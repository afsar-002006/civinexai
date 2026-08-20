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

  function getProfilesStore() {
    const saved = localStorage.getItem('civinex_user_profiles_store');
    let store = {
      'citizen@civinex.org': { name: 'Afsar Ahmed', email: 'citizen@civinex.org', role: 'Citizen' },
      'resident@civinex.org': { name: 'Afsar Ahmed', email: 'resident@civinex.org', role: 'Citizen' },
      'parent@civinex.org': { name: 'Afsar Ahmed', email: 'parent@civinex.org', role: 'Citizen' },
      'shopowner@civinex.org': { name: 'Afsar Ahmed', email: 'shopowner@civinex.org', role: 'Citizen' },
      'officer@civinex.org': { name: 'Authority Officer', email: 'officer@civinex.org', role: 'Authority' },
      'afsarafu760@gmail.com': { name: 'Afsar', email: 'afsarafu760@gmail.com', role: 'Citizen' },
    };
    if (saved) {
      try {
        store = { ...store, ...JSON.parse(saved) };
      } catch (_) {}
    }
    return store;
  }

  function cleanNameFromEmail(emailStr, fallbackName) {
    if (fallbackName && fallbackName.trim() && !fallbackName.includes('@')) {
      return fallbackName.trim();
    }
    if (!emailStr) return 'Citizen';
    const prefix = emailStr.split('@')[0];
    const cleaned = prefix.replace(/[0-9_.-]+/g, ' ').trim();
    if (!cleaned) return 'Citizen';
    return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  function getStoredProfile(emailStr, fallbackName = '') {
    if (!emailStr) return null;
    const lower = emailStr.toLowerCase().trim();
    const store = getProfilesStore();

    if (fallbackName && fallbackName.trim() && !fallbackName.includes('@')) {
      const updated = {
        name: fallbackName.trim(),
        email: lower,
        role: lower.includes('authority') || lower.includes('officer') ? 'Authority' : 'Citizen'
      };
      saveStoredProfile(updated);
      return updated;
    }

    if (store[lower] && store[lower].name && !store[lower].name.includes('@')) {
      return store[lower];
    }

    const clean = cleanNameFromEmail(lower, fallbackName);
    const role = lower.includes('authority') || lower.includes('officer') ? 'Authority' : 'Citizen';
    return { name: clean, email: lower, role };
  }

  function saveStoredProfile(profile) {
    if (!profile || !profile.email) return;
    const lower = profile.email.toLowerCase().trim();
    const store = getProfilesStore();
    const clean = profile.name && !profile.name.includes('@') ? profile.name.trim() : cleanNameFromEmail(lower);
    const updated = {
      name: clean,
      email: lower,
      role: profile.role || (lower.includes('authority') || lower.includes('officer') ? 'Authority' : 'Citizen')
    };
    store[lower] = updated;
    localStorage.setItem('civinex_user_profiles_store', JSON.stringify(store));
    localStorage.setItem('civinex_demo_profile', JSON.stringify(updated));
    return updated;
  }

  function updateUserProfileName(newName) {
    if (!newName || !newName.trim()) return;
    const clean = newName.trim();
    const email = currentUser?.email || userProfile?.email;
    if (!email) return;
    const lower = email.toLowerCase().trim();
    const updated = {
      name: clean,
      email: lower,
      role: userProfile?.role || 'Citizen'
    };
    saveStoredProfile(updated);
    setUserProfile(updated);
    if (currentUser) {
      const updatedUser = { ...currentUser, displayName: clean };
      setCurrentUser(updatedUser);
      localStorage.setItem('civinex_demo_user', JSON.stringify(updatedUser));
    }
  }

  function getRegisteredEmails() {
    const saved = localStorage.getItem('civinex_registered_emails');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) {}
    }
    return ['citizen@civinex.org', 'resident@civinex.org', 'parent@civinex.org', 'shopowner@civinex.org', 'officer@civinex.org', 'afsarafu760@gmail.com'];
  }

  function saveRegisteredEmail(email) {
    if (!email) return;
    const list = getRegisteredEmails();
    const lower = email.toLowerCase().trim();
    if (!list.includes(lower)) {
      list.push(lower);
      localStorage.setItem('civinex_registered_emails', JSON.stringify(list));
    }
  }

  function isEmailRegistered(email) {
    if (!email) return false;
    const list = getRegisteredEmails();
    return list.includes(email.toLowerCase().trim());
  }

  // Register function
  async function register(email, password, name, role = 'Citizen') {
    const cleanName = name && name.trim() ? name.trim() : cleanNameFromEmail(email);
    const profileData = {
      name: cleanName,
      email: email.toLowerCase().trim(),
      role,
      createdAt: new Date().toISOString()
    };
    saveStoredProfile(profileData);

    if (isEmailRegistered(email)) {
      const err = new Error('This email address is already registered.');
      err.code = 'auth/email-already-in-use';
      throw err;
    }
    saveRegisteredEmail(email);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, profileData);
      } catch (err) {
        console.warn("Firestore user creation warning:", err);
      }

      setUserProfile(profileData);
      return user;
    } catch (err) {
      console.warn("Firebase Auth Error, checking fallback:", err);
      if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key' || !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your_api_key_here') {
        const demoUser = { uid: 'demo-' + Date.now(), email: email.toLowerCase().trim(), displayName: cleanName };
        
        localStorage.setItem('civinex_demo_user', JSON.stringify(demoUser));
        localStorage.setItem('civinex_demo_profile', JSON.stringify(profileData));
        
        setCurrentUser(demoUser);
        setUserProfile(profileData);
        return demoUser;
      }
      throw err;
    }
  }

  // Login function
  async function login(email, password, providedName = '') {
    saveRegisteredEmail(email);
    let profile = getStoredProfile(email, providedName);

    if (providedName && providedName.trim() && !providedName.includes('@')) {
      profile = saveStoredProfile({ name: providedName.trim(), email, role: profile?.role || 'Citizen' });
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().name) {
          const fsProfile = { ...userSnap.data(), email: email.toLowerCase().trim() };
          saveStoredProfile(fsProfile);
          setUserProfile(fsProfile);
        } else {
          setUserProfile(profile);
        }
      } catch (err) {
        setUserProfile(profile);
      }

      return user;
    } catch (err) {
      console.warn("Firebase Login Error, checking fallback:", err);
      if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key' || !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your_api_key_here') {
        const demoUser = { uid: 'demo-user-id', email: email.toLowerCase().trim(), displayName: profile.name };
        
        localStorage.setItem('civinex_demo_user', JSON.stringify(demoUser));
        localStorage.setItem('civinex_demo_profile', JSON.stringify(profile));

        setCurrentUser(demoUser);
        setUserProfile(profile);
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

    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 800);

    const savedUser = localStorage.getItem('civinex_demo_user');
    const savedProfile = localStorage.getItem('civinex_demo_profile');
    
    if (savedUser && savedProfile) {
      try {
        const u = JSON.parse(savedUser);
        const p = JSON.parse(savedProfile);
        const cleanP = getStoredProfile(u.email || p.email, u.displayName || p.name);
        setCurrentUser({ ...u, displayName: cleanP.name });
        setUserProfile(cleanP);
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
          const profile = getStoredProfile(user.email, user.displayName);
          setUserProfile(profile);
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
    isEmailRegistered,
    updateUserProfileName,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

