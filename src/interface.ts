import { ObjectId } from "mongodb";
import mongoose from "mongoose";

// Определяем схему для коллекции customers
const customerSchema = new mongoose.Schema({
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    postcode: String,
  },
  createdAt: Date,
});

// Создаем модель для коллекции customers
export const Customer = mongoose.model("customers", customerSchema);

const anonymisedCustomerSchema = new mongoose.Schema({
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: String,
    postcode: String,
  },
  createdAt: Date,
});

// Создаем модель для коллекции customers_anonymised
export const AnonymisedCustomer = mongoose.model(
  "anonymised_customer",
  anonymisedCustomerSchema
);
