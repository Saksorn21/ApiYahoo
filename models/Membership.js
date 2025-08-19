
import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  membershipLevel: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  status: { type: String, enum: ["active", "inactive", "expired"] , default: "active" },
  apiRequestCount: { type: Number, default: 0 },
  apiRequestReset: { type: Date, default: () => new Date() },
}, { timestamps: true });
membershipSchema.index({ userId: 1, membershipLevel: 1 })
export default mongoose.model("Membership", membershipSchema);