const { firestore } = require("firebase-admin");
const { sendAdminNotifications, getUserNameById, getUserRoleById, logUserActivity, getCategoryById, capitalizeFirstLetter } = require("../utils/functions");
const { Timestamp, FieldValue } = require("firebase-admin/firestore");

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

        const categoryRef = db.collection('categories').doc();
        const counterRef = db.collection('counter').doc('counter_id');
        const categoryId = categoryRef.id;

        const data = {
            category_id: categoryId,
            category_name: category_name.toLowerCase().trim(),
            is_deleted: false,
            created_at: Timestamp.now(), 
        }

        const counterData = {
            categories: FieldValue.increment(1),
        }

        await counterRef.set(counterData, { merge: true });
        await categoryRef.set(data);

        const currentUserName = await getUserNameById(currentUserId);

        await sendAdminNotifications({
            heading: "New Category Created",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} created a category named ${capitalizeFirstLetter(category_name)}`,
            title: `${capitalizeFirstLetter(currentUserName)} created a category named ${capitalizeFirstLetter(category_name)}`,
            message: `${capitalizeFirstLetter(currentUserName)} just created a category named ${capitalizeFirstLetter(category_name)}`,
            type: 'category'
        });

        await logUserActivity({ 
            heading: "add category",
            currentUserId: currentUserId, 
            activity: 'you have successfully added a category' 
        });

        return res.status(200).json({ success: true, message: "Category Successfully Added" });
    } catch (error) {
        console.error("Error adding category", error);
        return res.status(500).json({ success: false, message: "Failed to add category", error: error.message });
    }
}

//!=============================================================== U P D A T E   C A T E G O R Y =========================================================================

const updateCategory = async (req, res) => {
    try {
        const { currentUserId, targetId,  } = req.params;
        const { category_name } = req.body;

        if (!category_name) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        const categoryRef = db.collection('categories').doc(targetId);
        const doc = await categoryRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        await categoryRef.update({ 
            category_name: category_name.toLowerCase().trim(),
        });

        const currentUserName = await getUserNameById(currentUserId);

        await sendAdminNotifications({
            heading: "Category has updated",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} updated a category named ${capitalizeFirstLetter(category_name)}`,
            title: `${capitalizeFirstLetter(currentUserName)} updated a category named ${capitalizeFirstLetter(category_name)}`,
            message: `${capitalizeFirstLetter(currentUserName)} just updated a category named ${capitalizeFirstLetter(category_name)}`,
            type: 'category'
        });
        
        await logUserActivity({ 
            heading: "Update a Category",
            currentUserId: currentUserId, 
            activity: 'you have successfully update a category' 
        });

        return res.status(200).json({ success: true, message: "Category successfully updated" });
    } catch (error) {
        console.error("Error updating category", error);
        return res.status(500).json({ success: false, message: "Failed to update category" });
    }
}

//=============================================================== D E L E T E   C A T E G O R Y =========================================================================

const deleteCategory = async (req, res) => {
    try {
        const { currentUserId, targetId,  } = req.params;
        const { is_deleted } = req.body;

        const categoryRef = db.collection('categories').doc(targetId);
        const counterRef = db.collection('counter').doc('counter_id');

        const doc = await categoryRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        await categoryRef.update({
            is_deleted: is_deleted,
            deleted_at: is_deleted ? Timestamp.now() : FieldValue.delete(),
        });

        const counterData = {
            categories: FieldValue.increment(-1),
        }

        await counterRef.set(counterData, { merge: true });

        const currentUserName = await getUserNameById(currentUserId);
        const category_name = await getCategoryById(targetId);

        await sendAdminNotifications({
            heading: "Category has Deleted",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} deleted a category named ${capitalizeFirstLetter(category_name)}`,
            title: `${capitalizeFirstLetter(currentUserName)} deleted a category named ${capitalizeFirstLetter(category_name)}`,
            message: `${capitalizeFirstLetter(currentUserName)} just deleted a category named ${capitalizeFirstLetter(category_name)}`,
            type: 'category'
        });

        await logUserActivity({ 
            heading: "delete category",
            currentUserId: currentUserId, 
            activity: 'you have deleted a category' 
        });

        return res.status(200).json({ success: true, message: "Category successfully deleted" });
    } catch (error) {
        console.error("Error updating category", error);
        return res.status(500).json({ success: false, message: "Error to delete category" });
    }
}

module.exports = { addCategory, updateCategory, deleteCategory }