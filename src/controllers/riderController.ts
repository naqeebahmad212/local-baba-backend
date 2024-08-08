import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import User from "../models/userModel";
import ApiErrorHandler from "../utils/apiErrorHandler";
import { sendEmail } from "../utils/sendEmail";
import logger from "../utils/logger";
import Order from "../models/order";
import Restaurant from "../models/restaurantModal";
import { Types } from "mongoose";
import { getISTDate } from "../utils";
import { getIo } from "../utils/socketIo";
import { storeNotification } from "../utils/saveNotification";
import Notification from "../models/notification";

export const registerRider = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(
        new ApiErrorHandler("Please provide email and password", 400)
      );
    }
    const restaurant = await Restaurant.findOne({ email });
    if (restaurant)
      return next(
        new ApiErrorHandler("A restaurant with this email exists", 400)
      );

    const rider = await User.create({
      email,
      password,
    });
    if (!rider) return next(new ApiErrorHandler("Rider not created", 400));
    const OTP = rider.generateOTP();
    await rider.save();
    // will send in email to rider
    const message = `Your 4 digit OTP is ${OTP}.`;

    // send mail to rider
    try {
      sendEmail({
        email: rider.email,
        message,
        subject: "Password verification",
      });
      res.status(200).json({
        message: "Four digit OTP was to sent to your registered email",
        succuss: true,
      });
    } catch (err: any) {
      rider.OTP = undefined;
      rider.OTP = undefined;
      await rider.save();

      return next(new ApiErrorHandler(err.message, 500));
    }
  }
);

export const getCurrentRiderDetails = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser) {
      return next(new ApiErrorHandler("UnAuthorize user", 401));
    }
    const currentRider = await User.findById(req.costumeUser._id)
      .populate("orders")
      .select("-password -OTP -OTPExpire");

    res.status(200).json({ currentRider, success: true });
  }
);

export const updatePersonalDetails = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("User not found", 404));
    let image = "";
    if (req.file) image = req.file.filename;
    const imageUrl = `${req.protocol}://${req.get("host")}/images/${image}`;
    const {
      name,
      phone,
      email,
      dateOfBirth,
      gender,
      nationality,
      address,
      availability,
    } = req.body;
    const rider = await User.findById(req.costumeUser._id);
    if (!rider) return next(new ApiErrorHandler("Rider not Created", 400));

    if (name) rider.name = name;
    if (phone) rider.personalDetails!.phone = phone;
    if (email) rider.email = email;
    if (dateOfBirth) rider.personalDetails!.DOB = dateOfBirth;
    if (gender) rider.personalDetails!.gender! = gender;
    if (nationality) rider.personalDetails!.nationality = nationality;
    if (address) rider.personalDetails!.address = address;
    if (availability) rider.personalDetails!.available = availability;
    if (req.file) rider.image = imageUrl;

    res.status(200).json({ rider });
  }
);

export const updateIdentification = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("User not found", 404));
    const email = req.costumeUser.email;
    let idCopyName = "";
    let licenseCopyName = "";
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // set the uploaded file name
    if (files.idCardCopy) idCopyName = files.idCardCopy[0].filename;
    if (files.drivingLicenseCopy)
      licenseCopyName = files.drivingLicenseCopy[0].filename;

    // set the uploaded file url
    const idCardUrl = `${req.protocol}://${req.get(
      "host"
    )}/images/${idCopyName}`;
    const licenseUrl = `${req.protocol}://${req.get(
      "host"
    )}/images/${licenseCopyName}`;

    // get data from client
    const { nationalId, idCardExp, drivingLicenseNo, drivingLicenseExp } =
      req.body;

    // check for empty fields
    [nationalId, idCardExp, drivingLicenseNo, drivingLicenseExp].forEach(
      (item) => {
        if (!item || item === "")
          return next(new ApiErrorHandler(`All fields required`, 400));
      }
    );

    // check expiry date
    if (idCardExp < Date.now()) {
      return next(new ApiErrorHandler("Id Card expired", 400));
    }
    if (drivingLicenseExp < Date.now()) {
      return next(new ApiErrorHandler("Driving License expired", 400));
    }

    // check for files
    if (!files.idCardCopy || !files.drivingLicenseCopy) {
      return next(new ApiErrorHandler("Upload files", 400));
    }

    const rider = await User.findById(req.costumeUser._id);
    if (!rider) return next(new ApiErrorHandler("Rider not Created", 400));

    if (nationalId) rider.identification!.nationalId = nationalId;
    if (idCardExp) rider.identification!.idCardExp = idCardExp;
    if (files.idCardCopy) rider.identification!.idCardCopy = idCardUrl;
    if (drivingLicenseNo)
      rider.identification!.drivingLicenseNo = drivingLicenseNo;
    if (drivingLicenseExp)
      rider.identification!.drivingLicenseExp = drivingLicenseExp;
    if (files.drivingLicenseCopy)
      rider.identification!.drivingLicenseCopy = licenseUrl;

    await rider.save();

    res.status(200).json({ rider });
  }
);

