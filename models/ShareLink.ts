import mongoose from "mongoose";

interface ShareLinkType extends mongoose.Document {
  file: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  jwt?: string;
  isPublic: boolean;
  allowedEmails: string[];
  createdAt: Date;
}

const shareLinkSchema = new mongoose.Schema<ShareLinkType>({
  file: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "File" },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  jwt: { type: String, required: false },
  isPublic: { type: Boolean, required: true, default: false },
  allowedEmails: { type: [String], required: false },
  createdAt: { type: Date, required: true, default: Date.now },
});

const ShareLink = mongoose.model<ShareLinkType>("ShareLink", shareLinkSchema);
export default ShareLink;
