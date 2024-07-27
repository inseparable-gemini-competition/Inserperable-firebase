import functions from "firebase-functions";
import { db } from "../helpers/firebaseAdmin.js";
import axios from "axios";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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
      return response.data.items[0].link;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching photo for ${description}:`, error);
    return null;
  }
};

const cleanupJSON = (jsonString) => {
  const start = jsonString.indexOf('{');
  const end = jsonString.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    throw new Error("No valid JSON object found in the response");
  }
  
  return jsonString.slice(start, end + 1);
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async (operation, retries = 0) => {
  try {
    return await operation();
  } catch (error) {
    if (retries >= MAX_RETRIES) {
      throw error;
    }
    console.log(`Attempt ${retries + 1} failed. Retrying...`);
    await wait(INITIAL_RETRY_DELAY * Math.pow(2, retries));
    return retryOperation(operation, retries + 1);
  }
};

export const generateTravelPlan = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const country = userData.country;
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
              description: { type: "string" }
            },
            required: ["name", "exactName", "time", "description"]
          }
        },
        Romance: { 
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" }
            },
            required: ["name", "exactName", "time", "description"]
          }
        },
        "Cultural Exploration": { 
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" }
            },
            required: ["name", "exactName", "time", "description"]
          }
        },
        Relaxation: { 
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" }
            },
            required: ["name", "exactName", "time", "description"]
          }
        },
        "Family Fun": { 
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" }
            },
            required: ["name", "exactName", "time", "description"]
          }
        },
        "Food & Dining": { 
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" }
            },
            required: ["name", "exactName", "time", "description"]
          }
        },
        Shopping: { 
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              exactName: { type: "string" },
              time: { type: "string" },
              description: { type: "string" }
            },
            required: ["name", "exactName", "time", "description"]
          }
        }
      },
      required: ["Adventure", "Romance", "Cultural Exploration", "Relaxation", "Family Fun", "Food & Dining", "Shopping"]
    };

    const generateAndParseTravelPlan = async () => {
      const query = `
        Generate a comprehensive 7-mood travel plan for ${country}. Structure the response as a JSON object with the following specifications:
        
        Moods:
        1. Adventure
        2. Romance
        3. Cultural Exploration
        4. Relaxation
        5. Family Fun
        6. Food & Dining
        7. Shopping
        
        For each mood:
        - Provide 10-15 unique entries
        - Ensure diversity in types of attractions and activities
        - Include both popular and lesser-known destinations
        
        Each entry should contain:
        - name: A concise, descriptive title
        - exactName: The precise name for google maps purpose, the name should be specific enough to return accurate latitude and longitude, for example if you suggest sea food restuarant in New York, the exactName should be the name of the restaurant
        - time: Optimal time of day to visit (e.g., "Early morning", "Afternoon", "Evening")
        - description: A brief, engaging description (20-30 words)
        
        Guidelines:
        1. Ensure all entries are actually located in ${country}
        2. Provide a mix of indoor and outdoor activities where applicable
        3. Include seasonal activities if relevant
        4. Avoid duplicate entries across different moods
        5. Ensure the "exactName" is specific enough for accurate Google searches
        
        Return only the JSON object with no additional text or explanation.
      `;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: query }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });

      const rawResponse = result.response.text();
      console.log("Raw AI response:", rawResponse);

      const cleanedResponse = cleanupJSON(rawResponse);
      return JSON.parse(cleanedResponse);
    };

    try {
      const travelPlan = await retryOperation(generateAndParseTravelPlan);

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

      console.log("Travel plan saved successfully!");
    } catch (error) {
      console.error("Error generating travel plan after all retries:", error);
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
      console.error(`Geocoding API error for ${placeName}: ${response.data.status}`);
      console.error("Full response:", JSON.stringify(response.data, null, 2));
      return { latitude: null, longitude: null };
    }

    if (response.data.results.length === 0) {
      console.error(`No results found for ${placeName}`);
      return { latitude: null, longitude: null };
    }

    const location = response.data.results[0].geometry.location;
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      console.error(`Invalid location data for ${placeName}:`, location);
      return { latitude: null, longitude: null };
    }

    return { latitude: location.lat, longitude: location.lng };
  } catch (error) {
    console.error(`Error fetching lat/long for ${placeName}:`, error);
    if (error.response) {
      console.error("Error response:", error.response.data);
    }
    return { latitude: null, longitude: null };
  }
};