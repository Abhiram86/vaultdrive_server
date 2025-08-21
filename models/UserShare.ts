import mongoose from "mongoose";

interface UserShareType {
  userEmail: string;
  file: mongoose.Types.ObjectId;
  grantedBy: mongoose.Types.ObjectId;
}

const userShareSchema = new mongoose.Schema<UserShareType>(
  {
    userEmail: String,
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File" },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const UserShare = mongoose.model<UserShareType>("UserShare", userShareSchema);
export default UserShare;
