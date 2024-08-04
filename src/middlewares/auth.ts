import { NextFunction, Request, Response } from "express";
import ApiErrorHandler from "../utils/apiErrorHandler";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import Restaurant from "../models/restaurantModal";
import { sendEmail } from "../utils/sendEmail";
import logger from "../utils/logger";

// CHECKS IF the user/restaurant is logged in and if true it check if email is verified if both are true then middleware will continue to next middleware
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.cookies.jwtTokenAccess ||
    req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    next(new ApiErrorHandler("Login to Access the resource", 401));
  } else {
    jwt.verify(
      token,
      process.env.JWT_SECRET!,
      async (err: any, userInfo: any) => {
        if (err) {
          next(new ApiErrorHandler("Login to Access the resource", 401));
        } else {
          //  check if the logged in is user set req.user to user
          const user = await User.findById(userInfo.id);
          if (user) {
            if (user.isVerified) {
              req.costumeUser = user;
              next();

              // IN ELSE if user is not verified send OTP to verify email
            } else {
              const OTP = user.generateOTP();
              await user.save();
              const message = `Your OTP is ${OTP}`;
              try {
                sendEmail({
                  email: user.email,
                  subject: "Email verification",
                  message,
                });
                res.status(200).json({
                  message:
                    "OTP was to sent to your register email please verify",
                  succuss: true,
                  email: user.email,
                });
              } catch (error) {
                logger.error(error);
                return next(new ApiErrorHandler("Unable to send email", 500));
              }
            }
          }
          // check if the logged in is restaurant set req.restaurant to restaurant
          const restaurant = await Restaurant.findById(userInfo.id);
          if (restaurant) {
            req.restaurant = restaurant;
            next();
          }
        }
      }
    );
  }
};

export const isUserRoleAuthorize = (...roles: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.costumeUser && !roles.includes(req.costumeUser.role)) {
      return next(
        new ApiErrorHandler(
          `Role : ${req.costumeUser.role} is not allowed to access this route`,
          403
        )
      );
    } else if (req.restaurant && !roles.includes(req.restaurant.role)) {
      return next(
        new ApiErrorHandler(
          `Role : ${req.restaurant.role} is not allowed to access this route`,
          403
        )
      );
    } else {
      next();
    }
  };
};

export const isRestaurantApproved = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.restaurant) return next(new ApiErrorHandler("UnAuthorized", 401));
  if (req.restaurant.isApproved !== true) {
    return next(
      new ApiErrorHandler(
        `Restaurant is not approved to access this route`,
        403
      )
    );
  } else {
    next();
  }
};
