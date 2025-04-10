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

        await admin.auth().createUser({
            email,
            password,
        });

        const userId = userRef.id;

        const userData = {
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
            ...otherData
        } = req.body;

        const userRef = db.collection(collection.collections.usersCollections).doc(id);
        const userDoc = await userRef.get();

        let birthDateTimestamp;
        try {
            birthDateTimestamp = Timestamp.fromDate(new Date(birth_date));
        } catch (error) {
            return res.status(400).json({ success: false, message: "Invalid birth_date format." });
        }

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        let updatedData = {};

        if (email) {
            const emailCheck = await db.collection(collection.collections.usersCollections).where("email", "==", email).get();
            if (!emailCheck.empty && emailCheck.docs[0].id !== id) {
                return res.status(400).json({ success: false, message: "Email is already in use." });
            }
            updatedData.email = email;
        }

        if (password || confirm_password) {
            if (password !== confirm_password) {
                return res.status(400).json({ success: false, message: "Passwords do not match." });
            }

            await admin.auth().updateUser(id, {
                password
            });
        }

        const allowedFields = { 
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
            ...otherData,
            updatedAt: Timestamp.now(),
        };
        Object.keys(allowedFields).forEach(key => {
            if (allowedFields[key] !== undefined) {
                updatedData[key] = allowedFields[key];
            }
        });

        await userRef.update(updatedData);

        return res.status(200).json({ success: true, message: "User updated successfully." });

    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ success: false, message: "Failed to update user", error: error.message });
    }
};
//=============================================================== L O G I N =========================================================================
const SECRET_KEY = "praetorian";
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }

        const userSnapshot = await db.collection(collection.collections.usersCollections).where("email", "==", email).get();
        if (userSnapshot.empty) {
            return res.status(400).json({ success: false, message: "Invalid email ssword." });
        }

        const userData = userSnapshot.docs[0].data();
        
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid emssssail ssword." });
        } 

        const token = jwt.sign(
            { id: userData.id, email: userData.email, role: userData.role },
            SECRET_KEY,
            { expiresIn: "2h" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: { id: userData.id, email: userData.email, role: userData.role }
        });

    } catch (error) {
        console.error("Error logging in:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to login",
            error: error.message,
        });
    }
};

module.exports = { addUser, updateUser, loginUser };
