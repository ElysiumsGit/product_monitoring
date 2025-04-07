const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");

const db = firestore();

const addProduct = async(req, res) => {
    try {
        const{
            product_name,
            sku_code,
            category,
            sku_status,
            unit,
            quantity,
            ...other_data
        } = req.body;

        if(
            !product_name || !sku_code || !category || !sku_status || !unit || !quantity
        ) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const userRef = db.collection("products").doc();
        const productId = userRef.id;

        const userProduct = {
            id: productId,
            product_name,
            sku_code,
            category,
            sku_status,
            unit,
            quantity,
            ...other_data,
            createdAt: Timestamp.now(),
        };

        await userRef.set(userProduct);

        return res.status(200).json({
            success: true,
            message: "Product added successfully",
            data: { id: productId, imageUrl },
        });

    } catch (error) {
        console.error("Error adding product:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add product",
            error: error.message,
        });
    }
}

const updateProduct = async(req, res) => {
    try {
        const { id } = req.params;
        const{
            product_name,
            sku_code,
            category,
            sku_status,
            unit,
            quantity,
            ...other_data
        } = req.body;

        const productRef = db.collection("products").doc(id);
        const productDoc = await productRef.get();

        if(!productDoc.exists){
            return res.status(404).json({success: false, message: "Product not found"});
        }
        
        let updatedProduct = {}

        const allowedFields = { 
            product_name, 
            sku_code, 
            category, 
            sku_status, 
            unit, 
            quantity, 
            ...other_data,
            updatedAt: Timestamp.now(),
        };

        Object.keys(allowedFields).forEach(key => {
            if(allowedFields[key] !== undefined){
                updatedProduct[key] = allowedFields[key];
            }
        });

        await productRef.update(updatedProduct);

        return res.status(200).json({success: true, message: "Product Updated Success"})

    } catch (error) {
        console.error("Error updating product", error);
        return res.status(500).json({success: false, message: "Failed to update"});
        
    }
}

const deleteProduct = async(req, res) => {
    try {
        const { id } = req.params;

        if(
            !id
        ){
            return res.status(404).json({ success: false, message: "ID not Found." });
        }

        const productRef = db.collection("products").doc(id);

        await productRef.delete();

        return res.status(200).json({success: true, message: "Deleted Product Success"})

    } catch (error) {
        console.error("Error deleting product", error);
        return res.status(500).json({success: false, message: "Failed to delete"});
        
    }
}

module.exports = { addProduct, updateProduct, deleteProduct };
