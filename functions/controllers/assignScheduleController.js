const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");

const db = firestore();

const assignStoreSchedule = async (req, res) => {
  try {

    const { targetId } = req.params;
    const { assign_users, weekly_pattern, same_time } = req.body;

    if(!Array.isArray(assign_users), !Array.isArray(weekly_pattern), same_time){
      return res.status(400).json({ success: false, message: "Assign users must be an array" });
    }

    const scheduleRef = db.collection('stores').doc(targetId).collection('schedules').doc();
    const scheduleId = scheduleRef.id;

    for(const users of assign_users){
      const userRef = db.collection('users').doc(users);

      const scheduleRef = {
        user_id: users,
        id: scheduleId,
        

      }
    }


    res.status(200).json({ success: true, message: "Schedules assigned successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

// const getNextWeekdayDate = (baseDate, targetDay) => {
//     const weekdays = {
//         sunday: 0,
//         monday: 1,
//         tuesday: 2,
//         wednesday: 3,
//         thursday: 4,
//         friday: 5,
//         saturday: 6,
//     };

//     const base = new Date(baseDate.toDate());
//     const dayOfWeek = base.getDay();
//     const targetDayNum = weekdays[targetDay.toLowerCase()];

//     let diff = targetDayNum - dayOfWeek;
//     if (diff < 0) diff += 7; 

//     const resultDate = new Date(base);
//     resultDate.setDate(base.getDate() + diff);
//     resultDate.setHours(0, 0, 0, 0); 

//     return Timestamp.fromDate(resultDate);
// };

// const assignStoreSchedule = async (req, res) => {
//     try {
//         const { storeId, users, same_time, weekly_pattern } = req.body;

//         if (!Array.isArray(users) || !Array.isArray(weekly_pattern)) {
//             return res.status(400).json({ success: false, message: "Invalid Data" });
//         }

//         const storeDoc = await db.collection(collections.storesCollection).doc(storeId).get();
//         if (!storeDoc.exists) {
//             return res.status(404).json({ success: false, message: "Store not found" });
//         }

//         for (const userId of users) {
//             const userDoc = await db.collection('users').doc(userId).get();
//             if (!userDoc.exists) {
//                 return res.status(404).json({ success: false, message: `User ${userId} not found` });
//             }

//             const userScheduleRef = db.collection(collections.usersCollections)
//                 .doc(userId)
//                 .collection("schedules")
//                 .doc();

//             const created_at = Timestamp.now();

//             await userScheduleRef.set({
//                 store: storeId,
//                 same_time,
//                 created_at,
//             });

//             for (const pattern of weekly_pattern) {
//                 const date = getNextWeekdayDate(created_at, pattern.day);

//                 const dayScheduleRef = userScheduleRef.collection("days").doc();
//                 await dayScheduleRef.set({
//                     day: pattern.day,
//                     date, 
//                     start_time: pattern.start_time,
//                     end_time: pattern.end_time,
//                 });
//             }

//             const notificationRef = db.collection(collections.usersCollections)
//                 .doc(userId)
//                 .collection(subCollections.notifications)
//                 .doc();

//             await notificationRef.set({
//                 message: `You're assigned to ${storeId}.`,
//                 type: "schedule",
//                 read: false,
//                 created_at,
//             });
//         }

//         res.status(200).json({ success: true, message: "Schedules assigned successfully" });
//     } catch (error) {
//         console.error("Error assigning store schedule:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };

// const getSchedule = async (req, res) => {
//     try {
//         const { date } = req.params;

//         const targetDate = new Date(date);
//         targetDate.setHours(0, 0, 0, 0);
//         const targetTime = targetDate.getTime();

//         const usersSnapshot = await db.collection(collections.usersCollections).get();
//         const usersWithSchedule = [];

//         for (const userDoc of usersSnapshot.docs) {
//             const userId = userDoc.id;
//             const schedulesSnapshot = await db.collection(collections.usersCollections)
//                 .doc(userId)
//                 .collection("schedules")
//                 .get();

//             for (const scheduleDoc of schedulesSnapshot.docs) {
//                 const scheduleId = scheduleDoc.id;

//                 const daysSnapshot = await db.collection(collections.usersCollections)
//                     .doc(userId)
//                     .collection("schedules")
//                     .doc(scheduleId)
//                     .collection("days")
//                     .get();

//                 for (const dayDoc of daysSnapshot.docs) {
//                     const dayData = dayDoc.data();

//                     // Compare day.date with targetDate
//                     if (dayData.date && dayData.date.toDate().getTime() === targetTime) {
//                         usersWithSchedule.push({
//                             userId,
//                             scheduleId,
//                             store: scheduleDoc.data().store,
//                             day: dayData.day,
//                             date,
//                             start_time: dayData.start_time,
//                             end_time: dayData.end_time,
//                         });
//                     }
//                 }
//             }
//         }

//         res.status(200).json({ success: true, data: usersWithSchedule });
//     } catch (error) {
//         console.error("Error getting schedule:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };

// const dayjs = require('dayjs');
// const weekday = require('dayjs/plugin/weekday');
// const utc = require('dayjs/plugin/utc');

// dayjs.extend(weekday);
// dayjs.extend(utc);

// const assignStoreSchedule = async (req, res) => {
//   try {
//     const { storeId, users, weekly_pattern } = req.body;

//     const time = Timestamp.now();

//     if (!Array.isArray(users) || !Array.isArray(weekly_pattern) || !time) {
//       return res.status(400).json({ success: false, message: "Invalid Data" });
//     }

//     const storeDoc = await db.collection(collections.storesCollection).doc(storeId).get();
//     if (!storeDoc.exists) {
//       return res.status(404).json({ success: false, message: "Store not found" });
//     }

//     const baseDate = dayjs(time.toDate()).startOf('day');

//     const dayNameToIndex = {
//       sunday: 0,
//       monday: 1,
//       tuesday: 2,
//       wednesday: 3,
//       thursday: 4,
//       friday: 5,
//       saturday: 6,
//     };

//     for (const userId of users) {
//       const userDoc = await db.collection(collections.usersCollections).doc(userId).get();
//       if (!userDoc.exists) {
//         throw new Error(`User ${userId} not found`);
//       }

//       const scheduleRef = db.collection(collections.usersCollections).doc(userId).collection("schedules").doc();
//       const scheduleId = scheduleRef.id; // Save this so we can create the subcollection

//       // Create the main schedule doc
//       await scheduleRef.set({
//         store: storeId,
//         created_at: Timestamp.now(),
//         assignedBy: "system", // optional: if you want to track who assigned
//       });

//       // Write each day as a doc in subcollection
//       for (const pattern of weekly_pattern) {
//         const targetDayIndex = dayNameToIndex[pattern.day.toLowerCase()];
//         const currentDayIndex = baseDate.day();
//         const daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7;

//         const scheduleDate = baseDate.add(daysToAdd, 'day');
//         const formattedDate = scheduleDate.format('YYYY-MM-DD'); // Use this as doc ID

//         const dayDocRef = db
//           .collection(collections.usersCollections)
//           .doc(userId)
//           .collection("schedules")
//           .doc(scheduleId)
//           .collection("days")
//           .doc(formattedDate);

//         await dayDocRef.set({
//           day: pattern.day,
//           start_time: pattern.start_time,
//           end_time: pattern.end_time,
//           date: scheduleDate.toDate(),
//         });
//       }

//       // Create notification
//       const notificationRef = db.collection(collections.usersCollections)
//         .doc(userId)
//         .collection(subCollections.notifications)
//         .doc();

//       await notificationRef.set({
//         title: `You have been scheduled to ${storeId}`,
//         isRead: false,
//         type: "schedule",
//         created_at: Timestamp.now(),
//       });
//     }

//     res.status(200).json({ success: true, message: "Schedules assigned successfully" });
//   } catch (error) {
//     console.error("Error assigning store schedule:", error.message);
//     res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
//   }
// };


// const getSchedulesByDate = async (req, res) => {
//     try {
//       const { date } = req.params; // Expecting "2025-02-20"
  
//       if (!date) {
//         return res.status(400).json({ success: false, message: "Date is required" });
//       }
  
//       const targetDate = new Date(date);
//       targetDate.setHours(0, 0, 0, 0);
  
//       const snapshot = await db.collectionGroup('days')
//         .where('date', '==', targetDate)
//         .get();
  
//       const schedules = [];
  
//       for (const doc of snapshot.docs) {
//         const dayData = doc.data();
  
//         const schedulePath = doc.ref.path; // e.g., users/{userId}/schedules/{scheduleId}/days/{date}
//         const pathParts = schedulePath.split('/');
  
//         const userId = pathParts[1]; // get userId from path
  
//         const userDoc = await db.collection('users').doc(userId).get();
//         const user = userDoc.exists ? userDoc.data() : null;
  
//         schedules.push({
//           userId,
//           userName: user?.name || "Unknown",
//           userRole: user?.role || "Unknown",
//           schedule: dayData,
//         });
//       }
  
//       return res.status(200).json({ success: true, data: schedules });
//     } catch (error) {
//       console.error("Error getting schedules:", error);
//       res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// // };
  
// const getSchedulesByDate = async (req, res) => {
//     try {
//       const { date } = req.params;
  
//       if (!dayjs(date, 'YYYY-MM-DD', true).isValid()) {
//         return res.status(400).json({ success: false, message: 'Invalid date format' });
//       }
  
//       const usersSnapshot = await db.collection(collections.usersCollections).get();
//       const results = [];
  
//       for (const userDoc of usersSnapshot.docs) {
//         const userId = userDoc.id;
  
//         const schedulesSnapshot = await db
//           .collection(collections.usersCollections)
//           .doc(userId)
//           .collection('schedules')
//           .get();
  
//         for (const scheduleDoc of schedulesSnapshot.docs) {
//             const scheduleData = scheduleDoc.data();

//           const dayDoc = await db
//             .collection(collections.usersCollections)
//             .doc(userId)
//             .collection('schedules')
//             .doc(scheduleDoc.id)
//             .collection('days')
//             .doc(date)
//             .get();
  
//           if (dayDoc.exists) {
//             results.push({
//               userId,
//               storeId: scheduleData.store,
//               scheduleId: scheduleDoc.id,
//               schedule: dayDoc.data()
//             });
//           }
//         }
//       }
  
//       if (results.length === 0) {
//         return res.status(404).json({ success: false, message: 'No schedules found for this date' });
//       }
  
//       res.status(200).json({ success: true, data: results });
//     } catch (error) {
//       console.error("Error fetching schedules for date:", error.message);
//       res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
//     }
//   };
  

module.exports = { assignStoreSchedule }