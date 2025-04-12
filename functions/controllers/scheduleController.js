const { firestore } = require("firebase-admin");
const { collections, subCollections } = require("../utils/utils");
const { Timestamp } = require("firebase-admin/firestore");

const db = firestore();

const addSchedule = async (req, res) => {
    try {
        const { user_id, store_id, inventory_id } = req.params;
        const { product_image, current_display, quantity } = req.body;

        if (!product_image || !current_display || !quantity) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const scheduleRef = db.collection("users").doc(user_id).collection("schedules").doc();
        const scheduleId = scheduleRef.id;

        const updateInventoryRef = db.collection(collections.storesCollection)
            .doc(store_id)
            .collection(subCollections.inventoryCollection)
            .doc(inventory_id);
        
            const inventorySnapshot = await updateInventoryRef.get();

        if (!inventorySnapshot.exists) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const currentStock = inventorySnapshot.data().quantity;

        if (currentStock < quantity) {
            return res.status(400).json({ success: false, message: "Not enough stock available." });
        }

        const newStock = currentStock - quantity;

        const batch = db.batch();

        batch.update(updateInventoryRef, { quantity: newStock });

        const scheduleData = {
            schedule_id: scheduleId,
            product_image,
            current_display,
            quantity,
            createdAt: Timestamp.now(),
        };
        batch.set(scheduleRef, scheduleData);

        await batch.commit();

        return res.status(200).json({
            success: true,
            message: "Schedule added successfully.",
            data: { schedule_id: scheduleId },
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to add schedule.",
            error: error.message,
        });
    }
};


module.exports = { addSchedule }