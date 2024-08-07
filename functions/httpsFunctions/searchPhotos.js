import * as functions from 'firebase-functions';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { db } from "../helpers/firebaseAdmin.js";
import sharp from 'sharp';
import fetch from 'node-fetch';

export const searchPhotos = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { query, lastVisible, pageSize = 20, userId } = data;

  try {
    let firestoreQuery = db.collection('photos')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc');

    if (lastVisible) {
      const lastDoc = await db.collection('photos').doc(lastVisible).get();
      firestoreQuery = firestoreQuery.startAfter(lastDoc);
    }

    const snapshot = await firestoreQuery.limit(100).get();
    const photos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const genAI = new GoogleGenerativeAI(functions.config().genai.apikey);
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


    const photoPromises = photos.map(async (photo) => {
      let imageBuffer;
      const prompt = `Analyze this travel photo, that has this description ${photo.description} and determine if it matches the search query: "${query}". Return "true" if it matches, "false" if it doesn't.`;


      // Fetch image from URL
      if (photo.url) {
        try {
          const response = await fetch(photo.url);
          imageBuffer = await response.buffer();
        } catch (fetchError) {
          console.error(`Error fetching image for photo ID ${photo.id}:`, fetchError);
          return { id: photo.id, relevance: 'false' };
        }
      } else {
        console.warn(`No URL found for photo ID ${photo.id}`);
        return { id: photo.id, relevance: 'false' };
      }

      // Resize image if necessary
      try {
        const resizedBuffer = await sharp(imageBuffer)
          .resize(800, 800, { fit: 'inside' }) // Resize to fit within 800x800 pixels
          .toBuffer();
        imageBuffer = resizedBuffer;
      } catch (resizeError) {
        console.error(`Error resizing image for photo ID ${photo.id}:`, resizeError);
        // Continue with the original imageBuffer if resizing fails
      }

      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');

      const image = {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg", // Adjust if needed based on your image types
        },
      };

      try {
        const result = await model.generateContent([prompt, image]);
        return { id: photo.id, relevance: result.response.text() };
      } catch (error) {
        console.error(`Error processing image for photo ID ${photo.id}:`, error);
        return { id: photo.id, relevance: 'false' };
      }
    });

    const photoAnalysis = await Promise.all(photoPromises);

    const relevantPhotoIds = photoAnalysis
      .filter(analysis => analysis.relevance.toLowerCase().includes('true'))
      .map(analysis => analysis.id)
      .slice(0, pageSize);

    const relevantPhotos = photos.filter(photo => relevantPhotoIds.includes(photo.id));

    const lastVisibleId = relevantPhotos.length > 0 ? relevantPhotos[relevantPhotos.length - 1].id : null;

    return { photos: relevantPhotos, lastVisible: lastVisibleId };
  } catch (error) {
    console.error('Error searching photos:', error);
    throw new functions.https.HttpsError('internal', 'Error searching photos');
  }
});