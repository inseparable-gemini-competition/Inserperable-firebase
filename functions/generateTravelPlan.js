import functions from "firebase-functions";
import { db } from "./firebaseAdmin.js"; // Import initialized Firebase Admin
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GOOGLE_API_KEY = "AIzaSyDTiF7YjBUWM0l0nKpzicv9R6kReU3dn8Q";
const GEN_AI_KEY = "AIzaSyCrRE67ES56RfBPeTZ4X2ZB7u1_r4Aolsk";
const IMAGE_SEARCH_API_KEY = "AIzaSyDPbsh2cXsQZY8IQgSfKYj3Be1Zeg4i8DQ";
const CX = "d189de1b204794ec5";

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

export const generateTravelPlan = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const country = userData.country;
    const genAI = new GoogleGenerativeAI(GEN_AI_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    try {
      // Fetch detailed 7-mood travel plan
      const query = `
        Generate a 7-mood travel plan for visiting ${country}. The moods should be: Adventure, Romance, Cultural Exploration, Relaxation, Family Fun, Food & Dining, and Shopping. Each mood should have multiple entries (up to 10-15), and each entry should have a name, best time to visit, and a brief description of the place to visit. Please structure the response as a JSON object with mood names as keys and each key should contain an array of objects with the properties: name, time (best time in day), and description. The JSON object should look like this:
        {
          "Adventure": [
            {"name": "Example Place", "time": "Best time to visit in the day", "description": "Brief description of the place"},
            ...
          ],
          "Romance": [
            {"name": "Example Place", "time": "Best time to visit in the day", "description": "Brief description of the place"},
            ...
          ],
          ...
        }
      `;

      const result = await model.generateContent([query]);
      const travelPlanText =
        result?.response.candidates[0].content.parts[0].text || "";

      // Parse the travel plan into a JavaScript object
      const travelPlan = parseJsonString(travelPlanText);

      if (!travelPlan) {
        throw new Error("Failed to parse travel plan.");
      }

      // Fetch latitude, longitude, and photos for all places concurrently
      const latLongAndPhotoPromises = [];
      for (const mood in travelPlan) {
        for (const place of travelPlan[mood]) {
          latLongAndPhotoPromises.push(
            getLatLong(place.name).then((latLong) => {
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

      // Save the updated travel plan back to Firestore
      await db.collection("users").doc(context.params.userId).update({
        travelPlan,
      });

      console.log("Travel plan saved successfully!");
    } catch (error) {
      console.error("Error generating travel plan:", error);
    }
  });

const parseJsonString = (jsonString) => {
  // Remove code block delimiters if they exist
  const cleanedString = jsonString.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleanedString);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return null;
  }
};

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

    const location = response.data.results[0]?.geometry?.location || {
      lat: null,
      lng: null,
    };
    return { latitude: location.lat, longitude: location.lng };
  } catch (error) {
    console.error(`Error fetching lat/long for ${placeName}:`, error);
    return { latitude: null, longitude: null };
  }
};
