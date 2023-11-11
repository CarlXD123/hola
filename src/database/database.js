const mysql = require("mysql");
import config from "../config";

const pool = mysql.createPool({
  host: config.host,
  database: config.database,
  user: config.user,
  password: config.password,
  
});

function getConnection() {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
}

// Test
async function testConnection() {
  try {
    const connection = await getConnection();
    console.log("Conexión exitosa");
    connection.release();
  } catch (err) {
    console.error("Error al obtener conexión:", err);
  }
}

testConnection();

export { getConnection };

