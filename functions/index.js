const functions = require('firebase-functions');
const admin = require('firebase-admin');


var serviceAccount = require("./permissions.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://product-monitoring-7d9c4-default-rtdb.firebaseio.com/",
    storageBucket: "gs://product-monitoring-7d9c4.firebasestorage.app",
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
// const inventoryRoute = require("./routes/inventoryRoute");
// const scheduleRoute = require("./routes/scheduleRoute");
const automationRoute = require("./routes/automationRoute");

const express = require('express');
const app = express();
const cors = require('cors');
const { renderErrorPage } = require('./renderHtml/error');
app.use(cors({ origin: true }));
app.use(express.json());

app.use("/userRoute", userRoute);
app.use("/teamRoute", teamRoute);
app.use("/productRoute", productRoute);
app.use("/notificationRoute", notificationRoute);
app.use("/storeRoute", storeRoute);
app.use("/groupRoute", groupRoute); 
app.use("/categoryRoute", categoryRoute);
app.use("/verify", verifyRoute);
app.use("/forgotPasswordRoute", forgotPasswordRoute);
// app.use("/inventoryRoute", inventoryRoute);
// app.use("/scheduleRoute", scheduleRoute);
app.use("/", automationRoute);

app.use((req, res) => {
    res.send(renderErrorPage());
});

exports.app = functions.https.onRequest(app);
