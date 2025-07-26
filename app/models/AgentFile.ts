// models/AgentFile.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IAgentFile extends Document {
  agentId: mongoose.Types.ObjectId;
  fileName: string;
  fileType: string;
  content: string;
  uploadedAt: Date;
  trained: boolean;
  size: number;
  owner: string;
}

const AgentFileSchema: Schema = new Schema(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    content: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    trained: { type: Boolean, default: false },
    size: { type: Number, required: true },
    owner: { type: String, required: true },
  },
  { timestamps: true }
);

export const AgentFile =
  mongoose.models.AgentFile || mongoose.model<IAgentFile>("AgentFile", AgentFileSchema)
