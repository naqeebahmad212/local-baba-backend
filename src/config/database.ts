import mongoose from "mongoose";
import logger from "../utils/logger";
import Restaurant from "../models/restaurantModal";
const ensureIndexes = async () => {
  await Restaurant.createIndexes();
};
export const connectToDB = async () => {
  const db = await mongoose.connect(process.env.MONGO_URI!);

  logger.info(`Connected to ${db.connection.name} database`);
};
