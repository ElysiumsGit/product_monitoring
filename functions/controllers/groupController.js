const { firestore } = require("firebase-admin");
const { collections } = require("../utils/utils");
const { Timestamp } = require("firebase-admin/firestore");
const { sendAdminNotifications, getUserNameById, getUserRoleById, logUserActivity } = require("../utils/functions");

const db = firestore();

const addGroup = async (req, res) => {
    try {
        const { currentUserId } = req.params;
        const { group_name, stores } = req.body;

        if (!group_name || !Array.isArray(stores) || stores.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid data" });
        }

        const storeDocs = await Promise.all(
            stores.map(id => db.collection('stores').doc(id).get())
        );


        for (const doc of storeDocs) {
            if (!doc.exists) {
                return res.status(400).json({ success: false, message: "Invalid store ID" });
            }
        }

        const groupRef = db.collection('groups').doc();
        const getGroupId = groupRef.id;

        await groupRef.set({
            id: groupRef.id,
            group_name,
            created_at: Timestamp.now(),
        });

        for(const updateStore of storeDocs){
            const storeRef = db.collection('stores').doc(updateStore.id);
            await storeRef.update({
                group: group_name,
                updated_at: Timestamp.now(),
            })
        }

        const getUserName = await getUserNameById(currentUserId);
        const getRole = await getUserRoleById(currentUserId);

        if(getRole === 'agent'){
            await sendAdminNotifications(`${getUserName} has added a group named ${group_name}`, 'group');
        }
        await logUserActivity(currentUserId, `You added a group named ${group_name}`)

        return res.status(201).json({ success: true, message: "Group added successfully" });

    } catch (error) {
        console.error("Error adding group:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

//=============================================================== U P D A T E   G R O U P =========================================================================

// const updateGroup = async(req, res) =>{
//     try {
//         const { groupId, currentUserId } = req.params;
//         const { group_name, stores } = req.body;

//         if (!group_name || !Array.isArray(stores)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All fields are required and stores must be an array of store IDs."
//             });
//         };

//         const groupRef = db.collection('groups').doc(groupId);

//         const groupStore = await db.collection('groups').where('group', "==", groupId).get()

//         const getGroup = groupStore.map((doc) => {
//             return doc.id;
//         });


        
//     } catch (error) {
        
//     }
// }

const updateGroup = async (req, res) => {
    try {
        const { groupId, currentUserId } = req.params;
        const { group_name, stores } = req.body;

        if (!group_name || !Array.isArray(stores)) {
            return res.status(400).json({
                success: false,
                message: "All fields are required and stores must be an array of store IDs."
            });
        }

        const groupRef = db.collection('groups').doc(groupId);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).json({ success: false, message: "Group not found." });
        }

        const currentGroupStoresSnap = await db.collection('stores').where("group", "==", groupId).get();
        const currentStoreIds = currentGroupStoresSnap.docs.map(doc => doc.id);
        const newStoreIds = [...stores];

        const removedStoreIds = currentStoreIds.filter(id => !newStoreIds.includes(id));
        const addedStoreIds = newStoreIds.filter(id => !currentStoreIds.includes(id));

        const storeCheckPromises = newStoreIds.map(uid =>
            db.collection('stores').doc(uid).get()
        );
        const storeDocs = await Promise.all(storeCheckPromises);

        for (const storeDoc of storeDocs) {
            if (!storeDoc.exists) {
                return res.status(400).json({
                    success: false,
                    message: "One or more store IDs are invalid."
                });
            }
        }

        const removeOldStore = removedStoreIds.map(async storeId => {
            const storeRef = db.collection('stores').doc(storeId);
            await storeRef.update({ group: firestore.FieldValue.delete(), updated_at: Timestamp.now() });
        });

        const updateNewStores = addedStoreIds.map(async storeId => {
            const storeRef = db.collection('stores').doc(storeId);
            await storeRef.update({ group: groupId, updated_at: Timestamp.now() });
        });

        await groupRef.update({
            group_name,
            updated_at: Timestamp.now(),
        });

        await Promise.all([...removeOldStore, ...updateNewStores]);

        const getUserName = await getUserNameById(currentUserId);
        const getRole = await getUserRoleById(currentUserId);

        if(getRole === 'agent'){
            await sendAdminNotifications(`${getUserName} updated a group named ${group_name}`);
        }
        await logUserActivity(`You updated a group named ${group_name}`);

        return res.status(200).json({
            success: true,
            message: "Group successfully updated",
            data: { id: groupId },
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update group",
            error: error.message,
        });
    }
};

const deleteGroup = async(req, res) => {
    try {
        const { id } = req.params

        const groupRef = db.collection(collections.group).doc(id);
        const groupDoc = await groupRef.get();

        if(!groupDoc.exists){
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        const storeSnap = await db.collection(collections.storesCollection).where("group", "==", id).get();
        
        const storeUpdatePromises = storeSnap.docs.map(async (storeDoc) => {
            const storeRef = storeDoc.ref;

            await storeRef.update({
                group: firestore.FieldValue.delete(),
                updated_at: Timestamp.now(),
            })
        });

        await Promise.all(storeUpdatePromises);
        await groupRef.delete();

        return res.status(200).json({ success: true, message: `Successfully deleted a group` });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to delete group", error: error.message });
    }
}

module.exports = { addGroup, deleteGroup, updateGroup }