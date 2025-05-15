const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const { products, users, notifications, activities } = require("../utils/utils");
const { sendAdminNotifications, getUserNameById, logUserActivity, getUserRoleById, getProductNameById } = require("../utils/functions");

const db = firestore();

const addProduct = async(req, res) => {
    try {
        const { currentUserId } = req.params;

        const{
            product_image,
            product_name,
            sku_code,
            category,
            sku_status,
            unit,
            quantity,
        } = req.body;

        if(
            !product_name || !sku_code || !category || !sku_status || !unit || !quantity
        ) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const productRef = db.collection(products).doc();
        const productId = productRef.id;
        const currentUserName = await getUserNameById(currentUserId);
        const getRole = await getUserRoleById(currentUserId);

        const userProduct = {
            id: productId,
            product_image,
            product_name,
            sku_code,
            category,
            sku_status,
            unit,
            quantity,
            created_at: Timestamp.now(),
        };

        if(getRole === "agent"){
            await sendAdminNotifications(`${currentUserName} has added a product named ${product_name}`, `product`);
        }
        await productRef.set(userProduct);
        await logUserActivity({ 
            heading: "Add Product",
            currentUserId: currentUserId, 
            activity: 'You have successfully added a product' 
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

//=============================================================== G E T  A L L   P R O D U C T =========================================================================

// const getAllProducts = async (req, res) => {
//     try {
//         const productsSnapshot = await db
//             .collection("products")
//             .orderBy("created_at", "desc")
//             .get();

//         const products = productsSnapshot.docs.map((doc) => doc.data());

//         return res.status(200).json({
//             success: true,
//             data: products,
//         });

//     } catch (error) {
//         console.error("Error fetching all products:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to fetch products",
//             error: error.message,
//         });
//     }
// };

//=============================================================== G E T   S I N G L E   P R O D U C T =========================================================================

// const getSingleProduct = async (req, res) => {
//     try {
//         const { productId } = req.params;

//         const productDoc = await db.collection("products").doc(productId).get();

//         if (!productDoc.exists) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Product not found",
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             data: productDoc.data(),
//         });

//     } catch (error) {
//         console.error("Error fetching product:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to fetch product",
//             error: error.message,
//         });
//     }
// };

//=============================================================== U P D A T E  P R O D U C T =========================================================================

const updateProduct = async(req, res) => {
    try {
        const { productId, currentUserId } = req.params;
        const{
            product_image,
            product_name,
            sku_code,
            category,
            sku_status,
            unit,
            quantity,
            ...other_data
        } = req.body;

        const productRef = db.collection("products").doc(productId);
        const productDoc = await productRef.get();

        if(!productDoc.exists){
            return res.status(404).json({success: false, message: "Product not found"});
        }

        const currentUserName = await getUserNameById(currentUserId);
        const getRole = await getUserRoleById(currentUserId);
        let updatedProduct = {}

        const allowedFields = { 
            product_image,
            product_name, 
            sku_code, 
            category, 
            sku_status, 
            unit, 
            quantity, 
            ...other_data,
        };

        Object.keys(allowedFields).forEach(key => {
            if(allowedFields[key] !== undefined){
                updatedProduct[key] = allowedFields[key];
            }
        });

        await productRef.update(updatedProduct);

        if(getRole === "agent"){
            await sendAdminNotifications(`${currentUserName} updated a product named ${product_name}`, `product`);
        }
        
        await logUserActivity({ 
            heading: "Update Product",
            currentUserId: currentUserId, 
            activity: 'You have successfully updated a product' 
        });

        return res.status(200).json({success: true, message: "Product Updated Success"})

    } catch (error) {
        console.error("Error updating product", error);
        return res.status(500).json({success: false, message: "Failed to update"});
        
    }
}

//=============================================================== D E L E T E  P R O D U C T =========================================================================
const deleteProduct = async (req, res) => {
    try {
        const { productId, currentUserId } = req.params;

        const productRef = db.collection("products").doc(productId);
        const productDoc = await productRef.get();

        if (!productDoc.exists) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        const currentUserName = await getUserNameById(currentUserId);
        const getRole = await getUserRoleById(currentUserId);
        const getProductName = await getProductNameById(productId);

        if (getRole === "agent") {
            await sendAdminNotifications(`${currentUserName} deleted a product named ${getProductName}`, "product");
        }

        await logUserActivity({ 
            heading: "Delete Product",
            currentUserId: currentUserId, 
            activity: 'You have deleted a product' 
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
