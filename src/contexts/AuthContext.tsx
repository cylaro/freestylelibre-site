"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut as firebaseSignOut
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { normalizeUser, UserProfile } from "@/lib/schemas";
import { callWorker } from "@/lib/workerClient";
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
    let stopPolling: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);

      if (stopPolling) {
        stopPolling();
        stopPolling = null;
      }

      if (nextUser) {
        setLoading(true);
        const loadProfile = async () => {
          try {
            const token = await getAuthToken(nextUser);
            const response = await callWorker<{ profile?: unknown }>("/api/user/profile", token, "GET");
            if (response.profile) {
              setProfile(normalizeUser(response.profile, { uid: nextUser.uid, email: nextUser.email ?? "" }));
            } else {
              setProfile(null);
            }
          } catch (error) {
            console.error("Profile load failed:", error);
            setProfile(null);
          } finally {
            setLoading(false);
          }
        };

        loadProfile();
        const timer = window.setInterval(loadProfile, 25000);
        stopPolling = () => window.clearInterval(timer);
        return;
      }

      setProfile(null);
      setLoading(false);
    });

    return () => {
      if (stopPolling) stopPolling();
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
