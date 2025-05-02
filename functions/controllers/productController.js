const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const { products, users, notifications, activities } = require("../utils/utils");

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

        const userDoc = await db.collection("users").doc(currentUserId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const currentUserData = userDoc.data();
        const currentUserName = currentUserData.first_name || "Unknown User";

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

        await productRef.set(userProduct);

        const adminUsersSnapshot = await db
            .collection(users)
            .where("role", "==", "admin")
            .get();

        const notificationPromises = [];

        adminUsersSnapshot.forEach((adminDoc) => {
            const adminId = adminDoc.id;

            const notificationRef = db
                .collection(users)
                .doc(adminId)
                .collection(notifications)
                .doc();

            const notificationData = {
                id: notificationRef.id,
                message: `A new product, ${product_name} has been launched by ${currentUserName}`,
                created_at: Timestamp.now(),
                isRead: false,
                type: "product",
            };

            notificationPromises.push(notificationRef.set(notificationData));
        });

        await Promise.all(notificationPromises);

        const activityRef = db.collection(users).doc(currentUserId).collection(activities).doc();
        const getActivityId = activityRef.id;

        await activityRef.set({
            id: getActivityId,
            title: `You have added a product named ${product_name}`,
            created_at: Timestamp.now(),
        })

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

const getAllProducts = async (req, res) => {
    try {
        const productsSnapshot = await db
            .collection("products")
            .orderBy("created_at", "desc")
            .get();

        const products = productsSnapshot.docs.map((doc) => doc.data());

        return res.status(200).json({
            success: true,
            data: products,
        });

    } catch (error) {
        console.error("Error fetching all products:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
            error: error.message,
        });
    }
};

//=============================================================== G E T   S I N G L E   P R O D U C T =========================================================================

const getSingleProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const productDoc = await db.collection("products").doc(productId).get();

        if (!productDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: productDoc.data(),
        });

    } catch (error) {
        console.error("Error fetching product:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch product",
            error: error.message,
        });
    }
};

//=============================================================== U P D A T E  P R O D U C T =========================================================================

const updateProduct = async(req, res) => {
    try {
        const { productId, currentUserId } = req.params;
        const{
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

        const userDoc = await db.collection("users").doc(currentUserId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const currentUserData = userDoc.data();
        const currentUserName = currentUserData.first_name || "Unknown User";
        
        let updatedProduct = {}

        const allowedFields = { 
            product_name, 
            sku_code, 
            category, 
            sku_status, 
            unit, 
            quantity, 
            ...other_data,
            updated_at: Timestamp.now(),
        };

        Object.keys(allowedFields).forEach(key => {
            if(allowedFields[key] !== undefined){
                updatedProduct[key] = allowedFields[key];
            }
        });

        await productRef.update(updatedProduct);

        const adminUsersSnapshot = await db
            .collection(users)
            .where("role", "==", "admin")
            .get();

        const notificationPromises = [];

        adminUsersSnapshot.forEach((adminDoc) => {
            const adminId = adminDoc.id;

            const notificationRef = db
                .collection(users)
                .doc(adminId)
                .collection(notifications)
                .doc();

            const notificationData = {
                id: notificationRef.id,
                message: `${product_name} has been updated by ${currentUserName}`,
                created_at: Timestamp.now(),
                isRead: false,
                type: "store",
            };

            notificationPromises.push(notificationRef.set(notificationData));
        });

        await Promise.all(notificationPromises);

        const activityRef = db.collection(users).doc(currentUserId).collection(activities).doc();
        const getActivityId = activityRef.id;

        await activityRef.set({
            id: getActivityId,
            title: `You have updated this product named ${product_name}`,
            created_at: Timestamp.now(),
        })

        return res.status(200).json({success: true, message: "Product Updated Success"})

    } catch (error) {
        console.error("Error updating product", error);
        return res.status(500).json({success: false, message: "Failed to update"});
        
    }
}

//=============================================================== D E L E T E  P R O D U C T =========================================================================
const deleteProduct = async(req, res) => {
    try {
        const { productId, currentUserId } = req.params;

        if(
            !productId
        ){
            return res.status(404).json({ success: false, message: "ID not Found." });
        }

        const productRef = db.collection(products).doc(productId);

        await productRef.delete();

        const userDoc = await db.collection("users").doc(currentUserId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const currentUserData = userDoc.data();
        const currentUserName = currentUserData.first_name || "Unknown User";

        const adminUsersSnapshot = await db
            .collection(users)
            .where("role", "==", "admin")
            .get();

        const notificationPromises = [];

        adminUsersSnapshot.forEach((adminDoc) => {
            const adminId = adminDoc.id;

            const notificationRef = db
                .collection(users)
                .doc(adminId)
                .collection(notifications)
                .doc();

            const notificationData = {
                id: notificationRef.id,
                message: `${store_name} store has been created by ${currentUserName} and is ready for team assignment`,
                created_at: Timestamp.now(),
                isRead: false,
                type: "store",
            };

            notificationPromises.push(notificationRef.set(notificationData));
        });

        await Promise.all(notificationPromises);

        const activityRef = db.collection(users).doc(currentUserId).collection(activities).doc();
        const getActivityId = activityRef.id;

        await activityRef.set({
            id: getActivityId,
            title: `You have deled this product named ${product_name}`,
            created_at: Timestamp.now(),
        })

        return res.status(200).json({success: true, message: "Deleted Product Success"})

    } catch (error) {
        console.error("Error deleting product", error);
        return res.status(500).json({success: false, message: "Failed to delete"});
        
    }
}

module.exports = { addProduct, getAllProducts, getSingleProduct, updateProduct, deleteProduct };
