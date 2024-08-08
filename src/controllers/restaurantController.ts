import express, { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import User from "../models/userModel";
import ApiErrorHandler from "../utils/apiErrorHandler";
import Restaurant from "../models/restaurantModal";
import { Model } from "mongoose";
import Product from "../models/productModel";
import bcrypt from "bcryptjs";
import { sendToken } from "../utils/sendToken";
import { sendRestaurantToken } from "../utils/sendRestuarantToken";
import { sendEmail } from "../utils/sendEmail";
import Order from "../models/order";
import { calculateDiscountPercentage, getYearRange } from "../utils";
import mongoose from "mongoose";
import Notification from "../models/notification";

export const registerRestaurant = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || password)
      return next(
        new ApiErrorHandler("Please provide email and password", 400)
      );

    const user = await User.findOne({ email });
    if (user)
      return next(new ApiErrorHandler("A user with this email exists", 400));

    const restaurant = await Restaurant.create({
      email,
      password,
    });
    if (!restaurant) {
      return next(new ApiErrorHandler("Restaurant not created", 400));
    }
    const OTP = restaurant.generateOTP();
    await restaurant.save();

    try {
      sendEmail({
        email: restaurant.email,
        subject: "Please confirm your Email",
        message: "Your four digit OTP is " + OTP,
      });
      res.status(201).json({
        success: true,
        message: "Four digit OTP was to sent to your register email",
      });
    } catch (error: any) {
      restaurant.OTP = undefined;
      restaurant.OTPExpire = undefined;
      await restaurant.save();
      return next(new ApiErrorHandler(error.message, 500));
    }
  }
);
export const loginRestaurant = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const restaurant = await Restaurant.findOne({ email }).select("+password");
    if (!restaurant) {
      return next(new ApiErrorHandler("Invalid Credentials", 401));
    } else {
      const auth = await bcrypt.compare(password, restaurant.password);
      if (!auth) {
        return next(new ApiErrorHandler("Invalid Credentials", 401));
      } else {
        sendRestaurantToken(restaurant, res, 201);
      }
    }
  }
);
export const restaurantDetails = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.restaurant) {
      return next(new ApiErrorHandler("Restaurant not found", 404));
    }
    let imageName = "";
    if (req.file) {
      imageName = req.file.filename;
    }
    const image =
      req.protocol + "://" + req.get("host") + "/images/" + imageName;
    const {
      name,
      phone,
      city,
      address,
      noOfEmployees,
      cuisineType,
      operatingHours,
    } = req.body;

    const restaurant = await Restaurant.findById(req.restaurant._id);
    if (!restaurant)
      return next(new ApiErrorHandler("Restaurant not found", 404));

    if (name) restaurant.name = name;
    if (phone) restaurant.phone = phone;
    if (city) restaurant.city = city;
    if (address) restaurant.address = address;
    if (noOfEmployees) restaurant.noOfEmployees = noOfEmployees;
    if (cuisineType) restaurant.cuisineType = cuisineType;
    if (operatingHours) restaurant.operatingHours = operatingHours;
    if (req.file) restaurant.image = image;
    await restaurant.save();
    const isCompleted = restaurant?.isProfileComplete();
    restaurant.isProfileCompleted = isCompleted;
    await restaurant.save();
    res.status(200).json({
      success: true,
      restaurant,
    });
  }
);

