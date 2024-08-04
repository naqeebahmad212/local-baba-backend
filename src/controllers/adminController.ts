import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import Category from "../models/category";
import Order from "../models/order";
import Restaurant from "../models/restaurantModal";
import Product from "../models/productModel";
import User from "../models/userModel";
import ApiErrorHandler from "../utils/apiErrorHandler";
import mongoose from "mongoose";
import { getYearRange } from "../utils";

export const addCategory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return next(new ApiErrorHandler("Category already exists", 400));
    }

    let imageName = "";
    if (req.file) {
      imageName = req.file.filename;
    }
    const image =
      req.protocol + "://" + req.get("host") + "/images/" + imageName;

    const category = await Category.create({ name, image });
    res.status(201).json({ category });
  }
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "category deleted" });
  }
);

export const adminDashboardStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const year = req.query.year;
    const totalOrders = await Order.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalRiders = await User.countDocuments({ role: "rider" });
    const monthlyRevenue = Array(12).fill(0);

    // get recent orders
    const recentOrders = await Order.find()
      .sort({ _id: -1 })
      .limit(10)
      .populate({ path: "user", select: "name email image phone location" })
      .populate({ path: "restaurant", select: "name image address location" });

    const allOrders = await Order.find({ orderStatus: "Delivered" }).populate({
      path: "user",
      select: "name email image phone location",
    });
    let totalRevenue = 0;
    allOrders.forEach((order) => {
      totalRevenue += order.totalPrice;
    });

    res.status(200).json({
      totalRiders,
      totalRestaurants,
      totalCategories,
      totalProducts,
      recentOrders,
      totalOrders,
      totalRevenue,
      monthlyRevenue,
    });
  }
);

export const ordersListAndHistory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const orders = await Order.find()
      .populate({
        path: "restaurant",
        select: "name image address location",
        populate: {
          path: "reviews",
          select: "review rating",
        },
      })
      .populate({ path: "user", select: "name image phone location" })
      .populate({
        path: "orderItem.product",
        select: "itemName image reviews",
      })
      .exec();
    res.status(200).json({ orders });
  }
);

export const getCustomers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const customersWithOrders = await User.find({
      role: "customer",
      orders: { $exists: true, $not: { $size: 0 } },
    }).select(
      "-password -OTP -OTPExpire -personalDetails -identification -accountBalance -isApproved -vehicleDetails"
    );
    res.status(200).json({ customers: customersWithOrders });
  }
);

export const getRestaurants = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const restaurants = await Restaurant.find({ isApproved: true }).select(
      "-password -OTP -OTPExpire"
    );
    res.status(200).json({ restaurants, success: true });
  }
);

export const getPendingRestaurants = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const restaurants = await Restaurant.find({ isApproved: false }).select(
      "-password -OTP -OTPExpire"
    );
    res.status(200).json({ restaurants, success: true });
  }
);

export const getRestaurantDetails = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).select(
      "-password -OTP -OTPExpire"
    );
    res.status(200).json({ restaurant, success: true });
  }
);

export const getRiders = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const riders = await User.find({ role: "rider", isApproved: true }).select(
      "-password -OTP -OTPExpire"
    );
    res.status(200).json({ riders, success: true });
  }
);

export const getPendingRiders = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const riders = await User.find({ role: "rider", isApproved: false }).select(
      "-password -OTP -OTPExpire"
    );
    res.status(200).json({ riders, success: true });
  }
);
export const getRiderDetails = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const rider = await User.findById(id).select("-password -OTP -OTPExpire");
    res.status(200).json({ rider, success: true });
  }
);

export const acceptRider = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { isApprove } = req.body;
    const rider = await User.findById(id);
    if (!rider) return next(new ApiErrorHandler("Rider not found", 404));
    rider.isApproved = isApprove;
    await rider.save();
    res.status(200).json({
      success: true,
      message: "Rider updated successfully",
      approve: rider?.isApproved,
    });
  }
);

export const acceptRestaurant = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { isApprove } = req.body;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant)
      return next(new ApiErrorHandler("Restaurant not found", 404));
    restaurant.isApproved = isApprove;
    await restaurant.save();
    res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      approve: restaurant?.isApproved,
    });
  }
);
