const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const { getUserNameById, capitalizeFirstLetter, sendAdminNotifications, logUserActivity } = require("../utils/functions");

const db = firestore();

const setStatus = async(req, res) => {
    try {
        const { currentUserId, targetId } = req.params;
        const { status } = req.body;
        const userRef = db.collection('users').doc(targetId);

        await userRef.update({
            status: status,
        });

        const currentUserName = await getUserNameById(currentUserId);
        const updateUserName = await getUserNameById(targetId);

        await sendAdminNotifications({
            heading: "Status has updated",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} updated the status of ${capitalizeFirstLetter(updateUserName)}`,
            title: `${capitalizeFirstLetter(currentUserName)} updated an status`,
            message: `${capitalizeFirstLetter(currentUserName)} just updated a status for ${capitalizeFirstLetter(updateUserName)}`,
            type: 'user'
        });

        await logUserActivity({
            heading: "account",
            currentUserId,
            activity: "Account status has been updated."
        });
        
     return res.status(200).json({
            success: true,
            message: "Success status updated",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update status",
            error: error.message,
        });
    }
}

module.exports = { setStatus }