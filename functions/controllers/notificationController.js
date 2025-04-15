const { firestore } = require("firebase-admin");
const { collections, subCollections } = require("../utils/utils");

const db = firestore();

const deleteNotification = async (req, res) => {
    try {
        const { user_id, notification_id } = req.params;

        if (!user_id || !notification_id) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const notificationRef = db
            .collection(collections.usersCollections)
            .doc(user_id)
            .collection(collections.notifications)
            .doc(notification_id);

        const doc = await notificationRef.get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        await notificationRef.delete();

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting notification:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete notification"
        });
    }
};

const deleteAllNotifications = async (req, res) => {
    try {
        const { user_id } = req.params;

        const notificationsRef = db
            .collection(collections.usersCollections)
            .doc(user_id)
            .collection(subCollections.notifications);

        const snapshot = await notificationsRef.get();

        if (snapshot.empty) {
            return res.status(200).json({
                success: true,
                message: "No notifications to delete.",
            });
        }

        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return res.status(200).json({
            success: true,
            message: "All notifications have been deleted.",
        });

    } catch (error) {
        console.error("Error deleting notifications:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete all notifications",
        });
    }
};

module.exports = { deleteNotification, deleteAllNotifications };