export const ownerDetails = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.restaurant)
      return next(new ApiErrorHandler("Restaurant not found", 404));
    let imageName = "";
    if (req.file) {
      imageName = req.file.filename;
    }
    const image =
      req.protocol + "://" + req.get("host") + "/images/" + imageName;
    const { name, email, phone, gender, DOB, nationality } = req.body;
    [name, email, phone, gender, DOB, nationality].forEach((val) => {
      if (!val)
        return next(new ApiErrorHandler("Please fill all the fields", 400));
    });
    await Restaurant.findByIdAndUpdate(req.restaurant._id, {
      ownerDetails: {
        name,
        email,
        phone,
        image,
        gender,
        DOB,
        nationality,
      },
    });
    const restaurant = await Restaurant.findById(req.restaurant._id);
    if (!restaurant)
      return next(new ApiErrorHandler("Restaurant not found", 404));
    const isCompleted = restaurant?.isProfileComplete();
    restaurant.isProfileCompleted = isCompleted;
    await restaurant.save();
    res.status(200).json({
      success: true,
      restaurant,
    });
  }
);

export const uploadLegalCopy = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.restaurant)
      return next(new ApiErrorHandler("Restaurant not found", 404));
    let imageName = "";
    if (req.file) {
      imageName = req.file.filename;
    }
    const legalCopyOfRestaurantLicense =
      req.protocol + "://" + req.get("host") + "/images/" + imageName;

    await Restaurant.findByIdAndUpdate(req.restaurant._id, {
      legalCopyOfRestaurantLicense,
    });

    const restaurant = await Restaurant.findById(req.restaurant._id);
    if (!restaurant)
      return next(new ApiErrorHandler("Restaurant not found", 404));
    const isCompleted = restaurant.isProfileComplete();
    restaurant.isProfileCompleted = isCompleted;
    await restaurant.save();
    res.status(200).json({
      success: true,
      restaurant,
    });
  }
);

export const getCurrentRestaurant = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.restaurant)
      return next(new ApiErrorHandler("Restaurant not found", 404));
    const restaurant = await Restaurant.findById(req.restaurant._id);
    res.status(200).json({
      success: true,
      restaurant,
    });
  }
);

export const addNewProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.restaurant)
      return next(new ApiErrorHandler("Restaurant not found", 404));

    const ifProductExist = await Product.findOne({
      restaurant: req.restaurant._id,
      itemName: req.body.itemName,
    });
    if (ifProductExist) {
      return next(
        new ApiErrorHandler(
          "Product already exist in your menu please update from the panel or delete it",
          400
        )
      );
    }

    let imageName = "";
    if (req.file) {
      imageName = req.file.filename;
    }
    const image =
      req.protocol + "://" + req.get("host") + "/images/" + imageName;

    const productData: any = {
      itemName: req.body.itemName,
      category: req.body.categoryId,
      description: req.body.description,
      basePrice: parseFloat(req.body.basePrice),
      discountPrice: parseFloat(req.body.discountPrice),
      restaurant: req.restaurant._id as any,
      ingredients: [],
      sizes: [],
      extras: [],
      availability: req.body.availability,
      image: image,
      discountPercentage: calculateDiscountPercentage(
        req.body.basePrice,
        req.body.discountPrice
      ),
    };

    // Process sizes
    if (Array.isArray(req.body.sizes)) {
      productData.sizes = req.body.sizes.map((size: any) => ({
        size: size.size,
        price: parseFloat(size.price),
      }));
    }

    // Process extras
    if (Array.isArray(req.body.extras)) {
      productData.extras = req.body.extras.map((extra: any) => ({
        name: extra.name,
        price: parseFloat(extra.price),
      }));
    }

    // Ensure ingredients is an array
    if (Array.isArray(req.body.ingredients)) {
      productData.ingredients = req.body.ingredients.map(
        (ingredient: any) => ingredient
      );
    } else if (req.body.ingredients) {
      productData.ingredients = [req.body.ingredients];
    }

    const product = new Product(productData);
    const savedProduct = await product.save();
    if (!savedProduct) {
      return next(new ApiErrorHandler("Product not created", 400));
    }
    await Restaurant.findByIdAndUpdate(req.restaurant._id, {
      $push: {
        products: savedProduct._id,
      },
    });
    res.status(201).json({
      success: true,
      savedProduct,
    });
  }
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findById(req.body.productId);
    if (!product) {
      return next(new ApiErrorHandler("Product not found", 404));
    }

    let imageName = "";
    if (req.file) {
      imageName = req.file.filename;
    }
    const image =
      req.protocol + "://" + req.get("host") + "/images/" + imageName;

    // Update product fields
    product.itemName = req.body.itemName || product.itemName;
    product.category = req.body.categoryId || product.category;
    product.description = req.body.description || product.description;
    product.basePrice = parseFloat(req.body.basePrice) || product.basePrice;
    product.discountPrice =
      parseFloat(req.body.discountPrice) || product.discountPrice;
    product.discountPercentage =
      calculateDiscountPercentage(req.body.basePrice, req.body.discountPrice) ||
      product.discountPercentage;
    product.availability = req.body.availability || product.availability;

    if (req.file) {
      product.image = image;
    }

    // Handle ingredients
    if (Array.isArray(req.body.ingredients)) {
      product.ingredients = req.body.ingredients;
    }

    // Handle sizes
    if (Array.isArray(req.body.sizes)) {
      product.sizes = req.body.sizes.map((size: any) => ({
        size: size.size,
        price: parseFloat(size.price),
      }));
    }

    // Handle extras
    if (Array.isArray(req.body.extras)) {
      console.log(req.body.extras);
      product.extras = req.body.extras.map((extra: any) => ({
        name: extra.name,
        price: extra.price,
      }));
    }

    await product.save();

    res.status(200).json({
      success: true,
      product,
    });
  }
);
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  }
);
export const getSingleProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const product = await Product.findById(id).populate("category");
    if (!product) return next(new ApiErrorHandler("Product not found", 404));

    res.status(200).json({
      success: true,
      product,
    });
  }
);

