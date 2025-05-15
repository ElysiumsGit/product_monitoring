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
            const subStore = db.collection('stores').doc(storeId).collection('display_information').doc();
            const getSubId = subStore.id;
            const storeDisplayInformationData = {
                id: getSubId,
                product: display.product,
                display_name : display.display_name,
                ...other_data,
            }

            await subStore.set(storeDisplayInformationData);
        }   

        await logUserActivity({ 
            heading: "Store",
            currentUserId: currentUserId, 
            activity: 'You have successfully added a store' 
        });

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
const updateStore = async (req, res) => {
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
                const productDoc = await db.collection('products').doc(display.product).get();
                return productDoc.exists;
            })
        );

        if (!productChecks.every(Boolean)) {
            return res.status(400).json({ success: false, message: "One or more product IDs are invalid." });
        }

        const storeRef = db.collection('stores').doc(storeId);
        const storeDoc = await storeRef.get();
        if (!storeDoc.exists) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        const updatedStoreData = {
            store_profile,
            store_name,
            location,
            radius,
            contact_name,
            contact_number,
            ...other_data,
            updated_at: Timestamp.now(),
        };
        await storeRef.update(updatedStoreData);

        const displayInfoRef = storeRef.collection('display_information');

        const receivedIds = new Set();

        for (const display of display_information) {
            let displayRef;

            if (display.id) {
                displayRef = displayInfoRef.doc(display.id);
                const displayDoc = await displayRef.get();

                if (displayDoc.exists) {
                    await displayRef.update({
                        product: display.product,
                        display_name: display.display_name,
                        ...other_data,
                        updated_at: Timestamp.now(),
                    });
                    receivedIds.add(display.id);
                    continue;
                }
            }

            displayRef = displayInfoRef.doc(); 
            await displayRef.set({
                id: displayRef.id,
                product: display.product,
                display_name: display.display_name,
                ...other_data,
                created_at: Timestamp.now(),
            });
            receivedIds.add(displayRef.id);
        }

        const existingDocs = await displayInfoRef.get();
        for (const doc of existingDocs.docs) {
            if (!receivedIds.has(doc.id)) {
                await doc.ref.delete();
            }
        }

        const currentUserName = await getUserNameById(currentUserId);
        const getRole = await getUserRoleById(currentUserId);

        if (getRole === "agent") {
            await sendAdminNotifications(`${currentUserName} has updated a store named ${store_name}`, 'store');
        }

        await logUserActivity({ 
            heading: "Update Store",
            currentUserId: currentUserId, 
            activity: 'You have successfully update a store' 
        });

        return res.status(200).json({
            success: true,
            message: "Store updated successfully",
            data: { id: storeId }
        });

    } catch (error) {
        console.error("Error updating store:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update store",
            error: error.message,
        });
    }
};


//=============================================================== D E L E T E   S T O R E =========================================================================

// const deleteStore = async(req, res) => {
//     try {
//         const { storeId, currentUserId } = req.params;
        
//         const storeRef = db.collection("stores").doc(storeId);
//         const storeDoc = await storeRef.get();

//         if (!storeDoc.exists) {
//             return res.status(404).json({ success: false, message: "Store not found." });
//         }

//         const currentUserName = await getUserNameById(currentUserId);
//         const getRole = await getUserRoleById(currentUserId);
//         const getStoreName = await getStoreNameById(storeId);

//         if(getRole === 'agent'){
//             await sendAdminNotifications(`${currentUserName} has deleted a store named ${getStoreName}`, 'store');
//         }

//         await logUserActivity(currentUserId, `You have delete a store named ${getStoreName}`);

//         await storeRef.update({
//             is_deleted: true,
//             delete_at: Timestamp.now(),
//         });

//         return res.status(200).json({success: true, message: "Store successfully deleted"});

//     } catch (error) {
//         console.error("Error deleting stores", error);
//         return res.status(500).json({ success: false, message: "Failed to delete" });
//     }
// }

module.exports = { addStore, updateStore };