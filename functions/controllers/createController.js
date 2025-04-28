const { firestore } = require("firebase-admin");
const { dateToTimeStamp } = require("../utils/utils");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");

const db = firestore();

async function createUser(req, res, restOfBody) {
    const { email, password, confirm_password, birth_date, hired_date } = req.body;
    const createdAt = admin.firestore.Timestamp.now();

    if (!email || !password || !confirm_password || !birth_date || !hired_date) {
        return res.status(400).json({ success: false, message: "Missing required user fields." });
    }

    if (password !== confirm_password) {
        return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    let emailExists = false;
    try {
        await admin.auth().getUserByEmail(email);
        emailExists = true;
    } catch (error) {
        if (error.code !== 'auth/user-not-found') {
            console.error(error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    if (emailExists) {
        return res.status(400).json({ success: false, message: "Email already exists." });
    }

    const hiredDate = dateToTimeStamp(hired_date);
    const birthDate = dateToTimeStamp(birth_date);

    const usersRef = db.collection("users").doc();
    const getId = usersRef.id;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await usersRef.set({
        "@id": getId,
        email,
        password: hashedPassword,
        birth_date: birthDate,
        hired_date: hiredDate,
        ...restOfBody,
        createdAt,
    });

    return res.status(200).json({ success: true, message: "Successfully added new user." });
}

async function createProduct(req, res, restOfBody) {
    const { product_name } = req.body;
            
    if (!product_name) {
        return res.status(400).json({ success: false, message: "Product name is required." });
    }

    if (!subCollectionName) {
        return res.status(400).json({ success: false, message: "Subcollection name is required." });
    }

    if (!docId) {
        return res.status(400).json({ success: false, message: "Document ID (docId) is required." });
    }

    const docRef = db.collection("users").doc(docId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
        return res.status(404).json({ success: false, message: `User with ID '${docId}' does not exist.` });
    }

    const productRef = db.collection(collectionName).doc();
    const getProductId = productRef.id;

    const notificationRef = docRef.collection(subCollectionName).doc();
    const getNotificationId = notificationRef.id;

    const activitiesRef = db.collection(collectionName).doc();
    const activitiesRefId = activitiesRef.id;

    await productRef.set({
        "@id": getProductId,
        product_name,
        ...restOfBody,
        createdAt
    });

    await notificationRef.set({
        "@id": getNotificationId,
        title: `You have successfully added a ${product_name}.`,
        isRead: false,
        createdAt
    });

    await activitiesRef.set({
        "@id": activitiesRefId,
        title: `You have added a ${product_name}.`,
        createdAt
    });

    const adminUsersSnapshot = await db
        .collection(collection.collections.usersCollections)
        .where("role", "==", "admin")
        .get();

    const notificationPromises = [];

    adminUsersSnapshot.forEach((adminDoc) => {
        const adminId = adminDoc.id;
        const adminNotificationRef = db
            .collection(collection.collections.usersCollections)
            .doc(adminId)
            .collection(collection.subCollections.notifications)
            .doc();

        notificationPromises.push(
            adminNotificationRef.set({
                id: adminNotificationRef.id,
                message: `A new product, ${product_name}, has been launched. Review and assign to stores.`,
                createdAt: admin.firestore.Timestamp.now(),
                isRead: false,
                type: "product",
            })
        );
    });

    await Promise.all(notificationPromises);

    return res.status(200).json({ success: true, message: "Successfully added new product." });
}

module.exports = { createUser, createProduct }