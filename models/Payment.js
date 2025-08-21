import mongoose from "mongoose";

const paymantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Order
  orderId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  displayAmount: { type: Number, required: true },
  fee: { type: Number, required: true },
  net: { type: Number, required: true },
  paid_at: { type: Date, default: Date.now },
  currency: { type: String, default: "THB" },

  // Omise Transaction
  chargeId: { type: String, required: true },    // id จาก Omise เช่น "chrg_test_xxx"
  cardId: { type: String },                      // tokenized card id จาก Omise
  status: { type: String, enum: ["pending","paid","refund_requested","refunded","refund_rejected","failed"], 
            default: "pending" },
  omiseStatus: { type: String },
  failureReason: { type: String },
  failureCode: { type: String },   // เก็บ code เช่น insufficient_funds, expired_card
  metadata: { type: mongoose.Schema.Types.Mixed }, // เก็บ orderId, userId, note เผื่ออนาคต
  // Card Metadata (Safe to store)
  cardLast4: { type: String },       // เช่น "4242"
  cardBrand: { type: String },       // เช่น "Visa", "MasterCard"
  cardExpMonth: { type: Number },    // 12
  cardExpYear: { type: Number },     // 2028
  cardFingerprint: { type: String }, // omise ใช้ตรวจ card ซ้ำ (ไม่ใช่เลขบัตรจริง)

  // Refund
  refunds: [{
    refundId: { type: String },
    amount: { type: Number },
    refundedAt: { type: Date }
  }],
  // User-requested refund (optional)
  refundRequestedAt: { type: Date },
  refundReason: { type: String },
  // Timestamps
}, { timestamps: true })
paymantSchema.index({ chargeId: 1,userId: 1, createdAt: -1 });
export default mongoose.model("Payment", paymantSchema);