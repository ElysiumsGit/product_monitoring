const functions = require('firebase-functions');
const admin = require('firebase-admin');
const dotenv = require("dotenv");

dotenv.config();

// var serviceAccount = require("./permissions.json");

admin.initializeApp({
    credential: admin.credential.cert({
        "type": process.env.TYPE,
        "project_id": process.env.PROJECT_ID,
        "private_key_id": process.env.PROJECT_KEY_ID,
        "private_key": process.env.PRIVATE_KEY,
        "client_email": process.env.CLIENT_EMAIL,
        "client_id": process.env.CLIENT_ID,
        "auth_uri": process.env.AUTH_URI,
        "token_uri": process.env.TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER,
        "client_x509_cert_url": process.env.CLIENT_CERT,
        "universe_domain": process.env.UNIVERSE_DOMAIN
    }),
    databaseURL: process.env.DATABASEURL
});

const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors({ origin: true }));
app.use("/userRoute", userRoute);
app.use("/productRoute", productRoute);

exports.app = functions.https.onRequest(app);
