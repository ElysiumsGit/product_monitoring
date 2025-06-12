const { firestore } = require("firebase-admin");
const { collections } = require("../utils/utils");
const { Timestamp, FieldValue } = require("firebase-admin/firestore");
const { sendAdminNotifications, getUserNameById, getUserRoleById, logUserActivity, getGroupNameById } = require("../utils/functions");

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

        const groupRef = db.collection('store-group').doc();
        const getGroupId = groupRef.id;

        await groupRef.set({
            group_id: getGroupId,
            group_name,
            created_at: Timestamp.now(),
        });

        for(const updateStore of storeDocs){
            const storeRef = db.collection('stores').doc(updateStore.id);
            await storeRef.update({
                store_group: getGroupId,
            })
        }

        await logUserActivity({ 
            heading: "add group",
            currentUserId: currentUserId, 
            activity: 'you have successfully added a group' 
        });

        return res.status(201).json({ success: true, message: "Group added successfully" });

    } catch (error) {
        console.error("Error adding group:", error);
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

//!=============================================================== U P D A T E   G R O U P =========================================================================

const updateGroup = async (req, res) => {
    try {
      const { currentUserId, targetId  } = req.params;
      const { group_name, stores } = req.body;
  
      if (!group_name || !Array.isArray(stores)) {
        return res.status(400).json({ success: false, message: "Invalid Data" });
      }
  
      const groupRef = db.collection('store-group').doc(targetId);
  
      await groupRef.update({
        group_name,
      });
  
      const existingStoresSnap = await db.collection('stores')
        .where('group', '==', targetId)
        .get();
  
      const existingStoreIds = existingStoresSnap.docs.map(doc => doc.id);
      const storesToAdd = stores.filter(storeId => !existingStoreIds.includes(storeId));
      const storesToRemove = existingStoreIds.filter(storeId => !stores.includes(storeId));
  
      for (const storeId of storesToAdd) {
        await db.collection('stores').doc(storeId).update({
          store_group: targetId,
        });
      }
  
      for (const storeId of storesToRemove) {
        await db.collection('stores').doc(storeId).update({
          store_group: "",
        });
      }
  
      await logUserActivity({ 
          heading: "update group",
          currentUserId: currentUserId, 
          activity: 'you have successfully updated a group' 
      });
  
      return res.status(200).json({ success: true, message: 'Group updated successfully' });
  
    } catch (error) {
      console.error("Error updating group:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};
  
//!=============================================================== U P D A T E   G R O U P =========================================================================

const deleteGroup = async(req, res) => {
    try {
        const { currentUserId, targetId } = req.params

        const groupRef = db.collection('store-group').doc(targetId);
        const groupDoc = await groupRef.get();

        if(!groupDoc.exists){
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        const storeSnap = await db.collection('stores').where("store_group", "==", targetId).get();
        
        const storeUpdatePromises = storeSnap.docs.map(async (storeDoc) => {
            const storeRef = storeDoc.ref;

            await storeRef.update({
                store_group: "",
            })
        });

        await Promise.all(storeUpdatePromises);
        await groupRef.delete();

        await logUserActivity({ 
            heading: "deleted group",
            currentUserId: currentUserId, 
            activity: 'you have deleted a group' 
        });

        return res.status(200).json({ success: true, message: `Successfully deleted a group` });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to delete group", error: error.message });
    }
}

module.exports = { addGroup, updateGroup, deleteGroup }