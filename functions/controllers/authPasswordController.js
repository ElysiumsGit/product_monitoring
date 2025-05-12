const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const admin = require("firebase-admin");
const { sendAdminNotifications, logUserActivity, getUserNameById, getUserRoleById } = require("../utils/functions");

const db = firestore();

const updatePassword = async (req, res) => {
    try {
        const { currentUserId } = req.params;
        const { new_password, confirm_new_password } = req.body;

        if (!new_password || !confirm_new_password) {
            return res.status(400).json({
                success: false,
                message: "All password fields are required.",
            });
        }

        if (new_password !== confirm_new_password) {
            return res.status(400).json({
                success: false,
                message: "New passwords do not match.",
            });
        }

        const userRef = db.collection('users').doc(currentUserId);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const { uid } = userSnap.data();

        if (!uid) {
            return res.status(400).json({
                success: false,
                message: "UID not found in user document.",
            });
        }

        await admin.auth().updateUser(uid, {
            password: new_password,
        });

        await logUserActivity(currentUserId, `You have successfully change your password`)

        return res.status(200).json({
            success: true,
            message: "Password updated successfully.",
        });
    } catch (error) {
        console.error("Error updating password:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
};

module.exports  = { updatePassword }