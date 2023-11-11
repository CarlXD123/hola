import express from "express";
import morgan from "morgan";
import cors from 'cors'; 
//Routes
import userRoutes from "./routes/language.routes"
import productRoutes from "./routes/product.routes"
import ordersRoutes from "./routes/orders.routes"
import recomendationsRoutes from "./routes/recomendation.routes"
import promotionsroutes from "./routes/promotion.routes"
// Importar función de inicialización del sistema de recomendación

const app = express();

//Settings
app.set("port", 4000);

//Middlewares
app.use(morgan("dev"));
app.use(cors());  // <-- Habilita CORS aquí
app.use(express.json());

//Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/promotions", promotionsroutes);
app.use("/api/recommendations", recomendationsRoutes);
app.use('/uploads', express.static('uploads'));


export default app;
