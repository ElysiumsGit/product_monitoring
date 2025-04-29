const { firestore } = require("firebase-admin");

const db = firestore();

const readTeam = async (req, res) => {
    try {
        const { teamId } = req.body;
        
        const usersQuerySnapshot = await db.collection("users")
            .where("team", "==", teamId) 
            .get();

        if(!usersQuerySnapshot){
            res.status(404).json({
                success: true,
                message: "You don't have team yet",
            })
        }

        const data = [];
        usersQuerySnapshot.forEach(doc => {
            data.push({ ...doc.data() });
        });

        return res.status(200).json({ 
            success: true, 
            message: "Successfully read this team.",
            data
        });
    } catch (error) {
        console.error("Error Reading:", error.message);
        res.status(500).send({ error: error.message });
    }
};

const readSingleData = async (req, res) => {
    try {
        const { userId } = req.body;

        const userDoc = await db.collection("users").doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const userData = userDoc.data();

        return res.status(200).json({ 
            success: true, 
            message: "Successfully read this data.",
            data: userData
        });
    } catch (error) {
        console.error("Error Reading:", error.message);
        res.status(500).send({ error: error.message });
    }
};

module.exports = { readTeam, readSingleData }