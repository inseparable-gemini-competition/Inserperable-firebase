// functions/services/geocodingService.js

import axios from 'axios';
import * as functions from 'firebase-functions';

const GOOGLE_API_KEY = functions.config().google.apikey;

export const geocodeAddress = async (address) => {
  console.log(
    `Geocoding address ${address} with Google Maps API...`
  )
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address: address,
          key: GOOGLE_API_KEY,
        },
      }
    );

    if (response.data.status !== "OK") {
      console.error(`Geocoding API error for ${address}: ${response.data.status}`);
      console.error("Full response:", JSON.stringify(response.data, null, 2));
      return null;
    }

    if (response.data.results.length === 0) {
      console.error(`No results found for ${address}`);
      return null;
    }

    const result = response.data.results[0];
    const location = result.geometry.location;

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      console.error(`Invalid location data for ${address}:`, location);
      return null;
    }
    console.log(
      `Geocoded address ${address} to location: ${location.lat},${location.lng}`
    )

    return {
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id
    };
  } catch (error) {
    console.error(`Error geocoding address ${address}:`, error);
    if (error.response) {
      console.error("Error response:", error.response.data);
    }
    return null;
  }
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${latitude},${longitude}`,
          key: GOOGLE_API_KEY,
        },
      }
    );

    if (response.data.status !== "OK") {
      console.error(`Reverse geocoding API error for ${latitude},${longitude}: ${response.data.status}`);
      console.error("Full response:", JSON.stringify(response.data, null, 2));
      return null;
    }

    if (response.data.results.length === 0) {
      console.error(`No results found for ${latitude},${longitude}`);
      return null;
    }

    const result = response.data.results[0];

    return {
      latitude,
      longitude,
      formattedAddress: result.formatted_address,
      placeId: result.place_id
    };
  } catch (error) {
    console.error(`Error reverse geocoding ${latitude},${longitude}:`, error);
    if (error.response) {
      console.error("Error response:", error.response.data);
    }
    return null;
  }
};