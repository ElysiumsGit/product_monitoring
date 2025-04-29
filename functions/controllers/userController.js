const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const bcrypt = require("bcryptjs");
const admin = require("firebase-admin");
const { get } = require("../routes/userRoute");
const { users, activities, notifications, dateToTimeStamp } = require("../utils/utils");

const db = firestore();

//=============================================================== A D D  U S E R ==========================================================================
const addUser = async (req, res) => {
    try {
        
        const { currentUserId } = req.params;

        const {
            first_name, 
            last_name, 
            birth_date, 
            email, 
            phone_number,
            region, 
            province, 
            municipality, 
            barangay, 
            zip_code,
            role, 
            password, 
            confirm_password, 
            uid,
            hired_date,
            collectionName,
            ...otherData
        } = req.body;

        if (
            !first_name || !last_name || !birth_date || !email || !phone_number ||
            !region || !province || !municipality || !barangay || !zip_code ||
            !role || !password || !confirm_password
        ) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }

        const hiredDateTimestamp = dateToTimeStamp(hired_date);
        const birthDateTimestamp = dateToTimeStamp(birth_date);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userRef = db.collection(users).doc();

        let emailExists = false;
        try {
            await admin.auth().getUserByEmail(email);
            emailExists = true;
        } catch (error) {
            if (error.code !== 'auth/user-not-found') {
                console.error(error);
                return res.status(500).json({ success: false, message: error.message });
            }
        }
    
        if (emailExists) {
            return res.status(400).json({ success: false, message: "Email already exists." });
        }
        else{
            await admin.auth().createUser({
                email,
                password,
            });
        }
            
        const getUserId = userRef.id;

        const userData = {
            id: getUserId,
            first_name, 
            last_name, 
            birth_date: birthDateTimestamp, 
            email, 
            phone_number,
            region, 
            province, 
            municipality, 
            barangay, 
            zip_code,
            role, 
            hired_date: hiredDateTimestamp,
            password: hashedPassword,
            ...otherData,
            createdAt: Timestamp.now(),
        };

        await userRef.set(userData);

        const activityRef = db.collection(users).doc(currentUserId).collection(activities).doc();

        const activityData = {
            title: `You have successfully added ${first_name} with a role of ${role}`,
            createdAt: Timestamp.now(),
        }

        await activityRef.set(activityData);

        const adminUsersSnapshot = await db
            .collection(users)
            .where("role", "==", "admin")
            .get();

        const notificationPromises = [];

        adminUsersSnapshot.forEach((adminDoc) => {
            const adminId = adminDoc.id;

            const notificationRef = db
                .collection(users)
                .doc(adminId)
                .collection(notifications)
                .doc();

            const notificationData = {
                id: notificationRef.id,
                message: `${first_name} has been added to users with a role of ${role}`,
                createdAt: Timestamp.now(),
                isRead: false,
                type: "users",
            };

            notificationPromises.push(notificationRef.set(notificationData));
        });

        return res.status(200).json({
            success: true,
            message: "User added successfully",
        });

    } catch (error) {
        console.error("Error adding user:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add user",
            error: error.message,
        });
    }
};

//=============================================================== U P D A T E  U S E R =========================================================================

const updateMyProfile = async(req, res) => {
    try {
        const { currentUserId } = req.params;
        const {
            first_name,
            last_name,
            birth_date,
            phone_number,
            street,
            region,
            province,
            municipality,
            barangay,
            zip_code,
            ...otherData
        } = req.body;

        const userRef = db.collection(users).doc(currentUserId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: "Need current User Id." });
        }

        const birthDateTimestamp = dateToTimeStamp(birth_date);

        const updatedData = {
            updatedAt: Timestamp.now(),
            ...otherData,
        };

        const updatableFields = {
            first_name,
            last_name,
            birth_date: birthDateTimestamp,
            phone_number,
            street,
            region,
            province,
            municipality,
            barangay,
            zip_code,
            ...otherData
        };

        for (const key in updatableFields) {
            if (updatableFields[key] !== undefined) {
                updatedData[key] = updatableFields[key];
            }
        }

        await userRef.update(updatedData);

        const activityRef = db.collection(users).doc(currentUserId).collection(activities).doc();

        const activityData = {
            title: `You have been updated your data`,
            createdAt: Timestamp.now(),
        }

        await activityRef.set(activityData);
        return res.status(200).json({ success: true, message: "User updated successfully." });
    } catch (error) {
        
    }
}
// //=============================================================== U P D A T E  P A S S W O R D =========================================================================

