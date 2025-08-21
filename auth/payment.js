import omise from "omise"
import logger from "../utils/logger.js"
import Membership from "../models/Membership.js"
import Payment from "../models/Payment.js"
import { User } from "../models/User.js"
const omiseInstance = omise({
  secretKey: process.env.OMISE_SECRET_KEY,
  publicKey: process.env.OMISE_PUBLIC_KEY
})
// ===================== User =====================

// GET /payment/history
export const getPaymentHistory = async (req, res) => {
  const userId = req.user._id; // assume middleware auth ใส่ user มา
  try {
    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 });
    res.status(200).json({ ok: true, payments });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

// POST /payment/:id/refund-request
export const requestRefund = async (req, res) => {
  const { id } = req.params; // paymentId
  const { reason } = req.body;
  const userId = req.user._id;

  try {
    const payment = await Payment.findOne({ _id: id, userId });
    if (!payment) return res.status(404).json({ ok: false, error: "Payment not found" });
    if (payment.status !== "paid")
      return res.status(400).json({ ok: false, error: "Only paid payments can request refund" });

    payment.status = "refund_requested";
    payment.refundRequestedAt = new Date();
    payment.refundReason = reason || "No reason provided";
    await payment.save();

    res.status(200).json({ ok: true, message: "Refund request submitted", payment });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
const refund = async (req, res) => {
  try {
     const { chargeId, amount, userId, orderId } = req.body
    const refund = await omiseInstance.charges.createRefund({
      charge: chargeId,
      amount: amount * 100  // คืนเท่าที่ frontend ส่งมา (เป็นบาท → แปลงเป็นสตางค์)
    })
    await Payment.findOneAndUpdate(
      { chargeId },
      {
        $push: {
          refunds: {
            refundId: refund.id,
            amount: refund.amount,
            refundedAt: refund.created_at
          }
        },
        status: refund.voided ? "refunded" : "paid"
      }
    )
  } catch (err) {
     
  }
  
}
export const payment = async (req, res) =>{
  try {
    
     const { userId, amount, token, orderId, membershipId, membershipLevel } = req.body
    if (!token || !amount || !orderId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    const membershipLevels = orderId.split("-")[1]
    // สร้างรายการ Charge ด้วย Secret Key
    const charge = await omiseInstance.charges.create({
      amount: amount * 100, // Omise ใช้หน่วยเป็นสตางค์
      currency: 'thb',
      card: token, // Token ที่ได้รับจาก Frontend
      description: `Order ID: ${orderId}`,
      metadata: {
          userId,
          orderId,
          membershipId,
          membershipLevel,
        }
      })
    const initialStatus = charge.status === "successful" ? "paid" : "pending"
    await Payment.create({
      userId,
      orderId,
      amount,
      displayAmount: amount,
      fee: charge.fee,
      net: charge.net,
      paid_at: charge.paid_at,
      currency: "THB",
      chargeId: charge.id,
      cardId: charge.card.id,
      failureReason: charge.failure_message,
      status: initialStatus,
        omiseStatus: charge.status,   // ส่วนใหญ่จะเริ่มเป็น "pending"
      cardLast4: charge.card.last_digits,
      cardBrand: charge.card.brand,
      cardExpMonth: charge.card.expiration_month,
      cardExpYear: charge.card.expiration_year
    });
    if (charge.status === 'successful') {
      // เมื่อการชำระเงินสำเร็จ
      // อัปเดตสถานะการสั่งซื้อในฐานข้อมูลของคุณ
      // ส่งคำตอบกลับไปหาลูกค้า
      logger.debug('Payment successful:', charge);
      res.status(200).json({ 
        ok: true,
        message: 'Payment successful',
        chargeId: charge.id,
        status: charge.status,
      });
    } else {
      // การชำระเงินไม่สำเร็จ
      logger.debug('Payment failed:', charge.failure_message);
      res.status(400).json({
        ok: false,
        error: 'Payment failed',
        message: charge.failure_message,
      });
    }

    } catch (err) {
    console.error('Error during payment process:', err);
    res.status(500).json({ 
      ok: false, error: 'Internal Server Error', message: err.message });
    }  
}