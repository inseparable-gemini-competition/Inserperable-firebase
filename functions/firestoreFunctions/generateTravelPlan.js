import functions from "firebase-functions";
import { db, FieldValue } from "../helpers/firebaseAdmin.js";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    functions.logger.error(
      `Error fetching photo for ${description}: ${error.message}`,
      { error }
    );
    return null;
  }
};

const getLatLong = async (placeName) => {
  if (!placeName) {
    functions.logger.error(`No place name provided for geocoding`);
    return { latitude: null, longitude: null };
  }

  try {
    functions.logger.info(`Fetching Lat/Long for place: ${placeName}`);

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address: placeName,
          key: GOOGLE_API_KEY,
        },
      }
    );

    functions.logger.info(`Geocode API response for ${placeName}:`, response.data);

    if (response.data.status !== "OK") {
      functions.logger.error(
        `Geocoding API error for ${placeName}: ${response.data.status}`,
        { response: response.data }
      );
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
      functions.logger.error(`Invalid location data for ${placeName}`, {
        location,
      });
      return { latitude: null, longitude: null };
    }

    functions.logger.info(`Lat/Long fetched for ${placeName}: ${location.lat}, ${location.lng}`);
    return { latitude: location.lat, longitude: location.lng };
  } catch (error) {
    functions.logger.error(
      `Error fetching lat/long for ${placeName}: ${error.message}`,
      { error }
    );
    return { latitude: null, longitude: null };
  }
};

const searchPlaces = async (searchPhrase) => {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
      {
        params: {
          query: searchPhrase,
          key: GOOGLE_API_KEY,
        },
      }
    );

    if (response.data.status !== "OK") {
      functions.logger.error(`Places API error: ${response.data.status}`);
      return [];
    }

    return response.data.results.map((place) => ({
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
    }));
  } catch (error) {
    functions.logger.error("Error searching places:", error);
    throw new Error("Failed to search places");
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
          responseSchema: {
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
          },
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
                functions.logger.warn(`No valid lat/long found for place: ${exactName}`);
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
