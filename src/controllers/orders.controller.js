import { getConnection } from '../database/database';

const createOrder = async (req, res) => {
    const { userId, selectedItems } = req.body;
    if (!userId || !selectedItems || selectedItems.length === 0) {
        return res.status(400).json({ message: "Datos del pedido incompletos." });
    }

    try {
        const connection = await getConnection();

        const order = { 
            id_usuario: userId, 
            date_order: new Date(), 
            total: 0,
            status: "Pendiente"
        };

        connection.query("INSERT INTO orders SET ?", order, async (error, results) => {
            if (error) {
                connection.release();
                console.error(error);
                return res.status(500).send(error.message);
            }
            const orderId = results.insertId;

            let totalAmount = 0;
            for (let item of selectedItems) {
                const detail = {
                    id_order: orderId,
                    id_product: item.id,
                    count: item.quantity,
                    price_unit: item.price,
                    sub_total: item.price * item.quantity
                };
                totalAmount += detail.sub_total;

                await new Promise((resolve, reject) => {
                    connection.query("INSERT INTO orderdetails SET ?", detail, (error) => {
                        if (error) {
                            reject(error);
                            return;
                        }
                        resolve();
                    });
                });
            }

            connection.query("UPDATE orders SET total = ? WHERE id_order = ?", [totalAmount, orderId], (error) => {
                connection.release();
                if (error) {
                    console.error(error);
                    return res.status(500).send(error.message);
                }
                res.json({
                    message: "Pedido realizado con éxito",
                    orderId: orderId
                });
            });
        });
    } catch (error) {
        console.error("Error al obtener conexión:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const connection = await getConnection();

        connection.query("SELECT o.id_order, o.date_order, od.price_unit, o.status, od.id_product, p.name AS product_name, od.count, od.price_unit, od.sub_total, u.username AS customer_name, u.direccion AS customer_address, u.telefono AS customer_phone FROM orders o JOIN orderdetails od ON o.id_order = od.id_order JOIN products p ON od.id_product = p.id_product JOIN users u ON o.id_usuario = u.id_usuario", (error, results) => {
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



const getOrderById = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await getConnection();

        connection.query("SELECT * FROM orders WHERE id_order = ?", [id], (error, results) => {
            connection.release();
            if (error) {
                console.error(error);
                return res.status(500).send(error.message);
            }
            if (results.length === 0) {
                return res.status(404).json({ message: "Pedido no encontrado." });
            }
            res.json(results[0]);
        });
    } catch (error) {
        console.error("Error al obtener conexión:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const updateOrder = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const connection = await getConnection();

        connection.query("UPDATE orders SET status = ? WHERE id_order = ?", [status, id], (error) => {
            connection.release();
            if (error) {
                console.error(error);
                return res.status(500).send(error.message);
            }
            res.json({ message: "Pedido actualizado con éxito." });
        });
    } catch (error) {
        console.error("Error al obtener conexión:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const deleteOrder = async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await getConnection();

        connection.query("DELETE FROM orders WHERE id_order = ?", [id], (error) => {
            connection.release();
            if (error) {
                console.error(error);
                return res.status(500).send(error.message);
            }
            res.json({ message: "Pedido eliminado con éxito." });
        });
    } catch (error) {
        console.error("Error al obtener conexión:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getOrdersByUserId = async (req, res) => {
    const { userId } = req.params;

    try {
        const connection = await getConnection();

        connection.query("SELECT * FROM orders WHERE id_usuario = ?", [userId], (error, results) => {
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

export const methods = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    getOrdersByUserId
};
