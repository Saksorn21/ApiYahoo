import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  user: { type: String, required: true },
  action: { type: String, required: true },
  ip: { type: String, required: true },
  tokenId: { type: String },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  statusCode: { type: Number, required: true },
  responseTime: { type: Number, required: true }, // ms
  timestamp: { type: Date, default: Date.now }
});
logSchema.index({ user: 1, action: 1, endpoint: 1, method: 1, ip: 1, timestamp: -1 })
export default mongoose.model("Log", logSchema);