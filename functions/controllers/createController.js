const { firestore } = require("firebase-admin");
const { dateToTimeStamp } = require("../utils/utils");
const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");
const { Timestamp } = require("firebase-admin/firestore");

const db = firestore();
const createdAt = Timestamp.now();

const createUser = async (req, res, restOfBody) => {
    try {
        const { email, password, confirm_password, birth_date, hired_date } = req.body;
    
        if (!email || !password || !confirm_password || !birth_date || !hired_date) {
            return res.status(400).json({ success: false, message: "Missing required user fields." });
        }
    
        if (password !== confirm_password) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }
    
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
    
        const hiredDate = dateToTimeStamp(hired_date);
        const birthDate = dateToTimeStamp(birth_date);
    
        const usersRef = db.collection("users").doc();
        const getId = usersRef.id;
    
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
    
        await usersRef.set({
            "@id": getId,
            email,
            ...restOfBody,
            password: hashedPassword,
            birth_date: birthDate,
            hired_date: hiredDate,
            createdAt,
        });
        
        return res.status(200).json({ success: true, message: "Successfully added new user." });

    } catch (error) {
        console.error("Error Creating:", error.message);
        res.status(500).send({ error: error.message });
    }
}

const createProduct = async(req, res, restOfBody) => {
    try {
        const { product_name, userDocId } = req.body;
            
        if (!product_name) {
            return res.status(400).json({ success: false, message: "Product name is required." });
        }

        if (!userDocId) {
            return res.status(400).json({ success: false, message: `Not a userDocId` });
        }

        const docRef = db.collection("users").doc(userDocId);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            return res.status(404).json({ success: false, message: `User with ID '${userDocId}' does not exist.` });
        }

        const productRef = db.collection("products").doc();
        const getProductId = productRef.id;

        const activitiesRef = docRef.collection('activities').doc();
        const activitiesRefId = activitiesRef.id;

        await productRef.set({
            "@id": getProductId,
            ...restOfBody,
            product_name,
            createdAt
        });

        await productRef.update({
            userDocId: firestore.FieldValue.delete()
        })

        await activitiesRef.set({
            "@id": activitiesRefId,
            title: `You have added a ${product_name}.`,
            createdAt
        });

        const adminUsersSnapshot = await db
            .collection("users")
            .where("role", "==", "admin")
            .get();

        const notificationPromises = [];

        adminUsersSnapshot.forEach((adminDoc) => {
            const adminId = adminDoc.id;
            const adminNotificationRef = db
                .collection("users")
                .doc(adminId)
                .collection("notifications")
                .doc(); 

            notificationPromises.push(
                adminNotificationRef.set({
                    id: adminNotificationRef.id,
                    title: `A new product, ${product_name}, has been launched. Review and assign to stores.`,
                    createdAt,
                    isRead: false,
                    type: "product",
                })
            );
        });

        await Promise.all(notificationPromises);
        return res.status(200).json({ success: true, message: "Successfully added new product." });
    } catch (error) {
        console.error("Error Creating:", error.message);
        res.status(500).send({ error: error.message });
    }
    
}

const createTeam = async(req, res) => {
    try {
        const { team_name, users } = req.body;

        if(!team_name){
            return res.status(400).json({ success: false, message: "Team name is required." });
        }

        if(!Array.isArray(users)){
            return res.status(400).json({ success: false, message: "Users is required." });
        }

        const teamRef = db.collection("team").doc();
        const getTeamId = teamRef.id;
        

        await teamRef.set({
            "@id" : getTeamId,
            team_name,
            createdAt
        });

        for(const user of users){
            const userRef = db.collection("users").doc(user);
            if(!userRef){
                return res.status(400).json({ success: false, message: "Users is not invalid." });
            }
            const notificationRef = userRef.collection("notifications").doc();
            userRef.update({
                team: getTeamId,
                updatedAt : createdAt
            })

            notificationRef.set({
                title: `You have been added to ${team_name}`,
                type: "team",
                isRead: false,
                createdAt
            })
        }

        return res.status(200).json({ success: true, message: "Successfully added new Team." });
    } catch (error) {
        console.error("Error Creating:", error.message);
        res.status(500).send({ error: error.message });
    }
}

const createStore = async(req, res, restOfBody) => {
    try {
        const { store_name, restOfBody  } = req.body;

        if(!store_name){
            return res.status(400).json({ success: false, message: "Store Name is required." });
        }

        const storeRef = db.collection("stores").doc();
        const getId = storeRef.id;

        await storeRef.set({
            "@id": getId,
            store_name,
            ...restOfBody,
            createdAt,
        });

        return res.status(200).json({ success: true, message: "Successfully create a store." });
    } catch (error) {
        console.error("Error Creating:", error.message);
        res.status(500).send({ error: error.message });
    }
}

const createGroup = async(req, res, restOfBody) => {
    try {
        
    } catch (error) {
        
    }
}

module.exports = { createUser, createProduct, createTeam, createStore }