export const updateVehicleDetails = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("User not found", 404));
    const email = req.costumeUser.email;
    const { type, model, make, vehicleNo } = req.body;
    let image = "";
    if (req.file) image = req.file.filename;
    const imageUrl = `${req.protocol}://${req.get("host")}/images/${image}`;

    [type, model, make, vehicleNo].forEach((item) => {
      if (!item || item === "")
        return next(new ApiErrorHandler(`All fields required`, 400));
    });

    if (!image || image === "") {
      return next(new ApiErrorHandler("Upload image", 400));
    }

    const rider = await User.findOneAndUpdate(
      { email },
      {
        vehicleDetails: {
          vehicleType: type,
          vehicleModel: model,
          vehicleMake: make,
          vehicleNumber: vehicleNo,
          vehicleIdCopy: imageUrl,
        },
      }
    );
    if (!rider) return next(new ApiErrorHandler("Rider not Created", 400));
    res.status(200).json({ rider });
  }
);

export const getNearByOrders = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("User not found", 404));
    const riderLocation = req.costumeUser.location;
    const nearByRestaurants = await Restaurant.find({
      location: {
        $near: {
          $maxDistance: 5000,
          $geometry: {
            type: "Point",
            coordinates: riderLocation.coordinates,
          },
        },
      },
    });

    const nearByOrders = await Order.find({
      restaurant: {
        $in: nearByRestaurants.map((rest) => rest._id),
      },
      orderStatus: {
        $nin: ["Cancelled", "Delivered", "On its way", "Picked up"],
      },
    })
      .populate({
        path: "restaurant",
        select: "name image location address city",
      })
      .populate({
        path: "user",
        select: "name image location",
      });

    res.status(200).json({
      success: true,
      message: "within 5km Orders with user and restaurant location",
      nearByOrders,
      riderLocation,
    });
  }
);

export const acceptOrder = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("User not found", 404));
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return next(new ApiErrorHandler("Order not found", 404));

    if (order.orderStatus === "Cancelled")
      return next(new ApiErrorHandler("Order already cancelled", 400));

    if (order.orderStatus === "Delivered")
      return next(new ApiErrorHandler("Order already delivered", 400));

    if (order.orderStatus === "On its way")
      return next(new ApiErrorHandler("Order already on its way", 400));

    if (order.orderStatus === "Picked up")
      return next(new ApiErrorHandler("Order already picked up", 400));

    order.orderStatus = "On its way";
    order.deliveredBy = req.costumeUser._id as any;
    await order.save();
    const updatedOrder = await Order.findById(orderId)

      .populate({
        path: "restaurant",
        select: "name image location address city",
      })
      .populate({
        path: "user",
        select: "name image location",
      })
      .populate({
        path: "deliveredBy",
        select: "name image location",
      });
    if (!updatedOrder) return next(new ApiErrorHandler("Order not found", 404));

    const message = `Order with id: ${orderId}, has been accepted by ${req.costumeUser.name} `;
    try {
      const newNotification = await storeNotification(
        "orderAccepted",
        order.user as any,
        order.restaurant!,
        updatedOrder._id as any,
        message
      );

      await newNotification.save();

      getIo().emit("notification", newNotification);
      res.status(200).json({ order: updatedOrder, message: "Order accepted" });
    } catch (err) {
      res.status(500).send("Error storing notification");
    }
  }
);

export const deliverOrder = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("User not found", 404));
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) return next(new ApiErrorHandler("Order not found", 404));
    if (order.orderStatus === "Delivered")
      return next(new ApiErrorHandler("Order already delivered", 400));
    const user = await User.findById(order.user);
    const restaurant = await Restaurant.findById(order.restaurant);
    if (!user || !restaurant)
      return next(new ApiErrorHandler("User or Restaurant not found", 404));

    // update user and restaurant order history
    user.orders.push(orderId);
    restaurant.orders.push(orderId);
    await user.save();
    await restaurant.save();

    // update order
    order.orderStatus = "Delivered";
    order.deliveredAt = new Date();
    await order.save();

    // update the rider accountBalance and order history
    const rider = await User.findById(req.costumeUser._id);
    if (!rider) return next(new ApiErrorHandler("Rider not found", 404));
    rider.accountBalance += order.shippingPrice * 0.5;
    await rider.save();

    const message = `Order with id: ${orderId}, has been delivered by ${
      req.costumeUser.name
    } <br/> rider account has been credited ${
      order.shippingPrice * 0.5
    } <br/> total Order Price: ${order.totalPrice} `;

    const newNotification = await storeNotification(
      "orderDelivered",
      order.deliveredBy as any,
      order.restaurant!,
      order._id as any,
      message
    );

    await newNotification.save();

    getIo().emit("notification", newNotification);

    // try {
    //   // sendEmail()

    // } catch (error) {

    // }

    res.status(200).json({ order, message: "Order delivered" });
  }
);

