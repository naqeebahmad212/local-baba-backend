import mongoose, { Document, Schema } from "mongoose";
import { UserWithLocation } from "../@types/user";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import validator from "validator";
import { Restaurant } from "../@types/restaurant";

const restaurantSchema = new Schema(
  {
    name: {
      type: String,
    },
    phone: {
      type: String,
      unique: true,
      validator: [validator.isMobilePhone, "Enter valid phone number"],
    },
    email: {
      type: String,
      required: [true, "Enter Email"],
    },
    password: {
      type: String,
      required: [true, "Enter Password"],
      select: false,
      minlength: [8, "Password should be at least 8 characters long"],
    },
    city: {
      type: String,
    },
    address: {
      type: String,
    },
    noOfEmployees: {
      type: Number,
    },
    cuisineType: {
      type: String,
    },
    operatingHours: {
      type: String,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    image: {
      type: String,
    },
    ownerDetails: {
      name: {
        type: String,
      },
      email: {
        type: String,
        unique: true,
        validate: [validator.isEmail, "Enter valid email"],
      },

      image: {
        type: String,
      },
      phone: {
        type: String,
      },
      gender: {
        type: String,
        enum: ["Male", "Female", "Others"],
        default: "Male",
      },
      DOB: {
        type: Date,
      },
      nationality: {
        type: String,
      },
    },
    legalCopyOfRestaurantLicense: {
      type: String,
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    ratings: {
      type: Number,
      default: 0,
    },
    totalReview: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // This should match the model name of the referenced schema
        },
        rating: {
          type: Number,
          default: 0,
        },
        comment: {
          type: String,
        },
      },
    ],
    role: {
      type: String,
      default: "restaurant",
    },

    OTP: {
      type: String,
    },
    OTPExpire: {
      type: Date,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0], //  [longitude, latitude]
      },
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    passwordVerificationToken: String,
    passwordVerificationExpire: Date,
  },
  { timestamps: true }
);

restaurantSchema.methods.comparePassword = async function (
  enteredPassword: string
) {
  return await bcrypt.compare(enteredPassword, this.password);
};

restaurantSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});
restaurantSchema.methods.generateOTP = function () {
  const OTP = Math.floor(1000 + Math.random() * 9000).toString();
  this.OTP = OTP;
  this.OTPExpire = Date.now() + 5 * 60 * 1000;
  return OTP;
};

restaurantSchema.methods.getPasswordVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString("hex");
  this.PasswordVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.PasswordVerificationExpire = Date.now() + 15 * 60 * 1000;
  return verificationToken;
};
// Function to check profile completeness
restaurantSchema.methods.isProfileComplete = function () {
  const requiredFields = [
    "name",
    "phone",
    "email",
    "city",
    "address",
    "noOfEmployees",
    "cuisineType",
    "operatingHours",
    "ownerDetails.name",
    "ownerDetails.email",
    "ownerDetails.phone",
    "ownerDetails.gender",
    "ownerDetails.DOB",
    "ownerDetails.nationality",
    "legalCopyOfRestaurantLicense",
  ];

  for (const field of requiredFields) {
    const value = field
      .split(".")
      .reduce((acc, part) => acc && acc[part], this);
    if (!value) {
      console.log(`Missing field: ${field}`);
      return false;
    }
  }
  return true;
};
restaurantSchema.index({ location: "2dsphere" });

const Restaurant = mongoose.model<Restaurant>("Restaurant", restaurantSchema);

export default Restaurant;
