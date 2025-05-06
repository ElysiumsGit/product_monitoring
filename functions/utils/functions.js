const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");

const db = firestore();

const sendAdminNotifications = async (message, type) => {
    const adminUsersSnapshot = await db.collection("users").where("role", "==", "admin").get();
    const notificationPromises = [];

    adminUsersSnapshot.forEach((adminDoc) => {
        const adminId = adminDoc.id;
        const notificationRef = db.collection("users").doc(adminId).collection("notifications").doc();

        const notificationData = {
            id: notificationRef.id,
            message,
            created_at: Timestamp.now(),
            isRead: false,
            type,
        };

        notificationPromises.push(notificationRef.set(notificationData));
    });

    await Promise.all(notificationPromises);
};

const logUserActivity = async (currentUserId, title) => {
    const activityRef = db.collection("users").doc(currentUserId).collection("activities").doc();
    const activityData = {
        title,
        created_at: Timestamp.now(),
    };
    await activityRef.set(activityData);
};

const getUserNameById = async (userId) => {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
        throw new Error("User not found");
    }

    const userData = userDoc.data();
    return userData.first_name || "Unknown User";
};


const getEmailById = async (userId) => {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
        throw new Error("User not found");
    }

    const userData = userDoc.data();
    return userData.email || "Unknown User";
};

const getUserRoleById = async (userId) => {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
        throw new Error("User not found");
    }

    const userData = userDoc.data();
    return userData.role || "Unknown Role";
};

const getStoreNameById = async (storeId) => {
    const storeDoc = await db.collection("stores").doc(storeId).get();

    if (!storeDoc.exists) {
        throw new Error("User not found");
    }

    const storeData = storeDoc.data();
    return storeData.store_name || "Unknown Store";
};

const getProductNameById = async (productId) => {
    const productDoc = await db.collection("products").doc(productId).get();

    if (!productDoc.exists) {
        throw new Error("User not found");
    }

    const productData = productDoc.data();
    return productData.product_name || "Unknown Product";
};


const getCategoryById = async (categoryId) => {
    const categoryDoc = await db.collection("categories").doc(categoryId).get();

    if (!categoryDoc.exists) {
        throw new Error("User not found");
    }

    const categoryData = categoryDoc.data();
    return categoryData.category_name || "Unknown Product";
};


const notifyTeamMembers = async (userId, message, type = "team") => {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
        throw new Error("User not found");
    }

    const userData = userDoc.data();
    const teamId = userData.team;

    if (!teamId) {
        throw new Error("User is not assigned to a team");
    }

    const teamSnapshot = await db.collection('users').where("team", "==", teamId).get();
    const notificationPromises = [];

    teamSnapshot.forEach((memberDoc) => {
        const memberId = memberDoc.id;

        const notificationRef = db.collection('users').doc(memberId).collection('notifications').doc();
        const notificationData = {
            id: notificationRef.id,
            message,
            created_at: Timestamp.now(),
            isRead: false,
            type,
        };

        notificationPromises.push(notificationRef.set(notificationData));
    });

    await Promise.all(notificationPromises);
};

module.exports = { 
    sendAdminNotifications, 
    logUserActivity, 
    getUserNameById, 
    getUserRoleById, 
    notifyTeamMembers,
    getStoreNameById,
    getProductNameById,
    getCategoryById,
    getEmailById
}