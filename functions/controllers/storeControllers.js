const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");

const db = firestore();

const addStore = async(req, res) => {
    try {
        const {
            store_name,
            location,
            name,
            phone_number,
            product,
            display_name,
            ...other_data
        } = req.body;

        if(
                !store_name || !location || !name || !phone_number || !product || !display_name
        )   {
                return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const storeRef = db.collection("store").doc();
        const storeId = storeRef.id;

        const storeData = {
            id: storeId,
            store_name,
            location,
            name,
            phone_number,
            product,
            display_name,
            ...other_data,
            createdAt: Timestamp.now(),
        };

        await storeRef.set(storeData);

        return res.status(200).json({
            success: true,
            message: "Store added successfully",
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
}

module.exports = { addStore };