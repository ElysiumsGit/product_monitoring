const admin = require('firebase-admin');
const renderErrorPage = require('../renderHtml/error');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res
            .status(401)
            .send(renderErrorPage());
    }

    if (!authHeader.startsWith('Bearer ')) {
        return res
            .status(401)
            .send(renderErrorPage());
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedIdToken;
        next();
    } catch (error) {
        console.error('Error verifying token:', error.message);
        return res
            .status(403)
            .send(renderErrorPage());
    }
};

module.exports = authenticateToken;
