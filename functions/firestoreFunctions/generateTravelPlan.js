import functions from "firebase-functions";
import { db } from "../helpers/firebaseAdmin.js";
import axios from "axios";
import {
  GoogleGenerativeAI,
} from "@google/generative-ai";

const GOOGLE_API_KEY = functions.config().google.apikey;
const GEN_AI_KEY = functions.config().genai.apikey;
const IMAGE_SEARCH_API_KEY = functions.config().search.apikey;
const CX = functions.config().search.cx;

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const fetchPhotoUrl = async (description) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1`,
      {
        params: {
          key: IMAGE_SEARCH_API_KEY,
          cx: CX,
          q: description,
          searchType: "image",
        },
      }
    );
    if (response.data.items && response.data.items.length > 0) {
      functions.logger.info(`Photo URL fetched for ${description}`);
      return response.data.items[0].link;
    }
    functions.logger.warn(`No photo found for ${description}`);
    return null;
  } catch (error) {
    functions.logger.error(`Error fetching photo for ${description}: ${error.message}`, { error });
    return null;
  }
};

const cleanupJSON = (jsonString) => {
  const start = jsonString.indexOf("{");
  const end = jsonString.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("No valid JSON object found in the response");
  }

  return jsonString.slice(start, end + 1);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryOperation = async (operation, retries = 0) => {
  try {
    return await operation();
  } catch (error) {
    if (retries >= MAX_RETRIES) {
      throw error;
    }
    functions.logger.warn(`Attempt ${retries + 1} failed. Retrying...`);
    await wait(INITIAL_RETRY_DELAY * Math.pow(2, retries));
    return retryOperation(operation, retries + 1);
  }
};

export const generateTravelPlan = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const country = userData.country;
    functions.logger.info(`Generating travel plan for user: ${context.params.userId}, country: ${country}`);
    const genAI = new GoogleGenerativeAI(GEN_AI_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const schema = {
      type: "object",
      properties: {
        Adventure: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" },
            },
            required: ["name", "exactName", "time", "description"],
          },
        },
        Romance: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" },
            },
            required: ["name", "exactName", "time", "description"],
          },
        },
        "Cultural Exploration": {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" },
            },
            required: ["name", "exactName", "time", "description"],
          },
        },
        Relaxation: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" },
            },
            required: ["name", "exactName", "time", "description"],
          },
        },
        "Family Fun": {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" },
            },
            required: ["name", "exactName", "time", "description"],
          },
        },
        "Food & Dining": {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" },
            },
            required: ["name", "exactName", "time", "description"],
          },
        },
        Shopping: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" },
            },
            required: ["name", "exactName", "time", "description"],
          },
        },
      },
      required: [
        "Adventure",
        "Romance",
        "Cultural Exploration",
        "Relaxation",
        "Family Fun",
        "Food & Dining",
        "Shopping",
      ],
    };

    const generateAndParseTravelPlan = async () => {
      const query = `
        Generate a 7-mood travel plan for visiting ${country}. The moods should be: Adventure, Romance, Cultural Exploration, Relaxation, Family Fun, Food & Dining, and Shopping. Each mood should have multiple entries (up to 10-15), and each entry should have a name, best time to visit, and a brief description of the place to visit. Please structure the response as a JSON object with mood names as keys and each key should contain an array of objects with the properties: name, time (best time in day), and description. The JSON object should look like this:
        {
          "Adventure": [
            {"name": "Example Place", "exactName": "place exact name", "time": "Best time to visit in the day", "description": "Brief description of the place"},
            ...
          ],
          "Romance": [
            {"name": "Example Place", "exactName": "place exact name", "time": "Best time to visit in the day", "description": "Brief description of the place"},
            ...
          ],
          ...
        }

        Guideline:
        - all the text has to be in ${userData?.baseLanguage} language
        - all the places have to be real place that will have latitude and longitude
        - Don't say general activities like "go to the beach", instead say "go to the beach in X city"
        - Each mood should contain 10 places.

      `;

      functions.logger.info(`Sending query to Generative AI: ${query}`);
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: query }] }],
        generationConfig: {
          responseSchema: schema,
        },
      });

      const rawResponse = result.response.text();
      functions.logger.info("Raw AI response received", { rawResponse });

      const cleanedResponse = cleanupJSON(rawResponse);
      return JSON.parse(cleanedResponse);
    };

    try {
      const travelPlan = await retryOperation(generateAndParseTravelPlan);
      functions.logger.info("Generated travel plan", { travelPlan });

      const latLongAndPhotoPromises = [];
      for (const mood in travelPlan) {
        for (const place of travelPlan[mood]) {
          latLongAndPhotoPromises.push(
            getLatLong(place.exactName).then((latLong) => {
              place.latitude = latLong.latitude;
              place.longitude = latLong.longitude;
              return fetchPhotoUrl(place.name).then((photoUrl) => {
                place.photoUrl = photoUrl;
              });
            })
          );
        }
      }

      await Promise.all(latLongAndPhotoPromises);

      await db.collection("users").doc(context.params.userId).update({
        travelPlan,
      });

      functions.logger.info("Travel plan saved successfully!", { userId: context.params.userId });
    } catch (error) {
      functions.logger.error("Error generating travel plan after all retries:", { error });
      await db.collection("users").doc(context.params.userId).update({
        travelPlanError: error.message,
      });
    }
  });

const getLatLong = async (placeName) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address: placeName,
          key: GOOGLE_API_KEY,
        },
      }
    );

    if (response.data.status !== "OK") {
      functions.logger.error(`Geocoding API error for ${placeName}: ${response.data.status}`, { response: response.data });
      return { latitude: null, longitude: null };
    }

    if (response.data.results.length === 0) {
      functions.logger.warn(`No results found for ${placeName}`);
      return { latitude: null, longitude: null };
    }

    const location = response.data.results[0].geometry.location;
    if (
      !location ||
      typeof location.lat !== "number" ||
      typeof location.lng !== "number"
    ) {
      functions.logger.error(`Invalid location data for ${placeName}`, { location });
      return { latitude: null, longitude: null };
    }

    functions.logger.info(`Lat/Long fetched for ${placeName}`, { location });
    return { latitude: location.lat, longitude: location.lng };
  } catch (error) {
    functions.logger.error(`Error fetching lat/long for ${placeName}: ${error.message}`, { error });
    if (error.response) {
      functions.logger.error("Error response from Geocoding API", { response: error.response.data });
    }
    return { latitude: null, longitude: null };
  }
};
