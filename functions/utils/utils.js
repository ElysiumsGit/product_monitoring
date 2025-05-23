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


const users = "users";
const notifications = "notifications";
const activities = "activities";
const team = "team";
const products = "products";

// const dateToTimeStamp = (date) => {
//     try { 
//         return Timestamp.fromDate(new Date(date));
//     } catch (error) {
//         return { success: false, message: "Invalid date format." };
//     }
// };


const dateToTimeStamp = (dateStr) => {
    try {
        const [month, day, year] = dateStr.split("/").map(Number);
        const date = new Date(year, month - 1, day); 
        const time = Timestamp.fromDate(date);

        return time;
    } catch (error) {
        return { success: false, message: "Invalid date format." };
    }
};

module.exports = { 
    collections,
    subCollections,
    users, 
    notifications,
    activities,
    team,
    products,
    dateToTimeStamp 
};





