import mongoose, { Types } from "mongoose";
import Notification from "../models/notification";

export async function storeNotification(
  type: string,
  customerId: mongoose.Schema.Types.ObjectId,
  restaurantId: mongoose.Schema.Types.ObjectId,
  orderId: mongoose.Schema.Types.ObjectId,
  message: string
) {
  try {
    const notification = await Notification.create({
      type,
      recipient: customerId,
      restaurant: restaurantId,
      order: orderId,
      message,
    });

    //   .populate({ path: "restaurant", select: "name " });
    return notification;
  } catch (err) {
    console.error("Error saving notification:", err);
    throw err;
  }
}
