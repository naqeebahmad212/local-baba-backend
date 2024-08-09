import { asyncHandler } from "../utils/asyncHandler";
import ApiErrorHandler from "../utils/apiErrorHandler";
import geoip from "geoip-lite";
import logger from "../utils/logger";
import User from "../models/userModel";
import { UserWithLocation } from "../@types/user";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendToken } from "../utils/sendToken";
import { NextFunction, Request, Response } from "express";
import { sendEmail } from "../utils/sendEmail";
import Restaurant from "../models/restaurantModal";
import { sendRestaurantToken } from "../utils/sendRestuarantToken";

export const loginUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const user = await User.findOne(
      { email },
      "-personalDetails -identification -vehicleDetails +password"
    ).exec();
    if (!user) return next(new ApiErrorHandler("Invalid Credentials", 401));

    if (!user.password)
      return next(new ApiErrorHandler("Invalid Credentials", 401));
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) return next(new ApiErrorHandler("Invalid Credentials", 401));
    user.lastLogin = new Date();
    await user.save();
    sendToken(user, res, 201);
    // else {
    //   if (user.password) {
    //     const auth = await bcrypt.compare(password, user.password);
    //     if (!auth) {
    //       return next(new ApiErrorHandler("Invalid Credentials", 401));
    //     }
    //     user.lastLogin = new Date();
    //     await user.save();
    //     sendToken(user, res, 201);
    //   } else {
    //     return next(new ApiErrorHandler("Invalid Credentials", 401));
    //   }
    // }
  }
);

export const logoutUser = (req: Request, res: Response, next: NextFunction) => {
  res
    .clearCookie("jwtTokenAccess", {
      path: "/",
      secure: true,
      sameSite: "none",
    })
    .json({ success: true });
};

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findOne({ email: req.body.email });
    const restaurant = await Restaurant.findOne({ email: req.body.email });
    if (user) {
      // reset password token
      const OTP = user.generateOTP();
      await user.save();
      // will send in email to rider
      const message = `Your four digit OTP is ${OTP}.`;
      try {
        sendEmail({
          email: user.email,
          message,
          subject: "Password verification",
        });
        res.status(200).json({
          message: "Verification Email was to sent to your register email",
          succuss: true,
          email: user.email,
        });
      } catch (err: any) {
        user.OTP = undefined;
        user.OTP = undefined;
        await user.save();
        return next(new ApiErrorHandler(err.message, 500));
      }
    } else if (restaurant) {
      const OTP = restaurant.generateOTP();
      await restaurant.save();
      // will send in email to rider
      const message = `Your four digit OTP is ${OTP}.`;
      try {
        sendEmail({
          email: restaurant.email,
          message,
          subject: "Password verification",
        });
        res.status(200).json({
          message: "Verification Email was to sent to your register email",
          succuss: true,
          email: restaurant.email,
        });
      } catch (err: any) {
        restaurant.OTP = undefined;
        restaurant.OTP = undefined;
        await restaurant.save();
        return next(new ApiErrorHandler(err.message, 500));
      }
    } else {
      return next(new ApiErrorHandler("User not found", 404));
    }
  }
);

export const verifyOTP = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { OTP } = req.body;
    const user = await User.findOne({ OTP, OTPExpire: { $gt: Date.now() } });
    const restaurant = await Restaurant.findOne({
      OTP,
      OTPExpire: { $gt: Date.now() },
    });
    if (user) {
      user.isVerified = true;
      user.OTP = undefined;
      await user.save();
      sendToken(user, res, 200, "OTP verified");
    } else if (restaurant) {
      restaurant.isEmailVerified = true;
      restaurant.OTP = undefined;
      await restaurant.save();
      sendRestaurantToken(restaurant, res, 200, "OTP verified");
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { password } = req.body;
    if (req.costumeUser) {
      const user = await User.findOne({
        email: req.costumeUser.email!,
        OTPExpire: { $gt: Date.now() },
      });
      if (!user) return next(new ApiErrorHandler("User not found", 404));
      user.password = password;
      user.OTPExpire = undefined;
      await user.save();
      res
        .status(200)
        .json({ success: true, message: "Password Updated Successfully" });
    } else if (req.restaurant) {
      const restaurant = await Restaurant.findOne({
        email: req.restaurant.email!,
        OTPExpire: { $gt: Date.now() },
      });

      if (!restaurant)
        return next(new ApiErrorHandler("restaurant not found", 404));
      restaurant.password = password;
      restaurant.OTPExpire = undefined;
      await restaurant.save();
      res
        .status(200)
        .json({ success: true, message: "Password Updated Successfully" });
    }
  }
);

export const updatePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("User not found", 404));
    const { password, oldPassword } = req.body;
    const user = await User.findById(req.costumeUser._id);
    if (!user) return next(new ApiErrorHandler("User not found", 404));
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return next(new ApiErrorHandler("Wrong password", 400));
    user.password = password;
    await user.save();
    res.status(200).json({ message: "Password updated" });
  }
);
