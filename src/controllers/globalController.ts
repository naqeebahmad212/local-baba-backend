import { NextFunction, Request, Response } from "express";
import User from "../models/userModel";
import { asyncHandler } from "../utils/asyncHandler";
import Category from "../models/category";
import Restaurant from "../models/restaurantModal";
import Product from "../models/productModel";
import ApiErrorHandler from "../utils/apiErrorHandler";

export const updateUserLocation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude)
      return next(new ApiErrorHandler("Invalid Location", 400));
    const user = req.costumeUser;
    const restaurant = req.restaurant;
    if (user) {
      const updatedUser = await User.findByIdAndUpdate(
        req.costumeUser!._id,
        {
          location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        updatedUser,
      });
    }
    if (restaurant) {
      const updatedRestaurant = await Restaurant.findByIdAndUpdate(
        restaurant._id,
        {
          location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        updatedRestaurant,
      });
    }
  }
);

export const getUserById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const user = await User.findById(id).select(
      "-password -OTP -OTPExpire -personalDetails -identification -accountBalance -isApproved -vehicleDetails"
    );

    res.status(200).json({ user });
  }
);

export const getCategories = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const categories = await Category.find();
    res.status(200).json({ categories });
  }
);

export const getAllRestaurants = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { category } = req.query;
    const restaurants = await Restaurant.find(
      {},
      "-ownerDetails, -legalCopyOfRestaurantLicense -OTP -OTPExpire -orders  "
    ).populate("products");

    res.status(200).json({
      success: true,
      restaurants,
    });
  }
);

export const getProductsByCategory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.query;
    const products = await Product.find({
      category: categoryId,
    }).populate("category");
    res.status(200).json({
      success: true,
      products,
    });
  }
);

export const getProductDetails = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const product = await Product.findById(id).populate({
      path: "restaurant",
      select: "name image",
    });
    if (!product) {
      return next(new ApiErrorHandler("Product not found", 404));
    }
    res.status(200).json({
      success: true,
      product,
    });
  }
);
