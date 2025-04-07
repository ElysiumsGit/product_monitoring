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

        const userIds = [agent_id, coordinator_id, ...promodiser_ids];
        const userCheckPromises = userIds.map(id => db.collection("users").where("id", "==", id).get());
        const userCheckResults = await Promise.all(userCheckPromises);

        for (const result of userCheckResults) {
            if (result.empty) {
                return res.status(400).json({ success: false, message: "One or more user IDs are invalid." });
            }
        }

        const teamId = teamRef.id;

        const assignTeam = {
            teamId: teamId,
            team_name,
            agent_id,
            coordinator_id,
            promodiser_ids,  
            createdAt: Timestamp.now(),
        };

        await teamRef.set(assignTeam);

        return res.status(201).json({
            success: true,
            message: "Team successfully created",
            data: { id: teamId },
        });

    } catch (error) {
        console.error("Error adding team", error);
        return res.status(500).json({ success: false, message: "Failed to create team" });
    }
}

const deleteTeam = async(req, res) => {
    try {
        const{
            multipleId,
        } = req.body;

        if(!multipleId){
            return res.status(400).json({ success: false, message: "ID does not exist" });
        }

        teamRef = db.collection("users").white("team", "==", multipleId);
        
        const data = {
            team: "",
        }

        await teamRef.update(data);

        return res.status(200).json({ success: false, message: "Team successfully deleted" });

    } catch (error) {
        console.error("Error delete team", error);
        return res.status(500).json({ success: false, message: "Failed to delete Team" });
    }
}

module.exports = { assignTeam, deleteTeam };
