const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const collection = require("../utils/utils")

const db = firestore();

//=============================================================== A D D  U S E R ==========================================================================
const addUser = async (req, res) => {
    try {
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

        let birthDateTimestamp;
        try {
            birthDateTimestamp = Timestamp.fromDate(new Date(birth_date));
        } catch (error) {
            return res.status(400).json({ success: false, message: "Invalid birth_date format." });
        }

        const emailCheck = await db.collection(collection.collections.usersCollections).where("email", "==", email).get();
        if (!emailCheck.empty) {
            return res.status(400).json({ success: false, message: "Email is already in use." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userRef = db.collection(collection.collections.usersCollections).doc();

        const authUser = await admin.auth().createUser({
            email,
            password,
        });

        const authUID = authUser.uid;
        const userId = userRef.id;

        const userData = {
            uid: authUID,
            id: userId,
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
            password: hashedPassword,
            ...otherData,
            createdAt: Timestamp.now(),
        };

        await userRef.set(userData);

        return res.status(200).json({
            success: true,
            message: "User added successfully",
            data: { id: userId },
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
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
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
            hired_date,
            ...otherData
        } = req.body;

        const userRef = db.collection(collection.collections.usersCollections).doc(id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const userData = userDoc.data();
        const uid = userData && userData.uid;

        // Parse birth_date if present
        let birthDateTimestamp;
        let hiredDateTimestamp;
        if (birth_date !== undefined || hired_date !== undefined) {
            try {
                birthDateTimestamp = Timestamp.fromDate(new Date(birth_date));
                hiredDateTimestamp = Timestamp.fromDate(new Date(hired_date));
            } catch (error) {
                return res.status(400).json({ success: false, message: "Invalid birth_date format." });
            }
        }

        const updatedData = {
            updatedAt: Timestamp.now(),
            ...otherData,
        };

        const updatableFields = {
            first_name,
            last_name,
            birth_date: birthDateTimestamp,
            phone_number,
            region,
            province,
            municipality,
            barangay,
            zip_code,
            role,
            hired_date: hiredDateTimestamp,
        };

        for (const key in updatableFields) {
            if (updatableFields[key] !== undefined) {
                updatedData[key] = updatableFields[key];
            }
        }

        // Email update logic
        if (email !== undefined) {
            const emailCheck = await db
                .collection(collection.collections.usersCollections)
                .where("email", "==", email)
                .get();

            const isUsedByAnother = !emailCheck.empty && emailCheck.docs.some(doc => doc.id !== id);
            if (isUsedByAnother) {
                return res.status(400).json({ success: false, message: "Email is already in use." });
            }

            if (uid) {
                await admin.auth().updateUser(uid, { email });
            }

            updatedData.email = email;
        }

        // Password update logic
        if (password !== undefined || confirm_password !== undefined) {
            if (password !== confirm_password) {
                return res.status(400).json({ success: false, message: "Passwords do not match." });
            }

            if (uid) {
                await admin.auth().updateUser(uid, { password });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updatedData.password = hashedPassword;
        }

        await userRef.update(updatedData);

        return res.status(200).json({ success: true, message: "User updated successfully." });

    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update user",
            error: error.message,
        });
    }
};
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

const loginUser = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ success: false, message: "ID token is required." });
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email } = decodedToken;

        const snapshot = await db.collection("users").where("uid", "==", uid).get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                ...userData,
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


module.exports = { addUser, updateUser, loginUser };
