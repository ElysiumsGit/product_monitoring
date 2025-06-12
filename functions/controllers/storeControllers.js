const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const collection = require("../utils/utils");
const { sendAdminNotifications, getUserNameById, logUserActivity, getUserRoleById, getStoreNameById, safeSplit, capitalizeFirstLetter } = require("../utils/functions");

const db = firestore();

//!=============================================================== A D D   S T O R E =========================================================================

const addStore = async(req, res) => {
    try {
        const { currentUserId } = req.params;
     
        const {
            store_image,
            store_name,
            store_location,
            longitude,
            latitude,
            store_radius,
            contact_name,
            contact_number,
            display,
        } = req.body;

        if (
            !store_name ||
            !store_location ||
            typeof longitude !== 'number' ||
            typeof latitude !== 'number' ||
            typeof store_radius !== 'number' ||
            !contact_name ||
            !contact_number ||
            !Array.isArray(display)
        ) {
            return res.status(400).json({ success: false, message: "All fields are required and must be valid types." });
        }

        const storeRef = db.collection('stores').doc();
        const id = storeRef.id;

        const storeData = {
            store_image,
            store_id: id,
            store_name: store_name.toLowerCase().trim(),
            store_location: store_location.toLowerCase().trim(),
            longitude,
            latitude,
            store_radius,
            contact_name: contact_name.toLowerCase().trim(),
            contact_number,
            display,
            created_at: Timestamp.now(),
            is_deleted: false,
            store_group: "",
            search_tags: [
                ...safeSplit(store_name.toLowerCase()),
                ...safeSplit(store_location.toLowerCase()), 
                longitude,
                latitude,
                store_radius,
                ...safeSplit(contact_name.toLowerCase()), 
            ].flat().filter(Boolean),
        };

        await storeRef.set(storeData);

        const currentUserName = await getUserNameById(currentUserId);

        await sendAdminNotifications({
            heading: "New Store Created",
            title: `${capitalizeFirstLetter(currentUserName)} created a store ${capitalizeFirstLetter(store_name)}`,
            message: `${capitalizeFirstLetter(currentUserName)} just created a store named ${capitalizeFirstLetter(store_name)}`,
            type: 'store'
        });

        await logUserActivity({ 
            heading: "store",
            currentUserId: currentUserId, 
            activity: 'you have successfully added a store' 
        });

         return res.status(200).json({
            success: true,
            message: "Store added successfully and notifications sent.",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to add store",
            error: error.message,
        });
    }
}

// const addStore = async (req, res) => {
//     try {
//         const { currentUserId } = req.params;

//         const {
//             store_image,
//             store_name,
//             store_location,
//             longitude,
//             latitude,
//             store_radius,
//             contact_name,
//             contact_number,
//             display_information,
//         } = req.body;

//         if (
//             !store_name || !store_location || !contact_name || !contact_number ||
//             !Array.isArray(display_information) || display_information.length === 0 ||
//             display_information.some(display => !display.product || !display.display_name)
//         ) {
//             return res.status(400).json({ success: false, message: "All fields are required." });
//         }

//         const productChecks = await Promise.all(
//             display_information.map(async (display) => {
//                 const productRef = db.collection('products').doc(display.product);
//                 const productDoc = await productRef.get();
//                 return productDoc.exists;
//             })
//         );

//         const allProductsValid = productChecks.every(exists => exists);
//         if (!allProductsValid) {
//             return res.status(400).json({ success: false, message: "One or more product IDs are invalid." });
//         }

//         const storeRef = db.collection('stores').doc();
//         const storeId = storeRef.id;

//         const storeData = {
//             store_image,
//             store_id: storeId,
//             store_name: store_name.toLowerCase().trim(),
//             store_location: store_location.toLowerCase().trim(),
//             longitude,
//             latitude,
//             store_radius,
//             contact_name: contact_name.toLowerCase().trim(),
//             contact_number,
//             created_at: Timestamp.now(),
//             search_tags: [
//                 ...safeSplit(store_name.toLowerCase()),
//                 ...safeSplit(store_location.toLowerCase()), 
//                 ...safeSplit(longitude.toLowerCase()), 
//                 ...safeSplit(latitude.toLowerCase()), 
//                 ...safeSplit(store_radius.toLowerCase()), 
//                 ...safeSplit(contact_name.toLowerCase()), 
//             ].flat().filter(Boolean),
//         };

//         await storeRef.set(storeData);

//         for(const display of display_information){
//             const subStore = db.collection('stores').doc(storeId).collection('display_information').doc();
//             const getSubId = subStore.id;
//             const storeDisplayInformationData = {
//                 id: getSubId,
//                 product: display.product,
//                 display_name : display.display_name,
//             }

