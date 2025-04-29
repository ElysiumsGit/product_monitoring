const { firestore } = require("firebase-admin");
const { collectionNameDB, subCollectionNameDB } = require('../utils/databaseStructure');

const db = firestore();

const automationController = async(req, res) => {
    try {
        const {collectionName, docId, subCollectionName, action } = req.body;

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
                } 
                
                else {
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