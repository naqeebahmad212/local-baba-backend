import mongoose, { Document, Schema } from "mongoose";
import { Order } from "../@types";
const orderSchema = new Schema({
  orderItem: [
    {
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      image: {
        type: String,
      },
      extras: [
        {
          name: {
            type: String,
            // required: true,
          },
          price: {
            type: Number,
            // required: true,
          },
        },
      ],
      size: {
        type: String,
        // required: true,
      },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    },
  ],
  //   user who orders and also the destination
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Please add user"],
  },
  //   restaurant whose product is ordered and also the pick up point
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  paymentInfo: {
    status: {
      type: String,
      required: [true, "Please add payment status"],
      enum: ["paid", "unpaid"],
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
    },

    id: {
      type: String,
    },
  },
  paidAt: {
    type: Date,
  },
  itemsPrice: {
    type: Number,
    default: 0,
    required: [true, "Please add items price"],
  },
  taxPrice: {
    type: Number,
    default: 0,
    required: [true, "Please add tax price"],
  },
  deliveredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  shippingPrice: {
    type: Number,
    default: 0,
    required: [true, "Please add shipping price"],
  },
  totalPrice: {
    type: Number,
    default: 0,
    required: [true, "Please add total price"],
  },

  orderStatus: {
    type: String,
    default: "Processing",
    enum: [
      "Processing",
      "Preparing",
      "Picked up",
      "On its way",
      "Delivered",
      "Cancelled",
    ],
  },
  deliveredAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Order = mongoose.model<Order>("Order", orderSchema);
export default Order;
