// models/AgentUserChat.ts

import mongoose, { Schema, Document } from "mongoose"

export interface IUserChat extends Document {
  agentId: mongoose.Types.ObjectId
  name?: string // optional for display, like "First Conversation"
  messages: {
    role: "user" | "ai"
    content: string
  }[]
}

const UserChatSchema = new Schema<IUserChat>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true },
    name: { type: String },
    messages: [
      {
        role: { type: String, enum: ["user", "ai"], required: true },
        content: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
)

export const AgentUserChat =
  mongoose.models.AgentUserChat || mongoose.model<IUserChat>("AgentUserChat", UserChatSchema)