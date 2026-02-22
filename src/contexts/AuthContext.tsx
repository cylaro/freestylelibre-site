"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut as firebaseSignOut
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { normalizeUser, UserProfile } from "@/lib/schemas";
import { callApi } from "@/lib/apiClient";
import { getAuthToken } from "@/lib/authToken";

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
    let unsubscribeProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (nextUser) {
        setLoading(true);
        // Use onSnapshot for real-time profile updates (e.g. if admin bans user)
        unsubscribeProfile = onSnapshot(
          doc(db, "users", nextUser.uid),
          (userDoc) => {
            if (userDoc.exists()) {
              setProfile(normalizeUser(userDoc.data(), { uid: nextUser.uid, email: nextUser.email ?? "" }));
            } else {
              // Profile will be created by Worker upon first interaction if needed,
              // or we can keep the local creation but only for non-sensitive fields.
              // However, per requirements, we trust the database state.
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error listening to profile:", error);
            (async () => {
              try {
                const token = await getAuthToken(nextUser);
                const response = await callApi<{ profile?: unknown }>("/api/user/profile", token, "GET");
                if (response.profile) {
                  setProfile(normalizeUser(response.profile, { uid: nextUser.uid, email: nextUser.email ?? "" }));
                } else {
                  setProfile(null);
                }
              } catch (fallbackError) {
                console.error("Profile fallback failed:", fallbackError);
                setProfile(null);
              } finally {
                setLoading(false);
              }
            })();
          }
        );
        return;
      }

      setProfile(null);
      setLoading(false);
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
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
