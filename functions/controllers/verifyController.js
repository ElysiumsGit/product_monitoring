const { firestore } = require("firebase-admin");
const { getUserNameById, getEmailById } = require("../utils/functions");
const { successVerify } = require("../emailer/emailer");
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key';
const db = firestore();

const verifyUser = async(req, res) => {
    const { token } = req.query;
  
    if (!token) {
      return res.status(400).send('Token is required.');
    }
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const { id } = decoded;
  
      const userRef = db.collection('users').doc(id);
      const userSnapshot = await userRef.get();
  
      if (!userSnapshot.exists) {
        return res.status(404).send('User not found.');
      }
  
      const userData = userSnapshot.data();
      const getUserName = await getUserNameById(id);
      const getEmail = await getEmailById(id);

      if (userData.is_verified) {
        return res.send('User already verified.');
      }
  
      await userRef.update({ 
        is_verified: true, 
        status: "active" 
      });
      
      await successVerify(getEmail, getUserName);
      res.send('Account successfully verified!');

    } catch (error) {
      console.error('Error verifying token:', error);
      res.status(500).send('Failed to verify the token.');
    }
}

module.exports = { verifyUser }