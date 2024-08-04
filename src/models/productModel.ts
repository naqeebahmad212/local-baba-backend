import mongoose, { Document, Schema } from "mongoose";
import Product from "../@types";

const productSchema = new Schema(
  {
    itemName: {
      type: String,
      required: [true, "Please add item name"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please add category"],
    },
    description: {
      type: String,
      required: [true, "Please add description"],
    },
    basePrice: {
      type: Number,
      required: [true, "Please add base price"],
    },
    discountPrice: {
      type: Number,
    },
    discountPercentage: {
      type: Number,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    status: {
      type: String,
      default: "Active",
    },

    ingredients: [
      {
        type: String,
      },
    ],
    totalReview: {
      type: Number,
      default: 0,
    },
    ratings: {
      type: Number,
      default: 0,
    },

    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // This should match the model name of the referenced schema
        },
        rating: {
          type: Number,
          default: 0,
        },
        comment: {
          type: String,
        },
        profile: {
          type: String,
        },
      },
    ],
    image: {
      type: String,
    },
    sizes: [{ size: String, price: Number }],
    extras: [
      {
        name: String,
        price: Number,
      },
    ],

    specialInstructions: {
      type: String,
    },

    availability: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model<Product>("Product", productSchema);

export default Product;
