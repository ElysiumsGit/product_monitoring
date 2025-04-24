const { firestore } = require("firebase-admin");
const { collections, subCollections } = require("../utils/utils");
const { Timestamp } = require("firebase-admin/firestore");

const db = firestore();

const getNextWeekdayDate = (baseDate, targetDay) => {
    const weekdays = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
    };

    const base = new Date(baseDate.toDate());
    const dayOfWeek = base.getDay();
    const targetDayNum = weekdays[targetDay.toLowerCase()];

    let diff = targetDayNum - dayOfWeek;
    if (diff < 0) diff += 7; 

    const resultDate = new Date(base);
    resultDate.setDate(base.getDate() + diff);
    resultDate.setHours(0, 0, 0, 0); 

    return Timestamp.fromDate(resultDate);
};

const assignStoreSchedule = async (req, res) => {
    try {
        const { storeId, users, same_time, weekly_pattern } = req.body;

        if (!Array.isArray(users) || !Array.isArray(weekly_pattern)) {
            return res.status(400).json({ success: false, message: "Invalid Data" });
        }

        const storeDoc = await db.collection(collections.storesCollection).doc(storeId).get();
        if (!storeDoc.exists) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        for (const userId of users) {
            const userDoc = await db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                return res.status(404).json({ success: false, message: `User ${userId} not found` });
            }

            const userScheduleRef = db.collection(collections.usersCollections)
                .doc(userId)
                .collection("schedules")
                .doc();

            const createdAt = Timestamp.now();

            await userScheduleRef.set({
                store: storeId,
                same_time,
                createdAt,
            });

            for (const pattern of weekly_pattern) {
                const date = getNextWeekdayDate(createdAt, pattern.day);

                const dayScheduleRef = userScheduleRef.collection("days").doc();
                await dayScheduleRef.set({
                    day: pattern.day,
                    date, 
                    start_time: pattern.start_time,
                    end_time: pattern.end_time,
                });
            }

            const notificationRef = db.collection(collections.usersCollections)
                .doc(userId)
                .collection(subCollections.notifications)
                .doc();

            await notificationRef.set({
                message: `You're assigned to ${storeId}.`,
                type: "schedule",
                read: false,
                createdAt,
            });
        }

        res.status(200).json({ success: true, message: "Schedules assigned successfully" });
    } catch (error) {
        console.error("Error assigning store schedule:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getSchedule = async (req, res) => {
    try {
        const { date } = req.params;

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const targetTime = targetDate.getTime();

        const usersSnapshot = await db.collection(collections.usersCollections).get();
        const usersWithSchedule = [];

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const schedulesSnapshot = await db.collection(collections.usersCollections)
                .doc(userId)
                .collection("schedules")
                .get();

            for (const scheduleDoc of schedulesSnapshot.docs) {
                const scheduleId = scheduleDoc.id;

                const daysSnapshot = await db.collection(collections.usersCollections)
                    .doc(userId)
                    .collection("schedules")
                    .doc(scheduleId)
                    .collection("days")
                    .get();

                for (const dayDoc of daysSnapshot.docs) {
                    const dayData = dayDoc.data();

                    // Compare day.date with targetDate
                    if (dayData.date && dayData.date.toDate().getTime() === targetTime) {
                        usersWithSchedule.push({
                            userId,
                            scheduleId,
                            store: scheduleDoc.data().store,
                            day: dayData.day,
                            date,
                            start_time: dayData.start_time,
                            end_time: dayData.end_time,
                        });
                    }
                }
            }
        }

        res.status(200).json({ success: true, data: usersWithSchedule });
    } catch (error) {
        console.error("Error getting schedule:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};




module.exports = { assignStoreSchedule, getSchedule }