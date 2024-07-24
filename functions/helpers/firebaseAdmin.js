import admin from "firebase-admin";

// Singleton pattern to initialize Firebase Admin only once
class FirebaseAdmin {
  constructor() {
    if (!FirebaseAdmin.instance) {
      admin.initializeApp();
      this.db = admin.firestore();
      FirebaseAdmin.instance = this;
    }
    return FirebaseAdmin.instance;
  }
}

const instance = new FirebaseAdmin();
Object.freeze(instance);

export const db = instance.db;
export default instance;
