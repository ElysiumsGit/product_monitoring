const { firestore } = require("firebase-admin");
const { Timestamp } = require("firebase-admin/firestore");
const { sendAdminNotifications, capitalizeFirstLetter, logUserActivity, getUserNameById } = require("../utils/functions");

const db = firestore();
const addSubmission = async (req, res) => {
    const { currentUserId } = req.params;

    try {
        const submissions = req.body; 

        if (!Array.isArray(submissions) || submissions.length === 0) {
            return res.status(400).json({ success: false, message: "No submission data provided." });
        }

        const submissionPromises = submissions.map((datus) => {
            const {
                image,
                user_id,
                store_id,
                product_id,
                display_quantity,
                add_quantity,
            } = datus;

            const submissionRef = db.collection("submissions").doc();
            const submissionId = submissionRef.id;

            const data = {
                submission_id: submissionId,
                image,
                user_id,
                store_id,
                product_id,
                display_quantity,
                add_quantity,
                status: "pending",
                created_at: Timestamp.now(),
            };

            return submissionRef.set(data); 
        });

        await Promise.all(submissionPromises);

        const firstName = await getUserNameById(currentUserId);

        await sendAdminNotifications({
            heading: "Submission of Promodiser",
            title: `${capitalizeFirstLetter(firstName)} submitted data`,
            message: `${capitalizeFirstLetter(firstName)} submitted data`,
            type: "submission",
        });

        await logUserActivity({
            heading: "submission",
            currentUserId,
            activity: "You have submitted display data",
        });

        res.status(200).json({ success: true, message: "Submissions successfully recorded." });
    } catch (error) {
        console.error("Error during submission:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


module.exports = { addSubmission }