export const getRestaurantProducts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const sort = req.query.sort as string;
    const query = req.query.q as string;
    if (!req.restaurant)
      return next(new ApiErrorHandler("Restaurant not found", 404));
    const { _id: id } = req.restaurant;
    let products = await Product.find({
      restaurant: id,
    }).sort({
      createdAt: sort === "asc" ? 1 : -1,
    });
    if (query) {
      products = products.filter((product) =>
        product.itemName.toLowerCase().includes(query.toLowerCase())
      );
    }
    if (!products) {
      return next(new ApiErrorHandler("Restaurant not found", 404));
    }
    res.status(200).json({
      success: true,
      products,
    });
  }
);

export const getRestaurantOrders = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.restaurant)
      return next(new ApiErrorHandler("Restaurant not found", 404));
    const { _id: id } = req.restaurant;

    const timeQuery = req.query.time;
    const sort = req.query.sort as string;
    const search = req.query.search as string;

    let orders = await Order.find({ restaurant: id })
      .sort({
        createdAt: sort === "asc" ? 1 : -1,
      })
      .populate({
        path: "restaurant",
        select: "name image",
      })
      .populate({
        path: "user",
        select:
          "name email image personalDetails.phone personalDetails.address",
      })
      .populate({
        path: "orderItem.product",
        select: "itemName description",
      });

    // const orders = await Order.aggregate([
    //   {
    //     $lookup: {
    //       from: "users", // Collection name for User model
    //       localField: "user", // Field in Order collection
    //       foreignField: "_id", // Field in User collection
    //       as: "userDetails",
    //     },
    //   },
    //   {
    //     $unwind: "$userDetails", // Unwind the array created by $lookup
    //   },

    //   {
    //     $match: {
    //       "userDetails.name": "khan", // Match orders where user's name is userName
    //     },
    //   },
    //   {
    //     $addFields: {
    //       user: "$userDetails",
    //     },
    //   },
    //   {
    //     $project: {
    //       "userDetails.name": 1,
    //       "userDetails.email": 1,
    //       "userDetails.image": 1,
    //       "userDetails.personalDetails.phone": 1,
    //       "userDetails.personalDetails.address": 1,
    //       orderItem: 1,
    //       user: 1,
    //       restaurant: 1,
    //       paymentInfo: 1,
    //       paidAt: 1,
    //       itemsPrice: 1,
    //       taxPrice: 1,
    //       deliveredBy: 1,
    //       shippingPrice: 1,
    //       totalPrice: 1,
    //       orderStatus: 1,
    //       deliveredAt: 1,
    //       createdAt: 1,
    //     },
    //   },
    // ]);

    if (!orders) {
      return next(new ApiErrorHandler("orders not found", 404));
    }

    if (search) {
      orders = orders.filter((order) => {
        const user = order.user as any;
        return user?.name.toLowerCase().includes(search.toLowerCase());
      });
    }

    // current week order ================================
    if (timeQuery === "weekly") {
      const endOfWeek = new Date();
      const startOfWeek = new Date();
      startOfWeek.setDate(endOfWeek.getDate() - 7); // 30 days ago

      let weeklyOrders = await Order.find({
        restaurant: req.restaurant._id,
        createdAt: {
          $gte: startOfWeek,
          $lt: endOfWeek,
        },
      })
        .populate({
          path: "restaurant",
          select: "name image",
        })
        .populate({
          path: "user",
          select:
            "name email image personalDetails.phone personalDetails.address",
        })
        .populate({
          path: "orderItem.product",
          select: "itemName description",
        });

      if (search) {
        weeklyOrders = weeklyOrders.filter((order) => {
          const user = order.user as any;
          return user?.name.toLowerCase().includes(search.toLowerCase());
        });
      }

      res.status(200).json({
        success: true,
        orders: weeklyOrders,
      });
    }
    // current month orders+++++++++++++++++++++++++++++++++++++++
    else if (timeQuery === "monthly") {
      const endOfMonth = new Date();
      const startOfMonth = new Date();
      startOfMonth.setDate(endOfMonth.getDate() - 30); // 30 days ago

      let monthlyOrders = await Order.find({
        restaurant: req.restaurant._id,
        createdAt: {
          $gte: startOfMonth,
          $lt: endOfMonth,
        },
      })
        .populate({
          path: "restaurant",
          select: "name image",
        })
        .populate({
          path: "user",
          select:
            "name email image personalDetails.phone personalDetails.address",
        })
        .populate({
          path: "orderItem.product",
          select: "itemName description",
        });
      if (search) {
        monthlyOrders = monthlyOrders.filter((order) => {
          const user = order.user as any;
          return user?.name.toLowerCase().includes(search.toLowerCase());
        });
      }
      res.status(200).json({
        success: true,
        orders: monthlyOrders,
      });
    }

    // todays orders+++++++++++++++++++++++
    else if (timeQuery === "daily") {
      const endOfDay = new Date();
      const startOfDay = new Date();
      startOfDay.setHours(startOfDay.getHours() - 24); // 24 hours ago

      let hourlyOrders = await Order.find({
        restaurant: req.restaurant._id,
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      })
        .populate({
          path: "restaurant",
          select: "name image",
        })
        .populate({
          path: "user",
          select:
            "name email image personalDetails.phone personalDetails.address",
        })
        .populate({
          path: "orderItem.product",
          select: "itemName description",
        });

      if (search) {
        hourlyOrders = hourlyOrders.filter((order) => {
          const user = order.user as any;
          return user?.name.toLowerCase().includes(search.toLowerCase());
        });
      }
      res.status(200).json({
        success: true,
        orders: hourlyOrders,
      });
    } else {
      res.status(200).json({
        orders,
        success: true,
      });
    }
  }
);

