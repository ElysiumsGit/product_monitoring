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
const authPassword = require("./routes/authPasswordRoute");
// const inventoryRoute = require("./routes/inventoryRoute");
// const scheduleRoute = require("./routes/scheduleRoute");
const automationRoute = require("./routes/automationRoute");
const multer = require('multer');
const { renderErrorPage } = require('./renderHtml/error');

const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors({ origin: true }));
app.use(express.json());
app.use("/user", userRoute);
app.use("/team", teamRoute);
app.use("/product", productRoute);
app.use("/notification", notificationRoute);
app.use("/store", storeRoute);
app.use("/group", groupRoute); 
app.use("/category", categoryRoute);
app.use("/verify", verifyRoute);
app.use("/forgotPassword", forgotPasswordRoute);
app.use("/auth", authPassword);
// app.use("/inventoryRoute", inventoryRoute);
// app.use("/scheduleRoute", scheduleRoute);
app.use("/", automationRoute);

const bucket = admin.storage().bucket();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const fileName = Date.now() + '-' + file.originalname;
  const fileUpload = bucket.file(fileName);

  const blobStream = fileUpload.createWriteStream({
      metadata: {
          contentType: file.mimetype
      }
  });

  blobStream.on('error', (error) => {
      console.error(error);
      res.status(500).send('Error uploading file');
  });

  blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
      res.status(200).send({ message: 'File uploaded successfully', url: publicUrl });
  });

  blobStream.end(file.buffer);
});

app.use((req, res) => {
    res.send(renderErrorPage());
});

exports.app = functions.https.onRequest(app);
