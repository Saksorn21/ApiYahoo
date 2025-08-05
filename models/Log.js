import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  user: { type: String, required: true },
  action: { type: String, required: true },
  ip: { type: String, required: true },
  tokenId: { type: String },   // optional, ถ้าอยากใส่ jti
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Log", logSchema);