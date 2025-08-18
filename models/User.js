import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: "user" }  // user หรือ admin
}, { timestamps: true });
userSchema.index({ username: 1, email: 1, role: 1, createdAt: -1, updatedAt: -1})
export const User = mongoose.model("User", userSchema);