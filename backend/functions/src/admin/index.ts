import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
    const db = admin.firestore();
    
    // Default to 'citizen' role. 
    // Authorities will be manually updated via console or admin script for now.
    const newUser = {
        name: user.displayName || "New Citizen",
        email: user.email || "",
        role: "citizen",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
        await db.collection("users").doc(user.uid).set(newUser);
        functions.logger.info(`Successfully created user document for ${user.uid}`);
    } catch (error) {
        functions.logger.error(`Error creating user document for ${user.uid}`, error);
    }
});
