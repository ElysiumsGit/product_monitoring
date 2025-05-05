const { firestore } = require("firebase-admin");
const { Timestamp, FieldValue } = require("firebase-admin/firestore");
const { team, users, activities, notifications } = require("../utils/utils");
const { logUserActivity } = require("../utils/functions");

const db = firestore();

const assignTeam = async(req, res) => {
    try {
        const { currentUserId } = req.params;
        const { team_name, teams } = req.body;

        if(!team_name, !Array.isArray(teams)){
            return res.status(400).json({ success: false, message: "Invalid Data" });
        }

        const teamRef = db.collection(team).doc();
        const teamId = teamRef.id;

        await teamRef.set({
            id: teamId,
            team_name,
            created_at: Timestamp.now(),
        })

        for(const userIds of teams){
            const userRef = db.collection(users).doc(userIds);
            const userDoc = await userRef.get();

            if(!userDoc.exists){
                return res.status(400).json({ success: false, message: "Invalid User ID" });
            }

            const notificationRef = userRef.collection(notifications).doc();
            const getNotificationId = notificationRef.id;
            
            await userRef.update({
                team: teamId,
                updated_at: Timestamp.now()
            })

            await notificationRef.set({
                id: getNotificationId,
                title: `You have been added to ${team_name}`,
                isRead: false,
                created_at: Timestamp.now(),
            })
        }

        await logUserActivity(currentUserId, `You have created a team with a team name of ${team_name}`);

        return res.status(200).json({
            success: true,
            message: "Team successfully added",
        });

    } catch (error) {
        console.error("Error updating team", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update team"
        });
    }
}

//=============================================================== G E T  T E A M =========================================================================
// const getUsersByTeam = async (req, res) => {
//     try {
//         const { teamId } = req.params;

//         if (!teamId) {
//             return res.status(400).json({ success: false, message: "Missing teamId" });
//         }

//         const usersSnapshot = await db.collection("users").where("team", "==", teamId).get();

//         if (usersSnapshot.empty) {
//             return res.status(404).json({ success: false, message: "No users found in this team" });
//         }

//         const users = [];
//         usersSnapshot.forEach(doc => {
//             users.push({ id: doc.id, ...doc.data() });
//         });

//         return res.status(200).json({ success: true, users });
//     } catch (error) {
//         console.error("Error fetching users by team:", error);
//         return res.status(500).json({ success: false, message: "Failed to fetch users" });
//     }
// };

//=============================================================== U P D A T E  T E A M =========================================================================
const updateTeam = async (req, res) => {
    try {
        const { teamId, currentUserId } = req.params;
        const { team_name, teams } = req.body;

        if (!team_name || !Array.isArray(teams)) {
            return res.status(400).json({ success: false, message: "Invalid Data" });
        }

        const teamDocRef = db.collection(team).doc(teamId);
        const teamDoc = await teamDocRef.get();
        if (!teamDoc.exists) {
            return res.status(404).json({ success: false, message: "Team not found" });
        }

        const oldTeamName = teamDoc.data().name;

        if (team_name !== oldTeamName) {
            await teamDocRef.update({ name: team_name });
        }


        const usersSnapshot = await db.collection('users').where('team', '==', teamId).get();
        const currentUserIdsInTeam = usersSnapshot.docs.map(doc => doc.id);
        const newTeamSet = new Set(teams);

        if (team_name !== oldTeamName) {
            for (const userId of currentUserIdsInTeam) {
                const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
                await notificationRef.set({
                    id: notificationRef.id,
                    title: `Team name has been changed to ${team_name}`,
                    isRead: false,
                    created_at: Timestamp.now(),
                });
            }
        }

        const removedUserIds = currentUserIdsInTeam.filter(uid => !newTeamSet.has(uid));
        for (const userId of removedUserIds) {
            await db.collection('users').doc(userId).update({
                team: FieldValue.delete(),
            });

            const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
            await notificationRef.set({
                id: notificationRef.id,
                title: `You have been removed from ${team_name}`,
                isRead: false,
                created_at: Timestamp.now(),
            });
        }

        for (const userId of teams) {
            const userRef = db.collection('users').doc(userId);
            if (!currentUserIdsInTeam.includes(userId)) {
                const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
                await notificationRef.set({
                    id: notificationRef.id,
                    title: `You have been added to ${team_name}`,
                    isRead: false,
                    created_at: Timestamp.now(),
                });
            }

            await userRef.update({
                team: teamId,
            });
        }

        await logUserActivity(currentUserId, `You have updated the team ${team_name}`);
        return res.status(200).json({ success: true, message: "Updated Team" });

    } catch (error) {
        console.error("Error updating team:", error);
        return res.status(500).json({ success: false, message: "Failed to update team" });
    }
};

//=============================================================== D E L E T E  T E A M =========================================================================
const deleteTeam = async (req, res) => {
    try {
        const { teamId, currentUserId } = req.params;

        const teamRef = db.collection(team).doc(teamId);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Team not found."
            });
        }

        const { team_name } = teamDoc.data();

        await teamRef.update({
            is_deleted: true,
            updated_at: Timestamp.now()
        });

        const usersSnap = await db
            .collection(users)
            .where("team", "==", teamId)
            .get();

        const userUpdatePromises = usersSnap.docs.map(async (userDoc) => {
            const userRef = userDoc.ref;
            const notifRef = userRef.collection(notifications).doc();

            await userRef.update({
                team: firestore.FieldValue.delete(),
                updated_at: Timestamp.now()
            });

            await notifRef.set({
                notification_id: notifRef.id,
                message: `The ${team_name} you were part of has been deleted.`,
                created_at: Timestamp.now(),
                type: "team",
                isRead: false
            });
        });

        await Promise.all(userUpdatePromises);

        await logUserActivity(currentUserId, `You have marked the team "${team_name}" as deleted.`);

        return res.status(200).json({
            success: true,
            message: `Team "${team_name}" marked as deleted and all users notified.`,
        });

    } catch (error) {
        console.error("Error deleting team", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark team as deleted"
        });
    }
};

module.exports = { assignTeam, updateTeam, deleteTeam };