export const restaurantDashboardStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.restaurant)
      return next(new ApiErrorHandler("Restaurant not found", 404));
    const year = req.query.year;

    const totalMenuItems = await Product.find({
      restaurant: req.restaurant._id,
    });
    const runningOrders = await Order.find({
      orderStatus: {
        $in: ["Preparing", "Picked up", "On its way"],
      },
      restaurant: req.restaurant._id,
    })
      .populate({
        path: "user",
        select:
          "name email image personalDetails.phone personalDetails.address",
      })
      .populate({
        path: "orderItem.product",
        select: "itemName description",
      });

    const orderRequests = await Order.find({
      restaurant: req.restaurant._id,
      orderStatus: "Processing",
    });

    const orderHistory = await Order.find({
      restaurant: req.restaurant._id,
    })
      .sort({ deliveredAt: -1 })
      .populate({
        path: "user",
        select: "name email image phone",
      });

    const deliveredOrders = await Order.find({
      restaurant: req.restaurant._id,
      orderStatus: "Delivered",
    });

    let totalEarning = 0;
    deliveredOrders.forEach((order) => {
      totalEarning += order.totalPrice;
    });

    res.status(200).json({
      message:
        "data: totalMenuItems , menuCount , runningOrders , runningOrderCunt , orderRequests , orderHistory , totalEarning , yearlyRevenue , monthlyRevenue for graph , deliveredOrders",
      totalMenuItems,
      menuCount: totalMenuItems.length,
      runningOrders,
      runningOrderCunt: runningOrders.length,
      orderRequests: orderRequests.length,
      orderHistory,
      totalEarning,
      deliveredOrders,
      success: true,
    });
  }
);

