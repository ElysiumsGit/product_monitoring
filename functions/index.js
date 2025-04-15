const functions = require('firebase-functions');
const admin = require('firebase-admin');

var serviceAccount = require("./permissions.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://product-monitoring-7d9c4-default-rtdb.firebaseio.com/",
    storageBucket: "gs://product-monitoring-7d9c4.firebasestorage.app",
});

const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const storeRoute = require("./routes/storeRoute");
const teamRoute = require("./routes/teamRoute");
const inventoryRoute = require("./routes/inventoryRoute");
const scheduleRoute = require("./routes/scheduleRoute");
const notificationRoute = require("./routes/notificationRoute");
const categoryRoute = require("./routes/categoryRoute");

const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors({ origin: true }));
app.use(express.json());

app.use("/userRoute", userRoute);
app.use("/productRoute", productRoute);
app.use("/storeRoute", storeRoute);
app.use("/teamRoute", teamRoute);
app.use("/inventoryRoute", inventoryRoute);
app.use("/scheduleRoute", scheduleRoute);
app.use("/notificationRoute", notificationRoute);
app.use("/categoryRoute", categoryRoute);

exports.app = functions.https.onRequest(app);
