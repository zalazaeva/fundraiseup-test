import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { Customer } from "./interface";
import dotenv from "dotenv";
dotenv.config();

function randomInteger(max: number) {
  // получить случайное число
  return Math.floor(Math.random() * max) + 1;
}

function createRandomUser() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    address: {
      line1: faker.location.streetAddress(),
      line2: faker.location.buildingNumber(),
      postcode: faker.location.zipCode(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.county(),
    },
    createdAt: new Date().toISOString(),
  };
}

const startApp = async () => {
  try {
    if (!process.env.DB_URI) {
      console.error("Not variable DB_URI");
      process.exit(1);
    }
    // Подключаемся к MongoDB
    await mongoose.connect(process.env.DB_URI);
    let timerId = setInterval(async () => {
      let users = faker.helpers.multiple(createRandomUser, {
        count: randomInteger(10),
      });
      const result = await Customer.insertMany(users, { ordered: true });
    }, 200);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startApp();
