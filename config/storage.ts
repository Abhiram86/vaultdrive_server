import { Client, Storage } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);
export const storage = new Storage(client);
export const bucketId = process.env.APPWRITE_BUCKET_ID!;
