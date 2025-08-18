import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  user: { type: String, required: true, unique: true },         // user name
  refreshToken: { type: String, required: true }, // token string
  apiToken: { type: String, required: true, unique: true },  // opaque token
  expiresAt: { type: Date, required: true },      // หมดอายุเมื่อไหร่
}, { timestamps: true });
tokenSchema.index({ user: 1, expiresAt: 1, createdAt: -1 });
export default mongoose.model("Token", tokenSchema);