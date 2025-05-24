const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const admin = require("firebase-admin");
const { users, activities, notifications, dateToTimeStamp } = require("../utils/utils");
const { sendAdminNotifications, logUserActivity, getUserNameById, getUserRoleById, capitalizeFirstLetter, incrementNotification } = require("../utils/functions");
const { sendWelcomeEmail, sendVerificationCode } = require("../emailer/emailer");
// const multer = require('multer');
// const upload = multer({ storage: multer.memoryStorage() });

const db = firestore();

//!=============================================================== A D D  U S E R ==========================================================================

const addUser = async (req, res) => {
    try {
        const { currentUserId } = req.params;

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
            hired_date,
            team,
            status,
            is_deleted,
            is_verified,
            gender,
            address1,
            address2,
            nationality,
            push_notification, 
            ...otherData
        } = req.body;

        if (
            !first_name || !last_name || !birth_date || !email || !mobile_number ||
            !region || !province || !municipality || !barangay || !zip_code ||
            !role || !password || !confirm_password || !gender || !nationality || !address1
        ) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }

        const hiredDateTimestamp = dateToTimeStamp(hired_date);
        const birthDateTimestamp = dateToTimeStamp(birth_date);

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
            avatar: "",
            id: userId,
            auth_id: getUserUID,
            first_name: first_name.toLowerCase(), 
            last_name: last_name.toLowerCase(), 
            birth_date: birthDateTimestamp, 
            email: email.toLowerCase(), 
            mobile_number,
            region: region.toLowerCase(), 
            province :province.toLowerCase(), 
            municipality: municipality.toLowerCase(), 
            barangay: barangay.toLowerCase(), 
            zip_code,
            role: role.toLowerCase(), 
            team: "",
            status: "active",
            is_deleted: false,
            is_verified: false,
            hired_date: hiredDateTimestamp,
            gender: gender.toLowerCase(),
            address1: address1.toLowerCase(),
            address2: address2.toLowerCase(),
            nationality: nationality.toLowerCase(),
            push_notification: false,
            ...otherData,
            created_at: Timestamp.now(),
        };

        await userRef.set(userData);

        await userRef.update({
            search_tags: [
                ...first_name.toLowerCase().trim().split(/\s+/), 
                ...last_name.toLowerCase().trim().split(/\s+/), 
                email.toLowerCase().trim().split(/\s+/), 
                mobile_number,
                ...region.toLowerCase().trim().split(/\s+/), 
                ...province.toLowerCase().trim().split(/\s+/),
                ...municipality.toLowerCase().trim().split(/\s+/), 
                ...barangay.toLowerCase().trim().split(/\s+/), 
                zip_code,
                role,
                gender,  
                ...address1.toLowerCase().trim().split(/\s+/), 
                ...address2.toLowerCase().trim().split(/\s+/), 
                ...nationality.toLowerCase().trim().split(/\s+/), 
            ].flat().filter(Boolean) 
        });

        const roleCurrentUser = await getUserRoleById(currentUserId); 
        const currentUserName = await getUserNameById(currentUserId);

        if(roleCurrentUser == "agent"){
            await sendAdminNotifications({
                fcmMessage: `${capitalizeFirstLetter(currentUserName)} created an account named ${capitalizeFirstLetter(first_name)}`,
                message: `${capitalizeFirstLetter(currentUserName)} created an account for ${capitalizeFirstLetter(first_name)} with the role of ${capitalizeFirstLetter(role)}`,
                type: 'user'
            })
        };

        await logUserActivity({ 
            heading: "account",
            currentUserId: currentUserId, 
            activity: 'new account has been created' 
        });

        const counterRef = db.collection('users').doc(userId).collection('counter').doc('counter_id');

        await counterRef.set({
            notifications: 0,
            activities: 0,
            attempts: 0,
        });

        const result = await sendWelcomeEmail(email, first_name, role, userId);

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

//!=============================================================== U P D A T E  U S E R =========================================================================

