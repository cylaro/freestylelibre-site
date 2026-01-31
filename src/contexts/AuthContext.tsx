"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut as firebaseSignOut
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  phoneE164?: string;
  telegram: string;
  isAdmin: boolean;
  isBanned: boolean;
  banReason?: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyLevel: number; // 0, 1, 2, 3
  loyaltyDiscount: number; // 0, 5, 7, 10
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      
      if (user) {
        // Use onSnapshot for real-time profile updates (e.g. if admin bans user)
        const unsubscribeProfile = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Profile will be created by Worker upon first interaction if needed,
            // or we can keep the local creation but only for non-sensitive fields.
            // However, per requirements, we trust the database state.
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to profile:", error);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
