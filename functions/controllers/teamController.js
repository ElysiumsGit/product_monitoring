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

        if (!team_name || !Array.isArray(agent_id) || !Array.isArray(coordinator_id) || !Array.isArray(promodiser_ids)) {
            return res.status(400).json({
                success: false,
                message: "All fields are required and promodiser_ids must be an array."
            });
        }

        const userIds = [...agent_id, ...coordinator_id, ...promodiser_ids];
        const userCheckPromises = userIds.map(id =>
            db.collection(collection.collections.usersCollections).doc(id).get()
        );
        const userCheckResults = await Promise.all(userCheckPromises);

        for (const doc of userCheckResults) {
            if (!doc.exists) {
                return res.status(400).json({
                    success: false,
                    message: "One or more user IDs are invalid."
                });
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

        const updateUserPromises = userIds.map(async (id) => {
            const userRef = db.collection(collection.collections.usersCollections).doc(id);
            const notificationRef = userRef.collection(collection.subCollections.notifications).doc();
            const notificationId = notificationRef.id;

            const dataNotification = {
                notification_id: notificationId,
                message: `You've been added to ${team_name}. Take a look at your team.`,
                createdAt: Timestamp.now(),
                type: "team",
                isRead: false
            };

            await userRef.update({ team: teamId, updatedAt: Timestamp.now() });
            await notificationRef.set(dataNotification);
        });

        await Promise.all(updateUserPromises);

        return res.status(200).json({
            success: true,
            message: "Team successfully created and users updated",
            data: { id: teamId },
        });

    } catch (error) {
        console.error("Error adding team", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create team"
        });
    }
};

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

        const oldData = teamDoc.data();
        const oldTeamName = oldData.team_name;
        const oldAgent = oldData.agent_id;
        const oldCoordinator = oldData.coordinator_id;

        const currentTeamUsersSnap = await db.collection(collection.collections.usersCollections).where("team", "==", id).get(); 
        const currentTeamUserIds = currentTeamUsersSnap.docs.map(doc => doc.id);
        const newUserIds = [agent_id, coordinator_id, ...promodiser_ids];

        const removedUserIds = currentTeamUserIds.filter(userId => !newUserIds.includes(userId));
        const addedUserIds = newUserIds.filter(userId => !currentTeamUserIds.includes(userId));

        const removeOldUsers = removedUserIds.map(async userId => {
            const userRef = db.collection(collection.collections.usersCollections).doc(userId);
            const notifRef = userRef.collection(collection.subCollections.notifications).doc();
            await userRef.update({ team: firestore.FieldValue.delete(), updatedAt: Timestamp.now() });
            await notifRef.set({
                notification_id: notifRef.id,
                message: `You have been removed from ${oldTeamName}.`,
                createdAt: Timestamp.now(),
                type: "team",
                isRead: false
            });
        });

        const userCheckPromises = newUserIds.map(userId =>
            db.collection(collection.collections.usersCollections).doc(userId).get()
        );
        const userCheckResults = await Promise.all(userCheckPromises);

        for (const userDoc of userCheckResults) {
            if (!userDoc.exists) {
                return res.status(400).json({ success: false, message: "One or more user IDs are invalid." });
            }
        }

        const updateNewUsers = newUserIds.map(async userId => {
            const userRef = db.collection(collection.collections.usersCollections).doc(userId);
            await userRef.update({ team: id, updatedAt: Timestamp.now() });

            if (addedUserIds.includes(userId)) {
                const notifRef = userRef.collection(collection.subCollections.notifications).doc();
                await notifRef.set({
                    notification_id: notifRef.id,
                    message: `You've been added to ${team_name}. Take a look at your team.`,
                    createdAt: Timestamp.now(),
                    type: "team",
                    isRead: false
                });
            }
        });

        await teamRef.update({
            team_name,
            agent_id,
            coordinator_id,
            updatedAt: Timestamp.now()
        });

        const notificationChanges = [];

        // Team name changed
        if (oldTeamName !== team_name) {
            for (const userId of newUserIds) {
                const userRef = db.collection(collection.collections.usersCollections).doc(userId);
                const notifRef = userRef.collection(collection.subCollections.notifications).doc();
                notificationChanges.push(notifRef.set({
                    notification_id: notifRef.id,
                    message: `Team name has been changed from ${oldTeamName} to ${team_name}.`,
                    createdAt: Timestamp.now(),
                    type: "team",
                    isRead: false
                }));
            }
        }

        // Agent change
        if (oldAgent !== agent_id) {
            const newAgentRef = db.collection(collection.collections.usersCollections).doc(agent_id);
            const newNotifRef = newAgentRef.collection(collection.subCollections.notifications).doc();
            notificationChanges.push(
                newNotifRef.set({
                    notification_id: newNotifRef.id,
                    message: `You are now the agent of ${team_name}.`,
                    createdAt: Timestamp.now(),
                    type: "team",
                    isRead: false
                })
            );
        }

        // Coordinator change
        if (oldCoordinator !== coordinator_id) {
            const newCoordRef = db.collection(collection.collections.usersCollections).doc(coordinator_id);
            const newNotifRef = newCoordRef.collection(collection.subCollections.notifications).doc();
            notificationChanges.push(
                newNotifRef.set({
                    notification_id: newNotifRef.id,
                    message: `You are now the coordinator of ${team_name}.`,
                    createdAt: Timestamp.now(),
                    type: "team",
                    isRead: false
                })
            );
        }

        await Promise.all([...removeOldUsers, ...updateNewUsers, ...notificationChanges]);

        return res.status(200).json({
            success: true,
            message: "Team successfully updated",
            data: { id },
        });

    } catch (error) {
        console.error("Error updating team", error);
        return res.status(500).json({ success: false, message: "Failed to update team" });
    }
};
const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;

        const teamRef = db.collection(collection.collections.teamCollection).doc(id);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return res.status(404).json({ success: false, message: "Team not found." });
        }

        const teamData = teamDoc.data();
        const teamName = teamData.team_name;

        const usersSnap = await db.collection(collection.collections.usersCollections).where("team", "==", id).get();

        const updateUserAndNotifyPromises = usersSnap.docs.map(async (userDoc) => {
            const userRef = userDoc.ref;
            const notifRef = userRef.collection(collection.subCollections.notifications).doc();
            await userRef.update({ team: firestore.FieldValue.delete(), updatedAt: Timestamp.now() });

            await notifRef.set({
                notification_id: notifRef.id,
                message: `Your team has been deleted.`,
                createdAt: Timestamp.now(),
                type: "team",
                isRead: false
            });
        });

        await Promise.all(updateUserAndNotifyPromises);

        await teamRef.delete();

        return res.status(200).json({
            success: true,
            message: "Team successfully deleted, and users unassigned + notified.",
            data: { id },
        });

    } catch (error) {
        console.error("Error deleting team", error);
        return res.status(500).json({ success: false, message: "Failed to delete team" });
    }
};

module.exports = { assignTeam, updateTeam, deleteTeam };
