import mongoose, { Types } from "mongoose";
import { UserWithLocation } from "./user";
export type Review = {
  user: mongoose.Schema.Types.ObjectId;
  rating: number;
  comment: string;
  profile?: string;
};

type InventoryManagement = {
  currentStock: number;
  isAvailable: boolean;
};

type AvailabilityDateRange = {
  start: Date;
  end: Date;
};

type extras = {
  name: string;
  price: number;
};
type size = {
  size: string;
  price: number;
};

export interface Product {
  itemName: string;
  category: mongoose.Schema.Types.ObjectId;
  discountPercentage?: number;
  description?: string;
  restaurant?: mongoose.Schema.Types.ObjectId;
  ingredients?: string[];
  availability?: boolean;
  totalReview?: number;
  reviews?: Review[];
  ratings?: number;
  image?: string;
  basePrice?: number;
  discountPrice?: number;
  extras?: extras[];
  sizes?: size[];

  specialInstructions?: string;

  status?: "Active" | "Inactive" | "Hidden";
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image: string;
  product: mongoose.Schema.Types.ObjectId;
  extras: extras[];
  size: string;
}

interface PaymentInfo {
  id: string;
  status: string;
  paymentMethod: string;
}

export interface Order extends Document {
  orderItem: OrderItem[];
  user: UserWithLocation | mongoose.Schema.Types.ObjectId;
  restaurant?: mongoose.Schema.Types.ObjectId;
  paymentInfo: PaymentInfo;
  deliveredBy?: mongoose.Schema.Types.ObjectId;
  paidAt: Date;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  orderStatus: string;
  deliveredAt?: Date;
  createdAt: Date;
}

export default Product;
