const { firestore } = require("firebase-admin");
const { collections } = require("../utils/utils");
const { sendAdminNotifications, getUserNameById, getUserRoleById, logUserActivity, getCategoryById } = require("../utils/functions");
const { Timestamp } = require("firebase-admin/firestore");

const db = firestore();

const addCategory = async(req, res) => {
    try {
        const { currentUserId } = req.params;

        const {
            category_name
        } = req.body;

        if(!category_name){
            return res.status(400).json({ success: false, message: "Category is required" });
        }

        categoryRef = db.collection('categories').doc();
        const categoryId = categoryRef.id;

        const data = {
            id: categoryId,
            category_name,
            is_deleted: false,
            created_at: Timestamp.now(), 
        }

        await categoryRef.set(data);

        const getUserName = await getUserNameById(currentUserId);
        const getRole = await getUserRoleById(currentUserId);

        if(getRole === 'agent'){
            await sendAdminNotifications(`${getUserName} has been added a category in product named ${category_name}`, 'category');
        }

        await logUserActivity(currentUserId, `You added a product category named ${category_name}`)
        return res.status(200).json({ success: true, message: "Category Successfully Added" });
    } catch (error) {
        console.error("Error adding category", error);
        return res.status(500).json({ success: false, message: "Failed to add category" });
    }
}

//=============================================================== U P D A T E   C A T E G O R Y =========================================================================

const updateCategory = async (req, res) => {
    try {
        const { categoryId, currentUserId } = req.params;
        const { category_name } = req.body;

        if (!category_name) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        const categoryRef = db.collection('categories').doc(categoryId);
        const doc = await categoryRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        await categoryRef.update({ 
            category_name,
            updated_at: Timestamp.now(), 
        });

        const getUserName = await getUserNameById(currentUserId);
        const getRole = await getUserRoleById(currentUserId);

        if(getRole === 'agent'){
            await sendAdminNotifications(`${getUserName} has been updated a category in product named ${category_name}`, 'category');
        }
        await logUserActivity(currentUserId, `You updated a product category named ${category_name}`)

        return res.status(200).json({ success: true, message: "Category successfully updated" });
    } catch (error) {
        console.error("Error updating category", error);
        return res.status(500).json({ success: false, message: "Failed to update category" });
    }
}

//=============================================================== D E L E T E   C A T E G O R Y =========================================================================

const deleteCategory = async (req, res) => {
    try {
        const { categoryId, currentUserId } = req.params;

        const categoryRef = db.collection('categories').doc(categoryId);

        const doc = await categoryRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        await categoryRef.update({
            is_deleted: true,
            deleted_at: Timestamp.now(),
        });

        const getUserName = await getUserNameById(currentUserId);
        const getRole = await getUserRoleById(currentUserId);
        const getCategoryName = await getCategoryById(categoryId);

        if(getRole === 'agent'){
            await sendAdminNotifications(`${getUserName} has been deleted a category in product, named ${getCategoryName}`, 'category');
        }
        await logUserActivity(currentUserId, `You deleted a product category named ${getCategoryName}`)

        return res.status(200).json({ success: true, message: "Category successfully deleted" });
    } catch (error) {
        console.error("Error updating category", error);
        return res.status(500).json({ success: false, message: "Error to delete category" });
    }
}

module.exports = { addCategory, updateCategory, deleteCategory }