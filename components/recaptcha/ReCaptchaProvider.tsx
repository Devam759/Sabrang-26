"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import Script from "next/script";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface ReCaptchaContextType {
  executeRecaptcha: (action: string) => Promise<string | null>;
  isLoaded: boolean;
}

const ReCaptchaContext = createContext<ReCaptchaContextType>({
  executeRecaptcha: async () => null,
  isLoaded: false,
});

export const useReCaptcha = () => useContext(ReCaptchaContext);

interface ReCaptchaProviderProps {
  children: React.ReactNode;
}

export function ReCaptchaProvider({ children }: ReCaptchaProviderProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!siteKey) {
      if (process.env.NODE_ENV === "development") {
        console.info(
          "[reCAPTCHA] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined. Skipping reCAPTCHA script injection.",
        );
      }
      return;
    }

    if (typeof window !== "undefined" && window.grecaptcha && typeof window.grecaptcha.ready === "function") {
      try {
        window.grecaptcha.ready(() => {
          setIsLoaded(true);
        });
      } catch (err) {
        console.warn("[reCAPTCHA] Ready callback notice:", err);
      }
    }
  }, [siteKey]);

  const executeRecaptcha = useCallback(
    async (action: string): Promise<string | null> => {
      if (!siteKey) {
        if (process.env.NODE_ENV === "development") {
          return "dev-mock-recaptcha-token";
        }
        return null;
      }

      if (typeof window === "undefined" || !window.grecaptcha) {
        console.warn("[reCAPTCHA] grecaptcha is not available yet.");
        return null;
      }

      try {
        return await new Promise<string | null>((resolve) => {
          window.grecaptcha!.ready(async () => {
            try {
              const token = await window.grecaptcha!.execute(siteKey, {
                action: action.replace(/[^a-zA-Z0-9_/]/g, "_"),
              });
              resolve(token);
            } catch (err) {
              console.error("[reCAPTCHA] Execution failed:", err);
              resolve(null);
            }
          });
        });
      } catch (err) {
        console.error("[reCAPTCHA] Unexpected error executing reCAPTCHA:", err);
        return null;
      }
    },
    [siteKey],
  );

  return (
    <ReCaptchaContext.Provider value={{ executeRecaptcha, isLoaded }}>
      {siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="lazyOnload"
          onLoad={() => {
            if (window.grecaptcha) {
              try {
                window.grecaptcha.ready(() => {
                  setIsLoaded(true);
                });
              } catch (err) {
                console.warn("[reCAPTCHA] onLoad callback notice:", err);
              }
            }
          }}
        />
      )}
      {children}
      {/* Official Google-compliant styling to hide badge without breaking DOM container */}
      <style jsx global>{`
        .grecaptcha-badge {
          visibility: hidden !important;
        }
      `}</style>
    </ReCaptchaContext.Provider>
  );
}

export default ReCaptchaProvider;
