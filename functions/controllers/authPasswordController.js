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
        const { currentUserId } = req.params;

        if (!currentUserId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const counterRef = db.collection('users').doc(currentUserId).collection('counter').doc('counter_id');
        const counterDoc = await counterRef.get();

        const now = new Date();
        const todayDateStr = now.toISOString().split('T')[0];

        let attempts = 0;
        let lastAttemptDateStr = todayDateStr;

        if (counterDoc.exists) {
            const data = counterDoc.data();

            if (data.last_attempt_date) {
                lastAttemptDateStr = data.last_attempt_date.toDate().toISOString().split('T')[0];
            }

            if (lastAttemptDateStr === todayDateStr) {
                attempts = data.attempts || 0;
                if (attempts >= 5) {
                    return res.status(400).json({ success: false, message: "Maximum attempts reached for today" });
                }
            } else {
                attempts = 0; 
            }
        }

        const code = Math.floor(1000 + Math.random() * 9000);
        const code_expires_at = Timestamp.fromDate(new Date(now.getTime() + 3 * 60 * 1000)); // 3 minutes

        await counterRef.set({
            code,
            code_expires_at,
            attempts: attempts + 1,
            last_attempt_date: Timestamp.fromDate(now),
        }, { merge: true });

        const email = await getEmailById(currentUserId);
        const getUserName = await getUserNameById(currentUserId);
        await sendVerificationCode(email, code, getUserName);

        return res.status(200).json({ success: true, message: "Successfully sent a verification code" });
    } catch (error) {
        console.error('getCode error:', error);
        return res.status(500).json({ success: false, message: "Error sending verification" });
    }
};

//!=========================================================================================================================================================

const submitCode = async (req, res) => {
    try {
        const { currentUserId } = req.params;
        const { code } = req.body;

        if (!currentUserId || !code) {
            return res.status(400).json({ success: false, message: "User ID and code are required" });
        }

        const userDoc = await db.collection('users').doc(currentUserId).collection('counter').doc('counter_id') .get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: "Counter data not found" });
        }

        const userData = userDoc.data();
        const getExpiration = userData.code_expires_at;
        const storedCode = userData.code;

        if (storedCode !== code) {
            return res.status(400).json({ success: false, message: "Wrong verification code" });
        }

        const now = Timestamp.now();
        if (getExpiration && getExpiration.toMillis() < now.toMillis()) {
            return res.status(400).json({ success: false, message: "This code has expired" });
        }

        return res.status(200).json({ success: true, message: "Success" });

    } catch (error) {
        console.error("submitCode error:", error);
        return res.status(500).json({ success: false, message: "Failed to verify code" });
    }
};


// const submitCode = async (req, res) => {
//     try {
//         const {currentUserId} = req.params;

//         const { code } = req.body;

//         const getId = await db.collection('users').where('id', '==', currentUserId).get();
    
//         if (getId.empty) {
//             return res.status(400).json({ status: false, message: "Email does not exist" });
//         }   

//         const userDoc = getId.docs[0];
//         const userData = userDoc.data();
//         const getUserId = userData.id;
//         const getCode = userData.code;
//         const getExpiration = userData.code_expires_at;

//         if(getCode !== code){
//             return res.status(400).json({ status: false, message: "Wrong verification code" });
//         }

//         const now = Timestamp.now();
//         if(getExpiration && getExpiration.toMillis() < now.toMillis()){
//             return res.status(400).json({ status: false, message: "This code has expired" });
//         }

//         const userRef  = db.collection('users').doc(getUserId);

//         await userRef.update({
//             code: FieldValue.delete(),
//             code_expires_at: FieldValue.delete(),
//             code_request_attempts,
//             last_code_request_date,
//         });

//         return res.status(200).json({ status: true, message: "Success" });
//     } catch (error) {
//         return res.status(500).json({ status: false, message: "failed" });
        
//     }   
// }

module.exports  = { updatePassword, getCode, submitCode }