const { firestore } = require("firebase-admin");
const { collections } = require("../utils/utils");
const { Timestamp } = require("firebase-admin/firestore");

const db = firestore();

const addGroup = async(req, res) => {
    try {
        const {
            group_name,
            stores
        } =  req.body;


        if(!group_name || !Array.isArray(stores)){
            return res.status(400).json({ success: false, message: "Invalid data" });
        }   

        const storeIds = [...stores];
        const storeCheckPromises = storeIds.map(id =>
            db.collection(collections.storesCollection).doc(id).get()
        );

        const storeCheckResult = await Promise.all(storeCheckPromises);

        for(const doc of storeCheckResult){
            if(!doc.exists){
                return res.status(400).json({
                    success: false,
                    message: "One or more user IDs are invalid."
                });
            }
        }

        const regionRef = db.collection(collections.group).doc();
        const getRegionId = regionRef.id;

        const data = {
            group_id: getRegionId,
            group_name,
            created_at: Timestamp.now(),
        }

        await regionRef.set(data);

        const updateStorePromise = storeIds.map(async (id) => {
            const storeRef = db.collection(collections.storesCollection).doc(id);

            await storeRef.update({group: getRegionId, updatedAt: Timestamp.now()});
        })

        await Promise.all(updateStorePromise);

        return res.status(200).json({ success: true, message: `Successfully added a ${group_name}` });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to add inventory" });
    }
}

const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { group_name, stores } = req.body;

        if (!group_name || !Array.isArray(stores)) {
            return res.status(400).json({
                success: false,
                message: "All fields are required and stores must be an array of store IDs."
            });
        }

        const groupRef = db.collection(collections.group).doc(id);
        const groupDoc = await groupRef.get();

        if (!groupDoc.exists) {
            return res.status(404).json({ success: false, message: "Group not found." });
        }

        const currentGroupStoresSnap = await db.collection(collections.storesCollection)
            .where("group", "==", id)
            .get();

        const currentStoreIds = currentGroupStoresSnap.docs.map(doc => doc.id);
        const newStoreIds = [...stores];

        const removedStoreIds = currentStoreIds.filter(id => !newStoreIds.includes(id));
        const addedStoreIds = newStoreIds.filter(id => !currentStoreIds.includes(id));

        // Validate if all new stores exist
        const storeCheckPromises = newStoreIds.map(uid =>
            db.collection(collections.storesCollection).doc(uid).get()
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

        // Remove group from old stores
        const removeOldStore = removedStoreIds.map(async storeId => {
            const storeRef = db.collection(collections.storesCollection).doc(storeId);
            await storeRef.update({ group: firestore.FieldValue.delete(), updatedAt: Timestamp.now() });
        });

        // Assign group to new stores
        const updateNewStores = addedStoreIds.map(async storeId => {
            const storeRef = db.collection(collections.storesCollection).doc(storeId);
            await storeRef.update({ group: id, updatedAt: Timestamp.now() });
        });

        // Update group document
        await groupRef.update({
            group_name,
            updatedAt: Timestamp.now(),
        });

        await Promise.all([...removeOldStore, ...updateNewStores]);

        return res.status(200).json({
            success: true,
            message: "Group successfully updated",
            data: { id },
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
                updatedAt: Timestamp.now(),
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