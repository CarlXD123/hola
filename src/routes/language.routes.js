import { Router } from "express";
import { methods as Users } from "../controllers/language.controllers";
import authenticate from '../middleware/authenticate';


const router=Router();

// Supongamos que todos pueden ver la lista de usuarios y un usuario específico
router.get("/", Users.getUsers);
router.get("/:id", Users.getUser);

// Solo usuarios autenticados pueden agregar, actualizar o eliminar usuarios.
// Y quizás solo los administradores puedan eliminar o actualizar usuarios.
router.post("/", Users.addUsers);
router.put("/:id", Users.updateUser);
router.delete("/:id", Users.deleteUser);

// La autenticación es necesaria para iniciar sesión, pero no se necesita autorización ya que cualquier usuario puede iniciar sesión.
router.post("/login", Users.loginUser);

// Añadir ruta para obtener el perfil del usuario autenticado.
// Cualquier usuario autenticado puede ver su propio perfil.
router.get("/profile/:id", authenticate, Users.getProfile);


export default router;
