import * as functions from 'firebase-functions';
import { db } from '../helpers/firebaseAdmin.js';

export const getUserScore = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to read scores.');
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a valid userId.');
  }

  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User does not exist');
    }

    const userData = userDoc.data();
    const scores = userData.scores || {};
    const overallScore = userData.overallScore || 0;

    return {
      overallScore: overallScore,
      culturalScore: scores.cultural || 0,
      socialScore: scores.social || 0,
      environmentalScore: scores.environmental || 0,
      lastUpdated: userData.lastUpdated ? userData.lastUpdated.toDate() : null
    };
  } catch (error) {
    console.error('Error reading user scores:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while reading the scores');
  }
});