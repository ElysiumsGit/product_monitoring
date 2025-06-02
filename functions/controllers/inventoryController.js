const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const collection = require("../utils/utils");
const { logUserActivity, sendAdminNotifications, getUserNameById, getStoreNameById, capitalizeFirstLetter } = require("../utils/functions");

const db = firestore();

const manageInventory = async (req, res) => {
    try {
        const { targetId, currentUserId } = req.params;
        const products = req.body;

        if (!Array.isArray(products)) {
            return res.status(400).json({ success: false, message: "Request body must be an array of products." });
        }

        const batch = db.batch();

        for (const item of products) {
            const productId = item.products;

            if (!productId) {
                return res.status(400).json({ success: false, message: "Each item must contain a valid 'products' field." });
            }

            const productDoc = await db.collection('products').doc(productId).get();

            if (!productDoc.exists) {
                return res.status(400).json({ success: false, message: `Product ID ${productId} does not exist.` });
            }

            const inventoryRef = db.collection('stores').doc(targetId).collection('inventory').doc();

            batch.set(inventoryRef, {
                id: inventoryRef.id,
                product: productId,
                created_at: Timestamp.now(),
            });
        }

        await batch.commit();

        await logUserActivity({
            heading: "inventory",
            currentUserId,
            activity: 'new inventory items have been created'
        });

        const currentUserName = await getUserNameById(currentUserId);
        const storeName = await getStoreNameById(targetId);

        await sendAdminNotifications({
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} manage an inventory to store named ${capitalizeFirstLetter(storeName)}`,
            message: `${capitalizeFirstLetter(currentUserName)} added an inventory to ${capitalizeFirstLetter(storeName)}`,
            type: 'inventory'
        });

        return res.status(200).json({ success: true, message: "Inventory successfully created." });
    } catch (error) {
        console.error("manageInventory error:", error); // Log the actual error
        return res.status(500).json({ success: false, message: "Failed to add inventory.", error });
    }
};


//!===================================================================================================================================================

const updateInventory = async (req, res) => {
    try {
        const { targetId, inventoryId, currentUserId } = req.params;
        const { unit, quantity, treshold } = req.body;

        const inventoryRef = db.collection('stores').doc(targetId).collection('inventory').doc(inventoryId);

        const updateData = {};

        if (unit !== undefined) updateData.unit = unit;
        if (quantity !== undefined) updateData.quantity = quantity;
        if (treshold !== undefined) updateData.treshold = treshold;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: "No valid fields provided to update." });
        }

        await inventoryRef.update(updateData);

        await logUserActivity({
            heading: "inventory",
            currentUserId,
            activity: 'Inventory item has been updated'
        });

        const currentUserName = await getUserNameById(currentUserId);
        const storeName = await getStoreNameById(targetId);

        await sendAdminNotifications({
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} manage an inventory to store named ${capitalizeFirstLetter(storeName)}`,
            message: `${capitalizeFirstLetter(currentUserName)} added an inventory to ${capitalizeFirstLetter(storeName)}`,
            type: 'inventory'
        });


        return res.status(200).json({ success: true, message: "Successfully updated inventory." });

    } catch (error) {
        console.error("updateInventory error:", error);
        return res.status(500).json({ success: false, message: "Failed to update inventory." });
    }
};

//!===================================================================================================================================================

// const deleteInventory = async (req, res) => {
//     try {
//         const { store_id, inventory_id } = req.params;

//         if (!store_id || !inventory_id) {
//             return res.status(400).json({ success: false, message: "Invalid Data" });
//         }

//         const inventoryRef = db.collection(collection.collections.storesCollection).doc(store_id).collection(collection.subCollections.inventoryCollection).doc(inventory_id);
//         const getInventory = await inventoryRef.get();

//         if (!getInventory.exists) {
//             return res.status(200).json({ success: true, message: "Inventory does not exist" });
//         }

//         await inventoryRef.delete();
//         return res.status(200).json({ success: true, message: "Deleted Inventory" });

//     } catch (error) {
//         console.error("Error deleting product", error);
//         return res.status(500).json({ success: false, message: "Failed to delete" });
//     }
// };

module.exports = { manageInventory, updateInventory };
