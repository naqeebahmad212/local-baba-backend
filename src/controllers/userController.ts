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
import Category from "../models/category";
import Restaurant from "../models/restaurantModal";
import Product from "../models/productModel";
import Order from "../models/order";
import { Order as OrderType, Review } from "../@types";
import { storeNotification } from "../utils/saveNotification";
import { getIo } from "../utils/socketIo";
import Notification from "../models/notification";

export const registerUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, phone } = req.body;
    [email, name, password, phone].forEach((val) => {
      if (!val) {
        return next(
          new ApiErrorHandler(
            "Please provide email, name, password and phone",
            400
          )
        );
      }
    });

    const restaurant = await Restaurant.findOne({ email });
    if (restaurant)
      return next(
        new ApiErrorHandler("A restaurant with this email exists", 400)
      );

    const user = await User.create({
      name,
      email,
      password,
      phone,
      isApproved: true,
    });
    if (!user) {
      return next(new ApiErrorHandler("User not created", 400));
    }
    const OTP = user.generateOTP();
    await user.save();
    try {
      sendEmail({
        email: user.email,
        message: "Your four digit OTP is " + OTP,
        subject: "Password verification",
      });
      res.status(200).json({
        message: "Four digit OTP was to sent to your register email",
        succuss: true,
      });
    } catch (err: any) {
      user.OTP = undefined;
      user.OTP = undefined;
      await user.save();

      return next(new ApiErrorHandler(err.message, 500));
    }
  }
);

export const getIndexPage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      success: true,
    });
  }
);

export const getCurrentUserDetails = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser) {
      return next(new ApiErrorHandler("UnAuthorize user", 401));
    }
    const currentUser = await User.findById(req.costumeUser._id)
      .populate("orders")
      .select(
        "-password -personalDetails -otp -vehicleDetails -identification -accountBalance -isApproved"
      );
    res.status(200).json({ currentUser, success: true });
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
export const getDiscountedRestaurants = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const restaurants = await Restaurant.find().populate({
      path: "products",
      match: { discountPercentage: { $gt: 0 } },
    });

    const discountedRestaurants = restaurants.filter(
      (restaurant) => restaurant.products.length > 0
    );
    res.status(200).json({
      success: true,
      discountedRestaurants,
    });
  }
);
export const getNearByRestaurants = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { longitude, latitude } = req.body;
    // Ensure 'location' is formatted correctly for geo-spatial queries
    const coordinates = [longitude, latitude]; // [longitude, latitude]
    const restaurants = await Restaurant.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          $maxDistance: 1000, // in meters (adjust as needed)
        },
      },
    });
    const nearByRestaurants =
      restaurants.length > 0 ? restaurants : "No restaurants found";
    res.status(200).json({
      success: true,
      nearByRestaurants,
    });
  }
);
export const getRestaurantProducts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).populate("products");
    if (!restaurant) {
      return next(new ApiErrorHandler("Restaurant not found", 404));
    }
    res.status(200).json({
      success: true,
      products: restaurant.products,
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
export const placeOrder = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser) {
      return next(new ApiErrorHandler("UnAuthorize user", 401));
    }

    const {
      orderItem,
      paymentInfo,
      itemsPrice,
      taxPrice,
      totalPrice,
      shippingPrice,
    }: OrderType = req.body;
    const product = await Product.findById(orderItem[0]?.product);

    if (paymentInfo.paymentMethod === "online") {
      if (!paymentInfo.id)
        return next(new ApiErrorHandler("Provide razorpay order id", 400));
    }

    const newOrder = await Order.create({
      orderItem,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      restaurant: product?.restaurant,
      user: req.costumeUser._id,
    });
    if (!newOrder) {
      return next(new ApiErrorHandler("Order not created", 400));
    }
    if (newOrder.paymentInfo?.paymentMethod === "online") {
      newOrder.paidAt = new Date();
      await newOrder.save();
    }

    const message = `Order with id: ${newOrder._id}, has been placed by 
    ${req.costumeUser.name}  <br/> total Order Price: ${newOrder.totalPrice} `;

    const newNotification = await storeNotification(
      "orderPlaced",
      newOrder.user as any,
      newOrder.restaurant!,
      newOrder._id as any,
      message
    );

    await newNotification.save();

    getIo().emit("notification", newNotification);

    try {
      sendEmail({
        email: req.costumeUser.email,
        subject: "Order Placed",
        message: `Your order has been placed. Order id is ${newOrder._id}, Total Amount: ${totalPrice}`,
      });

      res.status(200).json({
        success: true,
        newOrder,
      });
    } catch (error) {}
  }
);

