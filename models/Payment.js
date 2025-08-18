import mongoose from "mongoose";

const paymantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  action: { type: String, required: true },
  ip: { type: String, required: true },
  tokenId: { type: String },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  statusCode: { type: Number, required: true },
  responseTime: { type: Number, required: true }, // ms
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Log", paymantSchema);