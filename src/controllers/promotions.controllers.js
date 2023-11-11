import { getConnection } from '../database/database';


const addPromotion = async (req, res) => {
    // Asumiendo que se envía el id_producto y no el nombre del producto en el cuerpo de la solicitud
    const { description, price, id_producto } = req.body;
    const image = req.file ? req.file.filename : null; 

    if (!description || !price || !image || !id_producto) {
        let message = "Por favor, completa todos los campos.";

        if (!description) message = "La descripcion es requerida";
        else if (!price) message = "El precio es requerido.";
        else if (!image) message = "La imagen es requerida.";
        else if (!id_producto) message = "La categoría es requerida.";

        return res.status(400).json({ message });
    }

    const promo = { description, price, image, id_producto };

    try {
        const connection = await getConnection();

        connection.query("INSERT INTO promotions SET ?", promo, (error, results) => {
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

// Aquí irían las funciones getPromotions, getPromotion, deletePromotion, updatePromotion

export const promotionMethods = {
    addPromotion,
    // Aquí irían las otras exportaciones
};
