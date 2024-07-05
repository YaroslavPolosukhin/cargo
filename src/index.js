import express from "express";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import path from "path";
import YAML from "yamljs";
import $RefParser from "json-schema-ref-parser";
import authMiddleware from "./middlewares/checkAuth.js";
import authRoutes from "./routes/auth.js";
import ordersRoutes from "./routes/orders.js";
import nomenclatureRoutes from "./routes/nomenclature.js";
import driversRoutes from "./routes/drivers.js";
import addressRoutes from "./routes/address.js";
import contactsRoutes from "./routes/contacts.js";
import measureRoutes from "./routes/measure.js";
import generalRoutes from "./routes/general.js";
import logisticPointsRoutes from "./routes/logisticPoints.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")))

const swaggerDocument = YAML.load(path.join(__dirname, "docs", "swagger.yaml"));

app.get("/", (req, res) => {
  res.send("Cargo Delivery App Backend");
});

$RefParser
  .dereference(swaggerDocument)
  .then((schema) => {
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(schema));
  })
  .catch((err) => {
    console.error("Error resolving $ref in Swagger document:", err);
  });

app.use("/api/auth", authRoutes);
app.use("/api/orders", authMiddleware, ordersRoutes);
app.use("/api/general", authMiddleware, generalRoutes);
app.use("/api/address", authMiddleware, addressRoutes);
app.use("/api/contacts", authMiddleware, contactsRoutes);
app.use("/api/measures", authMiddleware, measureRoutes);
app.use("/api/nomenclature", authMiddleware, nomenclatureRoutes);
app.use("/api/drivers", authMiddleware, driversRoutes);
app.use("/api/logisticPoint", authMiddleware, logisticPointsRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

export default app;
