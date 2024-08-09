import axios from 'axios';
import * as functions from 'firebase-functions';

const GOOGLE_API_KEY = functions.config().google.apikey;

export const getPlacePhoto = async (placeName) => {
  try {
    // First, search for the place to get its place_id
    const searchResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/findplacefromtext/json',
      {
        params: {
          input: placeName,
          inputtype: 'textquery',
          fields: 'place_id',
          key: GOOGLE_API_KEY,
        },
      }
    );

    if (searchResponse.data.status !== "OK" || searchResponse.data.candidates.length === 0) {
      console.error(`Place search error: ${searchResponse.data.status}`);
      return null;
    }

    const placeId = searchResponse.data.candidates[0].place_id;

    // Then, get the place details to retrieve the photo reference
    const detailsResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          fields: 'photos',
          key: GOOGLE_API_KEY,
        },
      }
    );

    if (detailsResponse.data.status !== "OK" || !detailsResponse.data.result.photos) {
      console.error(`Place details error: ${detailsResponse.data.status}`);
      return null;
    }

    const photoReference = detailsResponse.data.result.photos[0].photo_reference;

    // Finally, construct the photo URL
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${GOOGLE_API_KEY}`;
  } catch (error) {
    console.error('Error getting place photo:', error);
    return null;
  }
};