export const getYearsComparison = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.restaurant) return next(new ApiErrorHandler("UnAuthorized", 400));
    const year1 = new Date().getFullYear();
    const year2 = year1 - 1;
    const { _id: restaurantId } = req.restaurant;

    async function getOrdersForYear(year: number) {
      const { start, end } = getYearRange(year);
      return Order.find({
        restaurant: restaurantId,
        orderStatus: "Delivered",
        deliveredAt: {
          $gte: start,
          $lt: end,
        },
      });
    }
    const firstYear = Array(12).fill(0);
    const secondYear = Array(12).fill(0);
    const monthsInYear = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const ordersYear1 = await getOrdersForYear(year1);
    const ordersYear2 = await getOrdersForYear(year2);

    ordersYear1.forEach((order) => {
      const month = new Date(order.deliveredAt!).getMonth();
      firstYear[month] += order.totalPrice;
    });
    const firstYearData = monthsInYear.map((month, index) => ({
      month: `${month}`, // Label for each day
      count: ordersYear1[index], // Corresponding order co
    }));

    ordersYear2.forEach((order) => {
      const month = new Date(order.deliveredAt!).getMonth();
      secondYear[month] += order.totalPrice;
    });

    const graphData = monthsInYear.map((month, index) => ({
      month: `${month}`, // Label for each day
      currentYear: firstYear[index], // Corresponding order co
      previousYear: secondYear[index],
    }));

    res.status(200).json({
      message: "data retrieved successfully",
      graphData,
    });
  }
);

