import * as functions from 'firebase-functions';
import { getStorage } from 'firebase-admin/storage';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';


const GEN_AI_KEY = functions.config().genai.apikey;
const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
const fileManager = new GoogleAIFileManager(GEN_AI_KEY);

const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export const extractCulturalVideoAnalysis = functions.runWith({
  timeoutSeconds: 540,
  memory: '2GB',
}).https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to use this function.');
  }

  const { videoUrl, language } = data;
  console.log(`Processing video URL: ${videoUrl}, Language: ${language}`);

  if (!videoUrl || !language) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing video URL or language');
  }

  let tempFilePath;
  let uploadedFileName;

  try {
    // Extract file path from the Firebase Storage URL
    const filePathMatch = videoUrl.match(/o\/(.+)\?/);
    if (!filePathMatch) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid video URL format');
    }
    const filePath = decodeURIComponent(filePathMatch[1]);

    // Download video to a temporary file
    const bucket = getStorage().bucket();
    tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    await bucket.file(filePath).download({ destination: tempFilePath });

    // Upload video to Google AI File Manager
    console.log('Uploading video to Google AI File Manager');
    const uploadResult = await retryOperation(() =>
      fileManager.uploadFile(tempFilePath, { mimeType: 'video/mp4' })
    );
    console.log('Upload result:', uploadResult);
    uploadedFileName = uploadResult.file.name;

    // Wait for video processing
    console.log('Waiting for video processing');
    let file = await fileManager.getFile(uploadedFileName);
    let processingAttempts = 0;
    const maxProcessingAttempts = 18; // 3 minutes max (18 * 10 seconds)
    while (file.state === FileState.PROCESSING && processingAttempts < maxProcessingAttempts) {
      console.log(`Video still processing, waiting 10 seconds... (Attempt ${processingAttempts + 1}/${maxProcessingAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      file = await fileManager.getFile(uploadedFileName);
      processingAttempts++;
    }

    if (file.state === FileState.FAILED || processingAttempts >= maxProcessingAttempts) {
      throw new Error('Video processing failed or timed out.');
    }

    console.log('Video processing completed');

    // Extract cultural insights using Gemini
    console.log('Initializing Gemini model');
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: {
        temperature: 1,
      },
    });

    const prompt = `
    Analyze the provided video and extract profound cultural insights for a traveler planning to visit the country depicted. Approach this task with the curiosity and depth of Richard Feynman, ensuring your analysis is both enlightening and engaging. Please discuss the following aspects in the ${language} language:

    1. Detailed Summary: Provide a concise yet comprehensive summary of the video's main events and key moments.
    2. Cultural Significance:
       - Attire: Analyze the clothing worn by people in the video. What does their attire signify about their cultural identity, history, climate, and social status?
       - Activities and Behaviors: Describe the activities and behaviors observed in the video. Explore their cultural, historical, and social underpinnings. Why are these actions significant, and what do they reveal about the community?
       - Dialogue and Communication: Translate and interpret the spoken words and non-verbal communication. Provide context about their cultural, historical, and social meanings. How do these communications reflect the values, beliefs, and norms of the society?
    3. Historical and Social Context: Connect the observed elements to the broader historical and social context of the country. How do these elements reflect the country's journey through history, its triumphs, struggles, and evolving norms?
    4. Local Insights: Identify subtle nuances and cultural cues that might be evident only to locals. Explain these elements to help the traveler appreciate the depth and richness of the local culture.
    5. Reflective Connections: Relate your insights to broader themes and human experiences. How do the cultural elements observed in the video resonate with universal human themes, and what can travelers learn from these insights?

    Your response should be as insightful, engaging, and thought-provoking as a lecture from Richard Feynman (don't mention this), transforming a simple video analysis into a captivating cultural exploration.
    you must response in ${language} language.
    `;

    const videoPart = {
      fileData: {
        fileUri: uploadResult.file.uri,
        mimeType: uploadResult.file.mimeType,
      },
    };

    console.log('Generating content with Gemini');
    const result = await retryOperation(() =>
      model.generateContent([prompt, videoPart])
    );
    const culturalInsights = result.response.text();
    console.log('Cultural insights generated');

    return { culturalInsights };
  } catch (error) {
    console.error('Error:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while processing the video', error.message);
  } finally {
    // Clean up
    console.log('Cleaning up temporary files');
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (error) {
        console.error('Error deleting temporary file:', error);
      }
    }
    if (uploadedFileName) {
      try {
        await fileManager.deleteFile(uploadedFileName);
      } catch (error) {
        console.error('Error deleting uploaded file:', error);
      }
    }
    console.log('Cleanup completed');
  }
});