export const riderDashboardStats = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("User not found", 404));
    // Get all orders by the rider from last 24 hours
    const todaysOrders = await Order.find({
      deliveredBy: req.costumeUser._id,
      orderStatus: "Delivered",
      deliveredAt: {
        $gte: getISTDate(0, 0, 0), // Start of the day in IST
        $lte: getISTDate(23, 59, 59), // End of the day in IST
      },
    })
      .populate({
        path: "restaurant",
        select: "name image location address city",
      })
      .populate({
        path: "user",
        select: "name image location",
      });

    // Get all orders by the rider
    const allOrders = await Order.find({
      deliveredBy: req.costumeUser._id,
      orderStatus: "Delivered",
    })
      .populate({
        path: "restaurant",
        select: "name image location address city",
      })
      .populate({
        path: "user",
        select: "name image location",
      });

    // Get number of orders
    const numberOfTotalOrders = allOrders.length;
    const numberOfTodaysOrders = todaysOrders.length;

    // get todays revenue
    let todaysRevenue = 0;
    todaysOrders.forEach((order) => {
      todaysRevenue += order.shippingPrice! * 0.5;
    });

    // Get total revenue
    let totalRevenue = 0;
    allOrders.forEach((order) => {
      totalRevenue += order.shippingPrice! * 0.5;
    });

    const riderAccountBalance = await User.findById(req.costumeUser._id).select(
      "accountBalance"
    );

    res.status(200).json({
      allOrders,
      todaysOrders,
      numberOfTotalOrders,
      numberOfTodaysOrders,
      totalRevenue,
      todaysRevenue,
      riderAccountBalance: riderAccountBalance?.accountBalance,
    });
  }
);

export const getRevGraphData = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("UnAuthorize user", 401));

    //===================================== weekly==============================================
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Get the start of the week (Sunday)
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Get the end of the week (Saturday)
    const weeklyRevenue = Array(7).fill(0); // For each day of the week
    const weeklyOrders = await Order.find({
      orderStatus: "Delivered",
      deliveredBy: req.costumeUser._id,
      deliveredAt: {
        $gte: startOfWeek,
        $lt: endOfWeek,
      },
    });
    weeklyOrders.forEach((order) => {
      const deliveredAt = new Date(order.deliveredAt!);
      const dayOfWeek = deliveredAt.getDay(); // Get the day of the week (0 for Sunday, 1 for Monday, etc.)
      weeklyRevenue[dayOfWeek] += order.shippingPrice! * 0.5;
    });

    //========================================== monthly=============================================================

    const endOfMonth = new Date();
    const startOfMonth = new Date();
    startOfMonth.setDate(endOfMonth.getDate() - 30); // 30 days ago

    const monthlyRevenue = Array(30).fill(0); // For each day of the last 30 days

    const monthlyOrders = await Order.find({
      orderStatus: "Delivered",
      deliveredBy: req.costumeUser._id,
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
      monthlyRevenue[dayOfMonth] += order.shippingPrice! * 0.5;
    });

    // ===========================================daily============================================================

    const endOfDay = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(startOfDay.getHours() - 24); // 24 hours ago

    const hourlyRevenue = Array(24).fill(0); // For each hour of the day

    const hourlyOrders = await Order.find({
      orderStatus: "Delivered",
      deliveredBy: req.costumeUser._id,
      deliveredAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });

    hourlyOrders.forEach((order) => {
      const deliveredAt = new Date(order.deliveredAt!);
      const hourOfDay = deliveredAt.getHours(); // Get the hour of the day (0-23)
      hourlyRevenue[hourOfDay] += order.shippingPrice! * 0.5;
    });

    res.status(200).json({
      success: true,
      message:
        "data: weeklyRevenue , monthlyRevenue , hourlyRevenue retrieved successfully",
      weeklyRevenue,
      monthlyRevenue,
      hourlyRevenue,
    });
  }
);

export const changeAvailability = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.costumeUser)
      return next(new ApiErrorHandler("User not found", 404));
    const { available } = req.body;
    const user = await User.findById(req.costumeUser._id);
    if (!user || !user.personalDetails)
      return next(new ApiErrorHandler("User not found", 404));
    user.personalDetails.available! = available;
    await user.save();
    res.status(200).json({
      user: user.personalDetails.available,
      message: "Availability changed",
    });
  }
);

export const getRiderNotifications = asyncHandler(
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
