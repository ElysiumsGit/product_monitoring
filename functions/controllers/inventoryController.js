const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const collection = require("../utils/utils")

const db = firestore();

const inventoryAssign = async (req, res) => {
    try {
        const { id } = req.params;
        const { inventoryProducts } = req.body;

        if (!id || !inventoryProducts || !Array.isArray(inventoryProducts)) {
            return res.status(400).json({ success: false, message: "Invalid data" });
        }

        const storeRef = db.collection(collection.collections.storesCollection).doc(id).collection(collection.subCollections.inventoryCollection);
        const batch = db.batch();

        inventoryProducts.map((product) => {
            const productRef = storeRef.doc(); 
            const inventoryId = productRef.id;
            const productData = { ...product, inventory_id: inventoryId, createdAt: Timestamp.now() };
            
            batch.set(productRef, productData);
            return productData; 
        });

        await batch.commit();
        return res.status(200).json({ success: true, message: "Inventory updated successfully" });
    } catch (error) {
        console.error("Error adding inventory", error);
        return res.status(500).json({ success: false, message: "Failed to add inventory" });
    }
};

const updateStock = async (req, res) => {
    try {
        const { store_id, inventory_id } = req.params; 
        const { unit, quantity, product_id } = req.body;

        if (!store_id || !inventory_id || !unit || !quantity) {
            return res.status(400).json({ success: false, message: "Invalid data" });
        }

        const productRef = db.collection(collection.collections.storesCollection).doc(store_id).collection(collection.subCollections.inventoryCollection).doc(inventory_id);
        const getProduct = db.collection(collection.collections.productsCollection).doc(product_id);
        const getProductRef = await getProduct.get();
        
        if(!getProductRef.exists){
            res.status(404).json({ success: false, message: "Product Not found"});
        }
        const inventoryUpdateData = {
            unit: unit,
            quantity: quantity,
            updatedAt: Timestamp.now(),
        }

        await productRef.update(inventoryUpdateData)

        return res.status(200).json({ success: true, message: "Inventory updated successfully" });
    } catch (error) {
        console.error("Error updating inventory", error);
        return res.status(500).json({ success: false, message: "Failed to update inventory" });
    }
};

const updateTreshold = async (req, res) => {
    try {
        const { store_id, inventory_id } = req.params; 
        const { treshold } = req.body;

        if (!store_id || !inventory_id || !treshold === undefined) {
            return res.status(400).json({ success: false, message: "Invalid data" });
        }

        const productRef = db.collection(collection.collections.storesCollection).doc(store_id).collection(collection.subCollections.inventoryCollection).doc(inventory_id);
        
        const updatedTreshold = {
            treshold,
            updatedAt: Timestamp.now()
        }

        await productRef.update(updatedTreshold)

        return res.status(200).json({ success: true, message: "Update Treshold Success" });
    } catch (error) {
        console.error("Error updating inventory", error);
        return res.status(500).json({ success: false, message: "Failed to update inventory" });
    }
};

const deleteInventory = async (req, res) => {
    try {
        const { store_id, inventory_id } = req.params;

        if (!store_id || !inventory_id) {
            return res.status(400).json({ success: false, message: "Invalid Data" });
        }

        const inventoryRef = db.collection(collection.collections.storesCollection).doc(store_id).collection(collection.subCollections.inventoryCollection).doc(inventory_id);
        const getInventory = await inventoryRef.get();

        if (!getInventory.exists) {
            return res.status(200).json({ success: true, message: "Inventory does not exist" });
        }

        await inventoryRef.delete();
        return res.status(200).json({ success: true, message: "Deleted Inventory" });

    } catch (error) {
        console.error("Error deleting product", error);
        return res.status(500).json({ success: false, message: "Failed to delete" });
    }
};

module.exports = { inventoryAssign, updateStock, updateTreshold, deleteInventory };
