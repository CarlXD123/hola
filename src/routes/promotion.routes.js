import { Router } from "express";
import { promotionMethods as Promotions } from "../controllers/promotions.controllers"; // Asumiendo que tus métodos están aquí
import upload from '../multerConfig';

const router = Router();

// Ruta para agregar una nueva promoción
router.post("/add",  upload.single('image'), Promotions.addPromotion);

export default router;