export const getOrderMapData = asyncHandler(
  async (req: Request, res: Response, next: Function) => {
    if (!req.restaurant)
      return next(new ApiErrorHandler("UnAuthorize restaurant", 401));

    // ========================current week============================================
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Get the start of the week (Sunday)

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Get the end of the week (Saturday)

    const weeklyOrderCount = Array(7).fill(0); // For each day of the week
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const weeklyOrders = await Order.find({
      orderStatus: "Delivered",
      restaurant: req.restaurant._id,
      deliveredAt: {
        $gte: startOfWeek,
        $lt: endOfWeek,
      },
    });
    weeklyOrders.forEach((order) => {
      const deliveredAt = new Date(order.deliveredAt!);
      const dayOfWeek = deliveredAt.getDay(); // Get the day of the week (0 for Sunday, 1 for Monday, etc.)
      weeklyOrderCount[dayOfWeek] += 1;
    });

    const weeklyOrderData = daysOfWeek.map((day, index) => ({
      day,
      count: weeklyOrderCount[index],
    }));

    // ============================================last 30 days============================================

    const endOfMonth = new Date();
    const startOfMonth = new Date();
    startOfMonth.setDate(endOfMonth.getDate() - 30); // 30 days ago

    const monthlyOrderCount = Array(30).fill(0); // For each day of the last 30 days
    const daysInMonth = Array.from({ length: 30 }, (_, index) => index + 1);

    const monthlyOrders = await Order.find({
      orderStatus: "Delivered",
      restaurant: req.restaurant._id,
      deliveredAt: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    });

    monthlyOrders.forEach((order) => {
      const deliveredAt = new Date(order.deliveredAt!);
      const dayOfMonth = Math.floor(
        (deliveredAt.getTime() - startOfMonth.getTime()) / (24 * 60 * 60 * 1000)
      ); // Day index in the last 30 days
      monthlyOrderCount[dayOfMonth] += 1;
    });

    const monthlyOrderData = daysInMonth.map((day, index) => ({
      day: `${day}`, // Label for each day
      count: monthlyOrderCount[index], // Corresponding order co
    }));

    // =======================================last 24 hours============================================

    const endOfDay = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(startOfDay.getHours() - 24); // 24 hours ago

    const hourlyOrderCount = Array(24).fill(0); // For each hour of the day
    const hoursInDay = Array.from({ length: 24 }, (_, index) => index + 1);

    const hourlyOrders = await Order.find({
      orderStatus: "Delivered",
      restaurant: req.restaurant._id,
      deliveredAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    hourlyOrders.forEach((order) => {
      const deliveredAt = new Date(order.deliveredAt!);
      const hourOfDay = deliveredAt.getHours(); // Get the hour of the day (0-23)
      hourlyOrderCount[hourOfDay] += 1;
    });

    const hourlyOrderData = hoursInDay.map((day, index) => ({
      day: `${day}`, // Label for each day
      count: hourlyOrderCount[index], // Corresponding order co
    }));

    res.status(200).json({
      success: true,
      message: "monthly , weekly, daily order count  retrieved successfully",
      monthlyOrderData,
      weeklyOrderData,
      hourlyOrderData,
    });
  }
);

export const getRestaurantReviews = asyncHandler(
  async (req: Request, res: Response, next: Function) => {
    if (!req.restaurant)
      return next(new ApiErrorHandler("restaurant not found", 404));
    const restaurant = await Restaurant.findById(req.restaurant._id).populate({
      path: "reviews.user",
      select: "name image",
    });

    res.status(200).json({
      reviews: restaurant?.reviews,
      ratings: restaurant?.ratings,
      reviewsCount: restaurant?.totalReview,
    });
  }
);

export const getOrderInfo = asyncHandler(
  async (req: Request, res: Response, next: Function) => {
    if (!req.restaurant) {
      return next(new ApiErrorHandler("UnAuthorize restaurant", 401));
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

export const getRestaurantNotifications = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.restaurant)
      return next(new ApiErrorHandler("Restaurant not found", 404));
    const notifications = await Notification.find({
      restaurant: req.restaurant._id,
    });

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      notifications,
    });
  }
);

export const updateOrder = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { orderId, paymentStatus, orderStatus } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return next(new ApiErrorHandler("Order not found", 404));
    if (order.orderStatus === "Delivered") {
      return next(new ApiErrorHandler("Order already delivered", 400));
    }
    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentInfo.status = paymentStatus;
    if (orderStatus === "Delivered") {
      order.deliveredAt = new Date();
      order.paidAt = new Date();
      order.paymentInfo.status = "paid";
      order.paymentInfo.paymentMethod = "cod";
    }
    if (paymentStatus === "paid") order.paidAt = new Date();
    await order.save();
    res.status(200).json({
      message: "order updated successfully",
      order,
    });
  }
);
