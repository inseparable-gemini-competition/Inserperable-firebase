import functions from "firebase-functions";
import { db, FieldValue } from "../helpers/firebaseAdmin.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  cleanupJSON,
  fetchPhotoUrl,
  getLatLong,
  planResponseSchema,
  retryOperation,
  searchPlaces,
} from "../helpers/travelPlanHelpers.js";

const GEN_AI_KEY = functions.config().genai.apikey;

export const generateTravelPlan = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "2GB",
  })
  .firestore.document("users/{userId}")
  .onWrite(async (change, context) => {
    const newValue = change.after.exists ? change.after.data() : null;
    const previousValue = change.before.exists ? change.before.data() : null;

    if (!newValue) {
      functions.logger.info(
        "User document deleted, skipping travel plan generation"
      );
      return null;
    }

    // Check if this update is coming from this function itself
    if (
      newValue.travelPlanLastUpdated &&
      (!previousValue ||
        newValue.travelPlanLastUpdated !== previousValue.travelPlanLastUpdated)
    ) {
      functions.logger.info("Travel plan just updated, skipping to avoid loop");
      return null;
    }

    const country = newValue.country;
    const baseLanguage = newValue.baseLanguage;

    functions.logger.info(
      `Generating travel plan for user: ${context.params.userId}, country: ${country}`
    );

    const searchMoods = [
      "Adventure",
      "Romance",
      "Cultural Exploration",
      "Relaxation",
      "Family Fun",
      "Food & Dining",
      "Shopping",
    ];

    const travelPlan = {};

    for (const mood of searchMoods) {
      const searchPhrase = `${mood} places to visit in ${country}`;
      const places = await searchPlaces(searchPhrase);
      if (places.length > 0) {
        travelPlan[mood] = places.slice(0, 10).map((place) => ({
          name: place.name,
          exactName: place.name,
          description: `Located at ${place.address}, rated ${place.rating} with ${place.user_ratings_total} reviews.`,
        }));
      } else {
        functions.logger.warn(`No places found for mood: ${mood}`);
      }
    }

    const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const generateAndRefineTravelPlan = async () => {
      const prompt = `
        Based on the following real places identified for different moods:
        ${JSON.stringify(travelPlan, null, 2)}

        Refine and generate a comprehensive travel plan for visiting ${country}. The travel plan should include recommendations for each of the following moods: Adventure, Romance, Cultural Exploration, Relaxation, Family Fun, Food & Dining, and Shopping. Each recommendation should include the place name, the best time to visit, and a brief description. The response should be structured as a JSON object with mood names as keys and each key containing an array of objects with the properties: name, time, and description.

        Please ensure the travel plan is in ${baseLanguage}.
      `;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: planResponseSchema,
        },
      });

      const rawResponse = result.response.text();
      functions.logger.info("Raw AI response received", { rawResponse });

      const cleanedResponse = cleanupJSON(rawResponse);
      return JSON.parse(cleanedResponse);
    };

    try {
      const refinedTravelPlan = await retryOperation(
        generateAndRefineTravelPlan
      );
      functions.logger.info("Generated travel plan", { refinedTravelPlan });

      const latLongAndPhotoPromises = [];
      for (const mood in refinedTravelPlan) {
        for (const place of refinedTravelPlan[mood]) {
          const exactName = place.exactName || place.name; // Fallback to place.name if exactName is undefined
          latLongAndPhotoPromises.push(
            getLatLong(exactName).then((latLong) => {
              if (latLong.latitude && latLong.longitude) {
                place.latitude = latLong.latitude;
                place.longitude = latLong.longitude;
              } else {
                functions.logger.warn(
                  `No valid lat/long found for place: ${exactName}`
                );
              }
              return fetchPhotoUrl(place.name).then((photoUrl) => {
                place.photoUrl = photoUrl;
              });
            })
          );
        }
      }

      await Promise.all(latLongAndPhotoPromises);

      await db.collection("users").doc(context.params.userId).update({
        travelPlan: refinedTravelPlan,
        travelPlanLastUpdated: FieldValue.serverTimestamp(),
      });

      functions.logger.info("Travel plan saved successfully!", {
        userId: context.params.userId,
      });
    } catch (error) {
      functions.logger.error(
        "Error generating travel plan after all retries:",
        { error }
      );
      await db.collection("users").doc(context.params.userId).update({
        travelPlanError: error.message,
        travelPlanLastUpdated: FieldValue.serverTimestamp(),
      });
    }
  });