export const getUserOrders = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser) {
      return next(new ApiErrorHandler("UnAuthorize user", 401));
    }
    const orders = await Order.find({ user: req.costumeUser._id }).populate({
      path: "restaurant",
      select: "name image",
    });
    res.status(200).json({
      success: true,
      orders,
    });
  }
);
export const getSingleOrderInfo = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser) {
      return next(new ApiErrorHandler("UnAuthorize user", 401));
    }
    const { id } = req.params;
    const order = await Order.findById(id).populate({
      path: "restaurant",
      select: "name image",
    });
    if (!order) {
      return next(new ApiErrorHandler("Order not found", 404));
    }
    res.status(200).json({
      success: true,
      order,
    });
  }
);
export const cancelOrder = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("UnAuthorize user", 401));
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return next(new ApiErrorHandler("Order not found", 404));
    }
    order.orderStatus = "Cancelled";
    await order.save();

    const message = `Order with id: ${order._id}, has been cancelled by 
    ${req.costumeUser.name}  <br/> total Order Price: ${order.totalPrice} `;

    const newNotification = await storeNotification(
      "orderCancelled",
      order.user as any,
      order.restaurant!,
      order._id as any,
      message
    );

    await newNotification.save();

    getIo().emit("notification", newNotification);
    try {
      sendEmail({
        email: req.costumeUser.email,
        subject: "Order Cancelled",
        message: `Your order with id: ${order._id}, total Order Price: ${order.totalPrice} has been cancelled.`,
      });

      res.status(200).json({
        success: true,
        message: "Order cancelled",
      });
    } catch (error) {
      return next(new ApiErrorHandler("Email not sent", 500));
    }
  }
);
export const updateProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("UnAuthorize user", 401));
    const { name, email, address, phone } = req.body;
    const user = await User.findById(req.costumeUser._id).select(
      "-password -personalDetails -vehicleDetails -identification -OTP -OTPExpires -accountBalance -ratings -reviews totalReview"
    );
    if (!user) return next(new ApiErrorHandler("User not found", 404));
    let imageName = "";
    if (req.file) {
      imageName = req.file.filename;
    }
    const image =
      req.protocol + "://" + req.get("host") + "/images/" + imageName;

    if (name) user.name = name;
    if (email) user.email = email;
    if (address) user.personalDetails!.address = address;
    if (req.file) user.image = image;
    if (phone) {
      if (user.personalDetails?.phone) {
        user.personalDetails.phone = phone;
      }
    }
    await user.save();
    res.status(200).json({
      success: true,
      message: "Profile updated",
      user,
    });
  }
);

