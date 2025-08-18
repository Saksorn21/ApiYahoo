import mongoose from "mongoose";

const paymantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Order
  orderId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "THB" },

  // Omise Transaction
  chargeId: { type: String, required: true },    // id จาก Omise เช่น "chrg_test_xxx"
  cardId: { type: String },                      // tokenized card id จาก Omise
  status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  failureReason: { type: String },

  // Card Metadata (Safe to store)
  cardLast4: { type: String },       // เช่น "4242"
  cardBrand: { type: String },       // เช่น "Visa", "MasterCard"
  cardExpMonth: { type: Number },    // 12
  cardExpYear: { type: Number },     // 2028
  cardFingerprint: { type: String }, // omise ใช้ตรวจ card ซ้ำ (ไม่ใช่เลขบัตรจริง)

  // Billing Info (optional, ใช้สำหรับออกใบเสร็จ/ตรวจ fraud)
  billingName: { type: String },
  billingEmail: { type: String },
  billingPhone: { type: String },
  billingAddress: {
    line1: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String, default: "TH" }
  },

  // Refund
  refundId: { type: String },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })
paymantSchema.index({ userId: 1, createdAt: -1 });
export default mongoose.model("Paymant", paymantSchema);