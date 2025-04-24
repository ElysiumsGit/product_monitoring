const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const collection = require("../utils/utils")

const db = firestore();

const addStore = async (req, res) => {
    try {
        const { userId } = req.params;

        const {
            store_profile,
            store_name,
            location,
            radius,
            name,
            phone_number,
            display_information,
            ...other_data
        } = req.body;

        if (!store_name || !location || !name || !phone_number || !Array.isArray(display_information) || display_information.length === 0 || display_information.some(di => !di.product || !di.display_name)) 
        {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const storeRef = db.collection(collection.collections.storesCollection).doc();
        const storeId = storeRef.id;

        const storeData = {
            store_profile,
            id: storeId,
            store_name,
            location,
            radius,
            name,
            phone_number,
            display_information,
            ...other_data,
            createdAt: Timestamp.now(),
        };

        await storeRef.set(storeData);

        const adminUsersSnapshot = await db
            .collection(collection.collections.usersCollections)
            .where("role", "==", "admin")
            .get();

        const notificationPromises = [];

        adminUsersSnapshot.forEach((adminDoc) => {
            const adminId = adminDoc.id;

            const notificationRef = db
                .collection(collection.collections.usersCollections)
                .doc(adminId)
                .collection(collection.subCollections.notifications)
                .doc();

            const notificationData = {
                id: notificationRef.id,
                message: `${store_name} store has been created and is ready for team assignment`,
                createdAt: Timestamp.now(),
                isRead: false,
                type: "store",
            };

            notificationPromises.push(notificationRef.set(notificationData));
        });

        await Promise.all(notificationPromises);

        const activityRef = db.collection(collection.collections.usersCollections).doc(userId).collection(collection.subCollections.activities).doc();

        const activityData = {
            title: `You added ${store_name}`,
            createdAt: Timestamp.now(),
        }

        await activityRef.set(activityData);

        return res.status(200).json({
            success: true,
            message: "Store added successfully and notifications sent.",
            data: { id: storeId },
        });

    } catch (error) {
        console.error("Error adding store:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add store",
            error: error.message,
        });
    }
};

const updateStore = async(req, res) => {
    try {
        const { id } = req.params;
        const {
            store_name,
            location,
            name,
            phone_number,
            product,
            display_name,
            ...other_data
        } = req.body;

        const storeRef = db.collection(collection.collections.storesCollection).doc(id);
        const storeDoc = await storeRef.get();

        if(!storeDoc.exists){
            return res.status(404).json({success: false, message: "Product not found"});
        }

        let updatedStore = {}

        const allowedFields = { 
            store_name,
            location,
            name,
            phone_number,
            product,
            display_name,
            ...other_data,
            updatedAt: Timestamp.now(),
        };

        Object.keys(allowedFields).forEach(key => {
            if(allowedFields[key] !== undefined){
                updatedStore[key] = allowedFields[key];
            }
        });

        await storeRef.update(updatedStore);
        return res.status(200).json({success: true, message: "Store Updated Success"})

    } catch (error) {
        console.error("Store updating error", error);
        return res.status(500).json({success: false, message: "Failed to update"});
        
    }
}

const deleteStore = async(req, res) => {
    try {
        const { id } = req.params;
        
        const storeRef = db.collection(collection.collections.storesCollection).doc(id);
        await storeRef.delete();

        const adminUsersSnapshot = await db
            .collection(collection.collections.usersCollections)
            .where("role", "==", "admin")
            .get();

        const notificationPromises = [];

        adminUsersSnapshot.forEach((adminDoc) => {
            const adminId = adminDoc.id;

            const notificationRef = db
                .collection(collection.collections.usersCollections)
                .doc(adminId)
                .collection(collection.subCollections.notifications)
                .doc();

            const notificationData = {
                id: notificationRef.id,
                message: `${store_name} store has been created and is ready for team assignment`,
                createdAt: Timestamp.now(),
                isRead: false,
                type: "store",
            };

            notificationPromises.push(notificationRef.set(notificationData));
        });

        await Promise.all(notificationPromises);

        return res.status(200).json({success: true, message: "Store successfully deleted"});
    } catch (error) {
        console.error("Error adding store:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add store",
            error: error.message,
        });
    }
}

module.exports = { addStore, deleteStore, updateStore };