import { Router } from "express";
import { getRecommendations, initRecommendationSystem, clearRecommendations} from "../ai/recomendation"; 

const router = Router();

// Ruta para iniciar el sistema de recomendación
router.post("/init", async (req, res) => {
    try {
        await initRecommendationSystem();
        res.json({
            message: "Sistema de recomendación iniciado exitosamente."
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al iniciar el sistema de recomendación");
    }
});

// Ruta para obtener recomendaciones para un usuario
router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const recommendations = await getRecommendations(userId);
        res.json({
            userId: userId,
            recommendations: recommendations
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al obtener recomendaciones");
    }
});

// Ruta para borrar todas las recomendaciones existentes
router.post("/clear", async (req, res) => {
  try {
      await clearRecommendations();
      res.json({
          message: "Todas las recomendaciones han sido eliminadas."
      });
  } catch (error) {
      console.error(error);
      res.status(500).send("Error al eliminar las recomendaciones");
  }
});

export default router;
