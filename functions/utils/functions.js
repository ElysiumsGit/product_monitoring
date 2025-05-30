const { firestore } = require("firebase-admin");
const { Timestamp, FieldValue } = require("firebase-admin/firestore");
const admin = require('firebase-admin');

const db = firestore();

const sendAdminNotifications = async ({heading = "New Account Created", title= "Rico created a new Promodiser Account", fcmMessage = "FCM Message", message = "Message", type}) => {
    const adminUsersSnapshot = await db.collection("users").where("role", "==", "admin").get();
    const notificationPromises = [];

    for (const adminDoc of adminUsersSnapshot.docs) {
        const adminId = adminDoc.id;
        const adminData = adminDoc.data();

        if (adminData.push_notification === true) {
            const notificationRef = db.collection("users").doc(adminId).collection("notifications").doc();
            const counterRef = db.collection("users").doc(adminId).collection("counter").doc("counter_id");

            const notificationData = {
                id: notificationRef.id,
                heading,
                title,
                message,
                created_at: Timestamp.now(),
                is_read: false,
                type,
            };

            const firestoreTasks = Promise.all([
                notificationRef.set(notificationData),
                counterRef.set({
                    notifications: FieldValue.increment(1),
                }, { merge: true })
            ]);

            notificationPromises.push(firestoreTasks);

            if (adminData.fcm_token) {
                const fcmData = {
                    token: adminData.fcm_token,
                    notification: {
                        title: "You have one notification in Store Watch",
                        body: fcmMessage,
                    },
                    data: {
                        type,
                        id: notificationRef.id,
                        link: "https://fcm.googleapis.com/fcm/send",
                    },
                };

                notificationPromises.push(admin.messaging().send(fcmData));
            }
        }
    }

    await Promise.all(notificationPromises);
    console.log("Notifications sent (Firestore + FCM) for all admins.");
};

const logUserActivity = async ({ currentUserId, activity, heading = 'Input a heading' }) => {
    const activityRef = db.collection("users").doc(currentUserId).collection("activities").doc();
    const stopWords = new Set(['in', 'been', 'has', 'a']);

    const search_tags = activity
        .toLowerCase()
        .replace(/[^\w\s]/g, '') 
        .split(/\s+/)            
        .filter(word => word && !stopWords.has(word));      

    const activityData = {
        heading,
        activity,
        created_at: Timestamp.now(),
        search_tags,
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

const getGroupNameById = async (groupId) => {
    const groupDoc = await db.collection("groups").doc(groupId).get();

    if (!groupDoc.exists) {
        throw new Error("User not found");
    }

    const groupData = groupDoc.data();
    return groupData.group_name || "Unknown Role";
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

const capitalizeFirstLetter = (word) => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

const incrementNotification = async (userId) => {
    try {
        const counterRef = db.collection('users').doc(userId).collection('counter').doc('counter_id');

        await counterRef.set({
            notifications: admin.firestore.FieldValue.increment(1),
        }, { merge: true });

        console.log(`Notification count incremented for user ${userId}`);
    } catch (error) {
        console.error(`Failed to increment notifications for user ${userId}:`, error.message);
    }
};

// const generateSearchTags = (user) => {

//     return [
//         user.first_name?.toLowerCase(),
//         user.last_name?.toLowerCase(),
//         user.email?.toLowerCase(),
//         user.mobile_number,
//         user.region?.toLowerCase(),
//         user.province?.toLowerCase(),
//         user.municipality?.toLowerCase(),
//         user.barangay?.toLowerCase(),
//         user.zip_code,
//         user.role?.toLowerCase(),
//         user.gender?.toLowerCase(),
//         user.address1?.toLowerCase(),
//         user.address2?.toLowerCase(),
//         user.nationality?.toLowerCase()
//     ].filter(Boolean); 
// };


const safeSplit = (input) => {
  return input
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 1);
};

const getGender = (gender) => {
    if (gender === "male") {
        return "him";
    } else {
        return "her";
    }
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
    getEmailById,
    getGroupNameById,
    capitalizeFirstLetter,
    incrementNotification,
    safeSplit,
    getGender
}