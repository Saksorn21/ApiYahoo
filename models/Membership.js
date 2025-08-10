
import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  membershipLevel: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  apiRequestCount: { type: Number, default: 0 },
  apiRequestReset: { type: Date, default: () => new Date() },
}, { timestamps: true });

export default mongoose.model("Membership", membershipSchema);