//             await subStore.set(storeDisplayInformationData);
//         }   

//         const currentUserName = await getUserNameById(currentUserId);

//         await sendAdminNotifications({
//             heading: "New Store Created",
//             title: `${capitalizeFirstLetter(currentUserName)} created a store ${capitalizeFirstLetter(store_name)}`,
//             message: `${capitalizeFirstLetter(currentUserName)} just created a store named ${capitalizeFirstLetter(store_name)}`,
//             type: 'store'
//         });

//         await logUserActivity({ 
//             heading: "store",
//             currentUserId: currentUserId, 
//             activity: 'you have successfully added a store' 
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Store added successfully and notifications sent.",
//             data: { id: storeId },
//         });

//     } catch (error) {
//         console.error("Error adding store:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to add store",
//             error: error.message,
//         });
//     }
// };

//!=============================================================== U P D A T E   S T O R E =========================================================================

const updateStore = async(req, res) => {
    try {
        const { currentUserId, targetId  } = req.params;

        const {
            store_image,
            store_name,
            store_location,
            longitude,
            latitude,
            store_radius,
            contact_name,
            contact_number,
        } = req.body;

        const storeRef = db.collection('stores').doc(targetId);
        
        const storeData = {
            store_image,
            store_name: store_name.toLowerCase().trim(),
            store_location: store_location.toLowerCase().trim(),
            longitude,
            latitude,
            store_radius,
            contact_name: contact_name.toLowerCase().trim(),
            contact_number,
            search_tags: [
                ...safeSplit(store_name.toLowerCase()),
                ...safeSplit(store_location.toLowerCase()), 
                longitude,
                latitude,
                store_radius, 
                ...safeSplit(contact_name.toLowerCase()), 
            ].flat().filter(Boolean) 
        }

        await storeRef.update(storeData);

        const currentUserName = await getUserNameById(currentUserId);

        await sendAdminNotifications({
            heading: "Store Updated",
            title: `${capitalizeFirstLetter(currentUserName)} updated a store ${capitalizeFirstLetter(store_name)}`,
            message: `${capitalizeFirstLetter(currentUserName)} just updated a store named ${capitalizeFirstLetter(store_name)}`,
            type: 'store'
        });

        await logUserActivity({ 
            heading: "store",
            currentUserId: currentUserId, 
            activity: 'you have successfully update a store' 
        });

        return res.status(200).json({
            success: true,
            message: "Store updated successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update store",
            error: error.message,
        });
    }
}

//!=============================================================== D E L E T E   S T O R E =========================================================================

const deleteStore = async(req, res) => {
    try {
        const { currentUserId, targetId } = req.params;

        const { is_deleted } = req.body;

        const storeRef = db.collection('stores').doc(targetId);

        const deleteData = {
            is_deleted,
            deleted_by: currentUserId,
            deleted_at: Timestamp.now()
        }

        await storeRef.update(deleteData);

        const currentUserName = await getUserNameById(currentUserId);
        const store_name = await getStoreNameById(targetId);

        await sendAdminNotifications({
            heading: "Store Updated",
            title: `${capitalizeFirstLetter(currentUserName)} updated a store ${capitalizeFirstLetter(store_name)}`,
            message: `${capitalizeFirstLetter(currentUserName)} just updated a store named ${capitalizeFirstLetter(store_name)}`,
            type: 'store'
        });

        return res.status(200).json({
            success: true,
            message: "Store deleted successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete store",
            error: error.message,
        });
    }
}

//!=============================================================== U P D A T E   D I S P L A Y =========================================================================

const updateDisplay = async (req, res) => {
    try {
        const { storeId, currentUserId } = req.params;
        const display_information = req.body; 

        if (!Array.isArray(display_information)) {
            return res.status(400).json({
                success: false,
                message: "Body must be a JSON array",
            });
        }

        for (const item of display_information) {
            const { product, displayId, display_name } = item;

            const displayRef = displayId
                ? db.collection('stores').doc(storeId).collection('display_information').doc(displayId)
                : db.collection('stores').doc(storeId).collection('display_information').doc();

            const data = {
                product,
                display_name,
                id: displayRef.id,
            };

            await displayRef.set(data, { merge: true });
        }

        await logUserActivity({ 
            heading: "store",
            currentUserId: currentUserId, 
            activity: 'you have updated a display information in this store' 
        });


        return res.status(200).json({
            success: true,
            message: "Display information processed successfully",
        });

    } catch (error) {
        console.error("Error updating display info:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while processing display information",
        });
    }
};


module.exports = { addStore, updateStore, deleteStore, updateDisplay };