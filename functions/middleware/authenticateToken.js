const admin = require('firebase-admin');

const authenticateToken = async (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized: No Bearer token');
    }

    const idToken = req.headers.authorization.split('Bearer ')[1];

    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedIdToken; 
        next(); 
    } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(403).send('Unauthorized: Invalid token');
    }
};

module.exports = authenticateToken;