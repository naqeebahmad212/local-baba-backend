import mongoose, { Document, Schema } from "mongoose";

// Define the Notification interface
interface INotification extends Document {
  type:
    | "orderAccepted"
    | "orderDelivered"
    | "systemAlert"
    | "orderCancelled"
    | "orderPlaced"
    | "other";
  recipient?: mongoose.Types.ObjectId;
  restaurant?: mongoose.Types.ObjectId;
  order?: mongoose.Schema.Types.ObjectId;
  message: string;
  createdAt: Date;
  read: boolean;
}

// Define the notification schema
const notificationSchema: Schema = new Schema({
  type: {
    type: String,
    enum: [
      "orderAccepted",
      "orderDelivered",
      "orderCancelled",
      "orderPlaced",
      "systemAlert",
      "other",
    ],
    required: true,
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  restaurant: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
  },
  order: {
    type: mongoose.Types.ObjectId,
    ref: "Order",
  },
  // recipientRole: {
  //   type: String,
  //   enum: ["customer", "admin", "restaurant", "rider"],
  //   required: true,
  // },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

// Create the model
const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;
