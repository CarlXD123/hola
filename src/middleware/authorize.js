import { getConnection } from '../database/database';

const authorize = (role) => {
  return async (req, res, next) => {
    const userId = req.userData.userId;

    try {
      const connection = await getConnection();

      connection.query("SELECT rol FROM `users` WHERE id = ?", [userId], (error, results) => {
        connection.release();
        if (error || results.length === 0) {
          return res.status(403).json({ message: "User not found." });
        }

        const userRole = results[0].rol;

        if (userRole !== role) {
          return res.status(403).json({ message: "Insufficient permissions." });
        }

        next();
      });
    } catch (error) {
      console.error("Error al obtener conexión:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

export default authorize;
