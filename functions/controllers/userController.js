const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const admin = require("firebase-admin");
const { users, activities, notifications, dateToTimeStamp } = require("../utils/utils");
const { sendAdminNotifications, logUserActivity, getUserNameById, getUserRoleById } = require("../utils/functions");
const { sendWelcomeEmail } = require("../emailer/emailer");
// const multer = require('multer');
// const upload = multer({ storage: multer.memoryStorage() });

const db = firestore();

//=============================================================== A D D  U S E R ==========================================================================
const addUser = async (req, res) => {
    try {
        const { currentUserId } = req.params;

        // const blob = bucket.file(`avatar/${Date.now()}_${req.file.originalname}`);
        // const blobStream = blob.createWriteStream({
        //     metadata: {
        //         contentType: req.file.mimetype,
        //         metadata: {
        //             firebaseStorageDownloadTokens: uuidv4(),
        //         }
        //     }
        // });

        // blobStream.on('error', err => {
        //     console.error(err);
        //     return res.status(500).send('Upload error');
        // });

        // // Wait for the upload to finish
        // await new Promise((resolve, reject) => {
        //     blobStream.on('finish', resolve);
        //     blobStream.on('error', reject);
        //     blobStream.end(req.file.buffer);
        // });

        // Get the public URL of the uploaded profile picture
        // const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media&token=${blob.metadata.metadata.firebaseStorageDownloadTokens}`;

        const {
            avatar,
            first_name, 
            last_name, 
            birth_date, 
            email, 
            mobile_number,
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
            team,
            status,
            is_deleted,
            is_verified,
            ...otherData
        } = req.body;

        if (
            !first_name || !last_name || !birth_date || !email || !mobile_number ||
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

        // Check if the email already exists
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

        // Create the new user
        const getUID = await admin.auth().createUser({
            email,
            password,
        });

        const getUserUID = getUID.uid;
        const userRef = db.collection('users').doc(); 
        const userId = userRef.id;

        const userData = {
            // avatar: publicUrl,
            avatar: "",
            id: userId,
            auth_id: getUserUID,
            first_name, 
            last_name, 
            birth_date: birthDateTimestamp, 
            email, 
            mobile_number,
            region, 
            province, 
            municipality, 
            barangay, 
            zip_code,
            role, 
            team: "",
            status: "active",
            is_deleted: false,
            is_verified: false,
            hired_date: hiredDateTimestamp,
            ...otherData,
            created_at: Timestamp.now(),
        };

        await userRef.set(userData);

        const roleCurrentUser = await getUserRoleById(currentUserId); 
        const currentUserName = await getUserNameById(currentUserId);
        

        if(roleCurrentUser == "agent"){
            await sendAdminNotifications(`${currentUserName} added ${first_name} with a role of ${role}`, 'user');
        }

        await logUserActivity(currentUserId, `You added ${first_name} with a role of ${role}`);
        const result = await sendWelcomeEmail(email, `${first_name} ${last_name}`, role, userId);

        return res.status(200).json({
            success: true,
            message: "User added successfully",
            userData,
            result
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
            mobile_number,
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
            updated_at: Timestamp.now(),
            ...otherData,
        };

        const updatableFields = {
            first_name,
            last_name,
            birth_date: birthDateTimestamp,
            mobile_number,
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
        await logUserActivity(currentUserId, `You updated your data`);

        await activityRef.set(activityData);
        return res.status(200).json({ success: true, message: "User updated successfully." });
    } catch (error) {
        console.error("Error updating password:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message,
        });
    }
}

//=============================================================== U P D A T E  P A S S W O R D =========================================================================
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

//=============================================================== G E T =========================================================================
// const getAllUsers = async (req, res) => {
//     try {
//         const userRef = db.collection(users); 
//         const userSnapshot = await userRef.get();
        
//         if (userSnapshot.empty) {
//             return res.status(200).json({
//                 success: true,
//                 message: "No data found.",
//                 data: [],
//             });
//         }

//         const data = [];
//         userSnapshot.forEach(doc => {
//             data.push({ ...doc.data() });
//         });

//         res.status(200).json({ success: true, data });
//     } catch (error) {
//         console.error("Error fetching users:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error.",
//             error: error.message,
//         });
//     }
// };

// const getUser = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const userRef = db.collection(users).doc(id);
//         const doc = await userRef.get(); 

//         if (!doc.exists) {
//             return res
//             .status(403)
//             .send(renderErrorPage(
//                 "404 – Page Not Found",
//                 "The page you’re looking for doesn’t exist.",
//                 "Please check the URL for any mistakes."
//             ));
//         }

//         const userData = doc.data();

//         return res.status(200).json({ success: true, data: userData });
//     } catch (error) {
//         console.error("Error fetching user:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error.",
//             error: error.message,
//         });
//     }
// };

//=============================================================== L O G I N =========================================================================
const loginUser = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ success: false, message: "ID token is required." });
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email } = decodedToken;

        let snapshot = await db.collection("users").where("auth_id", "==", uid).get();

        if (snapshot.empty && email) {
            snapshot = await db.collection("users").where("email", "==", email).get();
        }

        if (snapshot.empty) {
            return res.status(400).json({ success: false, message: "Email already used." });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (userData.status === "inactive") {
            return res.status(400).json({ success: false, message: "User inactive." });
        }

        if(userData.is_deleted === true){
            return res.status(400).json({ success: false, message: "User not found." });
        }

        if (!userData.team || userData.team.trim() === "") {
            return res.status(200).json({
                success: true,
                message: "Login successful",
                user: userData,
            });
        }

        const teamSnapshot = await db.collection("team").doc(userData.team).get();

        if (!teamSnapshot.exists) {
            return res.status(404).json({
                success: false,
                message: "Assigned team not found.",
            });
        }

        const teamData = teamSnapshot.data();
        const teamName = teamData.team_name || null;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                ...userData,
                team_name: teamName,
            },
        });

    } catch (error) {
        console.error("Error verifying ID token:", error);
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            error: error.message,
        });
    }
};



// const getUserData = async (req, res) => {
//     try {
//         res.send("Hello World");
//     } catch (error) {
//         console.log(error);
//     }
// }

// const getUserData = async (req, res) => {
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             return res.status(401).json({ success: false, message: "No token provided" });
//         }

//         const idToken = authHeader.split(' ')[1];
//         const decodedToken = await admin.auth().verifyIdToken(idToken);
//         const { uid } = decodedToken;

//         const snapshot = await db.collection('users').where('uid', '==', uid).get();

//         if (snapshot.empty) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }

//         const userDoc = snapshot.docs[0];
//         const userData = userDoc.data();

//         return res.status(200).json({
//             success: true,
//             user: userData,  
//         });

//     } catch (error) {
//         console.error('Error fetching user data:', error);
//         return res.status(500).json({
//             success: false,
//             message: 'Failed to fetch user data',
//             error: error.message,
//         });
//     }
// }

module.exports = { addUser, updateMyProfile, updatePassword, loginUser };
