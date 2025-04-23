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

const assignStore = async (req, res) => {
    try {
        const { store_id } = req.params;
        const { assigned_users, weekly_pattern, same_time_for_all_days } = req.body;

        // Basic validations
        if (!Array.isArray(assigned_users) || !Array.isArray(weekly_pattern)) {
            return res.status(400).json({
                success: false,
                message: "assigned_users and weekly_pattern must be arrays"
            });
        }

        // Validate weekly pattern structure
        const isValidPattern = weekly_pattern.every(item =>
            typeof item.day === 'string' &&
            typeof item.start_time === 'string' &&
            typeof item.end_time === 'string'
        );

        if (!isValidPattern) {
            return res.status(400).json({
                success: false,
                message: "Each item in weekly_pattern must include day, start_time, and end_time as strings"
            });
        }

        const batch = db.batch();

        const storeDoc = db.collection(collection.collections.storesCollection).doc(store_id);
        const storeSnap = await storeDoc.get();

        if (!storeSnap.exists) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }

        const storeData = storeSnap.data();
        const storeName = storeData.display_name || "a store";

        for (const userId of assigned_users) {
            // Create assignment reference
            const assignRef = storeDoc
                .collection(collection.subCollections.assignStore)
                .doc();

            const assignId = assignRef.id;

            const assignedData = {
                id: assignId,
                user_id: userId,
                createdAt: Timestamp.now(),
            };

            batch.set(assignRef, assignedData);

            // Create notification
            const notificationRef = db
                .collection(collection.collections.usersCollections)
                .doc(userId)
                .collection(collection.subCollections.notifications)
                .doc();

            const notificationId = notificationRef.id;

            const notificationData = {
                id: notificationId,
                message: `You have been assigned to ${storeName}`,
                type: "store",
                createdAt: Timestamp.now(),
                read: false
            };

            batch.set(notificationRef, notificationData);

            // Create schedule
            const scheduleRef = db
                .collection(collection.collections.usersCollections)
                .doc(userId)
                .collection(collection.subCollections.schedules)
                .doc();

            const scheduleId = scheduleRef.id;

            const scheduleData = {
                id: scheduleId,
                same_time_for_all_days: !!same_time_for_all_days,
                weekly_pattern,
                createdAt: Timestamp.now(),
            };

            batch.set(scheduleRef, scheduleData);
        }

        await batch.commit();

        return res.status(200).json({
            success: true,
            message: "Store assigned and schedules created successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to assign store",
            error: error.message
        });
    }
};


const deleteAssign = async (req, res) => {
    try {
        const { store_id, assign_id } = req.params;

        const assignRef = db
            .collection(collection.collections.storesCollection)
            .doc(store_id)
            .collection(collection.subCollections.assignStore)
            .doc(assign_id);

        const assignSnap = await assignRef.get();

        if (!assignSnap.exists) {
            return res.status(404).json({
                success: false,
                message: "Assignment not found",
            });
        }

        const assignData = assignSnap.data();
        const userId = assignData.user_id;

        const batch = db.batch();
        batch.delete(assignRef);

        const notificationRef = db
            .collection(collection.collections.usersCollections)
            .doc(userId)
            .collection(collection.subCollections.notifications)
            .doc();

        const notificationData = {
            message: `You have been removed from a store assignment.`,
            type: "store",
            id: notificationRef.id,
            createdAt: Timestamp.now(),
            read: false,
        };

        batch.set(notificationRef, notificationData);

        await batch.commit();

        return res.status(200).json({
            success: true,
            message: "Deleted",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete this person",
            error: error.message,
        });
    }
};

const deleteAllAssign = async (req, res) => {
    try {
        const { store_id } = req.params;

        const assignCollectionRef = db
            .collection(collection.collections.storesCollection)
            .doc(store_id)
            .collection(collection.subCollections.assignStore);

        const snapshot = await assignCollectionRef.get();

        if (snapshot.empty) {
            return res.status(200).json({
                success: true,
                message: "No assignments to delete"
            });
        }

        const batch = db.batch();

        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            const userId = data.user_id; // Adjust this based on how your doc is structured

            // Delete the assignment
            batch.delete(doc.ref);

            // Create a notification for the user
            const notificationRef = db
                .collection(collection.collections.usersCollections)
                .doc(userId)
                .collection(collection.subCollections.notifications)
                .doc(); // Auto-generated ID

            const notificationData = {
                message: `You have been removed from a store assignment.`,
                type: "store",
                id: notificationRef.id,
                createdAt: Timestamp.now(),
                read: false,
            };

            batch.set(notificationRef, notificationData);
        });

        await batch.commit();

        return res.status(200).json({
            success: true,
            message: "All assignments deleted and users notified"
        });

    } catch (error) {
        console.error("Error deleting assignments:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete assignments",
            error: error.message
        });
    }
};


module.exports = { addStore, deleteStore, updateStore, assignStore, deleteAssign, deleteAllAssign };