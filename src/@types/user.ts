import { Request } from "express";
import mongoose, { Document } from "mongoose";
import { Review } from "./restaurant";

interface PersonalDetails {
  address?: string;
  phone?: string;
  gender?: string;
  available?: boolean;
  DOB?: Date;
  nationality?: string;
}

interface Identification {
  nationalId?: string;
  idCardExp?: Date;
  idCardCopy?: string;
  drivingLicenseNo?: string;
  drivingLicenseExp?: Date;
  drivingLicenseCopy?: string;
}

interface VehicleDetails {
  vehicleType?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  vehicleMake?: string;
  vehicleIdCopy?: string;
}

interface Location {
  type: string;
  coordinates: number[];
}

export interface UserWithLocation extends Document {
  // Add methods
  name?: string;
  email: string;
  password?: string;
  googleId?: string;
  accountBalance: number;
  image?: string;
  role: "costumer" | "rider" | "admin";
  orders: mongoose.Schema.Types.ObjectId[];
  isApproved: boolean;
  isVerified: boolean;
  totalReview?: number;
  reviews?: Review[];
  status?: "Active" | "Inactive" | "Deleted" | "Blocked" | "Suspended";
  lastLogin?: Date;
  ratings?: number;
  OTP?: string;
  OTPExpire?: Date;
  personalDetails?: PersonalDetails;
  identification?: Identification;
  vehicleDetails?: VehicleDetails;
  isProfileCompleted: boolean;
  location: Location;
  createdAt: Date;
  passwordVerificationToken?: string;
  passwordVerificationExpire?: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
  getPasswordVerificationToken(): string;
  generateOTP(): string;
}
