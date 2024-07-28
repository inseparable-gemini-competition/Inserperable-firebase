// functions/services/placesService.js

import axios from 'axios';
import * as functions from 'firebase-functions';

const GOOGLE_API_KEY = functions.config().google.apikey;

export const searchPlaces = async (searchPhrase) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      {
        params: {
          query: searchPhrase,
          key: GOOGLE_API_KEY,
        },
      }
    );

    if (response.data.status !== "OK") {
      console.error(`Places API error: ${response.data.status}`);
      console.error("Full response:", JSON.stringify(response.data, null, 2));
      return [];
    }

    return response.data.results.map(place => ({
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total
    }));
  } catch (error) {
    console.error('Error searching places:', error);
    throw new Error('Failed to search places');
  }
};