# Firebase Backend Connection Guide for React Frontend

This document explains how the React frontend should connect to the Firebase backend. 
**Do not create REST APIs for normal CRUD operations.** The React application will use the Firebase Web SDK directly for Authentication, Firestore, and Storage.

## 1. Firebase Initialization

First, initialize the Firebase SDK in your React app.

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

*(Keep the configuration inside environment variables like `REACT_APP_FIREBASE_API_KEY`)*

## 2. Authentication

Use the Firebase Authentication SDK for user management.

**Sign Up (Citizen):**
```javascript
import { createUserWithEmailAndPassword } from "firebase/auth";

// ...
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const user = userCredential.user;
```

**Sign In:**
```javascript
import { signInWithEmailAndPassword } from "firebase/auth";

// ...
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user;
```

**Sign Out:**
```javascript
import { signOut } from "firebase/auth";

// ...
await signOut(auth);
```

## 3. Cloud Firestore

Use the Firestore SDK to read and write data. 

**Add a new Issue:**
```javascript
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ...
const issueRef = await addDoc(collection(db, "issues"), {
  userId: user.uid,
  description: "Huge pothole near college",
  category: "Road Damage",
  imageUrl: imageUrl, // Obtained from Storage
  latitude: 13.04,
  longitude: 80.23,
  status: "Pending",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

**Get User's Issues:**
```javascript
import { collection, query, where, getDocs } from "firebase/firestore";

// ...
const q = query(collection(db, "issues"), where("userId", "==", user.uid));
const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
  console.log(doc.id, " => ", doc.data());
});
```

## 4. Cloud Storage

Use the Storage SDK for uploading images.

**Upload Issue Image:**
```javascript
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ...
// Path format: issues/{userId}/{issueId}/{filename}
// Note: You can generate an issueId before adding to Firestore using doc(collection(db, "issues")).id
const imageRef = ref(storage, `issues/${user.uid}/${issueId}/${file.name}`);

await uploadBytes(imageRef, file);
const imageUrl = await getDownloadURL(imageRef);
```

---
*Note: This guide is a living document and will be updated as we implement Cloud Functions and AI features.*
