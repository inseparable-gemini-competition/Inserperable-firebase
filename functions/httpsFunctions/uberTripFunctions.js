import * as functions from 'firebase-functions';
import { geocodeAddress } from '../services/geocodingService.js';
import { getFriendlyErrorMessage } from '../helpers/utils/errorHandler.js';
import { constructSearchPhrase, recommendBestPlaces } from '../services/geminiService.js';
import { searchPlaces } from '../services/placeService.js';
import { getPlacePhoto } from '../services/photoService.js';

export const scheduleTrip = functions.https.onCall(async (data) => {
  try {
    const { userInput } = data;
    
    // Step 1: Construct search phrase from user input
    const interpretedInput = await constructSearchPhrase(userInput.userMoodAndDesires, userInput.country);
    console.log('Interpreted input:', interpretedInput);

    // Step 2: Get suggestions from Google Places API
    const searchResults = await searchPlaces(interpretedInput.searchPhrase);
    console.log('Search results:', searchResults);

    // Step 3: Use Gemini to recommend best places
    const recommendations = await recommendBestPlaces(searchResults, userInput.userMoodAndDesires, userInput.country, userInput?.currentLanguage);
    console.log('Recommended places:', recommendations);

    if (!recommendations || recommendations.length === 0) {
      throw new Error('No recommendations were generated');
    }

    // Step 4: Get lat and long for the recommended places and fetch photos
    const finalRecommendations = await Promise.all(recommendations.map(async (recommendation) => {
      try {
        const location = await geocodeAddress(recommendation.name);
        if (!location) {
          console.warn(`Failed to geocode address for ${recommendation.name}`);
          return null;
        }
        const photoUrl = await getPlacePhoto(recommendation.name);
        return {
          ...recommendation,
          latitude: location.latitude,
          longitude: location.longitude,
          imageUrl: photoUrl,
        };
      } catch (error) {
        console.error(`Error processing recommendation for ${recommendation.name}:`, error);
        return null;
      }
    }));

    // Filter out any null results (failed geocoding or photo fetch)
    const validRecommendations = finalRecommendations.filter(rec => rec !== null);

    if (validRecommendations.length === 0) {
      throw new Error('No valid recommendations could be generated');
    }

    // Step 5: Return the final recommendations to the user
    return validRecommendations;
  } catch (error) {
    console.error('Error in scheduleTrip:', error);
    const friendlyMessage = getFriendlyErrorMessage(error);
    throw new functions.https.HttpsError('internal', friendlyMessage);
  }
});