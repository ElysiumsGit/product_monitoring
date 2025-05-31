const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const { sendAdminNotifications, getUserNameById, logUserActivity, getUserRoleById, getProductNameById, safeSplit, capitalizeFirstLetter } = require("../utils/functions");

const db = firestore();

const addProduct = async(req, res) => {
    try {
        const { currentUserId } = req.params;

        const{
            product_image,
            product_name,
            sku_code,
            category,
            unit,
        } = req.body;

        if(
            !product_name || !sku_code || !category || !unit
        ) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const productRef = db.collection("products").doc();
        const productId = productRef.id;
        const currentUserName = await getUserNameById(currentUserId);

        const userProduct = {
            product_id: productId,
            product_image,
            product_name: product_name.toLowerCase().trim(),
            sku_code,
            category: category.toLowerCase().trim(),
            sku_status: "active",
            unit: unit.toLowerCase().trim(),
            is_deleted: false,
            created_at: Timestamp.now(),
            search_tags: [
                ...safeSplit(product_name.toLowerCase()),
                ...safeSplit(category.toLowerCase()), 
                ...safeSplit(sku_code.toLowerCase()), 
                ...safeSplit(unit.toLowerCase()), 
            ].flat().filter(Boolean) 
        };
            
        await productRef.set(userProduct);

        await sendAdminNotifications({
            heading: "New Product Created",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} created a product named ${capitalizeFirstLetter(product_name)}`,
            title: `${capitalizeFirstLetter(currentUserName)} created a product ${capitalizeFirstLetter(product_name)}`,
            message: `${capitalizeFirstLetter(currentUserName)} just created a product named ${capitalizeFirstLetter(product_name)}`,
            type: 'product'
        });

        await logUserActivity({ 
            heading: "add product",
            currentUserId: currentUserId, 
            activity: 'you have successfully added a product' 
        });

        return res.status(200).json({
            success: true,
            message: "Product added successfully",
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

//!=============================================================== U P D A T E  P R O D U C T =========================================================================

const updateProduct = async(req, res) => {
    try {
        const { currentUserId, targetId  } = req.params;
        const{
            product_image,
            product_name,
            sku_code,
            category,
            sku_status,
            unit,
        } = req.body;

        const productRef = db.collection("products").doc(targetId);
        const productDoc = await productRef.get();

        if(!productDoc.exists){
            return res.status(404).json({success: false, message: "Product not found"});
        }

        const currentUserName = await getUserNameById(currentUserId);
        let updatedProduct = {}

        const allowedFields = { 
            product_image,
            product_name: product_name.toLowerCase().trim(), 
            sku_code:sku_code.toLowerCase().trim(), 
            category: category.toLowerCase().trim(), 
            sku_status, 
            unit: unit.toLowerCase().trim(), 
            search_tags: [
                ...safeSplit(product_name.toLowerCase()),
                ...safeSplit(category.toLowerCase()), 
                ...safeSplit(sku_code.toLowerCase()), 
                ...safeSplit(unit.toLowerCase()), 
            ].flat().filter(Boolean) 
        };

        Object.keys(allowedFields).forEach(key => {
            if(allowedFields[key] !== undefined){
                updatedProduct[key] = allowedFields[key];
            }
        });

        await productRef.update(updatedProduct);

        await sendAdminNotifications({
            heading: "Product Updated",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} updated a product named ${capitalizeFirstLetter(product_name)}`,
            title: `${capitalizeFirstLetter(currentUserName)} updated a product ${capitalizeFirstLetter(product_name)}`,
            message: `${capitalizeFirstLetter(currentUserName)} just updated a product named ${capitalizeFirstLetter(product_name)}`,
            type: 'product'
        });
        
        await logUserActivity({ 
            heading: "update product",
            currentUserId: currentUserId, 
            activity: 'you have successfully updated a product' 
        });

        return res.status(200).json({success: true, message: "Product Updated Success"})

    } catch (error) {
        console.error("Error updating product", error);
        return res.status(500).json({success: false, message: "Failed to update"});
    }
}

//!=============================================================== D E L E T E  P R O D U C T =========================================================================

const deleteProduct = async (req, res) => {
    try {
        const { currentUserId, targetId } = req.params;
        const { is_deleted } = req.body;

        const productRef = db.collection("products").doc(targetId);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const currentUserName = await getUserNameById(currentUserId);
        const product_name = await getProductNameById(targetId);

        const productData = {
            is_deleted,
            deleted_at: Timestamp.now(),
            deleted_by: currentUserId,
        }

        await productRef.update(productData);

        await sendAdminNotifications({
            heading: "Product Updated",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} updated a product named ${capitalizeFirstLetter(product_name)}`,
            title: `${capitalizeFirstLetter(currentUserName)} updated a product ${capitalizeFirstLetter(product_name)}`,
            message: `${capitalizeFirstLetter(currentUserName)} just updated a product named ${capitalizeFirstLetter(product_name)}`,
            type: 'product'
        });

        await logUserActivity({ 
            heading: "delete product",
            currentUserId: currentUserId, 
            activity: 'you have deleted a product' 
        });

        await productRef.update({
            is_deleted: true,
            deleted_at: Timestamp.now(),
        });

        return res.status(200).json({ success: true, message: "Deleted Product Success" });

    } catch (error) {
        console.error("Error deleting product", error);
        return res.status(500).json({ success: false, message: "Failed to delete" });
    }
};

module.exports = { addProduct, updateProduct, deleteProduct };
