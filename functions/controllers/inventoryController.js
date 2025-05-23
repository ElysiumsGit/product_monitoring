const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const collection = require("../utils/utils");
const { logUserActivity } = require("../utils/functions");

const db = firestore();

const manageInventory = async (req, res) => {
    try {
        const { currentUserId, storeId } = req.params;
        const products = req.body; 

        if (!Array.isArray(products)) {
            return res.status(400).json({ success: false, message: "Request body must be an array of products." });
        }

        const batch = db.batch();

        products.forEach((item) => {
            const inventoryRef = db.collection('stores').doc(storeId).collection('inventory').doc();
            batch.set(inventoryRef, {
                id: inventoryRef.id,
                product: item.products, 
                created_at: Timestamp.now(),
            });
        });

        await batch.commit();

        await logUserActivity({
            heading: "inventory",   
            currentUserId,
            activity: 'New inventory items have been created'
        });

        return res.status(200).json({ success: true, message: "Inventory successfully created." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to add inventory." });
    }
};

const addStock = async(req, res) => {
    try {
        const { storeId, inventoryId, currentUserId } = req.params;
        const { unit, quantity } = req.body;

        const inventoryRef = db.collection('stores').doc(storeId).collection('inventory').doc(inventoryId);

        await inventoryRef.update({
            unit,
            quantity,
        });

        await logUserActivity({
            heading: "inventory",   
            currentUserId,
            activity: 'New inventory items have been created'
        });

        return res.status(200).json({ success: true, message: "Successfully added a stock" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update" });
    }
}


// const updateStock = async (req, res) => {
//     try {
//         const { store_id, inventory_id } = req.params; 
//         const { unit, quantity } = req.body;

//         if (!store_id || !inventory_id || !unit || !quantity) {
//             return res.status(400).json({ success: false, message: "Invalid data" });
//         }

//         const inventoryRef = db.collection(collection.collections.storesCollection).doc(store_id).collection(collection.subCollections.inventoryCollection).doc(inventory_id);
        
//         const doc = await inventoryRef.get();
//         if (!doc.exists) {
//             return res.status(404).json({ success: false, message: "Inventory id not found" });
//         }
            
//         const inventoryupdated_ata = {
//             unit: unit,
//             quantity: quantity,
//         }

//         await inventoryRef.update(inventoryupdated_ata)

//         return res.status(200).json({ success: true, message: "Inventory updated successfully" });
//     } catch (error) {
//         console.error("Error updating inventory", error);
//         return res.status(500).json({ success: false, message: "Failed to update inventory" });
//     }
// };

// const updateTreshold = async (req, res) => {
//     try {
//         const { store_id, inventory_id } = req.params; 
//         const { treshold } = req.body;

//         if (!store_id || !inventory_id || !treshold === undefined) {
//             return res.status(400).json({ success: false, message: "Invalid data" });
//         }

//         const inventoryRef = db.collection(collection.collections.storesCollection).doc(store_id).collection(collection.subCollections.inventoryCollection).doc(inventory_id);
        
//         const doc = await inventoryRef.get();
//         if (!doc.exists) {
//             return res.status(404).json({ success: false, message: "Inventory id not found" });
//         }

//         const updatedTreshold = {
//             treshold,
//         }

//         await inventoryRef.update(updatedTreshold)

//         return res.status(200).json({ success: true, message: "Update Treshold Success" });
//     } catch (error) {
//         console.error("Error updating inventory", error);
//         return res.status(500).json({ success: false, message: "Failed to update inventory" });
//     }
// };

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

module.exports = { manageInventory, addStock };
