import { getConnection } from '../database/database';

const addProduct = async (req, res) => {
    const { name, description, price, category } = req.body;
    const image = req.file ? req.file.filename : null; 

    if (!name || !description || !price || !image || !category) {
        let message = "Por favor, completa todos los campos.";

        if (!name) message = "El nombre es requerido.";
        else if (!description) message = "La descripción es requerida.";
        else if (!price) message = "El precio es requerido.";
        else if (!image) message = "La imagen es requerida.";
        else if (!category) message = "La categoría es requerida.";

        return res.status(400).json({ message });
    }

    const product = { name, description, price, image, category };

    try {
        const connection = await getConnection();

        connection.query("INSERT INTO products SET ?", product, (error, results) => {
            connection.release();
            if (error) {
                console.error(error);
                return res.status(500).send(error.message);
            }

            res.json({
                message: "Producto agregado exitosamente",
                productId: results.insertId,
            });
        });
    } catch (error) {
        console.error("Error al obtener conexión:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getProducts = async (req, res) => {
    try {
        const connection = await getConnection();

        connection.query("SELECT id_product, name, description, price, image, category FROM `products`", (error, results) => {
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

const getProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await getConnection();

        connection.query("SELECT id_product, name, description, price, image FROM `products` WHERE id_product = ?", [id], (error, results) => {
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

const deleteProduct = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await getConnection();

        connection.query("DELETE FROM `products` WHERE id_product = ?", [id], (error, results) => {
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

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!name && !description && !price && !category && !image) {
        return res.status(400).json({
            message: "Por favor, proporciona al menos un campo para actualizar.",
        });
    }

    let updates = [];
    let values = [];

    if (name) {
        updates.push("name = ?");
        values.push(name);
    }

    if (description) {
        updates.push("description = ?");
        values.push(description);
    }

    if (price) {
        updates.push("price = ?");
        values.push(price);
    }

    if (category) {
        updates.push("category = ?");
        values.push(category);
    }

    if (image) {
        updates.push("image = ?");
        values.push(image);
    }

    values.push(id);

    const query = `UPDATE products SET ${updates.join(", ")} WHERE id_product = ?`;

    try {
        const connection = await getConnection();

        connection.query(query, values, (error, results) => {
            connection.release();
            if (error) {
                console.error("Error de la base de datos:", error);
                return res.status(500).json({
                    message: "Error interno del servidor. Por favor, intenta de nuevo.",
                });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ message: "Producto no encontrado." });
            }

            res.json({
                message: "Producto actualizado con éxito",
                updatedFields: results.changedRows,
            });
        });
    } catch (error) {
        console.error("Error al obtener conexión:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const methods = {
    addProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
};
