const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const { logUserActivity, sendAdminNotifications, getUserNameById, getStoreNameById, capitalizeFirstLetter, getLastName } = require("../utils/functions");

const db = firestore();

const manageInventory = async (req, res) => {
    try {
        const { currentUserId, targetId } = req.params;
        const { products } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ success: false, message: "Products must be a non-empty array of product IDs." });
        }

        const productChecks = products.map(async (productId) => {
            if (!productId) {
                throw new Error("Each product ID must be valid.");
            }

            const productDoc = await db.collection('products').doc(productId).get();
            if (!productDoc.exists) {
                throw new Error(`Product ID ${productId} does not exist.`);
            }

            return productId;
        });

        let validProducts;
        try {
            validProducts = await Promise.all(productChecks);
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }

        const firstName = await getUserNameById(currentUserId);
        const lastName = await getLastName(currentUserId);

        await Promise.all(
            validProducts.map(async (productId) => {
                const inventoryRef = db.collection('stores').doc(targetId).collection('inventory').doc();

                await inventoryRef.set({
                    inventory_id: inventoryRef.id,
                    product_id: productId,
                    created_at: Timestamp.now(),
                    unit: "",
                    quantity: 0,
                    treshold: 0,
                    is_deleted: false,
                    action_by: `${firstName} ${lastName}`,
                    action: "in",
                });
            })
        );

        // Log activity and send notifications
        await logUserActivity({
            heading: "inventory",
            currentUserId,
            activity: 'new inventory has been created'
        });

        const storeName = await getStoreNameById(targetId);

        await sendAdminNotifications({
            heading: "Created an Inventory",
            title: `${capitalizeFirstLetter(firstName)} added inventory`,
            message: `${capitalizeFirstLetter(firstName)} just added inventory to ${capitalizeFirstLetter(storeName)}`,
            type: 'inventory'
        });

        return res.status(200).json({ success: true, message: "Inventory successfully created." });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to add inventory.",
            error: error.message
        });
    }
};

//!===================================================================================================================================================

const updateInventory = async (req, res) => {
    try {
        const { currentUserId, targetId, inventoryId,  } = req.params;
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
            heading: "Updated an Inventory",
            title: `${capitalizeFirstLetter(currentUserName)} update inventory`,
            message: `${capitalizeFirstLetter(currentUserName)} just update inventory to ${capitalizeFirstLetter(storeName)}`,
            type: 'inventory'
        });


        return res.status(200).json({ success: true, message: "Successfully updated inventory." });

    } catch (error) {
        console.error("updateInventory error:", error);
        return res.status(500).json({ success: false, message: "Failed to update inventory." });
    }
};

//!===================================================================================================================================================req.

const deleteInventory = async(req, res) => {
    try {

        const { currentUserId, targetId, inventoryId,  } = req.params;
        const { is_deleted } = req.body

        const inventoryRef = db.collection('stores').doc(targetId).collection('inventory').doc(inventoryId);

        const currentUserName = await getUserNameById(currentUserId);
        const storeName = await getStoreNameById(targetId);

        await inventoryRef.update({
            is_deleted,
            deleted_by: currentUserId,
            deleted_at: Timestamp.now(),
        })

        await logUserActivity({
            heading: "inventory",
            currentUserId,
            activity: 'Inventory item has been updated'
        });

        await sendAdminNotifications({
            heading: "Updated an Inventory",
            title: `${capitalizeFirstLetter(currentUserName)} update inventory`,
            message: `${capitalizeFirstLetter(currentUserName)} just update inventory to ${capitalizeFirstLetter(storeName)}`,
            type: 'inventory'
        });

        return res.status(200).json({ success: true, message: "Successfully updated inventory." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update inventory." });
    }
}

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

module.exports = { manageInventory, updateInventory, deleteInventory };
