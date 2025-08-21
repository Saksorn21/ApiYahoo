import Payment from "../../models/Payment.js";
import omise from "omise";
import logger from "../../utils/logger.js"
const omiseInstance = omise({
  secretKey: process.env.OMISE_SECRET_KEY,
  publicKey: process.env.OMISE_PUBLIC_KEY
});

// /admin/payments?status=paid&userId=xxx&page=1&limit=20&sync=true
export const listPayments = async (req, res) => {
  try {
    const { status, userId, page = 1, limit = 20, sync } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // ถ้า sync=true → query Omise API เพิ่ม (optional)
    if (sync === 'true') {
      // ตัวอย่าง pseudo code
      // payments.forEach(p => {
      //   const omiseCharge = await omiseInstance.charges.retrieve(p.chargeId);
      //   // update DB ถ้าต้องการ
      // });
    }

    res.status(200).json({ ok: true, payments });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
// /admin/refunds?status=refunded&sync=true
export const listRefunds = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sync } = req.query;
    const filter = { "refunds.0": { $exists: true } }; // มี refunds อย่างน้อย 1 รายการ
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (sync === 'true') {
      // optional: query Omise refund API
    }

    res.status(200).json({ ok: true, payments });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
export const getPaymentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ ok: false, error: "Payment not found" });

    res.status(200).json({ ok: true, payment });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
export const getStatistics = async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalFee: { $sum: "$fee" },
          totalNet: { $sum: "$net" },
          totalRefunded: { $sum: { $sum: "$refunds.amount" } }
        }
      }
    ]);

    res.status(200).json({ ok: true, statistics: stats[0] || {} });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
// POST /admin/refund/:id/approve
export const approveRefund = async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ ok: false, error: "Payment not found" });
    if (payment.status !== "refund_requested")
      return res.status(400).json({ ok: false, error: "Payment is not requested for refund" });

    // ยิง Omise Refund
    const refund = await omiseInstance.charges.createRefund({
      charge: payment.chargeId,
      amount: payment.amount * 100, // Omise ใช้สตางค์
    });

    payment.status = "refunded";
    payment.refunds.push({
      refundId: refund.id,
      amount: refund.amount,
      refundedAt: refund.created_at
    });
    await payment.save();

    res.status(200).json({ ok: true, message: "Refund approved", payment });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// POST /admin/refund/:id/reject
export const rejectRefund = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ ok: false, error: "Payment not found" });
    if (payment.status !== "refund_requested")
      return res.status(400).json({ ok: false, error: "Payment is not requested for refund" });

    payment.status = "refund_rejected";
    payment.refundReason = reason || "No reason provided";
    await payment.save();

    res.status(200).json({ ok: true, message: "Refund rejected", payment });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};