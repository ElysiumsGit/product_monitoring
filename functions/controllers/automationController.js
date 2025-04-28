const { firestore } = require("firebase-admin");
const { collectionNameDB, subCollectionNameDB } = require('../utils/databaseStructure');
const { Timestamp } = require("firebase-admin/firestore");
const { dateToTimeStamp } = require("../utils/utils");
const { createUser, createProduct } = require("./createController");

const db = firestore();

const automationController = async(req, res) => {
    try {
        const { collectionName, docId, subCollectionName, subDocId, action, ...restOfBody } = req.body;
        const createdAt = Timestamp.now();

        if (!collectionName || typeof collectionName !== "string") {
            return res.status(400).json({ success: false, message: "collectionName is required and must be a string." });
        }

        if (!collectionNameDB.includes(collectionName)) {
            return res.status(400).json({ success: false, message: `Invalid collectionName. Allowed: ${collectionNameDB.join(", ")}` });
        }

        if (subCollectionName) {
            if (typeof subCollectionName !== "string") {
                return res.status(400).json({ success: false, message: "subCollectionName must be a string." });
            }

            if (!subCollectionNameDB.includes(subCollectionName)) {
                return res.status(400).json({ success: false, message: `Invalid subCollectionName. Allowed: ${subCollectionNameDB.join(", ")}` });
            }
        }

        switch (action) {
            case "create": {
                const createdAt = Timestamp.now();
            
                if (!restOfBody || Object.keys(restOfBody).length === 0) {
                    return res.status(400).json({ success: false, message: "Request body must contain fields to create." });
                }
            
                if (subCollectionName) {
                    const parentDocRef = db.collection(collectionName).doc(docId);
                    const newSubDocRef = parentDocRef.collection(subCollectionName).doc(); 
                    const newSubDocId = newSubDocRef.id;
            
                    await newSubDocRef.set({
                        "@id": newSubDocId,
                        ...restOfBody,
                        createdAt
                    });
            
                    return res.status(200).json({ success: true, message: `Successfully added document to ${subCollectionName}.` });
                }
            
                else if (collectionName === "users") {
                    return await createUser(req, res, restOfBody);
                }
            
                else if (collectionName === "products") {
                    return await createProduct(req, res, restOfBody);
                }
            
                else {
                    const createCollection = db.collection(collectionName).doc();
                    const getId = createCollection.id;
            
                    await createCollection.set({
                        "@id": getId,
                        ...restOfBody,
                        createdAt
                    });
            
                    return res.status(200).json({ success: true, message: `Successfully added document to ${collectionName}.` });
                }
            }
            break;
            
            case "update": {
                if (!restOfBody || Object.keys(restOfBody).length === 0) {
                    return res.status(400).json({ success: false, message: "Request body must contain fields to update." });
                }
            
                const updatedAt = new Date(); 
            
                if (subCollectionName) {
                    const parentDocRef = db.collection(collectionName).doc(docId);
                    const subDocRef = parentDocRef.collection(subCollectionName).doc(subDocId); 
                    
                    await subDocRef.update({
                        ...restOfBody,
                        updatedAt,
                    });
                    res.status(200).json({success: true, message: `Successfully Added ${restOfBody} to subcollection of ${subCollectionName}` })

                } else {
                    const docRef = db.collection(collectionName).doc(docId); 
                    
                    await docRef.update({
                        ...restOfBody,
                        updatedAt,
                    });

                    res.status(200).json({success: true, message: `Successfully Added ${restOfBody} to subcollection of ${collectionName}` })

                }
            
                break;
            }

            case "delete": {
                if (subCollectionName) {
                    const parentDocRef = db.collection(collectionName).doc(docId);
                    const subDocRef = parentDocRef.collection(subCollectionName).doc(subDocId); 
                    
                    await subDocRef.delete();

                    res.status(200).json({success: true, message: `Successfully Deleted to subcollection of ${subCollectionName}` });

                } else {
                    const docRef = db.collection(collectionName).doc(docId); 
                    await docRef.delete();

                    res.status(200).json({success: true, message: `Successfully Deleted to subcollection of ${collectionName}` });
                }
                break;
            }

            case "read": {
                if (subCollectionName) {
                    const parentDocRef = db.collection(collectionName).doc(docId);
                    const subColRef = parentDocRef.collection(subCollectionName); 
                    
                    const subColSnapshot = await subColRef.get();
                    
                    const data = [];
                    subColSnapshot.forEach(doc => {
                        data.push({ ...doc.data() });
                    });
            
                    res.status(200).json({ success: true, data });
                } else {
                    const colRef = db.collection(collectionName); 
                    const colSnapshot = await colRef.get();
                    
                    const data = [];
                    colSnapshot.forEach(doc => {
                        data.push({ ...doc.data() });
                    });
            
                    res.status(200).json({ success: true, data });
                }
                break;
            }
                
            default:
                throw new Error("Invalid action");
        }

        res.status(200).send({
            message: "Action performed successfully.",
            success: true
        });

    } catch (error) {
        console.error("Error handling request:", error.message);
        res.status(500).send({ error: error.message });
    }
}

module.exports = { automationController }