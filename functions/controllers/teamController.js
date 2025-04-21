const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const collection = require("../utils/utils");

const db = firestore();

const assignTeam = async (req, res) => {
    try {
        const {
            team_name,
            team
        } = req.body;

        if (!team_name || !Array.isArray(team)) {
            return res.status(400).json({
                success: false,
                message: "All fields are required and promodiser_ids must be an array."
            });
        }

        const userIds = [...team];
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

        const assignTeamData = {
            team_id: teamId,
            team_name,
            createdAt: Timestamp.now(),
        };

        await teamRef.set(assignTeamData);

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
        const { team_name, team } = req.body;

        if (!team_name || !Array.isArray(team)) {
            return res.status(400).json({
                success: false,
                message: "All fields are required and team must be an array of user IDs."
            });
        }

        const teamRef = db.collection(collection.collections.teamCollection).doc(id);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return res.status(404).json({ success: false, message: "Team not found." });
        }

        const oldData = teamDoc.data();
        const oldTeamName = oldData.team_name;

        // Get all users currently assigned to this team
        const currentTeamUsersSnap = await db
            .collection(collection.collections.usersCollections)
            .where("team", "==", id)
            .get();

        const currentUserIds = currentTeamUsersSnap.docs.map(doc => doc.id);
        const newUserIds = [...team];

        const removedUserIds = currentUserIds.filter(uid => !newUserIds.includes(uid));
        const addedUserIds = newUserIds.filter(uid => !currentUserIds.includes(uid));

        // Validate all new user IDs
        const userCheckPromises = newUserIds.map(uid =>
            db.collection(collection.collections.usersCollections).doc(uid).get()
        );
        const userDocs = await Promise.all(userCheckPromises);

        for (const userDoc of userDocs) {
            if (!userDoc.exists) {
                return res.status(400).json({
                    success: false,
                    message: "One or more user IDs are invalid."
                });
            }
        }

        // Remove old users
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

        // Update new users
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

        // Send notifications for team name change
        const teamNameChangeNotifs = [];
        if (oldTeamName !== team_name) {
            for (const userId of newUserIds) {
                const userRef = db.collection(collection.collections.usersCollections).doc(userId);
                const notifRef = userRef.collection(collection.subCollections.notifications).doc();
                teamNameChangeNotifs.push(
                    notifRef.set({
                        notification_id: notifRef.id,
                        message: `Team name has been changed from ${oldTeamName} to ${team_name}.`,
                        createdAt: Timestamp.now(),
                        type: "team",
                        isRead: false
                    })
                );
            }
        }

        // Update the team document
        await teamRef.update({
            team_name,
            updatedAt: Timestamp.now()
        });

        await Promise.all([...removeOldUsers, ...updateNewUsers, ...teamNameChangeNotifs]);

        return res.status(200).json({
            success: true,
            message: "Team successfully updated",
            data: { id },
        });

    } catch (error) {
        console.error("Error updating team", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update team"
        });
    }
};

const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;

        const teamRef = db.collection(collection.collections.teamCollection).doc(id);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Team not found."
            });
        }

        const { team_name } = teamDoc.data();

        // Get all users currently in the team
        const usersSnap = await db
            .collection(collection.collections.usersCollections)
            .where("team", "==", id)
            .get();

        // Unassign users from the deleted team and notify them
        const userUpdatePromises = usersSnap.docs.map(async (userDoc) => {
            const userRef = userDoc.ref;
            const notifRef = userRef.collection(collection.subCollections.notifications).doc();

            await userRef.update({
                team: firestore.FieldValue.delete(),
                updatedAt: Timestamp.now()
            });

            await notifRef.set({
                notification_id: notifRef.id,
                message: `The team "${team_name}" you were part of has been deleted.`,
                createdAt: Timestamp.now(),
                type: "team",
                isRead: false
            });
        });

        await Promise.all(userUpdatePromises);

        await teamRef.delete();

        return res.status(200).json({
            success: true,
            message: `Team "${team_name}" successfully deleted and all users notified.`,
            data: { id },
        });

    } catch (error) {
        console.error("Error deleting team", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete team"
        });
    }
};


module.exports = { assignTeam, updateTeam, deleteTeam };