const updateMyProfile = async (req, res) => {
    try {
        const { currentUserId } = req.params;
        const updates = req.body;

        if (!currentUserId) {
            return res.status(400).json({ success: false, message: "User ID is required." });
        }

        const userRef = db.collection("users").doc(currentUserId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const { email, password } = updates;

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
        await admin.auth().createUser({
            email,
            password,
        });

        const allowedFields = [
            "avatar", "first_name", "last_name", "birth_date", "email", "mobile_number",
            "region", "province", "municipality", "barangay", "zip_code", "role",
            "password", "confirm_password", "hired_date", "team", "status",
            "is_deleted", "is_verified", "gender", "address1", "address2",
            "nationality", "push_notification", "on_duty"
        ];

        const updatedData = {};
        let hasOtherChanges = false;

        for (const key of Object.keys(updates)) {
            if (!allowedFields.includes(key)) {
                return res.status(400).json({ success: false, message: `Updating "${key}" is not allowed.` });
            }

            let value = updates[key];

            if (typeof value === "string" && key !== "email") value = value.toLowerCase();
            if (key === "birth_date") value = dateToTimeStamp(value);
            if (key === "hired_date") value = dateToTimeStamp(value);

            const oldValue = userDoc.data()[key];
            if (value !== undefined && value !== oldValue) {
                updatedData[key] = value;
                if (key !== "push_notification" && key !== "on_duty") {
                    hasOtherChanges = true;
                }
            }
        }

        if (Object.keys(updatedData).length === 0) {
            return res.status(200).json({ success: true, message: "No changes detected." });
        }

        await userRef.update(updatedData);

        const identityFields = [
            "first_name", "last_name", "email", "mobile_number", "region",
            "province", "municipality", "barangay", "zip_code", "role",
            "gender", "address1", "address2", "nationality"
        ];

        const shouldUpdateTags = identityFields.some(field => updatedData.hasOwnProperty(field));

        if (shouldUpdateTags) {
            const user = { ...userDoc.data(), ...updatedData };

            const rawTags = [
                user.first_name,
                user.last_name,
                user.email,
                user.mobile_number,
                user.region,
                user.province,
                user.municipality,
                user.barangay,
                user.zip_code,
                user.role,
                user.gender,
                user.address1,
                user.address2,
                user.nationality
            ];

            const processedTags = rawTags
                .map(val => typeof val === 'string' ? val.toLowerCase().trim().split(/\s+/) : [val])
                .flat().filter(Boolean);

            await userRef.update({
                search_tags: processedTags
            });
        }

        if (hasOtherChanges) {
            await logUserActivity({
                heading: "update User",
                currentUserId,
                activity: "You have successfully updated a user."
            });
        } else if (Object.keys(updatedData).length === 1 && updatedData.hasOwnProperty("push_notification")) {
            return res.status(200).json({ success: true, message: "Push notification updated successfully." });
        } else if (Object.keys(updatedData).length === 1 && updatedData.hasOwnProperty("on_duty")) {
            return res.status(200).json({ success: true, message: "User successfully chose attendance." });
        } else {
            await logUserActivity({
                heading: "account",
                currentUserId,
                activity: "Account has been updated."
            });
        }

        return res.status(200).json({ success: true, message: "User updated successfully." });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
            error: error.message
        });
    }
};

//!=============================================================== L O G I N =========================================================================

const loginUser = async (req, res) => {
    try {
        const { idToken, fcmToken } = req.body;

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

        const getId = userData.id;

        const userRef = db.collection('users').doc(getId)

        if (!userData.team || userData.team.trim() === "") {
            await logUserActivity({ 
                heading: "sign in",
                currentUserId: getId, 
                activity: 'account signed in successfully' 
            });

            await userRef.update({
                fcm_token: fcmToken,
            });

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

        // const currentTime = Timestamp.now();
        // const dateObj = currentTime.toDate();

        // const formattedTime = dateObj.toLocaleString('en-US', {
        //     year: 'numeric',
        //     month: 'long',
        //     day: 'numeric',
        //     hour: 'numeric',
        //     minute: '2-digit',
        //     hour12: true,
        // });

        await logUserActivity({ 
            heading: "signed In",
            currentUserId: getId, 
            activity: 'account signed in successfully' 
        });

        await userRef.update({
           fcm_token: fcmToken,
        });

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

        const isNetworkError = [
            'ECONNRESET',
            'ENOTFOUND',
            'ETIMEDOUT',
            'EAI_AGAIN',
            'UNAVAILABLE'
        ].includes(error.code);

        if (isNetworkError) {
            return res.status(503).json({
                success: false,
                message: "Service unavailable. Please check your internet connection and try again.",
                error: error.message,
            });
        }

        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            error: error.message,
        });
    }
};

//!=============================================================== L O G I N =========================================================================

const userAttendance = async(req, res) => {
    try {
        const { currentUserId } = req.params;
        const { on_duty } = req.body;

        if (typeof on_duty !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Invalid input. `currentUserId` and `on_duty` (boolean) are required.',
            });
        }

        const now = new Date();

        const phTime = new Date(
            now.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
        );

        const phHour = phTime.getHours();
        const phMinute = phTime.getMinutes();

        if (phHour < 8) {
            return res.status(400).json({
                success: false,
                message: 'Too early to attendance',
            });
        }

        if (phHour > 11 || (phHour === 11 && phMinute > 0)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot attendance you are late',
            });
        }

        const attendanceRef = db.collection('attendance').doc();
        const attendanceData = {
            id: currentUserId,
            on_duty,
            created_at: Timestamp.now()
        }

        await attendanceRef.set(attendanceData);

        return res.status(200).json({
            success: true,
            message: "Attendance success"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Attendance failed',
        });
    }
}

module.exports = { addUser, updateMyProfile, loginUser, userAttendance };