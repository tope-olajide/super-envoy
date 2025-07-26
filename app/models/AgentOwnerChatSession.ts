// models/AgentOwnerChat.ts

import mongoose, { Schema, Document } from "mongoose"

export interface IOwnerChat extends Document {
  agentId: mongoose.Types.ObjectId
  ownerId: string
  name: string // e.g., "Parenting Advice"
  messages: {
    role: "user" | "ai"
    content: string
  }[]
}

const OwnerChatSchema = new Schema<IOwnerChat>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true },
    ownerId: { type: String, required: true },
    name: { type: String, required: true },
    messages: [
      {
        role: { type: String, enum: ["user", "ai"], required: true },
        content: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
)

export const AgentOwnerChat =
  mongoose.models.AgentOwnerChat || mongoose.model<IOwnerChat>("AgentOwnerChat", OwnerChatSchema)