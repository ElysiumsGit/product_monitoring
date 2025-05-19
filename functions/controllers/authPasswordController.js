const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const admin = require("firebase-admin");
const { logUserActivity, getUserNameById, getEmailById } = require("../utils/functions");
const { sendVerificationCode } = require("../emailer/emailer");

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

        const { auth_id } = userSnap.data();

        if (!auth_id) {
            return res.status(400).json({
                success: false,
                message: "UID not found in user document.",
            });
        }

        await admin.auth().updateUser(auth_id, {
            password: new_password,
        });

        await logUserActivity({ 
            heading: "Change Password",
            currentUserId: currentUserId, 
            activity: 'You have change the password' 
        });

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

//!=========================================================================================================================================================
const getCode = async (req, res) => {
    try {
        const { currentUserId } = req.body;

        if (!currentUserId) {
            return res.status(400).json({ status: false, message: "User ID is required" });
        }

        const userRef = db.collection('users').doc(currentUserId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        const code = Math.floor(100000 + Math.random() * 900000);
        const code_expires_at = Timestamp.fromDate(new Date(Date.now() + 3 * 60 * 1000));

        await userRef.update({
            code,
            code_expires_at,
            attempts: 1,
        });

        const email = await getEmailById(currentUserId);
        const getUserName = await getUserNameById(currentUserId);
        await sendVerificationCode(email, code, getUserName);

        return res.status(200).json({ status: true, message: "Successfully sent a verification code" });
    } catch (error) {
        console.error('getCode error:', error);
        return res.status(500).json({ status: false, message: "Error sending verification" });
    }
};
const resendCode = async (req, res) => {
    try {
        const { currentUserId } = req.body;

        if (!currentUserId) {
            return res.status(400).json({ status: false, message: "User ID is required" });
        }

        const userRef = db.collection('users').doc(currentUserId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        const userData = userDoc.data();

        if (userData.attempts > 5) {
            return res.status(429).json({ status: false, message: "Maximum Attempts Reached" });
        }

        const code = Math.floor(100000 + Math.random() * 900000);
        const code_expires_at = Timestamp.fromDate(new Date(Date.now() + 3 * 60 * 1000));

        await userRef.update({
            code,
            code_expires_at,
            attempts: FieldValue.increment(1),
        });

        const email = await getEmailById(currentUserId);
        const getUserName = await getUserNameById(currentUserId);
        await sendVerificationCode(email, code, getUserName);

        return res.status(200).json({ status: true, message: "Successfully sent a verification code" });

    } catch (error) {
        console.error('resendCode error:', error);
        return res.status(500).json({ status: false, message: "Error sending verification" });
    }
};
// const getCode = async (req, res) => {
//     try {
//         const { currentUserId } = req.body;

//         const getId = await db.collection('users').where('id', '==', currentUserId).get();

//         if (getId.empty) {
//             return res.status(400).json({ status: false, message: "Email does not exist" });
//         }

//         const userDoc = getId.docs[0];
//         const userRef = db.collection('users').doc(currentUserId);
//         const userData = userDoc.data();

//         const now = new Date();
//         const phTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
//         phTime.setHours(0, 0, 0, 0); 

//         const lastRequestDate = userData.last_code_request_date?.toDate() || null;
//         let requestAttempts = userData.code_request_attempts || 0;

//         if (!lastRequestDate || lastRequestDate.getTime() !== phTime.getTime()) {
//             requestAttempts = 0;
//         }

//         if (requestAttempts >= 5) {
//             return res.status(429).json({ status: false, message: "Maximum verification requests reached for today (PH time)" });
//         }

//         const code = Math.floor(100000 + Math.random() * 900000);
//         const code_expires_at = Timestamp.fromDate(new Date(Date.now() + 3 * 60 * 1000)); // 3 minutes

//         await userRef.update({
//             code,
//             code_expires_at,
//             code_request_attempts: requestAttempts + 1,
//             last_code_request_date: Timestamp.fromDate(phTime),
//         });

//         const email = await getEmailById(userId);
//         const getUserName = await getUserNameById(userId);
//         await sendVerificationCode(email, code, getUserName);

//         return res.status(200).json({ status: true, message: "Successfully sent a verification code" });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ status: false, message: "Error sending verification" });
//     }
// };

//!=========================================================================================================================================================

const submitCode = async (req, res) => {
    try {
        const {currentUserId} = req.params;

        const { code } = req.body;

        const getId = await db.collection('users').where('id', '==', currentUserId).get();
    
        if (getId.empty) {
            return res.status(400).json({ status: false, message: "Email does not exist" });
        }   

        const userDoc = getId.docs[0];
        const userData = userDoc.data();
        const getUserId = userData.id;
        const getCode = userData.code;
        const getExpiration = userData.code_expires_at;

        if(getCode !== code){
            return res.status(400).json({ status: false, message: "Wrong verification code" });
        }

        const now = Timestamp.now();
        if(getExpiration && getExpiration.toMillis() < now.toMillis()){
            return res.status(400).json({ status: false, message: "This code has expired" });
        }

        const userRef  = db.collection('users').doc(getUserId);

        await userRef.update({
            code: FieldValue.delete(),
            code_expires_at: FieldValue.delete(),
            code_request_attempts,
            last_code_request_date,
        });

        return res.status(200).json({ status: true, message: "Success" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "failed" });
        
    }   
}

module.exports  = { updatePassword, getCode, submitCode }