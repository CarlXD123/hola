import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "No Authorization header present." });
    }

    const token = req.headers.authorization.split(' ')[1]; 
    if (!token) {
      return res.status(401).json({ message: "Bearer token is not present in Authorization header." });
    }

    const decodedToken = jwt.verify(token, 'your-secret-key');
    console.log(decodedToken)
    req.userData = { userId: decodedToken.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed!", error: error.message });
  }
};

export default authenticate;
