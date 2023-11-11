import { Router } from "express";
import { methods as Products } from "../controllers/product.controllers";
import upload from '../multerConfig';

const router=Router();

// Agregar productos
router.post('/', upload.single('image'), Products.addProduct);
router.get("/", Products.getProducts);
router.delete("/:id", Products.deleteProduct);
router.get("/:id", Products.getProduct);
router.put("/:id", upload.single('image'), Products.updateProduct);


export default router;