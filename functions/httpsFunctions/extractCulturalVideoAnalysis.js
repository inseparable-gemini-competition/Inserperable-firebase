import * as functions from "firebase-functions";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import ytdl from "@distube/ytdl-core";
import { pipeline } from "stream/promises";
import { storage } from "../helpers/firebaseAdmin.js";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import os from "os";

const bucket = storage().bucket();

const downloadToStorage = async (url, filename) => {
  const file = bucket.file(filename);
  const writeStream = file.createWriteStream({
    metadata: {
      contentType: "video/mp4",
    },
  });

  try {
    console.log(`Starting download of ${url} to ${filename}`);
    const videoStream = ytdl(url, {
      quality: 'lowestaudio',
      filter: 'audioandvideo',
    });

    await pipeline(videoStream, writeStream);
    console.log(`Download completed: ${filename}`);
  } catch (error) {
    console.error(`Download failed: ${error.message}`);
    throw error;
  }
};

const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(
        `Retry ${i + 1}/${maxRetries} failed. Retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export const extractCulturalVideoAnalysis = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "2GB",
  })
  .https.onCall(async (data) => {
    console.log("Function called with data:", data);

    const GEN_AI_KEY = functions.config().genai.apikey;
    const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
    const fileManager = new GoogleAIFileManager(GEN_AI_KEY);

    try {
      const youtubeUrl = data.url;
      const targetLanguage = data.language || "unknown";
      const country = data.country || "unknown";

      console.log(
        `Processing YouTube URL: ${youtubeUrl}, Target Language: ${targetLanguage}`
      );

      if (!youtubeUrl) {
        console.log("Error: Missing YouTube URL");
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Missing YouTube URL"
        );
      }

      // Download video to Firebase Storage
      const filename = `videos/${Date.now()}.mp4`;
      console.log(`Downloading video to Firebase Storage: ${filename}`);
      await retryOperation(() => downloadToStorage(youtubeUrl, filename));

      // Download video buffer from Firebase Storage
      console.log("Downloading video buffer from Firebase Storage");
      const [videoBuffer] = await bucket.file(filename).download();

      // Write video buffer to a temporary file
      const tempFilePath = join(os.tmpdir(), `temp-${Date.now()}.mp4`);
      writeFileSync(tempFilePath, videoBuffer);

      // Upload video to Google AI File Manager
      console.log("Uploading video to Google AI File Manager");
      const uploadResult = await retryOperation(() =>
        fileManager.uploadFile(tempFilePath, { mimeType: "video/mp4" })
      );
      console.log("Upload result:", uploadResult);

      // Delete the temporary file
      unlinkSync(tempFilePath);

      // Wait for video processing
      console.log("Waiting for video processing");
      let file = await fileManager.getFile(uploadResult.file.name);
      let processingAttempts = 0;
      const maxProcessingAttempts = 18; // 3 minutes max (18 * 10 seconds)
      while (
        file.state === FileState.PROCESSING &&
        processingAttempts < maxProcessingAttempts
      ) {
        console.log(
          `Video still processing, waiting 10 seconds... (Attempt ${
            processingAttempts + 1
          }/${maxProcessingAttempts})`
        );
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
        file = await fileManager.getFile(uploadResult.file.name);
        processingAttempts++;
      }

      if (
        file.state === FileState.FAILED ||
        processingAttempts >= maxProcessingAttempts
      ) {
        console.error("Video processing failed or timed out");
        throw new Error("Video processing failed or timed out.");
      }

      console.log("Video processing completed");

      // Extract cultural insights using Gemini
      console.log("Initializing Gemini model");
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
        generationConfig: {
          temperature: 1,
        },
      });

      const prompt = `Analyze this video and provide key cultural insights for a traveler to ${country}
      talk in a deep way in ${targetLanguage} language summarize the video, then get cultural insights from it, like what are people wearing and why, what are they doing and why, what are they saying and why.
      how this connects to their history and norms, what are things that is understood only by country people, and explain it`;

      const videoPart = {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      };

      console.log("Generating content with Gemini");
      const result = await retryOperation(() =>
        model.generateContent([prompt, videoPart])
      );
      const culturalInsights = result.response.text();
      console.log("Cultural insights generated");

      // Clean up
      console.log("Cleaning up temporary files");
      await bucket.file(filename).delete();
      await fileManager.deleteFile(uploadResult.file.name);
      console.log("Cleanup completed");

      console.log("Sending response");
      return { culturalInsights };
    } catch (error) {
      console.error("Error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "An error occurred while processing the video",
        error
      );
    }
  });