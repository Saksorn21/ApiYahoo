import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  user: { type: String, required: true, unique: true },         // user name
  refreshToken: { type: String, required: true }, // token string
  expiresAt: { type: Date, required: true },      // หมดอายุเมื่อไหร่
}, { timestamps: true });

export default mongoose.model("Token", tokenSchema);