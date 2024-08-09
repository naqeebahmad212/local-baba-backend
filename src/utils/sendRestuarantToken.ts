import { Response } from "express";
import { Restaurant } from "../@types/restaurant";
import jwt from "jsonwebtoken";
export const sendRestaurantToken = (
  restaurant: Restaurant,
  res: Response,
  statusCode: number,
  otpMsg?: string
) => {
  const maxAge = Date.now() + 24 * 3 * 60 * 60 * 1000;

  const token = jwt.sign({ id: restaurant._id }, process.env.JWT_SECRET!, {
    expiresIn: maxAge,
  });
  res
    .cookie("jwtTokenAccess", token, {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "none",
    })
    .status(statusCode)
    .json({ message: otpMsg ? otpMsg : "Authenticated", restaurant, token });
};
