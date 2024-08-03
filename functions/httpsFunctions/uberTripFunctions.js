import * as functions from 'firebase-functions';
import { geocodeAddress } from '../services/geocodingService.js';
import { getFriendlyErrorMessage } from '../helpers/utils/errorHandler.js';
import { constructSearchPhrase, recommendBestPlace } from '../services/geminiService.js';
import { searchPlaces } from '../services/placeService.js';

export const scheduleTrip = functions.https.onCall(async (data) => {
  try {
    const { userInput } = data;
    
    
    // Step 1: Construct search phrase from user input
    const interpretedInput = await constructSearchPhrase(userInput.userMoodAndDesires, userInput.country);
    console.log('Interpreted input:', interpretedInput);

    // Step 2: Get suggestions from Google Places API
    const searchResults = await searchPlaces(interpretedInput.searchPhrase);
    console.log('Search results:', searchResults);

    // Step 3: Use Gemini to recommend best place
    const recommendation = await recommendBestPlace(searchResults, userInput.userMoodAndDesires, userInput.country, userInput?.currentLanguage);
    console.log('Recommended place:', recommendation);

    // Step 4: Get lat and long for the recommended place
    const location = await geocodeAddress(recommendation.name);

    // Step 5: Return the final recommendation to the user
    return {
      name: recommendation.name,
      description: recommendation.description,
      latitude: location.latitude,
      longitude: location.longitude
    };
  } catch (error) {
    console.error('Error in scheduleTrip:', error);
    const friendlyMessage = getFriendlyErrorMessage(error);
    throw new functions.https.HttpsError('internal', friendlyMessage);
  }

});

