/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { CohereClient } from "cohere-ai";
import { QdrantClient } from "@qdrant/js-client-rest";

import { randomUUID } from "crypto";

import { Types } from "mongoose";
import { connectMongoose } from "../lib/mongoose";
import { AgentFile } from "../models/AgentFile";

const COHERE_API_KEY = process.env.COHERE_API_KEY!;
const QDRANT_URL = process.env.QDRANT_URL!;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY!;

const COLLECTION_NAME = "agent_chunks"; 

const EXPECTED_VECTOR_SIZE = 1536; 

const cohere = new CohereClient({ token: COHERE_API_KEY });
const qdrant = new QdrantClient({ url: QDRANT_URL, apiKey: QDRANT_API_KEY });

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
    i += chunkSize - overlap;
  }
  return chunks;
}

export async function trainAgent(agentId: string): Promise<{
  success: boolean;
  message: string;
  chunksTrained?: number;
}> {
  if (!agentId) {
    console.error("Validation Error: Missing agentId.");
    return { success: false, message: "Missing agentId." };
  }

  try {
    await connectMongoose();
    console.log("MongoDB connected for agent training.");

    // --- Qdrant Collection Check ---
  try {
  const collectionInfo = await qdrant.getCollection(COLLECTION_NAME);
  console.log(`Collection '${COLLECTION_NAME}' already exists.`);

  // Check vector size and recreate if mismatched
  if (collectionInfo.config.params.vectors.size !== EXPECTED_VECTOR_SIZE) {
    console.warn(
      `Vector size mismatch: Qdrant collection '${COLLECTION_NAME}' has size ${collectionInfo.config.params.vectors.size}, expected ${EXPECTED_VECTOR_SIZE}. Recreating...`
    );
    await qdrant.deleteCollection(COLLECTION_NAME);
    throw { status: 404, message: "Recreating due to vector size mismatch." };
  }
} catch (error: any) {
  if (error.status === 404) {
    console.log(`Collection '${COLLECTION_NAME}' not found. Creating...`);
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: EXPECTED_VECTOR_SIZE,
        distance: "Cosine",
      },
    });
    console.log(`Collection '${COLLECTION_NAME}' created.`);
  } else {
    console.error("Error checking/creating collection:", error);
    return {
      success: false,
      message: `Failed to check/create collection: ${error.message || "Unknown error"}`,
    };
  }
}

// ✅ Ensure payload index on `agentId`
try {
  await qdrant.createPayloadIndex(COLLECTION_NAME, {
    field_name: "agentId",
    field_schema: "keyword", // Use "keyword" to allow filtering
  });
  console.log("Payload index on 'agentId' created or already exists.");
} catch (indexError: any) {
  if (indexError.response?.status === 409) {
    // 409 means index already exists — safe to ignore
    console.log("Payload index on 'agentId' already exists.");
  } else {
    console.error("Failed to create payload index for 'agentId':", indexError);
    return {
      success: false,
      message: "Failed to create index for filtering on 'agentId'.",
    };
  }
}

    // --- File Fetch ---
    const files = await AgentFile.find({ agentId });
    if (files.length === 0) {
      console.log(`No files found for agentId: ${agentId}.`);
      return {
        success: true,
        message: "No files found for this agent. Training skipped.",
        chunksTrained: 0,
      };
    }

    console.log(`Found ${files.length} files for agentId: ${agentId}.`);
    const allPoints: any[] = [];

    for (const file of files) {
      if (!file.content) {
        console.warn(`Skipping file ${file._id} due to empty content.`);
        continue;
      }

      const chunks = chunkText(file.content);
      const validChunks = chunks.filter(chunk => chunk.trim().length > 0);

      if (validChunks.length === 0) {
        console.warn(`File ${file._id} resulted in no valid chunks.`);
        continue;
      }

      console.log(`Processing file ${file._id}: ${validChunks.length} valid chunks.`);

      let embeddingsRes;
      try {
        embeddingsRes = await cohere.v2.embed({
          texts: validChunks,
          model: "embed-v4.0",
          inputType: "search_document",
          embeddingTypes: ["float"],
        });
        console.log(`Cohere embed API call successful for file ${file._id}.`);
      } catch (embedError: any) {
        console.error(`Cohere embedding failed for file ${file._id}:`, embedError.message || JSON.stringify(embedError));
        if (embedError.statusCode === 401 || embedError.statusCode === 403) {
          console.error("Cohere API Key might be invalid or unauthorized.");
        }
        continue;
      }

      // ✅ Extract from embeddings.float
      const embeddings = Array.isArray(embeddingsRes?.embeddings?.["float"])
        ? embeddingsRes.embeddings["float"] as number[][]
        : undefined;

      if (!Array.isArray(embeddings) || embeddings.length === 0 || !embeddings[0]) {
        console.warn(`Cohere returned an EMPTY or invalid embeddings array for file ${file._id}. Skipping.`);
        console.log("Full Cohere embeddings response:", JSON.stringify(embeddingsRes, null, 2));
        continue;
      }

      const actualCohereDimension = embeddings[0].length;
      if (actualCohereDimension !== EXPECTED_VECTOR_SIZE) {
        console.error(
          `CRITICAL ERROR: Cohere returned dimension ${actualCohereDimension}, but Qdrant expects ${EXPECTED_VECTOR_SIZE}.`
        );
        throw new Error(
          `Vector dimension mismatch: Cohere output ${actualCohereDimension}, Qdrant expects ${EXPECTED_VECTOR_SIZE}.`
        );
      }

      for (let i = 0; i < embeddings.length; i++) {
        if (!embeddings[i] || embeddings[i].length !== EXPECTED_VECTOR_SIZE) {
          console.error(`Skipping malformed embedding at index ${i} in file ${file._id}.`);
          continue;
        }

        allPoints.push({
          id: randomUUID(),
          vector: embeddings[i],
          payload: {
            agentId,
            agentFileId: (file._id as string | Types.ObjectId).toString(),
            chunk: validChunks[i] || "N/A",
          },
        });
      }

      file.trained = true;
      await file.save();
      console.log(`File ${file._id} marked as trained. ${embeddings.length} embeddings processed.`);
    }

    if (allPoints.length > 0) {
      console.log(`Upserting ${allPoints.length} points to Qdrant...`);
      await qdrant.upsert(COLLECTION_NAME, {
        points: allPoints,
        wait: true,
      });
      console.log(`Successfully upserted ${allPoints.length} points to Qdrant.`);
    } else {
      console.log("No valid points to upsert to Qdrant.");
    }

    return {
      success: true,
      message: "Agent training completed!",
      chunksTrained: allPoints.length,
    };
  } catch (err: any) {
    console.error("Training failed with an unexpected error:", err);
    if (err.status && err.statusText) {
      return {
        success: false,
        message: `Qdrant API Error: ${err.status} - ${err.statusText}. Details: ${
          err.message || JSON.stringify(err.data)
        }.`,
      };
    } else if (err.message?.includes("Vector dimension mismatch")) {
      return { success: false, message: err.message };
    }

    return {
      success: false,
      message: err.message || "Unknown error during training. Check server logs for details.",
    };
  }
}