export const addProductRestaurantAndRiderReview = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("User not found", 404));
    const { rating, comment, id } = req.body;

    [rating, comment, id].forEach((val) => {
      if (!val)
        return next(new ApiErrorHandler("Please fill all the fields", 400));
    });

    const product = await Product.findById(id);
    const restaurant = await Restaurant.findById(id);
    const rider = await User.findById(id);

    const review: Review = {
      user: req.costumeUser._id as any,
      rating: Number(rating),
      comment,
      profile: req.costumeUser.image,
    };

    // check if the review is a for product
    if (product) {
      const isReviewed = product?.reviews?.find(
        (rev) => rev.user.toString() === req.costumeUser?._id?.toString()
      );

      if (isReviewed) {
        product.reviews?.forEach((rev) => {
          if (rev.user.toString() === req.costumeUser?._id?.toString()) {
            rev.rating = rating;
            rev.comment = comment;
            rev.profile = req.costumeUser.image!;
          }
        });
      } else {
        product.reviews?.push(review);
        product.totalReview = product.reviews?.length;
      }

      const totalRatingCount = product.reviews?.reduce(
        (acc, item) => acc + item.rating,
        0
      );
      product.ratings = totalRatingCount! / product.reviews?.length!;
      await product.save();

      const message = `${req.costumeUser.name}  has left ${rating} star review on your product.`;

      const newNotification = await storeNotification(
        "other",
        req.costumeUser._id as any,
        product.restaurant as any,
        undefined as any,
        message
      );

      await newNotification.save();

      getIo().emit("notification", newNotification);

      res.status(200).json({
        success: true,
        product,
        message: "Review added",
      });
    }

    if (restaurant) {
      const isReviewed = restaurant?.reviews?.find(
        (rev) => rev.user.toString() === req.costumeUser?._id?.toString()
      );

      if (isReviewed) {
        restaurant.reviews?.forEach((rev) => {
          if (rev.user.toString() === req.costumeUser?._id?.toString()) {
            rev.rating = rating;
            rev.comment = comment;
            rev.profile = req.costumeUser.image!;
          }
        });
      } else {
        restaurant.reviews?.push(review);
        restaurant.totalReview = restaurant.reviews?.length;
      }

      const totalRatingCount = restaurant.reviews?.reduce(
        (acc, item) => acc + item.rating,
        0
      );
      restaurant.ratings = totalRatingCount! / restaurant.reviews?.length!;
      await restaurant.save();

      const message = `${req.costumeUser.name}  has left ${rating} star review on your restaurant.`;

      const newNotification = await storeNotification(
        "other",
        req.costumeUser._id as any,
        restaurant._id as any,
        undefined as any,
        message
      );
      await newNotification.save();

      getIo().emit("notification", newNotification);

      res.status(200).json({
        success: true,
        restaurant,
        message: "Review added",
      });
    }

    if (rider) {
      const isReviewed = rider?.reviews?.find(
        (rev) => rev.user.toString() === req.costumeUser?._id?.toString()
      );

      if (isReviewed) {
        rider.reviews?.forEach((rev) => {
          if (rev.user.toString() === req.costumeUser?._id?.toString()) {
            rev.rating = rating;
            rev.comment = comment;
            rev.profile = req.costumeUser.image!;
          }
        });
      } else {
        rider.reviews?.push(review);
        rider.totalReview = rider.reviews?.length;
      }

      const totalRatingCount = rider.reviews?.reduce(
        (acc, item) => acc + item.rating,
        0
      );
      rider.ratings = totalRatingCount! / rider.reviews?.length!;
      await rider.save();

      const message = `${req.costumeUser.name}  has left you ${rating} star review.`;

      const newNotification = await storeNotification(
        "other",
        req.costumeUser._id as any,
        undefined as any,
        undefined as any,
        message
      );
      await newNotification.save();

      getIo().emit("notification", newNotification);

      res.status(200).json({
        success: true,
        rider,
        message: "Review added",
      });
    }

    if (!product && !restaurant && !rider) {
      return next(new ApiErrorHandler("Id is not valid or its undefined", 404));
    }
  }
);

export const getTopRatedRestaurants = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const restaurants = await Restaurant.find()
      .sort({ ratings: -1 })
      .limit(10)
      .select(
        "-password -personalDetails -OTP -OTPExpire -vehicleDetails -identification -accountBalance -isApproved -ownerDetails -legalCopyOfRestaurantLicense"
      );
    res.status(200).json({
      success: true,
      restaurants,
    });
  }
);

export const getUserNotifications = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("User not found", 404));
    const notifications = await Notification.find({
      receipt: req.costumeUser._id,
    });

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      notifications,
    });
  }
);
