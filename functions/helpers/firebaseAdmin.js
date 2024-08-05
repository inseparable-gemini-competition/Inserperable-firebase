import admin from "firebase-admin";

// Singleton pattern to initialize Firebase Admin only once
class FirebaseAdmin {
  constructor() {
    if (!FirebaseAdmin.instance) {
      admin.initializeApp();
      this.db = admin.firestore();
      this.storage = admin.storage; // Correct initialization without parentheses
      this.FieldValue = admin.firestore.FieldValue; // Add FieldValue for serverTimestamp
      FirebaseAdmin.instance = this;
    }
    return FirebaseAdmin.instance;
  }
}

const instance = new FirebaseAdmin();
Object.freeze(instance);

export const db = instance.db;
export const storage = instance.storage;
export const FieldValue = instance.FieldValue; // Export FieldValue
export default instance;
