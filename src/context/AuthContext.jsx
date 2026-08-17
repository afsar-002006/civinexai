import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // { name, role, email }
  const [loading, setLoading] = useState(true);

  // Register function
  async function register(email, password, name, role = 'Citizen') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile document in Firestore: users/{userId}
      const userRef = doc(db, 'users', user.uid);
      const profileData = {
        name,
        email,
        role,
        createdAt: serverTimestamp()
      };

      try {
        await setDoc(userRef, profileData);
        setUserProfile(profileData);
      } catch (err) {
        console.warn("Firestore user creation warning:", err);
        setUserProfile(profileData);
      }

      return user;
    } catch (err) {
      console.warn("Firebase Auth Error, checking fallback:", err);
      // Fallback for demo prototype mode if API key is invalid/placeholder
      if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key' || !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your_api_key_here') {
        const demoUser = { uid: 'demo-' + Date.now(), email, displayName: name };
        const demoProfile = { name, email, role, createdAt: new Date().toISOString() };
        
        localStorage.setItem('civinex_demo_user', JSON.stringify(demoUser));
        localStorage.setItem('civinex_demo_profile', JSON.stringify(demoProfile));
        
        setCurrentUser(demoUser);
        setUserProfile(demoProfile);
        return demoUser;
      }
      throw err;
    }
  }

  // Login function
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user profile from Firestore
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserProfile(userSnap.data());
        } else {
          const defaultProfile = { name: email.split('@')[0], email, role: 'Citizen' };
          setUserProfile(defaultProfile);
        }
      } catch (err) {
        console.warn("Error fetching user profile from Firestore:", err);
        setUserProfile({ name: email.split('@')[0], email, role: 'Citizen' });
      }

      return user;
    } catch (err) {
      console.warn("Firebase Login Error, checking fallback:", err);
      if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key' || !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your_api_key_here') {
        const savedProfile = localStorage.getItem('civinex_demo_profile');
        let demoProfile = savedProfile ? JSON.parse(savedProfile) : { name: email.split('@')[0], email, role: 'Citizen' };
        
        // Infer authority if email contains authority or officer
        if (email.toLowerCase().includes('authority') || email.toLowerCase().includes('officer')) {
          demoProfile.role = 'Authority';
        }

        const demoUser = { uid: 'demo-user-id', email, displayName: demoProfile.name };
        
        localStorage.setItem('civinex_demo_user', JSON.stringify(demoUser));
        localStorage.setItem('civinex_demo_profile', JSON.stringify(demoProfile));

        setCurrentUser(demoUser);
        setUserProfile(demoProfile);
        return demoUser;
      }
      throw err;
    }
  }

  // Logout function
  function logout() {
    localStorage.removeItem('civinex_demo_user');
    localStorage.removeItem('civinex_demo_profile');
    setUserProfile(null);
    setCurrentUser(null);
    try {
      return signOut(auth);
    } catch (e) {
      return Promise.resolve();
    }
  }

  // Listen to auth state changes
  useEffect(() => {
    let isMounted = true;

    // Safety fallback timeout: prevent blank page if Firebase Auth hangs or delays on demo keys
    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 800);

    // Check local storage for demo mode persistence
    const savedUser = localStorage.getItem('civinex_demo_user');
    const savedProfile = localStorage.getItem('civinex_demo_profile');
    
    if (savedUser && savedProfile) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setUserProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.warn("Failed to parse demo user session", e);
      }
      setLoading(false);
      clearTimeout(timeout);
      return;
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!isMounted) return;
        setCurrentUser(user);
        if (user) {
          try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setUserProfile(userSnap.data());
            } else {
              setUserProfile({ name: user.displayName || user.email.split('@')[0], email: user.email, role: 'Citizen' });
            }
          } catch (err) {
            console.warn("Error fetching user profile on auth state change:", err);
            setUserProfile({ name: user.displayName || user.email.split('@')[0], email: user.email, role: 'Citizen' });
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
        clearTimeout(timeout);
      }, (err) => {
        console.warn("onAuthStateChanged error:", err);
        if (isMounted) setLoading(false);
        clearTimeout(timeout);
      });
    } catch (err) {
      console.warn("Firebase Auth listener initialization error:", err);
      if (isMounted) setLoading(false);
      clearTimeout(timeout);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    role: userProfile?.role || 'Citizen',
    register,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

