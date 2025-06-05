const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const { getUserNameById, capitalizeFirstLetter, sendAdminNotifications, logUserActivity } = require("../utils/functions");

const db = firestore();

const userAttendance = async(req, res) => {
    try {
        const { currentUserId } = req.params;
        const { on_duty } = req.body;

        const userRef = db.collection('users').doc(currentUserId);

        if (typeof on_duty !== 'boolean') {
            return res.status(200).json({
                success: false,
                message: 'Invalid input. `currentUserId` and `on_duty` (boolean) are required.',
            });
        }

        const now = new Date();

        const phTime = new Date(
            now.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
        );

        const phHour = phTime.getHours();
        const phMinute = phTime.getMinutes();

        // if (phHour < 8) {
        //     return res.status(200).json({
        //         success: false,
        //         message: 'Too early to attendance',
        //     });
        // }

        if (phHour > 11 || (phHour === 11 && phMinute > 0)) {
            return res.status(200).json({
                success: false,
                message: 'Cannot attendance you are late',
            });
        }

        const attendanceRef = db.collection('attendance').doc();

        const attendanceData = {
            id: currentUserId,
            on_duty,
            created_at: Timestamp.now()
        }

        await attendanceRef.set(attendanceData);

        await userRef.update({
            attendance: on_duty ? "on duty" : "off duty",
            attendance_date: Timestamp.now(),
        });

        return res.status(200).json({
            success: true,
            message: "Attendance success"
        });

    } catch (error) {
        return res.status(200).json({
            success: false,
            message: 'Attendance failed',
        });
    }
}

//!=================================================================  A D M I N   U P D A T E ==================================================================

const adminUpdateAttendance = async(req, res) => {
    try {
        const { currentUserId, targetId } = req.params;
        const { on_duty } = req.body;
        const attendanceRef = db.collection('attendance').doc();
        const userRef = db.collection('users').doc(targetId);

        const attendanceData = {
            id: targetId,
            on_duty,
            created_at: Timestamp.now()
        }

        const userData = {
            attendance: on_duty ? "on duty" : "off duty",
            attendance_date: Timestamp.now(),
        }

        const currentUserName = await getUserNameById(currentUserId);
        const targetName = await getUserNameById(targetId);

        await attendanceRef.set(attendanceData);
        await userRef.update(userData);

        await sendAdminNotifications({
            heading: "Update User Attendance",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} update the attendance of ${capitalizeFirstLetter(targetName)}`,
            title: `${capitalizeFirstLetter(currentUserName)} update user Attendance`,
            message: `${capitalizeFirstLetter(currentUserName)} just updated a attendance of ${capitalizeFirstLetter(targetName)}`,
            type: 'user'
        });

        await logUserActivity({ 
            heading: "attendance",
            currentUserId: currentUserId, 
            activity: 'user has updated an attendance' 
        });

        return res.status(200).json({
            success: true,
            message: "Update Attendance Success"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Update Attendance Failed',
            error: error.message
        });
    }
}

//!=================================================================  A D M I N   U P D A T E ==================================================================

const updateAttendance = async(req, res) => {
    try {
        const { currentUserId, targetId } = req.params;
        const { id, on_duty } = req.body;

        const userRef = db.collection('users').doc(id);
        const attendanceRef = db.collection('attendance').doc(targetId);

        await attendanceRef.update({
            on_duty
        });

        await userRef.update({
            attendance: on_duty ? "on duty" : "off duty",
        });

        const currentUserName = await getUserNameById(currentUserId);
        const targetName = await getUserNameById(id);

        await sendAdminNotifications({
            heading: "Update User Attendance",
            fcmMessage: `${capitalizeFirstLetter(currentUserName)} update the attendance of ${capitalizeFirstLetter(targetName)}`,
            title: `${capitalizeFirstLetter(currentUserName)} update user Attendance`,
            message: `${capitalizeFirstLetter(currentUserName)} just updated a attendance of ${capitalizeFirstLetter(targetName)}`,
            type: 'user'
        });

        await logUserActivity({ 
            heading: "attendance",
            currentUserId: currentUserId, 
            activity: 'user has updated an attendance' 
        });

        return res.status(200).json({
            success: true,
            message: "Update Attendance Success"
        });

    } catch (error) {
         return res.status(500).json({
            success: false,
            message: 'Update Attendance Failed',
            error: error.message
        });
    }
}

module.exports = { userAttendance, adminUpdateAttendance, updateAttendance }