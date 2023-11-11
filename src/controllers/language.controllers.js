import { getConnection } from '../database/database';  
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const saltRounds = 10;

const getUsers = async (req, res) => {
    try {
        const connection = await getConnection();
        connection.query("SELECT username, email, rol, idrol FROM `users`", (error, results) => {
            connection.release();  
            if (error) {
                console.error(error);
                return res.status(500).json({ message: "Internal Server Error" });
            }
            res.json(results);
        });
    } catch (error) {
        console.error("Error al obtener conexión:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;

    if (!id || !username || !password) {
        return res.status(400).json({ message: "Bad request. Please fill all fields." });
    }

    const usuario = { username, password };

    try {
        const connection = await getConnection();
        connection.query("UPDATE `users` SET ? WHERE id_usuario = ?", [usuario, id], (error, results) => {
            connection.release();
            if (error) {
                console.error(error);
                return res.status(500).send(error.message);
            }
            res.json(results);
        });
    } catch (error) {
        console.error("Error al obtener conexión:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getUser = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Bad request. Please provide a valid user ID." });
    }

    try {
        const connection = await getConnection();
        connection.query("SELECT id_usuario, username FROM `users` WHERE id_usuario = ?", id, (error, results) => {
            connection.release();
            if (error) {
                console.error(error);
                return res.status(500).send(error.message);
            }
            res.json(results);
        });
    } catch (error) {
        console.error("Error al obtener conexión:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const deleteUser = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Bad request. Please provide a valid user ID." });
    }

    try {
        const connection = await getConnection();
        connection.query("DELETE FROM `users` WHERE id_usuario = ?", id, (error, results) => {
            connection.release();
            if (error) {
                console.error(error);
                return res.status(500).send(error.message);
            }
            res.json(results);
        });
    } catch (error) {
        console.error("Error al obtener conexión:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const addUsers = async (req, res) => {
    const { username, password, email, rol, idrol } = req.body;

    if (!username || !password || !email || !rol || !idrol) {
        return res.status(400).json({ message: "Please fill all fields." });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const usuario = { username, password: hashedPassword, email, rol, idrol};

    try {
        const connection = await getConnection();
        connection.query("INSERT INTO users SET ?", usuario, (error, results) => {
            connection.release();
            if (error) {
                console.error(error);
                return res.status(500).send(error.message);
            }
            res.json(results);
        });
    } catch (error) {
        console.error("Error al obtener conexión:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Attempting to log in with email:", email);

        console.log(password);

        const connection = await getConnection();
        connection.query("SELECT * FROM `users` WHERE email = ?", email, async (error, users) => {
            connection.release();
            if (error) {
                console.error(error);
                return res.status(500).send(error.message);
            }

            if (users.length > 0) {
                const user = users[0];
                const match = await bcrypt.compare(password, user.password);

                if (match) {
                    const token = jwt.sign({ id: user.id }, "your-secret-key", {
                        expiresIn: "1h",
                    });
                    res.json({ message: "Login successful", token: token, userData: user });
                } else {
                    console.log("Password mismatch");
                    res.status(400).json({ message: "Invalid password" });
                }
            } else {
                console.log("User not found in database");
                res.status(400).json({ message: "User not found" });
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getProfile = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Bad request. Please provide a valid user ID." });
    }

    try {
        const connection = await getConnection();
        connection.query("SELECT id_usuario, username FROM `users` WHERE id_usuario = ?", id, (error, results) => {
            connection.release();
            if (error) {
                console.error(error);
                return res.status(500).send(error.message);
            }

            if (results && results.length > 0) {
                res.json(results[0]);
            } else {
                res.status(404).json({ message: "User not found" });
            }
        });
    } catch (error) {
        console.error("Error al obtener conexión:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const methods = {
    getUsers,
    addUsers,
    getUser,
    deleteUser,
    updateUser,
    loginUser,
    getProfile,
};
