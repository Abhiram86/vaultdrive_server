import mongoose from "mongoose";

interface MyFileType extends mongoose.Document {
  appwriteId?: string;
  name: string;
  path: string;
  size?: number;
  createdAt: Date;
  lastModified: Date;
  fileType: "file" | "folder";
  type: string;
  parent: mongoose.Types.ObjectId | null;
  owner: mongoose.Types.ObjectId;
  publicPermission: "public" | "private";
}

const fileSchema = new mongoose.Schema<MyFileType>({
  appwriteId: { type: String, required: true },
  name: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: false },
  createdAt: { type: Date, required: true, default: Date.now },
  lastModified: { type: Date, required: true, default: Date.now },
  fileType: { type: String, required: true, enum: ["file", "folder"] },
  type: { type: String, required: true },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "File",
  },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  publicPermission: {
    type: String,
    default: "private",
    enum: ["public", "private"],
  },
});

const MyFile = mongoose.model<MyFileType>("File", fileSchema);
export default MyFile;
