import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import integrationRoutes from "./routes/integrationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import publicRoutes from "./routes/publicRoutes.js"
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

const PORT = process.env.PORT || 5001;
const app = express();

//MIDDLEWARES

app.use(cors());
app.use(express.json());

//ROUTES

app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/integration", integrationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/public", publicRoutes);
app.use("/api/public", publicRoutes);



const server = http.createServer(app);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please choose a different port.`,
    );
    process.exit(1);
  }

  throw error;
});

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});
