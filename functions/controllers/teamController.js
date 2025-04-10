const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const collection = require("../utils/utils");

const db = firestore();

const assignTeam = async (req, res) => {
    try {
        const {
            team_name,
            agent_id,
            coordinator_id,
            promodiser_ids 
        } = req.body;

        if (!team_name || !agent_id || !coordinator_id || !promodiser_ids || !Array.isArray(promodiser_ids)) {
            return res.status(400).json({ success: false, message: "All fields are required and promodiser_ids must be an array." });
        }

        const userIds = [agent_id, coordinator_id, ...promodiser_ids];
        const userCheckPromises = userIds.map(id => db.collection(collection.collections.usersCollections).doc(id).get());
        const userCheckResults = await Promise.all(userCheckPromises);

        for (const doc of userCheckResults) {
            if (!doc.exists) {
                return res.status(400).json({ success: false, message: "One or more user IDs are invalid." });
            }
        }

        const teamRef = db.collection(collection.collections.teamCollection).doc();
        const teamId = teamRef.id;

        const assignTeam = {
            team_id: teamId,
            team_name,
            createdAt: Timestamp.now(),
        };

        await teamRef.set(assignTeam);

        const updateUserPromises = userIds.map(id => 
            db.collection(collection.collections.usersCollections).doc(id).update({ team: teamId, updatedAt: Timestamp.now() })
        );

        await Promise.all(updateUserPromises);

        return res.status(200).json({
            success: true,
            message: "Team successfully created and users updated",
            data: { id: teamId },
        });

    } catch (error) {
        console.error("Error adding team", error);
        return res.status(500).json({ success: false, message: "Failed to create team" });
    }
}
const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { team_name, agent_id, coordinator_id, promodiser_ids } = req.body;

        if (!team_name || !agent_id || !coordinator_id || !promodiser_ids || !Array.isArray(promodiser_ids)) {
            return res.status(400).json({ success: false, message: "All fields are required and promodiser_ids must be an array." });
        }

        const teamRef = db.collection(collection.collections.teamCollection).doc(id);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return res.status(404).json({ success: false, message: "Team not found." });
        }

        const currentTeamUsersSnap = await db.collection(collection.collections.usersCollections).where("team", "==", id).get(); 
        const currentTeamUserIds = currentTeamUsersSnap.docs.map(doc => doc.id);

        const newUserIds = [agent_id, coordinator_id, ...promodiser_ids];
        const removeOldUsers = currentTeamUserIds
            .filter(userId => !newUserIds.includes(userId))
            .map(userId => db.collection(collection.collections.usersCollections).doc(userId).update({ team: firestore.FieldValue.delete(), updatedAt: Timestamp.now() }));

        const userCheckPromises = newUserIds.map(userId => db.collection(collection.collections.usersCollections).doc(userId).get());
        const userCheckResults = await Promise.all(userCheckPromises);

        for (const userDoc of userCheckResults) {
            if (!userDoc.exists) {
                return res.status(400).json({ success: false, message: "One or more user IDs are invalid." });
            }
        }

        const updateNewUsers = newUserIds.map(userId =>
            db.collection(collection.collections.usersCollections).doc(userId).update({ team: id, updatedAt: Timestamp.now() })
        );

        await teamRef.update({ team_name, updatedAt: Timestamp.now() });

        await Promise.all([...removeOldUsers, ...updateNewUsers]);

        return res.status(200).json({
            success: true,
            message: "Team successfully updated",
            data: { id: id },
        });

    } catch (error) {
        console.error("Error updating team", error);
        return res.status(500).json({ success: false, message: "Failed to update team" });
    }
};

const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if team exists
        const teamRef = db.collection("team").doc(id);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return res.status(404).json({ success: false, message: "Team not found." });
        }

        // Get all users assigned to this team
        const usersSnap = await db.collection(collection.collections.usersCollections).where("team", "==", id).get();
        const updateUserPromises = usersSnap.docs.map(userDoc =>
            userDoc.ref.update({ team: firestore.FieldValue.delete(), updatedAt: Timestamp.now() })
        );

        // Execute updates
        await Promise.all(updateUserPromises);

        // Delete the team document
        await teamRef.delete();

        return res.status(200).json({
            success: true,
            message: "Team successfully deleted, and users unassigned.",
            data: { id },
        });

    } catch (error) {
        console.error("Error deleting team", error);
        return res.status(500).json({ success: false, message: "Failed to delete team" });
    }
};

module.exports = { assignTeam, updateTeam, deleteTeam };
