import mongoose, { Document, Schema } from "mongoose";
import { UserWithLocation } from "../@types/user";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import validator from "validator";

const userSchema = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Enter Email"],
      unique: true,
      validate: [validator.isEmail, "Enter valid email"],
    },
    googleId: {
      type: String,
    },
    password: {
      type: String,
      // required: [true, "Enter Password"],
      select: false,
      // minlength: [8, "Password should be at least 8 characters long"],
    },
    totalReview: {
      type: Number,
      default: 0,
    },
    ratings: {
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
        profile: {
          type: String,
        },
      },
    ],
    accountBalance: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      default: "costumer",
      enum: ["costumer", "rider", "admin"],
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    isApproved: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Inactive", "Deleted", "Blocked", "Suspended"],
    },
    lastLogin: {
      type: Date,
    },
    OTP: {
      type: String,
    },
    OTPExpire: {
      type: Date,
    },

    personalDetails: {
      address: {
        type: String,
      },
      phone: {
        type: String,
        validator: [
          function (v: any) {
            return validator.isMobilePhone(v, "any", { strictMode: true });
          },
          "Enter valid phone number",
        ],
      },
      gender: {
        type: String,
        // enum: ["male", "female", "Others"],
        default: "Male",
      },
      available: {
        type: Boolean,
        default: true,
      },
      DOB: {
        type: Date,
      },
      nationality: {
        type: String,
      },
    },
    identification: {
      nationalId: {
        type: String,
      },
      idCardExp: {
        type: Date,
      },
      idCardCopy: {
        type: String,
      },
      drivingLicenseNo: {
        type: String,
      },
      drivingLicenseExp: {
        type: Date,
      },
      drivingLicenseCopy: {
        type: String,
      },
    },
    vehicleDetails: {
      vehicleType: {
        type: String,
      },
      vehicleNumber: {
        type: String,
      },
      vehicleModel: {
        type: String,
      },
      vehicleMake: {
        type: String,
      },
      vehicleIdCopy: {
        type: String,
      },
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
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

userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// will use this for forget password
userSchema.methods.getPasswordVerificationToken = function () {
  const verificationToken = crypto.randomBytes(20).toString("hex");
  this.PasswordVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.PasswordVerificationExpire = Date.now() + 15 * 60 * 1000;
  return verificationToken;
};

// mail verification after signup
userSchema.methods.generateOTP = function () {
  const OTP = Math.floor(1000 + Math.random() * 9000).toString();
  this.OTP = OTP;
  this.OTPExpire = Date.now() + 5 * 60 * 1000;
  return OTP;
};
// Function to check profile completeness
userSchema.methods.isProfileComplete = function () {
  const requiredFields = [
    "name",
    "email",
    "personalDetails.address",
    "personalDetails.phone",
    "personalDetails.gender",
    "personalDetails.DOB",
    "personalDetails.nationality",
    "identification.nationalId",
    "identification.idCardExp",
    "identification.idCardCopy",
    "identification.drivingLicenseNo",
    "identification.drivingLicenseExp",
    "identification.drivingLicenseCopy",
    "vehicleDetails.vehicleType",
    "vehicleDetails.vehicleNumber",
    "vehicleDetails.vehicleModel",
    "vehicleDetails.vehicleMake",
    "vehicleDetails.vehicleIdCopy",
  ];

  for (const field of requiredFields) {
    const value = field
      .split(".")
      .reduce((acc, part) => acc && acc[part], this);
    if (!value) return false;
  }
  return true;
};

const User = mongoose.model<UserWithLocation>("User", userSchema);

userSchema.index({ location: "2dsphere" });
export default User;
