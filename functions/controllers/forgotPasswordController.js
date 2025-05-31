const { firestore } = require("firebase-admin");
const { sendVerificationCode } = require("../emailer/emailer");
const { FieldValue, Timestamp } = require("firebase-admin/firestore");
const admin = require('firebase-admin');
const { getUserNameById } = require("../utils/functions");

const db = firestore();

const forgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body;

        const getEmail = await db.collection('users').where('email', '==', email).get();

        if (getEmail.empty) {
            return res.status(400).json({ success: false, message: "Email does not exist" });
        }

        const userDoc = getEmail.docs[0];
        const userId = userDoc.id;

        const now = new Date();
        const todayDateStr = now.toISOString().split('T')[0];

        let attempts = 0;
        let lastAttemptDateStr = todayDateStr;

        if (userDoc.exists) {
            const data = userDoc.data();

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

        

        const userRef = db.collection('users').doc(userId);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const code_expires_at = Timestamp.fromDate(new Date(Date.now() + 3 * 60 * 1000)); 

        await userRef.update({ 
            code,
            code_expires_at,
            attempts: attempts + 1,
            last_attempt_date: Timestamp.fromDate(now),
        }, { merge: true });

        const getUserName = await getUserNameById(userId);

        await sendVerificationCode(email, code, getUserName);

        return res.status(200).json({ success: true, message: "Successfully sent a verification code" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error sending verification" });
    }
};

//=============================================================== S U B M I T   V E R I F I C A T I O N ========================================================================

const submitVerificationCode = async(req, res) => {
    try {
        const { email, code } = req.body;

        const getEmail = await db.collection('users').where('email', '==', email).get();
    
        if (getEmail.empty) {
            return res.status(400).json({ success: false, message: "Email does not exist" });
        }   

        const userDoc = getEmail.docs[0];
        const userData = userDoc.data();
        const getUserId = userData.id;
        const getCode = userData.code;
        const getExpiration = userData.code_expires_at;

        if(getCode !== code){
            return res.status(400).json({ success: false, message: "Wrong verification code" });
        }

        const now = Timestamp.now();
        if(getExpiration && getExpiration.toMillis() < now.toMillis()){
            return res.status(400).json({ success: false, message: "This code has expired" });
        }

        const userRef  = db.collection('users').doc(getUserId);

        await userRef.update({
            code: FieldValue.delete(),
            code_expires_at: FieldValue.delete(),
        });

        return res.status(200).json({ success: true, message: "Success" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "failed" });
    }   
}

//=============================================================== C R E A T E   N E W P A S S ========================================================================

const createNewPassword = async(req, res) => {
    try {
        const { new_password, confirm_password, email } = req.body;

        if(new_password !== confirm_password){
            return res.status(400).json({ success: true, message: "The password is not the same" });
        }

        const getEmail = await db.collection('users').where('email', '==', email).get();

        if (getEmail.empty) {
            return res.status(400).json({ success: false, message: "Email does not exist" });
        }

        const userDoc = getEmail.docs[0];
        const userRef = userDoc.data();
        const uid = userRef.auth_id;
        const userId = userDoc.id;

        if (!uid) {
            return res.status(400).json({ success: false, message: "User UID is missing in database" });
        }

        await admin.auth().updateUser(uid, {
            password: new_password,
        });

        const userReference = db.collection('users').doc(userId);

        await userReference.update({
            attempts: FieldValue.delete(),
            last_attempt_date: FieldValue.delete(),
        });

        return res.status(200).json({ success: true, message: "Successfully change the password" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error not change password" });
    }
}

module.exports = { forgotPasswordController, submitVerificationCode, createNewPassword }