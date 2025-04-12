const { firestore } = require("firebase-admin");
const { collections } = require("../utils/utils");

const db = firestore();

const deleteNotification = async(req, res) => {
    try {
        const {user_id, notification_id } = req.params;

        if(!user_id || !notification_id){
            return res.status(400).json({
                success: false,
                message: "All fields are requrie"
            });
        }

        const notificationRef = db.collection(collections.usersCollections).doc(user_id).collection(collections.notifications).doc(notification_id);

        await notificationRef.delete()

        return res.status(200).json({
            success: true,
            message: "delete a notification",
        });
    } catch (error) {
        console.error("Error deleting team", error);
        return res.status(500).json({ success: false, message: "Failed to delete notification" });
    }
}

module.exports = { deleteNotification }