const { firestore } = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

const db = firestore();

//!=============================================================== D E L E T E    N O T I F I C A T I O N =========================================================================

const readNotification = async (req, res) => {
    try {
        const { currentUserId, targetId } = req.params;
        const { is_read } = req.body;

        if (typeof is_read !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: "`is_read` must be a boolean",
            });
        }

        const notificationRef = db
            .collection('users')
            .doc(currentUserId)
            .collection('notifications')
            .doc(targetId);

        const counterRef = db
            .collection('users')
            .doc(currentUserId)
            .collection('counter')
            .doc('counter_id');

        const notificationSnap = await notificationRef.get();

        if (!notificationSnap.exists) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        const currentData = notificationSnap.data();

        if (!currentData.is_read && is_read === true) {
            await notificationRef.update({ is_read: true });
            await counterRef.update({
                notifications: FieldValue.increment(-1),
            });

            return res.status(200).json({
                success: true,
                message: "Notification marked as read and counter updated",
            });
        }

        return res.status(200).json({
            success: true,
            message: "No update needed (already read or no change)",
        });

    } catch (error) {
        console.error("Error reading notification:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to read notification"
        });
    }
};

const readAllNotifications = async (req, res) => {
    try {
        const { currentUserId } = req.params;
        const { is_read } = req.body;

        const notificationsRef = db.collection('users').doc(currentUserId).collection('notifications');
        const snapshot = await notificationsRef.get();
        const counterRef = db.collection('users').doc(currentUserId).collection('counter').doc('counter_id');


        const batch = db.batch();

        snapshot.forEach((doc) => {
            const notificationRef = notificationsRef.doc(doc.id);
            batch.update(notificationRef, { is_read });
        });

        await batch.commit();

        await counterRef.update({
            notifications: 0,
        });

        return res.status(200).json({
            success: true,
            message: "Successfully marked all notifications as read",
        });

    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read"
        });
    }
};




// const deleteNotification = async(req, res) => {
//     try {
//         const { notificationId, currentUserId  } = req.params;

//         const notificationRef = db.collection('users').doc(currentUserId).collection('notifications').doc(notificationId);

//         const notificationData = {
//             is_deleted: true,
//         }

//         await notificationRef.update(notificationData);

//         return res.status(200).json({
//             success: true,
//             message: "Notification deleted successfully",
//         });

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: "Failed to delete notification"
//         });
//     }
// }

//!=============================================================== D E L E T E    A L L    N O T I F I C A T I O N =========================================================================

// const deleteAllNotification = async (req, res) => {
//     try {
//         const { currentUserId } = req.params;

//         const notificationsRef = db
//             .collection('users')
//             .doc(currentUserId)
//             .collection('notifications');

//         const snapshot = await notificationsRef.get();

//         if (snapshot.empty) {
//             return res.status(200).json({
//                 success: true,
//                 message: 'No notifications to delete.',
//             });
//         }

//         const batch = db.batch();

//         snapshot.forEach(doc => {
//             batch.update(doc.ref, { is_delete: true });
//         });

//         await batch.commit();

//         return res.status(200).json({
//             success: true,
//             message: 'All notifications marked as deleted.',
//         });

//     } catch (error) {
//         console.error('Failed to delete notifications:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Something went wrong while deleting notifications.',
//         });
//     }
// };




// const deleteNotification = async (req, res) => {
//     try {
//         const { currentUserId, notification_id } = req.params;

//         if (!currentUserId || !notification_id) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All fields are required"
//             });
//         }

//         const notificationRef = db.collection("users").doc(currentUserId).collection("notifications").doc(notification_id);
//         const doc = await notificationRef.get();

//         if (!doc.exists) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Notification not found",
//             });
//         }

//         await notificationRef.delete();

//         return res.status(200).json({
//             success: true,
//             message: "Notification deleted successfully",
//         });
//     } catch (error) {
//         console.error("Error deleting notification:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to delete notification"
//         });
//     }
// };

//=============================================================== D E L E T E   A L L   N O T I F I C A T I O N =========================================================================

// const deleteAllNotifications = async (req, res) => {
//     try {
//         const { currentUserId } = req.params;

//         const notificationsRef = db.collection(collections.usersCollections).doc(currentUserId).collection(subCollections.notifications);
//         const snapshot = await notificationsRef.get();

//         if (snapshot.empty) {
//             return res.status(200).json({
//                 success: true,
//                 message: "No notifications to delete.",
//             });
//         }

//         const batch = db.batch();
//         snapshot.forEach(doc => {
//             batch.delete(doc.ref);
//         });

//         await batch.commit();

//         return res.status(200).json({
//             success: true,
//             message: "All notifications have been deleted.",
//         });

//     } catch (error) {
//         console.error("Error deleting notifications:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to delete all notifications",
//         });
//     }
// };

//=============================================================== G E T   N O T I F I C A T I O N =========================================================================

// const getNotification = async (req, res) => {
//     try {
//         const { currentUserId } = req.params;

//         const notificationsRef = db.collection("users").doc(currentUserId).collection("notifications");
//         const snapshot = await notificationsRef.orderBy("created_at", "desc").get();

//         const notifications = [];

//         snapshot.forEach(doc => {
//             notifications.push({ ...doc.data() });
//         });

//         return res.status(200).json({ success: true, notifications });

//     } catch (error) {
//         console.error("Error fetching notifications", error);
//         return res.status(500).json({ success: false, message: "Failed to get notifications" });
//     }
// };

module.exports = { readNotification, readAllNotifications };
