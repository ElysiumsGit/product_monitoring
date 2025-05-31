const { firestore } = require("firebase-admin");
const { Timestamp, FieldValue } = require("firebase-admin/firestore");
const admin = require("firebase-admin");
const { users, activities, notifications, dateToTimeStamp } = require("../utils/utils");
const { sendAdminNotifications, logUserActivity, getUserNameById, getUserRoleById, capitalizeFirstLetter, incrementNotification, safeSplit, getGender } = require("../utils/functions");
const { sendWelcomeEmail, sendVerificationCode } = require("../emailer/emailer");

const db = firestore();
const zeroTimestamp = Timestamp.fromMillis(0);

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
            city, 
            barangay, 
            zip_code,
            role, 
            manage_store,
            manage_account,
            manage_product,
            password, 
            confirm_password, 
            team,
            status,
            is_deleted,
            is_verified,
            gender,
            address1,
            address2,
            nationality,
            push_notification, 
            attendance,
            last_signed_in,
            ...otherData
        } = req.body;

        if (
            !first_name || !last_name || !birth_date || !email || !mobile_number ||
            !region || !province || !city || !barangay ||
            !role || !password || !confirm_password || !gender || !nationality || !address1
        ) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }

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
            city: city.toLowerCase(), 
            barangay: barangay.toLowerCase(), 
            zip_code,
            role: role.toLowerCase(), 
            manage_store,
            manage_account,
            manage_product,
            team: "",
            status: "inactive",
            is_deleted: false,
            is_verified: false,
            gender: gender.toLowerCase(),
            address1: address1.toLowerCase(),
            address2: address2.toLowerCase(),
            nationality: nationality.toLowerCase(),
            push_notification: false,
            attendance: "",
            attendance_date: Timestamp.now(),
            last_signed_in: zeroTimestamp,
            ...otherData,
            created_at: Timestamp.now(),
        };

        await userRef.set(userData);

        await userRef.update({
            search_tags: [
                ...safeSplit(first_name.toLowerCase()),
                ...safeSplit(last_name.toLowerCase()), 
                email.toLowerCase().trim().split(/\s+/), 
                mobile_number,
                ...safeSplit(region.toLowerCase()), 
                ...safeSplit(province.toLowerCase()),
                ...safeSplit(city.toLowerCase()), 
                ...safeSplit(barangay.toLowerCase()), 
                zip_code,
                role,
                gender,  
                ...safeSplit(address1.toLowerCase()), 
                ...safeSplit(address2.toLowerCase()), 
                ...safeSplit(nationality.toLowerCase()), 
            ].flat().filter(Boolean) 
        });

        const currentUserName = await getUserNameById(currentUserId);

        await sendAdminNotifications({
            heading: "New Account Created",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} created an account named ${capitalizeFirstLetter(first_name)}`,
            title: `${capitalizeFirstLetter(currentUserName)} created a new ${capitalizeFirstLetter(role)} account`,
            message: `${capitalizeFirstLetter(currentUserName)} just created an account for ${capitalizeFirstLetter(first_name)} as promodiser. Make sure to welcome ${getGender(gender)} and verify that permissions are set up properly.`,
            type: 'user'
        })

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

//!=============================================================== U P D A T E  P R O F I L E =========================================================================

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

        const currentEmail = userDoc.data().email;
        const { email, password } = updates;

        if (email && email !== currentEmail) {
            try {
                const userRecord = await admin.auth().getUserByEmail(email);
                if (userRecord && userRecord.uid !== currentUserId) {
                    return res.status(400).json({ success: false, message: "Email already exists." });
                }
            } catch (error) {
                if (error.code !== 'auth/user-not-found') {
                    console.error(error);
                    return res.status(500).json({ success: false, message: error.message });
                }
            }
            await admin.auth().createUser({
                email,
                password,
            });
        }

        const allowedFields = [
            "avatar", "first_name", "middle_name", "last_name", "birth_date", "email", "mobile_number",
            "region", "province", "city", "barangay", "zip_code", "role", "team", "status",
            "is_deleted", "is_verified", "gender", "address1", "address2",
            "nationality", "push_notification", "on_duty", "manage_store", "manage_account", "fcm_token"
        ];

        const updatedData = {};
        let hasOtherChanges = false;

        for (const key of Object.keys(updates)) {
            if (!allowedFields.includes(key)) {
                return res.status(400).json({ success: false, message: `Updating "${key}" is not allowed.` });
            }

            let value = updates[key];

            if (typeof value === "string" && key !== "email") value = value;
            if (key === "birth_date") value = dateToTimeStamp(value);

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
            "province", "city", "barangay", "zip_code", "role",
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
                user.city,
                user.barangay,
                user.zip_code,
                user.role,
                user.gender,
                user.address1,
                user.address2,
                user.nationality
            ];

            const processedTags = rawTags
                .map(val => typeof val === 'string' ? safeSplit(val.toLowerCase()) : [val])
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

//!=============================================================== U P D A T E  U S E R =========================================================================

const updateUser = async (req, res) => {
    try {
        const { currentUserId, targetId } = req.params;
        const updates = req.body;

        const userRef = db.collection('users').doc(targetId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const allowedFields = [
            "avatar", "first_name", "middle_name", "last_name", "birth_date", "mobile_number",
            "street", "region", "province", "city", "barangay", "zip_code", "role", "status", "is_deleted"
        ];

        const updatedData = {};
        let hasOtherChanges = false;

        for (const key of Object.keys(updates)) {
            if (!allowedFields.includes(key)) {
                return res.status(400).json({ success: false, message: `Updating "${key}" is not allowed.` });
            }

            let value = updates[key];
            if (typeof value === "string" && key !== "email") value = value;
            if (key === "birth_date") value = dateToTimeStamp(value);

            const oldValue = userDoc.data()[key];
            if (value !== undefined && value !== oldValue) {
                updatedData[key] = value;
                if (key !== "push_notification" && key !== "on_duty") {
                    hasOtherChanges = true;
                }
            };
        }

        if (Object.keys(updatedData).length === 0) {
            return res.status(200).json({ success: true, message: "No changes detected." });
        }

        await userRef.update(updatedData);

        const identityFields = [
            "first_name", "last_name", "mobile_number", "region",
            "province", "city", "barangay", "zip_code"
        ];

        const shouldUpdateTags = identityFields.some(field => updatedData.hasOwnProperty(field));

        if (shouldUpdateTags) {
            const user = { ...userDoc.data(), ...updatedData };

            const rawTags = [
                user.first_name,
                user.last_name,
                user.mobile_number,
                user.region,
                user.province,
                user.city,
                user.barangay,
                user.zip_code,
            ];

            const processedTags = rawTags
                .map(val => typeof val === 'string' ? safeSplit(val.toLowerCase()) : [val])
                .flat().filter(Boolean);

            await userRef.update({ search_tags: processedTags });
        }

        const currentUserName = await getUserNameById(currentUserId);
        const updateUserName = await getUserNameById(targetId);

        await sendAdminNotifications({
            heading: "Account Has Updated",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} updated information for ${capitalizeFirstLetter(updateUserName)}`,
            title: `${capitalizeFirstLetter(currentUserName)} updated an account`,
            message: `${capitalizeFirstLetter(currentUserName)} just updated an account for ${capitalizeFirstLetter(updateUserName)}`,
            type: 'user'
        });

        if (hasOtherChanges) {
            await logUserActivity({
                heading: "update User",
                currentUserId,
                activity: `Updated user ${updateUserName}.`
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


// const updateUser = async(req, res) => {
//     try {
//         const { currentUserId, targetId } = req.params;
//         const { 
//             first_name,
//             last_name,
//             birth_date,
//             mobile_number,
//             street_address,
//             province,
//             city,
//             barangay,
//             zip_code
//         } = req.body;

//         const userRef = db.collection('users').doc(targetId);
//         const updatedData = {
//             first_name,
//             middle_name: "",
//             last_name,
//             birth_date,
//             mobile_number,
//             street_address,
//             province,
//             city,
//             barangay,
//             zip_code
//         }
        
//         await userRef.update(updatedData);

//         const currentUserName = await getUserNameById(currentUserId);
//         const updateUserName = await getUserNameById(targetId);

//         await sendAdminNotifications({
//             heading: "Account Has Updated",
//             fcmMessage: `${capitalizeFirstLetter(currentUserName)} updated an information to ${capitalizeFirstLetter(updateUserName)}`,
//             title: `${capitalizeFirstLetter(currentUserName)} update a `,
//             message: `${capitalizeFirstLetter(currentUserName)} just update an account for ${capitalizeFirstLetter(updateUserName)}`,
//             type: 'user'
//         });

//         await logUserActivity({
//             heading: "account",
//             currentUserId,
//             activity: "Account has been updated."
//         });

//     } catch (error) {
//         return res.status(500).json({
//             success: false,
//             message: "Internal server error.",
//             error: error.message
//         });
//     }
// }

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

        await logUserActivity({ 
            heading: "signed In",
            currentUserId: getId, 
            activity: 'account signed in successfully' 
        });

        await userRef.update({
           fcm_token: fcmToken,
           last_signed_in: Timestamp.now(),
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
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            error: error.message,
        });
    }
};

//!=============================================================== D E L E T E   U S E R =========================================================================

const deleteUser = async(req, res) => {
    try {
        const { currentUserId, targetId } = req.params;
        const { is_deleted } = req.body;

        const userRef = db.collection("users").doc(targetId);

        const userData = {
            is_deleted,
            deleted_at: Timestamp.now(),
            deleted_by: currentUserId
        }

        await userRef.update(userData);

        const currentUserName = await getUserNameById(currentUserId);
        const updateUserName = await getUserNameById(targetId);

        await sendAdminNotifications({
            heading: "Account Has Deleted",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} deleted an account named ${capitalizeFirstLetter(updateUserName)}`,
            title: `${capitalizeFirstLetter(currentUserName)} delete an account`,
            message: `${capitalizeFirstLetter(currentUserName)} just deleted an account named ${capitalizeFirstLetter(updateUserName)}`,
            type: 'user'
        });

        await logUserActivity({ 
            heading: "signed In",
            currentUserId: currentUserId, 
            activity: 'account signed in successfully' 
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            error: error.message,
        });   
    }
}

module.exports = { addUser, updateMyProfile, updateUser, loginUser, deleteUser };