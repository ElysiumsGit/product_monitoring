const { Timestamp } = require("firebase-admin/firestore");

const collections = {
    usersCollections: "users",
    productsCollection: "products",
    storesCollection: "stores",
    teamCollection: "team",
    category: "category",
    group: "group",
};

const subCollections = {
    inventoryCollection: "inventory",
    schedules: "schedules",
    notifications: "notifications",
    assignStore: "assign_store",
    schedules: "schedule",
    activities: "activities",
};


const dateToTimeStamp = (date) => {
    try {
        return { success: true, timestamp: Timestamp.fromDate(new Date(date)) };
    } catch (error) {
        return { success: false, message: "Invalid date format." };
    }
};

module.exports = { collections, subCollections, dateToTimeStamp };



