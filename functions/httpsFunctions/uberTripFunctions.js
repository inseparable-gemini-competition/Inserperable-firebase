import * as functions from 'firebase-functions';
import { processUserInput } from '../services/geminiService.js';
import { geocodeAddress } from '../services/geocodingService.js';
import { getFriendlyErrorMessage } from '../helpers/utils/errorHandler.js';

export const scheduleTrip = functions.https.onCall(async (data) => {
  try {
    const { userInput } = data;
    const processedInput = await processUserInput(userInput);
    console.log('Processed input:', processedInput);
    const destinationGeo = await geocodeAddress(processedInput.destination);
    console.log('destintion geo:', processedInput);

    return { 
      destination: destinationGeo,
      additionalContext: processedInput.additionalContext
    };
  } catch (error) {
    const friendlyMessage = getFriendlyErrorMessage(error);
    throw new functions.https.HttpsError('internal', friendlyMessage);
  }
});

