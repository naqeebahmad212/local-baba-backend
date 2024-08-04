import mongoose, { Document, Types } from "mongoose";
import { Product } from "../@types/index";

interface OwnerDetails {
  name: string;
  email: string;
  password: string;
  image?: string;
  phone?: string;
  gender?: "Male" | "Female" | "Others";
  DOB?: Date;
  nationality?: string;
}

interface Location {
  type: string;
  coordinates: [number, number];
}
// interface order={

// }

export type Review = {
  user: mongoose.Schema.Types.ObjectId;
  rating: number;
  comment: string;
  profile?: string;
};
interface Restaurant extends Document {
  ownerDetails: OwnerDetails;
  name: string;
  phone?: string;
  email: string;
  password: string;
  city: string;
  role: string;
  address: string;
  noOfEmployees: number;
  isEmailVerified: boolean;
  cuisineType: string;
  totalReview?: number;
  reviews?: Review[];
  ratings?: number;
  operatingHours?: string;
  image?: string;
  legalCopyOfRestaurantLicense?: string;
  isApproved?: boolean;
  location?: Location;
  createdAt?: Date;
  updatedAt?: Date;
  OTP?: string;
  orders: mongoose.Schema.Types.ObjectId[];
  OTPExpire?: Date;
  passwordVerificationToken?: string;
  passwordVerificationExpire?: Date;
  isProfileCompleted?: boolean;
  products: Product[];

  comparePassword(enteredPassword: string): Promise<boolean>;
  getPasswordVerificationToken(): string;
  generateOTP(): string;
  isProfileComplete(): boolean;
}

export type { OwnerDetails, Location, Restaurant };
