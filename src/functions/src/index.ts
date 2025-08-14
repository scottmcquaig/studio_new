/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onUserCreate } from "firebase-functions/v2/auth";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

// This function triggers when a new user is created in Firebase Authentication.
export const createuserdocument = onUserCreate(async (event) => {
  const user = event.data; // The user object created in Firebase Auth
  const { uid, email, displayName, photoURL } = user;

  logger.info(`New user created: ${email} (${uid})`);

  const db = getFirestore();
  const userRef = db.collection("users").doc(uid);

  // Determine the user's role based on their email address.
  // This is a secure way to assign roles, as it's done on the server.
  const role = email === "admin@yac.com" ? "site_admin" : "player";

  const newUserDocument = {
    displayName: displayName || "New User",
    email: email,
    photoURL: photoURL || "",
    createdAt: new Date().toISOString(),
    role: role,
    status: "active",
  };

  try {
    // Set the new user document in Firestore.
    await userRef.set(newUserDocument);
    logger.info(`Successfully created Firestore document for user: ${uid}`);
    return null;
  } catch (error) {
    logger.error(`Error creating Firestore document for user: ${uid}`, error);
    return null;
  }
});
