import functions from "firebase-functions";

const GOOGLE_API_KEY = functions.config().google.apikey;
import axios from "axios";
const IMAGE_SEARCH_API_KEY = functions.config().search.apikey;
const CX = functions.config().search.cx;

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export const fetchPhotoUrl = async (description) => {
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

export const getLatLong = async (placeName) => {
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

    functions.logger.info(
      `Geocode API response for ${placeName}:`,
      response.data
    );

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

    functions.logger.info(
      `Lat/Long fetched for ${placeName}: ${location.lat}, ${location.lng}`
    );
    return { latitude: location.lat, longitude: location.lng };
  } catch (error) {
    functions.logger.error(
      `Error fetching lat/long for ${placeName}: ${error.message}`,
      { error }
    );
    return { latitude: null, longitude: null };
  }
};

export const searchPlaces = async (searchPhrase) => {
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

export const cleanupJSON = (jsonString) => {
  const start = jsonString.indexOf("{");
  const end = jsonString.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("No valid JSON object found in the response");
  }

  return jsonString.slice(start, end + 1);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const retryOperation = async (operation, retries = 0) => {
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

export const planResponseSchema = {
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
