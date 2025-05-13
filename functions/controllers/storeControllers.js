const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const collection = require("../utils/utils");
const { sendAdminNotifications, getUserNameById, logUserActivity, getUserRoleById, getStoreNameById } = require("../utils/functions");

const db = firestore();

const addStore = async (req, res) => {
    try {
        const { currentUserId } = req.params;

        const {
            store_profile,
            store_name,
            location,
            radius,
            contact_name,
            contact_number,
            display_information,
            ...other_data
        } = req.body;

        if (
            !store_name || !location || !contact_name || !contact_number ||
            !Array.isArray(display_information) || display_information.length === 0 ||
            display_information.some(display => !display.product || !display.display_name)
        ) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const productChecks = await Promise.all(
            display_information.map(async (display) => {
                const productRef = db.collection('products').doc(display.product);
                const productDoc = await productRef.get();
                return productDoc.exists;
            })
        );

        const allProductsValid = productChecks.every(exists => exists);
        if (!allProductsValid) {
            return res.status(400).json({ success: false, message: "One or more product IDs are invalid." });
        }

        const storeRef = db.collection('stores').doc();
        const storeId = storeRef.id;
        const currentUserName = await getUserNameById(currentUserId);
        const getRole = await getUserRoleById(currentUserId);
        const subStore = db.collection('stores').doc(storeId).collection('display_information').doc();

        const storeData = {
            store_profile,
            id: storeId,
            store_name,
            location,
            radius,
            contact_name,
            contact_number,
            ...other_data,
            created_at: Timestamp.now(),
        };

        if (getRole === "agent") {
            await sendAdminNotifications(`${currentUserName} has added a store named ${store_name}`, 'store');
        }

        await storeRef.set(storeData);

        for(const display of display_information){
            const storeDisplayInformationData = {
                product: display.product,
                display_name : display.display_name,
                ...other_data,
            }

            await subStore.set(storeDisplayInformationData);
        }   

        await logUserActivity(currentUserId, `You have added a store named ${store_name}`);

        return res.status(200).json({
            success: true,
            message: "Store added successfully and notifications sent.",
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
};

//=============================================================== U P D A T E   S T O R E =========================================================================

const updateStore = async(req, res) => {
    try {
        const { storeId, currentUserId } = req.params;
        const {
            store_profile,
            store_name,
            location,
            radius,
            contact_name,
            contact_number,
            display_information,
            ...other_data
        } = req.body;

        if (
            !store_name || !location || !contact_name || !contact_number ||
            !Array.isArray(display_information) || display_information.length === 0 ||
            display_information.some(display => !display.product || !display.display_name)
        ) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const productChecks = await Promise.all(
            display_information.map(async (display) => {
                const productRef = db.collection('products').doc(display.product);
                const productDoc = await productRef.get();
                return productDoc.exists;
            })
        );

        const allProductsValid = productChecks.every(exists => exists);
        if (!allProductsValid) {
            return res.status(400).json({ success: false, message: "One or more product IDs are invalid." });
        }

        const storeRef = db.collection('stores').doc(storeId);
        const storeDoc = await storeRef.get();

        if(!storeDoc.exists){
            return res.status(404).json({success: false, message: "Product not found"});
        }

        let updatedStore = {}

        const allowedFields = { 
            store_profile,
            store_name,
            location,
            radius,
            contact_name,
            contact_number,
            display_information,
            ...other_data,
        };

        Object.keys(allowedFields).forEach(key => {
            if(allowedFields[key] !== undefined){
                updatedStore[key] = allowedFields[key];
            }
        });

        const getRole = await getUserRoleById(currentUserId);
        const currentUserName = await getUserNameById(currentUserId);

        await storeRef.update(updatedStore);
        if(getRole === "agent"){
            await sendAdminNotifications(`${currentUserName} has updated a store named ${store_name}`, 'store');
        }

        await logUserActivity(currentUserId, `You have updated a store named ${store_name}`)

        return res.status(200).json({success: true, message: "Store Updated Success"})

    } catch (error) {
        console.error("Store updating error", error);
        return res.status(500).json({success: false, message: "Failed to update"});
    }
}

//=============================================================== D E L E T E   S T O R E =========================================================================

const deleteStore = async(req, res) => {
    try {
        const { storeId, currentUserId } = req.params;
        
        const storeRef = db.collection("stores").doc(storeId);
        const storeDoc = await storeRef.get();

        if (!storeDoc.exists) {
            return res.status(404).json({ success: false, message: "Store not found." });
        }

        const currentUserName = await getUserNameById(currentUserId);
        const getRole = await getUserRoleById(currentUserId);
        const getStoreName = await getStoreNameById(storeId);

        if(getRole === 'agent'){
            await sendAdminNotifications(`${currentUserName} has deleted a store named ${getStoreName}`, 'store');
        }

        await logUserActivity(currentUserId, `You have delete a store named ${getStoreName}`);

        await storeRef.update({
            is_deleted: true,
            delete_at: Timestamp.now(),
        });

        return res.status(200).json({success: true, message: "Store successfully deleted"});

    } catch (error) {
        console.error("Error deleting stores", error);
        return res.status(500).json({ success: false, message: "Failed to delete" });
    }
}

module.exports = { addStore, updateStore, deleteStore };