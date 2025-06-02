const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const { logUserActivity, incrementNotification, capitalizeFirstLetter, getUserNameById, sendAdminNotifications, getTeamNameById } = require("../utils/functions");

const db = firestore();

const assignTeam = async(req, res) => {
    try {
        const { currentUserId } = req.params;
        const { team_name, teams } = req.body;

        if(!team_name, !Array.isArray(teams)){
            return res.status(400).json({ success: false, message: "Invalid Data" });
        }

        const teamRef = db.collection("team").doc();
        const teamId = teamRef.id;

        await teamRef.set({
            id: teamId,
            team_name,
            created_at: Timestamp.now(),
            is_deleted: false
        })

        for(const userIds of teams){
            const userRef = db.collection("users").doc(userIds);
            const userDoc = await userRef.get();

            if(!userDoc.exists){
                return res.status(400).json({ success: false, message: "Invalid User ID" });
            }

            const notificationRef = userRef.collection("notifications").doc();
            const getNotificationId = notificationRef.id;

            await userRef.update({
                team: teamId,
            });

            await notificationRef.set({
                id: getNotificationId,
                title: `You have been added to ${team_name}`,
                isRead: false,
                created_at: Timestamp.now(),
            })

            await incrementNotification(userIds);
        }

        const currentUserName = await getUserNameById(currentUserId);

        await sendAdminNotifications({
            heading: "New Team Created",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} created a team named ${capitalizeFirstLetter(team_name)}`,
            title: `${capitalizeFirstLetter(currentUserName)} created a team ${capitalizeFirstLetter(team_name)}`,
            message: `${capitalizeFirstLetter(currentUserName)} just created a team named ${capitalizeFirstLetter(team_name)}`,
            type: 'team'
        });

        await logUserActivity({ 
            heading: "team assignment",
            currentUserId: currentUserId, 
            activity: 'you have successfully assigned a team' 
        });

        return res.status(200).json({
            success: true,
            message: "Team successfully added",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update team",
            error: error.message
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
        const { currentUserId, targetId  } = req.params;
        const { team_name, teams } = req.body;

        if (!team_name || !Array.isArray(teams)) {
            return res.status(400).json({ success: false, message: "Invalid Data" });
        }

        const teamDocRef = db.collection("team").doc(targetId);
        const teamDoc = await teamDocRef.get();
        if (!teamDoc.exists) {
            return res.status(404).json({ success: false, message: "Team not found" });
        }

        const oldTeamName = teamDoc.data().name;

        if (team_name !== oldTeamName) {
            await teamDocRef.update({ team_name: team_name });
        }
        
        const usersSnapshot = await db.collection('users').where('team', '==', targetId).get();
        const currentUserIdsInTeam = usersSnapshot.docs.map(doc => doc.id);
        const newTeamSet = new Set(teams);
        const currentUserName = await getUserNameById(currentUserId);

        if (team_name !== oldTeamName) {
            for (const userId of currentUserIdsInTeam) {
                const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
               
                await notificationRef.set({
                    id: notificationRef.id,
                    title: `Team name has been changed to ${team_name}`,
                    isRead: false,
                    created_at: Timestamp.now(),
                });

                await sendAdminNotifications({
                    heading: "Team Renamed",
                    fcmMessage: `${capitalizeFirstLetter(currentUserName)} rename a team named ${capitalizeFirstLetter(team_name)}`,
                    title: `${capitalizeFirstLetter(currentUserName)} rename a team ${capitalizeFirstLetter(team_name)}`,
                    message: `${capitalizeFirstLetter(currentUserName)} just rename a team named ${capitalizeFirstLetter(team_name)}`,
                    type: 'team'
                });

                await incrementNotification(userId);
            }
        }

        const removedUserIds = currentUserIdsInTeam.filter(uid => !newTeamSet.has(uid));
        for (const userId of removedUserIds) {
            await db.collection('users').doc(userId).update({
                team: "",
            });

            const notificationRef = db.collection('users').doc(userId).collection('notifications').doc();
            await notificationRef.set({
                id: notificationRef.id,
                title: `You have been removed from ${team_name}`,
                isRead: false,
                created_at: Timestamp.now(),
            });

            await sendAdminNotifications({
                heading: "Team Edit",
                fcmMessage: `${capitalizeFirstLetter(currentUserName)} there are few members remove in ${capitalizeFirstLetter(team_name)}`,
                title: `${capitalizeFirstLetter(currentUserName)} there are few members remove in ${capitalizeFirstLetter(team_name)}`,
                message: `${capitalizeFirstLetter(currentUserName)} there are few members remove in ${capitalizeFirstLetter(team_name)}`,
                type: 'team'
            });

            await incrementNotification(userId);
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

                await sendAdminNotifications({
                    heading: "Team Add",
                    fcmMessage: `${capitalizeFirstLetter(currentUserName)} there are few members add in ${capitalizeFirstLetter(team_name)}`,
                    title: `${capitalizeFirstLetter(currentUserName)} there are few members add in ${capitalizeFirstLetter(team_name)}`,
                    message: `${capitalizeFirstLetter(currentUserName)} there are few members add in ${capitalizeFirstLetter(team_name)}`,
                    type: 'team'
                });

                await incrementNotification(userId);
            }

            await userRef.update({
                team: targetId,
            });
        }

        await logUserActivity({ 
            heading: "team update",
            currentUserId: currentUserId, 
            activity: 'you have successfully update a team' 
        });
        return res.status(200).json({ success: true, message: "Updated Team" });

    } catch (error) {
        console.error("Error updating team:", error);
        return res.status(500).json({ success: false, message: "Failed to update team" });
    }
};

//!=============================================================== D E L E T E  T E A M =========================================================================

const deleteTeam = async (req, res) => {
    try {
        const { currentUserId, targetId  } = req.params;
        const { is_deleted } = req.body;

        const teamRef = db.collection("team").doc(targetId);
        const teamDoc = await teamRef.get();

        if (!teamDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Team not found."
            });
        }

        await teamRef.update({
            is_deleted: is_deleted,
            deleted_at: Timestamp.now(),
            deleted_by: currentUserId
        });

        const usersSnap = await db.collection("users").where("team", "==", targetId).get();
        const currentUserName = await getUserNameById(currentUserId);
        const teamName = await getTeamNameById(targetId);

        const userUpdatePromises = usersSnap.docs.map(async (userDoc) => {
            const userRef = userDoc.ref;
            const notifRef = userRef.collection(notifications).doc();

            await userRef.update({
                team: "",
            });

            await notifRef.set({
                notification_id: notifRef.id,
                message: `The ${teamName} you were part of has been deleted.`,
                created_at: Timestamp.now(),
                type: "team",
                isRead: false
            });

            await incrementNotification(userRef.id);

        });

        await Promise.all(userUpdatePromises);

        await sendAdminNotifications({
            heading: "Team Deleted",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} deleted a team named ${capitalizeFirstLetter(teamName)}`,
            title: `${capitalizeFirstLetter(currentUserName)} deleted a team ${capitalizeFirstLetter(teamName)}`,
            message: `${capitalizeFirstLetter(currentUserName)} just deleted a team named ${capitalizeFirstLetter(teamName)}`,
            type: 'team'
        });


        await logUserActivity({ 
            heading: "team deletion",
            currentUserId: currentUserId, 
            activity: 'you have deleted a team' 
        });

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
