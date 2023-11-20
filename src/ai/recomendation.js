// Importando TensorFlow.js para Node.js y la función de conexión a la base de datos.
import * as tf from "@tensorflow/tfjs-node";
import { getConnection } from "../database/database";

// Inicializando el modelo como null para comenzar.
let model = null;

// Definiendo el número de productos que se van a recomendar.
const N = 10;

async function fetchData(query, values) {
  const connection = await getConnection();
  return new Promise((resolve, reject) => {
    connection.query(query, values, (error, results) => {
      connection.release();
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

//Esto construye la matriz usuario-producto, ponderando con 1 o 0 si el usuario pidio o no el producto
async function buildUserProductMatrix() {
  const users = await fetchData("SELECT DISTINCT id_usuario FROM orders");
  const products = await fetchData("SELECT DISTINCT id_product FROM products");

  const matrix = [];
  for (const user of users) {
    const userOrders = await getUserOrderHistory(user.id_usuario);
    const orderedProducts = preprocessOrderHistory(userOrders);
    const row = products.map((product) =>
      orderedProducts.includes(product.id_product) ? 1 : 0
    );
    matrix.push(row);
  }
  return { matrix, users, products };
}

// Función asíncrona para generar y guardar recomendaciones.
async function generateAndSaveRecommendations() {
  // Si no hay un modelo de recomendación cargado, entrena uno nuevo.
  if (!model) {
    model = await trainRecommendationModel();
  }
  // Obtiene una lista de usuarios distintos de la base de datos.
  const users = await fetchData("SELECT DISTINCT id_usuario FROM orders");
  // Itera sobre cada usuario.
  for (const user of users) {
    // Genera recomendaciones para el usuario actual.
    const recommendations = await generateRecommendationsForUser(
      user.id_usuario
    );
    // Guarda las recomendaciones generadas para el usuario actual.
    await saveRecommendationsForUser(user.id_usuario, recommendations);
  }
}

// Función asíncrona para obtener datos de entrenamiento.
async function getTrainingData() {
  // Construye una matriz de usuarios y productos.
  const { matrix } = await buildUserProductMatrix();
  // Inicializa arrays para almacenar índices de usuarios, productos y las etiquetas (ratings, interacciones, etc.).
  const userIndices = [];
  const productIndices = [];
  const labels = [];
  // Itera sobre la matriz para poblar los arrays.
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      // Añade el índice del usuario.
      userIndices.push(i);
      // Añade el índice del producto.
      productIndices.push(j);
      // Añade la etiqueta (valor en la matriz).
      labels.push(matrix[i][j]);
    }
  }
  // Devuelve los datos de entrenamiento en forma de tensores.
  return {
    xs: [
      tf.tensor1d(userIndices, "int32"), // Tensor para índices de usuarios.
      tf.tensor1d(productIndices, "int32"), // Tensor para índices de productos.
    ],
    ys: tf.tensor1d(labels), // Tensor para las etiquetas.
  };
}

// Función asíncrona para entrenar el modelo de recomendación.
async function trainRecommendationModel() {
  // Construye una matriz de interacción entre usuarios y productos.
  const { matrix } = await buildUserProductMatrix();
  // Determina el número de usuarios y productos.
  const [userCount, productCount] = [matrix.length, matrix[0].length];

  // Define la entrada del modelo para usuarios.
  const userInputs = tf.input({ shape: [1], dtype: "int32" });
  // Define la entrada del modelo para productos.
  const productInputs = tf.input({ shape: [1], dtype: "int32" });

  // Crea una capa de embedding para los usuarios.
  const userEmbeddingLayer = tf.layers.embedding({
    inputDim: userCount,
    outputDim: 10,
  });
  // Crea una capa de embedding para los productos.
  const productEmbeddingLayer = tf.layers.embedding({
    inputDim: productCount,
    outputDim: 10,
  });

  // Aplica la capa de embedding a las entradas de usuario.
  const userEmbedded = userEmbeddingLayer.apply(userInputs);
  // Aplica la capa de embedding a las entradas de producto.
  const productEmbedded = productEmbeddingLayer.apply(productInputs);

  // Fusiona las capas embedidas utilizando concatenación y aplanado.
  const merged = tf.layers
    .concatenate()
    .apply([
      tf.layers.flatten().apply(userEmbedded),
      tf.layers.flatten().apply(productEmbedded),
    ]);
  // Crea la capa de salida con una unidad y activación sigmoide.
  const output = tf.layers
    .dense({ units: 1, activation: "sigmoid" })
    .apply(merged);

  // Construye el modelo con las entradas y salidas definidas.
  model = tf.model({ inputs: [userInputs, productInputs], outputs: output });
  // Compila el modelo con el optimizador SGD y pérdida de entropía cruzada binaria.
  model.compile({ optimizer: "sgd", loss: "binaryCrossentropy" });

  // Obtiene los datos de entrenamiento.
  const { xs, ys } = await getTrainingData();
  // Entrena el modelo con los datos de entrenamiento.
  await model.fit(xs, ys, { epochs: 40, batchSize: 96 });

  // Devuelve el modelo entrenado.
  return model;
}

async function saveRecommendationsForUser(userId, recommendations) {
  const existingProducts = await fetchData("SELECT id_product FROM products");
  const existingProductIds = new Set(
    existingProducts.map((product) => product.id_product)
  );

  for (const productId of recommendations) {
    // Continúa solo si el id_product existe en la tabla de productos
    if (!existingProductIds.has(productId)) {
      console.log(
        `Producto con ID ${productId} no existe en la base de datos y será omitido.`
      );
      continue;
    }
    const promoQuery = "SELECT id_promo FROM promotions WHERE id_producto = ?";
    const promoValues = [productId];
    const promoResult = await fetchData(promoQuery, promoValues);

    // Si hay una promoción para este producto, usa su id_promo, si no, usa null.
    const id_promo = promoResult.length ? promoResult[0].id_promo : null;

    // Insertar la recomendación en la base de datos con el id_promo correspondiente.
    const insertQuery =
      "INSERT INTO recomendations (id_user, id_product, id_promo) VALUES (?, ?, ?)";
    const insertValues = [userId, productId, id_promo];
    await fetchData(insertQuery, insertValues);
  }
}

// Función asíncrona para obtener el historial de pedidos de un usuario.
async function getUserOrderHistory(userId) {
  // Define la consulta SQL para obtener los detalles del pedido.
  const query =
    "SELECT orderdetails.id_product FROM orders JOIN orderdetails ON orders.id_order = orderdetails.id_order WHERE orders.id_usuario = ?";
  // Define los valores a ser utilizados en la consulta (en este caso, el ID del usuario).
  const values = [userId];
  // Ejecuta la consulta y devuelve los resultados.
  return await fetchData(query, values);
}

// Función para preprocesar el historial de pedidos.
function preprocessOrderHistory(orderHistory) {
  // Mapea el historial de pedidos para extraer solo los IDs de los productos.
  return orderHistory.map((order) => order.id_product);
}

async function getRecommendations(userId) {
  // Obtiene el historial de pedidos del usuario.
  const userOrderHistory = await getUserOrderHistory(userId);
  // Convierte el historial de pedidos en una lista de IDs de productos comprados.
  const orderedProductIds = userOrderHistory.map((order) => order.id_product);

  // Encuentra promociones basadas en los productos que el usuario ha comprado.
  const promotions = await fetchData("SELECT * FROM promotions");
  let recommendedPromotions = promotions.filter((promotion) =>
    orderedProductIds.includes(promotion.id_producto)
  );

  // Si no hay promociones específicas para los productos comprados, usa selectPromotionBasedOnHistory
  // para encontrar una promoción recomendada basada en otros criterios.
  if (recommendedPromotions.length === 0) {
    const recommendedPromotionId = await selectPromotionBasedOnHistory(userId);
    if (recommendedPromotionId) {
      recommendedPromotions = promotions.filter(
        (promotion) => promotion.id_promo === recommendedPromotionId
      );
    }
  }

  // Si aún no hay promociones recomendadas, devuelve un conjunto vacío de resultados o alguna promoción por defecto.
  if (recommendedPromotions.length === 0) {
    return []; // O reemplaza esto con la lógica para una promoción por defecto.
  }

  // Construye la consulta para obtener los detalles de las promociones recomendadas.
  const promoIds = recommendedPromotions.map((promo) => promo.id_promo);
  const placeholders = promoIds.map(() => "?").join(",");
  const query = `
  SELECT
    'promo' AS type,
    pr.id_promo,
    pr.description,
    pr.price,
    pr.image,
    NULL AS category,
    pr.id_promo
  FROM
    promotions pr
  WHERE
    pr.id_promo IN (${placeholders})`;

  // Ejecuta la consulta con los IDs de las promociones recomendadas.
  return await fetchData(query, promoIds);
}

// Función asíncrona para generar recomendaciones de productos para un usuario específico.
async function generateRecommendationsForUser(userId) {
  // Obtiene una lista de todos los usuarios únicos que han realizado pedidos.
  const users = await fetchData("SELECT DISTINCT id_usuario FROM orders");
  // Obtiene una lista de todos los productos únicos disponibles.
  const products = await fetchData("SELECT DISTINCT id_product FROM products");
  // Obtiene el historial de pedidos del usuario.
  const userOrders = await getUserOrderHistory(userId);
  // Procesa el historial de pedidos para obtener solo los IDs de los productos.
  const orderedProducts = preprocessOrderHistory(userOrders);

  // Crea un array de índices de usuario, donde cada elemento corresponde al índice del usuario actual.
  const userIndices = Array(products.length).fill(
    users.findIndex((user) => user.id_usuario === userId)
  );
  // Crea un array de índices de productos.
  const productIndices = products.map((product, index) => index);

  // Convierte los índices de usuario y producto a tensores para el modelo de recomendación.
  const userTensor = tf.tensor1d(userIndices, "int32");
  const productTensor = tf.tensor1d(productIndices, "int32");

  // Utiliza el modelo para predecir las puntuaciones de los productos para el usuario.
  const scores = model.predict([userTensor, productTensor]);
  // Convierte las puntuaciones predichas a un array.
  const scoresArray = scores.dataSync();

  // Asocia cada producto con su puntuación predicha.
  const scoredProducts = products.map((product, index) => ({
    id_product: product.id_product,
    score: scoresArray[index],
  }));
  // Filtra y ordena los productos para obtener las mejores recomendaciones,
  // excluyendo los productos que el usuario ya ha pedido.
  const topRecommendedProducts = scoredProducts
    .filter((product) => !orderedProducts.includes(product.id_product))
    .sort((a, b) => b.score - a.score)
    .slice(0, N);

  // Obtiene el id de la promoción recomendada basada en el historial de compras del usuario.
  const recommendedPromotionId = await selectPromotionBasedOnHistory(userId);

  // Devuelve los IDs de los productos mejor recomendados junto con la promoción recomendada.
  const topRecommendedProductIds = topRecommendedProducts.map(
    (product) => product.id_product
  );
  return recommendedPromotionId
    ? [...topRecommendedProductIds, recommendedPromotionId]
    : topRecommendedProductIds;
}

// Función para seleccionar la promoción basada en el historial de compras del usuario.
async function selectPromotionBasedOnHistory(userId) {
  // Obtiene el historial de pedidos del usuario.
  const userOrderHistory = await getUserOrderHistory(userId);
  // Convierte el historial de pedidos en una lista de IDs de productos comprados.
  const orderedProductIds = userOrderHistory.map((order) => order.id_product);
  // Encuentra el ID del producto más comprado por el usuario.
  const mostFrequentProductId = findMostFrequentProductId(orderedProductIds);
  // Obtiene todas las promociones.
  const promotions = await fetchData("SELECT * FROM promotions");
  // Encuentra la promoción que incluye el producto más comprado.
  const recommendedPromotion = promotions.find(
    (promotion) => promotion.id_producto == mostFrequentProductId
  );
  // Retorna el id_promo de la promoción recomendada si existe.
  return recommendedPromotion ? recommendedPromotion.id_promo : null;
}

// Función para encontrar el producto más frecuente en el historial de pedidos.
function findMostFrequentProductId(orderedProductIds) {
  const frequencyMap = orderedProductIds.reduce((acc, productId) => {
    acc[productId] = (acc[productId] || 0) + 1;
    return acc;
  }, {});

  let mostFrequentProductId = null;
  let maxFrequency = 0;
  Object.entries(frequencyMap).forEach(([productId, frequency]) => {
    if (frequency > maxFrequency) {
      mostFrequentProductId = productId;
      maxFrequency = frequency;
    }
  });

  return mostFrequentProductId;
}

//Inicia todo el entrenamiento
async function initRecommendationSystem() {
  console.log("Training the recommendation model...");
  await trainRecommendationModel();
  console.log("Model trained successfully.");

  console.log("Generating recommendations for users...");
  await generateAndSaveRecommendations();
  console.log("Recommendations generated and saved.");
}

async function clearRecommendations() {
  const deleteQuery = "DELETE FROM recomendations";
  await fetchData(deleteQuery);
}

//Exportamos todos los metodos
export {
  fetchData,
  getUserOrderHistory,
  preprocessOrderHistory,
  getRecommendations,
  initRecommendationSystem,
  generateRecommendationsForUser,
  selectPromotionBasedOnHistory,
  clearRecommendations,
};
