import { Timestamp } from "firebase/firestore";

export type UserRole = "user" | "scanner" | "admin";

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Timestamp | Date;
}

export type CouponDiscountType = "percentage" | "fixed";

export interface Coupon {
  id?: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number; // percentage (e.g. 20 for 20%) or fixed price (e.g. 300 for ₹300)
  amount?: number; // legacy backward compatibility for fixed amount
  discountPercentage?: number; // legacy backward compatibility
  applicableEvents?: string[]; // List of event IDs / titles this coupon applies to. If empty or ['ALL'], applies to all events.
  expiryDate?: Timestamp | Date | string | null;
  maxUses?: number;
  usedCount?: number;
  active: boolean;
  createdAt?: Timestamp | Date | any;
  updatedAt?: Timestamp | Date | any;
}

export interface Coordinator {
  name: string;
  phone: string;
}

export interface Event {
  id?: string;
  title: string;
  description: string;
  category: "Flagship" | "Cultural" | "Fine Arts" | "E-Sports" | "Other" | string;
  dateTime?: Timestamp | Date | string;
  date?: Timestamp | Date | string;
  time?: string;
  venue: string;
  rules?: string;
  maxParticipants?: number;
  coordinators?: Coordinator[];
  prizePool?: string;
  price?: number; // Event registration price in INR
  isActive?: boolean;
  createdAt?: Timestamp | Date | any;
}

export interface Registration {
  id?: string;
  userId: string;
  eventId: string;
  eventName?: string;
  name?: string;
  email?: string;
  mobile?: string;
  rollNumber?: string;
  amount?: number;
  couponCode?: string;
  discountAmount?: number;
  qrCode: string;
  referralCode?: string;
  attended?: boolean;
  hasEntered?: boolean;
  attendedAt?: Timestamp | Date;
  checkedInBy?: string; // UID of admin/scanner
  createdAt: Timestamp | Date;
}
