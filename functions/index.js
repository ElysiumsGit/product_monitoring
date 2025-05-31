const functions = require('firebase-functions');
const admin = require('firebase-admin');
var serviceAccount = require("./permissions.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://product-monitoring-7d9c4-default-rtdb.firebaseio.com/",
    storageBucket: "product-monitoring-7d9c4.firebasestorage.app",
});

const userRoute = require("./routes/userRoute");
const teamRoute = require("./routes/teamRoute");
const productRoute = require("./routes/productRoute");
const notificationRoute = require("./routes/notificationRoute");
const storeRoute = require("./routes/storeRoute");
const groupRoute = require("./routes/groupRoute");
const categoryRoute = require("./routes/categoryRoute");
const verifyRoute = require("./routes/verifyRoute");
const forgotPasswordRoute = require("./routes/forgotPasswordRoute");
const authPassword = require("./routes/authPasswordRoute");
const inventoryRoute = require("./routes/inventoryRoute");
const attendanceRoute = require("./routes/attendanceRoute");
// const scheduleRoute = require("./routes/scheduleRoute");
// const automationRoute = require("./routes/automationRoute");
const { renderErrorPage } = require('./renderHtml/error');

const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors({ origin: true }));
app.use(express.json());
app.use("/users", userRoute);
app.use("/team", teamRoute);
app.use("/products", productRoute);
app.use("/notification", notificationRoute);
app.use("/stores", storeRoute);
app.use("/group", groupRoute); 
app.use("/categories", categoryRoute);
app.use("/verify", verifyRoute);
app.use("/forgot", forgotPasswordRoute);
app.use("/auth", authPassword);
app.use("/inventory", inventoryRoute);
app.use("/attendance", attendanceRoute);

// app.use("/scheduleRoute", scheduleRoute);
// app.use("/", automationRoute);

app.use((req, res) => {
    res.send(renderErrorPage());
});


exports.app = functions.https.onRequest(app);
