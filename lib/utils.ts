import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates the JKLU Application Number format (e.g. JKLU/BBA/2025/0310).
 * Format: JKLU/<Course>/<Year>/<Serial>
 */
export function validateRegistrationNumber(num: string): boolean {
  if (!num) return false;
  const regex = /^[jJ][kK][lL][uU]\/[a-zA-Z0-9\.\-]+\/\d{4}\/\d{4}$/;
  return regex.test(num.trim());
}

/**
 * Automatically formats registration number to: JKLU/<Course>/<Year>/<Serial>
 * E.g., JKLU/BBA/2025/0310
 */
export function formatRegistrationNumber(val: string, prevVal: string = ''): string {
  let clean = val.toUpperCase().replace(/[^A-Z0-9\.\-\/]/g, '');
  const isDeleting = prevVal && clean.length < prevVal.toUpperCase().replace(/[^A-Z0-9\.\-\/]/g, '').length;

  // Ensure starts with JKLU
  if (clean.length > 0) {
    if (!clean.startsWith('JKLU')) {
      if ('JKLU'.startsWith(clean)) {
        // Let user type J, JK, JKL, JKLU
      } else {
        clean = 'JKLU/' + clean.replace(/^\/+/, '');
      }
    } else if (clean.startsWith('JKLU')) {
      if (clean === 'JKLU') {
        if (!isDeleting) {
          clean = 'JKLU/';
        }
      } else if (clean.length > 4 && clean[4] !== '/') {
        clean = 'JKLU/' + clean.slice(4);
      }
    }
  }

  // Format rest: Course/Year/Serial
  if (clean.startsWith('JKLU/')) {
    let rest = clean.slice(5);
    const hasTrailingSlash = rest.endsWith('/') && rest.length > 1;
    rest = rest.replace(/\/+/g, '/');
    if (rest.endsWith('/') && rest.length > 1) {
      rest = rest.slice(0, -1);
    }

    const segments = rest.split('/');
    
    if (segments.length === 1) {
      const seg = segments[0];
      const firstDigitIdx = seg.search(/\d/);
      if (firstDigitIdx !== -1) {
        const course = seg.slice(0, firstDigitIdx);
        const digits = seg.slice(firstDigitIdx);
        
        let formattedDigits = digits.slice(0, 4);
        if (digits.length > 4) {
          formattedDigits += '/' + digits.slice(4, 8);
        } else if (digits.length === 4 && (hasTrailingSlash || !isDeleting)) {
          formattedDigits += '/';
        }
        
        if (course) {
          clean = `JKLU/${course}/${formattedDigits}`;
        } else {
          clean = `JKLU/${formattedDigits}`;
        }
      } else {
        const courseCodes = ['BBA', 'BTECH', 'B.TECH', 'BDES', 'B.DES', 'MDES', 'M.DES'];
        if (courseCodes.includes(seg) && !isDeleting) {
          clean = `JKLU/${seg}/`;
        } else if (hasTrailingSlash) {
          clean = `JKLU/${seg}/`;
        }
      }
    } else if (segments.length === 2) {
      const course = segments[0];
      const digits = segments[1].replace(/\D/g, '');
      
      let formattedDigits = digits.slice(0, 4);
      if (digits.length > 4) {
        formattedDigits += '/' + digits.slice(4, 8);
      } else if (digits.length === 4 && (hasTrailingSlash || !isDeleting)) {
        formattedDigits += '/';
      }
      
      if (course) {
        clean = `JKLU/${course}/${formattedDigits}`;
      } else {
        clean = `JKLU/${formattedDigits}`;
      }
    } else if (segments.length >= 3) {
      const course = segments[0];
      const year = segments[1].replace(/\D/g, '').slice(0, 4);
      const serial = segments[2].replace(/\D/g, '').slice(0, 4);
      
      if (course) {
        clean = `JKLU/${course}/${year}/${serial}`;
      } else {
        clean = `JKLU/${year}/${serial}`;
      }
    }
  }

  return clean;
}

export const formatDate = (date: any) => {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
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



