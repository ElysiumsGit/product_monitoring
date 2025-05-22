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
            return res.status(400).json({ status: false, message: "Email does not exist" });
        }

        const userDoc = getEmail.docs[0];
        const userId = userDoc.id;

        const userRef = db.collection('users').doc(userId);
        const code = Math.floor(1000 + Math.random() * 9000);
        const code_expires_at = Timestamp.fromDate(new Date(Date.now() + 3 * 60 * 1000)); 

        await userRef.update({ 
            code,
            code_expires_at,
        });

        const getUserName = await getUserNameById(userId);

        await sendVerificationCode(email, code, getUserName);

        return res.status(200).json({ status: true, message: "Successfully sent a verification code" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: "Error sending verification" });
    }
};

//=============================================================== S U B M I T   V E R I F I C A T I O N ========================================================================

const submitVerificationCode = async(req, res) => {
    try {
        const { email, code } = req.body;

        const getEmail = await db.collection('users').where('email', '==', email).get();
    
        if (getEmail.empty) {
            return res.status(400).json({ status: false, message: "Email does not exist" });
        }   

        const userDoc = getEmail.docs[0];
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
        });

        return res.status(200).json({ status: true, message: "Success" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "failed" });
        
    }   
}

//=============================================================== C R E A T E   N E W P A S S ========================================================================

const createNewPassword = async(req, res) => {
    try {
        const { new_password, confirm_password, email } = req.body;

        if(new_password !== confirm_password){
            return res.status(400).json({ status: true, message: "The password is not the same" });
        }

        const getEmail = await db.collection('users').where('email', '==', email).get();

        if (getEmail.empty) {
            return res.status(400).json({ status: false, message: "Email does not exist" });
        }

        const userDoc = getEmail.docs[0];
        const userRef = userDoc.data();
        const uid = userRef.auth_id;

        if (!uid) {
            return res.status(400).json({ status: false, message: "User UID is missing in database" });
        }

        await admin.auth().updateUser(uid, {
            password: new_password,
        });

        return res.status(400).json({ status: true, message: "Successfully change the password" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Server error not change password" });
    }
}

module.exports = { forgotPasswordController, submitVerificationCode, createNewPassword }