import mongoose from "mongoose";

interface StarredFile {
  file: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
}

const starredSchema = new mongoose.Schema<StarredFile>({
  file: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "File" },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
});

const Starred = mongoose.model<StarredFile>("Starred", starredSchema);
export default Starred;
