"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { User, UserRole } from "@/lib/types";

// Maximum session lifetime: 8 hours
const MAX_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
// Inactivity timeout: 45 minutes of no user interaction
const INACTIVITY_TIMEOUT_MS = 45 * 60 * 1000;

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  role: UserRole | null;
  logout: () => Promise<void>;
  sessionExpiresAt: number | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  role: null,
  logout: async () => {},
  sessionExpiresAt: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);

  const lastActivityRef = useRef<number>(Date.now());
  const expirationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    try {
      // Clear server-side HttpOnly session cookie
      await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
    } catch {}

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("sabrang_auth");
      sessionStorage.removeItem("sabrang_session_expires");
    }

    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn("SignOut warning:", e);
    }

    setUser(null);
    setUserData(null);
    setRole(null);
    setSessionExpiresAt(null);
  }, []);

  // Inactivity and session expiration watchdog
  useEffect(() => {
    if (!user) return;

    const checkExpiration = () => {
      const now = Date.now();
      const expires = sessionExpiresAt || (now + MAX_SESSION_DURATION_MS);
      const isExpired = now >= expires;
      const isInactive = now - lastActivityRef.current > INACTIVITY_TIMEOUT_MS;

      if (isExpired || isInactive) {
        console.warn("[Auth] Session expired or timed out due to inactivity.");
        handleLogout();
      }
    };

    const interval = setInterval(checkExpiration, 30 * 1000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [user, sessionExpiresAt, handleLogout]);

  // Track user activity (clicks, keys, touch) to update inactivity timestamp
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pointerdown", updateActivity, { passive: true });
      window.addEventListener("keydown", updateActivity, { passive: true });
      window.addEventListener("scroll", updateActivity, { passive: true });

      return () => {
        window.removeEventListener("pointerdown", updateActivity);
        window.removeEventListener("keydown", updateActivity);
        window.removeEventListener("scroll", updateActivity);
      };
    }
  }, []);

  useEffect(() => {
    let unsubscribe = () => {};

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        (event.reason.message?.includes("Database is closing") ||
          event.reason.message?.includes("database is closing") ||
          event.reason.code === "failed-precondition")
      ) {
        event.preventDefault();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", handleUnhandledRejection);
    }

    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          if (firebaseUser) {
            setUser(firebaseUser);

            // Calculate session expiration timestamp
            const now = Date.now();
            const storedExpires = typeof window !== "undefined"
              ? Number(sessionStorage.getItem("sabrang_session_expires"))
              : null;
            
            const expires = storedExpires && storedExpires > now
              ? storedExpires
              : now + MAX_SESSION_DURATION_MS;

            setSessionExpiresAt(expires);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("sabrang_session_expires", String(expires));
            }

            // Secure role verification from database
            // FAIL-CLOSED: strictly default to 'attendee'
            let resolvedRole: UserRole = "attendee";
            let resolvedUserData: User | null = null;

            try {
              const [userDoc, roleDoc] = await Promise.all([
                getDoc(doc(db, "users", firebaseUser.uid)).catch(() => null),
                getDoc(doc(doc(db, "roles", firebaseUser.uid).parent, firebaseUser.uid)).catch(() => null),
              ]);

              if (roleDoc && roleDoc.exists() && roleDoc.data()?.role) {
                const r = roleDoc.data().role;
                if (r === "admin" || r === "scanner") resolvedRole = r;
              } else if (userDoc && userDoc.exists() && userDoc.data()?.role) {
                const data = userDoc.data() as User;
                resolvedUserData = data;
                if (data.role === "admin" || data.role === "scanner") {
                  resolvedRole = data.role;
                }
              }
            } catch (error) {
              console.warn("[Auth] Failed to load user profile doc. Defaulting to standard attendee role:", error);
              resolvedRole = "attendee";
            }

            setRole(resolvedRole);
            setUserData(resolvedUserData);
          } else {
            setUser(null);
            setUserData(null);
            setRole(null);
            setSessionExpiresAt(null);
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("sabrang_auth");
              sessionStorage.removeItem("sabrang_session_expires");
            }
          }
          setLoading(false);
        },
        (error) => {
          console.warn("Auth state observer warning:", error);
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn("Could not subscribe to Firebase auth state:", err);
      setLoading(false);
    }

    return () => {
      unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, role, logout: handleLogout, sessionExpiresAt }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
