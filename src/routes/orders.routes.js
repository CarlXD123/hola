import { Router } from "express";
import { methods as Orders } from "../controllers/orders.controller"; // Asume que has creado este controlador

const router = Router();

// Consultar todos los pedidos (útil para administradores)
router.get("/", Orders.getAllOrders);

// Consultar un pedido específico por ID
router.get("/:id", Orders.getOrderById);

// Crear un nuevo pedido
router.post("/", Orders.createOrder);

// Actualizar un pedido (por ejemplo, cambiar su estado)
router.put("/:id", Orders.updateOrder);

// Eliminar un pedido (limitado a administradores)
router.delete("/:id", Orders.deleteOrder);

// Si quieres una ruta donde un usuario puede ver solo sus propios pedidos:
router.get("/user-orders", Orders.getOrdersByUserId);

export default router;