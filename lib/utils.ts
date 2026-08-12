import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: any) => {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(36).padStart(2, "0"))
      .join("")
      .slice(0, 13);
  }
  return Math.random().toString(36).substring(2, 15);
};

export const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const array = new Uint32Array(5);
    crypto.getRandomValues(array);
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(array[i] % chars.length);
    }
  } else {
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return code;
};

// Sanitize user input to prevent XSS attacks
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>"'&]/g, "") // Remove potentially dangerous characters
    .slice(0, 100); // Limit length
};

// Validate name input
export const validateName = (
  name: string,
): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(name);

  if (!sanitized) {
    return { isValid: false, error: "Name is required" };
  }

  if (sanitized.length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters" };
  }

  if (sanitized.length > 50) {
    return { isValid: false, error: "Name must be less than 50 characters" };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-']+$/.test(sanitized)) {
    return {
      isValid: false,
      error: "Name can only contain letters, spaces, hyphens, and apostrophes",
    };
  }

  return { isValid: true };
};

// Sanitize and validate email
export const validateEmail = (
  email: string,
): { isValid: boolean; error?: string; email?: string } => {
  const sanitized = email.trim().toLowerCase();

  if (!sanitized) {
    return { isValid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true, email: sanitized };
};