// const updatePassword = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { old_password, new_password, confirm_new_password } = req.body;

//         // Validate fields 
//         if (!old_password || !new_password || !confirm_new_password) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All password fields are required.",
//             });
//         }

//         // Fetch user doc
//         const userRef = db.collection(collection.collections.usersCollections).doc(id);
//         const userSnap = await userRef.get();

//         if (!userSnap.exists) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found.",
//             });
//         }

//         const userData = userSnap.data();
//         const hashedOldPassword = userData.password;
//         const uid = userData.uid;

//         // Compare old password
//         const isMatch = await bcrypt.compare(old_password, hashedOldPassword);
//         if (!isMatch) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Old password is incorrect.",
//             });
//         }

//         // Confirm passwords match
//         if (new_password !== confirm_new_password) {
//             return res.status(400).json({
//                 success: false,
//                 message: "New passwords do not match.",
//             });
//         }

//         // Update Firebase Auth password if UID is available
//         if (uid) {
//             await admin.auth().updateUser(uid, {
//                 password: new_password,
//             });
//         }

//         // Hash new password and update Firestore
//         const salt = await bcrypt.genSalt(10);
//         const hashedNewPassword = await bcrypt.hash(new_password, salt);

//         await userRef.update({
//             password: hashedNewPassword,
//         });

//         const activityRef = db.collection(collection.collections.usersCollections).doc(id).collection(collection.subCollections.activities).doc();

//         const activityData = {
//             title: `You have successfully change your password`,
//             createdAt: Timestamp.now(),
//         }

//         await activityRef.set(activityData);

//         return res.status(200).json({
//             success: true,
//             message: "Password updated successfully.",
//         });
//     } catch (error) {
//         console.error("Error updating password:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error.",
//             error: error.message,
//         });
//     }
// };

//=============================================================== L O G I N =========================================================================
// const SECRET_KEY = "praetorian";
// const loginUser = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             return res.status(400).json({ success: false, message: "Email and password are required." });
//         }

//         const userSnapshot = await db.collection(collection.collections.usersCollections).where("email", "==", email).get();
//         if (userSnapshot.empty) {
//             return res.status(400).json({ success: false, message: "Invalid email ssword." });
//         }

//         const userData = userSnapshot.docs[0].data();
        
//         const isMatch = await bcrypt.compare(password, userData.password);
//         if (!isMatch) {
//             return res.status(400).json({ success: false, message: "Invalid emssssail ssword." });
//         } 

//         const token = jwt.sign(
//             { id: userData.id, email: userData.email, role: userData.role },
//             SECRET_KEY,
//             { expiresIn: "2h" }
//         );

//         return res.status(200).json({
//             success: true,
//             message: "Login successful",
//             token,
//             user: { id: userData.id, email: userData.email, role: userData.role }
//         });

//     } catch (error) {
//         console.error("Error logging in:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to login",
//             error: error.message,
//         });
//     }
// };

// const loginUser = async (req, res) => {
//     try {
//         const { idToken } = req.body;

//         if (!idToken) {
//             return res.status(400).json({ success: false, message: "ID token is required." });
//         }

//         const decodedToken = await admin.auth().verifyIdToken(idToken);
//         const { uid, email } = decodedToken;

//         const snapshot = await db.collection("users").where("uid", "==", uid).get();

//         if (snapshot.empty) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }

//         const userDoc = snapshot.docs[0];
//         const userData = userDoc.data();

//         return res.status(200).json({
//             success: true,
//             message: "Login successful",
//             user: {
//                 email,
//                 role: userData.role || null,
//                 id: userData.id,
//             },
//         });

//     } catch (error) {
//         console.error("Error verifying ID token:", error);
//         return res.status(401).json({
//             success: false,
//             message: "Unauthorized",
//             error: error.message,
//         });
//     }
// };


module.exports = { addUser, updateMyProfile };
