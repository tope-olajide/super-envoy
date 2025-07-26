// models/Agent.ts

import mongoose, { Schema, Document } from "mongoose";

export interface IAgent extends Document {
  name: string;
  description: string;
  owner: string;

}

const AgentSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    owner: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


AgentSchema.virtual("files", {
  ref: "AgentFile",           // model to populate from
  localField: "_id",         // match agent._id
  foreignField: "AgentId",    // with agentFile.AgentId
  justOne: false,            // multiple files per Agent
});

export const Agent = mongoose.models.Agent || mongoose.model<IAgent>("Agent", AgentSchema);
