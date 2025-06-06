import express, { Express } from "express";
import dotenv from "dotenv";
import { authRoutes, problemsetRoutes, problemsRoutes } from "./routes";
import cors from "cors";

dotenv.config();

const app: Express = express();
const port = process.env.SERVER_PORT ?? 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use("/api/v1/accounts", authRoutes);
app.use("/api/v1/problemset", problemsetRoutes);
app.use("/api/v1/problems", problemsRoutes);

app.listen(port, () => console.log("Server started"));
