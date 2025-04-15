const { firestore } = require("firebase-admin");
const { collections } = require("../utils/utils");

const db = firestore();

const addCategory = async(req, res) => {
    try {
        const {
            category_name
        } = req.body;

        if(!category_name){
            return res.status(400).json({ success: false, message: "Category is required" });
        }

        categoryRef = db.collection(collections.category).doc();
        const categoryId = categoryRef.id;

        const data = {
            id: categoryId,
            category_name
        }

        await categoryRef.set(data);
        return res.status(200).json({ success: true, message: "Category Successfully Added" });
    } catch (error) {
        console.error("Error adding category", error);
        return res.status(500).json({ success: false, message: "Failed to add category" });
    }
}

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name } = req.body;

        if (!category_name) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        const categoryRef = db.collection(collections.category).doc(id);
        const doc = await categoryRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        await categoryRef.update({ category_name });

        return res.status(200).json({ success: true, message: "Category successfully updated" });
    } catch (error) {
        console.error("Error updating category", error);
        return res.status(500).json({ success: false, message: "Failed to update category" });
    }
}

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const categoryRef = db.collection(collections.category).doc(id);

        const doc = await categoryRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        await categoryRef.delete();

        return res.status(200).json({ success: true, message: "Category successfully deleted" });

    } catch (error) {
        console.error("Error updating category", error);
        return res.status(500).json({ success: false, message: "Error to delete category" });
    }
}

module.exports = { addCategory, updateCategory, deleteCategory }