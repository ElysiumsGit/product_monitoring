const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");

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
        const userCheckPromises = userIds.map(id => db.collection("users").doc(id).get());
        const userCheckResults = await Promise.all(userCheckPromises);

        for (const doc of userCheckResults) {
            if (!doc.exists) {
                return res.status(400).json({ success: false, message: "One or more user IDs are invalid." });
            }
        }

        const teamRef = db.collection("team").doc();
        const teamId = teamRef.id;

        const assignTeam = {
            team_id: teamId,
            team_name,
            createdAt: Timestamp.now(),
        };

        await teamRef.set(assignTeam);

        const updateUserPromises = userIds.map(id => 
            db.collection("users").doc(id).update({ team: teamId, updateAt: Timestamp.now() })
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

module.exports = { assignTeam };
