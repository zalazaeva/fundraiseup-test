import { Timestamp } from "mongodb";
import mongoose from "mongoose";
import RandExp from "randexp";
import { Customer, AnonymisedCustomer } from "./interface";
import dotenv from "dotenv";
dotenv.config();

let buffer: any[] = [];
let timer: NodeJS.Timeout | null;

// Функция для анонимизации покупателей
const anonymiseCustomer = (customer: any) => {
  let Id = customer._id;
  const anonymisedCustomer = {
    createdAt: customer.createdAt,
    _id: Id,
    firstName: getRandmonString(),
    lastName: getRandmonString(),
    email: getRandmonStringForEmail(customer.email),
    address: {
      ...customer.address,
      line1: getRandmonString(),
      line2: getRandmonString(),
      postcode: getRandmonString(),
    },
  };
  return anonymisedCustomer;
};

function getRandmonString(): string {
  return new RandExp(/^[a-zA-Z\d]{8}$/).gen();
}

function getRandmonStringForEmail(email: string): string {
  let anonymizerStr = new RandExp(/^[a-zA-Z\d]{8}$/).gen();
  var res = email.split("@").pop();
  return anonymizerStr + res;
}

// Функция для обработки изменений в коллекции customers
const handleCustomerChange = async (change: any) => {
  try {
    if (change.operationType === "insert") {
      const customer = change.fullDocument;
      const anonymisedCustomer = anonymiseCustomer(customer);
      buffer.push(anonymisedCustomer);
      if (buffer.length >= 1000) {
        const docsToInsert = buffer.splice(0, 1000);
        await AnonymisedCustomer.insertMany(docsToInsert);
      } else if (!timer) {
        timer = setTimeout(async () => {
          const docsToInsert = buffer.splice(0, buffer.length);
          await AnonymisedCustomer.insertMany(docsToInsert);
          timer = null;
        }, 1000);
      }
    }
    if (change.operationType === "update") {
      await AnonymisedCustomer.updateOne(
        { _id: change.documentKey._id.toString() },
        {
          $set: change.updateDescription.updatedFields,
        }
      );
    }
  } catch (error) {
    console.error(error);
  }
};

// Функция для синхронизации всех данных в коллекции customers
const syncAllCustomers = async () => {
  try {
    const customers = await Customer.find();
    const anonymisedCustomers = customers.map((customer) =>
      anonymiseCustomer(customer)
    );
    await AnonymisedCustomer.deleteMany();
    await AnonymisedCustomer.insertMany(anonymisedCustomers);
    console.log("All customers synced successfully!");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

// Функция для запуска приложения
const startApp = async () => {
  try {
    if (!process.env.DB_URI) {
      console.error("Not variable DB_URI");
      process.exit(1);
    }
    // Подключаемся к MongoDB
    await mongoose.connect(process.env.DB_URI);

    // Проверяем наличие флага --full-reindex
    const isFullReindex = process.argv.includes("--full-reindex");

    if (isFullReindex) {
      // Запускаем полную синхронизацию данных
      await syncAllCustomers();
    } else {
      // Запускаем реальтайм синхронизацию данных
      const lastDoc = await AnonymisedCustomer.findOne().sort({
        createdAt: -1,
      });
      let createdDate = lastDoc?.createdAt?.getTime();
      let ms = lastDoc?.createdAt?.getMilliseconds();
      let stream;
      if (createdDate && ms) {
        const ts = new Timestamp({ t: createdDate / 1000, i: ms });
        stream = Customer.watch([], { startAtOperationTime: ts });
      } else {
        stream = Customer.watch();
      }
      stream.on("change", handleCustomerChange);
      console.log("Realtime sync started successfully!");
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startApp();
