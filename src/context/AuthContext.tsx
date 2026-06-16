import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { auth, db } from '../services/firebase';
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: data.name || firebaseUser.displayName || '',
              role: data.role as UserRole,
            });
          }
          // If the user document doesn't exist, we deliberately do NOT set the user state.
          // This prevents unregistered users from accessing the app.
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const verifyGoogleToken = async (idToken: string, role: UserRole = 'buyer', isRegister: boolean = false) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      // Block login if they don't have an account
      if (!isRegister && !userDoc.exists()) {
        await signOut(auth); // Log them back out of Firebase
        throw new Error('Account not found. Please go to Register to create an account first.');
      }

      // Create account only if registering
      if (isRegister && !userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          name: result.user.displayName,
          role,
          createdAt: new Date().toISOString(),
        });
      }
      
      // Use existing role if they already have an account, otherwise use the selected role
      const finalRole = userDoc.exists() ? userDoc.data().role : role;
      
      setUser({
        id: result.user.uid,
        email: result.user.email || '',
        name: result.user.displayName || '',
        role: finalRole as UserRole,
      });
      
      return true;
    } catch (error) {
      console.error('Error verifying Google Token:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const registerWithEmail = async (email: string, password: string, role: UserRole = 'buyer') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        role,
        createdAt: new Date().toISOString(),
      });
      setUser({ id: result.user.uid, email, role });
      return true;
    } catch (error) {
      console.error('Error registering with email:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error('Account not found. Please go to Register first.');
      }
      const data = userDoc.data();
      setUser({ id: result.user.uid, email: result.user.email || '', role: data.role });
      return true;
    } catch (error) {
      console.error('Error logging in with email:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, verifyGoogleToken, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

