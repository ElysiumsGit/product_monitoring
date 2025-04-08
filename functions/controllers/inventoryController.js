const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");

const db = firestore();

const inventoryAssign = async (req, res) => {
    try {
        const assignments = req.body; // Expecting an array of assignments

        if (!Array.isArray(assignments) || assignments.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid request format. Expected an array." });
        }

        const batch = db.batch();

        for (const assignment of assignments) {
            const { store_id, product_id } = assignment;

            if (!store_id || !product_id ) {
                return res.status(400).json({ success: false, message: "Missing required fields in one or more assignments" });
            }

            const productRef = db.collection("store").doc(store_id).collection("product").doc();
            const inventoryId = productRef.id;

            const inventoryData = {
                id: inventoryId,
                product_id,
                createdAt: Timestamp.now(),
            };
            batch.set(productRef, inventoryData);
        }

        await batch.commit();

        return res.status(200).json({
            success: true,
            message: "Store successfully assigned inventory products",
        });

    } catch (error) {
        console.error("Error assigning inventory", error);
        return res.status(500).json({ success: false, message: "Failed to assign inventory" });
    }
};

const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { store_id, stocks, unit, low_stocks_treshold } = req.body;

        if (!stocks || !unit || low_stocks_treshold === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields for updating inventory" });
        }

        // Check if the product exists in the global inventory
        const productGlobalRef = db.collection("products").doc(id);
        const productSnap = await productGlobalRef.get();

        if (!productSnap.exists) {
            return res.status(404).json({ success: false, message: `Product ${id} not found in global inventory` });
        }

        const productData = productSnap.data();
        const currentQuantity = productData.quantity || 0;
        const productName = productData.product_name;

        if (currentQuantity < stocks) {
            return res.status(400).json({ success: false, message: `Not enough stock for product ${productName}` });
        }

        const newQuantity = currentQuantity - stocks;

        // Update global inventory quantity
        const batch = db.batch();
        batch.update(productGlobalRef, { quantity: newQuantity });

        // Update store inventory
        const productRef = db.collection("store").doc(store_id).collection("product").doc(id);

        const inventoryData = {
            stocks,
            unit,
            low_stocks_treshold,
            updatedAt: Timestamp.now(),  // Add an updated timestamp instead of creating new fields like field_type
        };

        // Update the store's inventory without overwriting unintended fields
        batch.set(productRef, inventoryData, { merge: true });  // Merge ensures only the provided fields are updated

        await batch.commit();

        return res.status(200).json({
            success: true,
            message: "Inventory successfully updated",
        });

    } catch (error) {
        console.error("Error updating inventory", error);
        return res.status(500).json({ success: false, message: "Failed to update inventory" });
    }
};

module.exports = { inventoryAssign, updateInventory };
