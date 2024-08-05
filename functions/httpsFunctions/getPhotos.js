import * as functions from "firebase-functions";
import { db } from "../helpers/firebaseAdmin.js";

export const getPhotos = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated."
    );
  }

  const { lastVisible, pageSize = 20 } = data;

  try {
    let query = db
      .collection("photos")
      .where("userId", "==", context.auth.uid)
      .orderBy("timestamp", "desc")
      .limit(pageSize);

    if (lastVisible) {
      const lastDoc = await db.collection("photos").doc(lastVisible).get();
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    const photos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastVisibleId =
      photos.length > 0 ? photos[photos.length - 1].id : null;

    return { photos, lastVisible: lastVisibleId };
  } catch (error) {
    console.error("Error fetching photos:", error);
    throw new functions.https.HttpsError("internal", "Error fetching photos");
  }
});
