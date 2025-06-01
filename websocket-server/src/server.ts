import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { getRedisClient } from "./configs/redis";

dotenv.config();

interface TokenPayload {
    userId: string,
}

const port = process.env.SERVER_PORT;
const httpServer = createServer();
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
const io = new Server(httpServer, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ["GET", "POST"],
    }
});

io.use((socket, next) => {
    const authToken = socket.handshake.auth.token ?? socket.handshake.headers.token;  
    if (!authToken?.startsWith("Bearer ")) {
        return next(new Error("Authentication token missing or invalid"));
    }

    try {
        const token = authToken.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
        socket.data.userId = decoded.userId;
        next();
    } catch (err) {
        return next(new Error("Token invalid"));
    }

});

io.on("connection", (socket) => {
    const userId = socket.data.userId;
    socket.join(`room_${userId}`);
    console.log(`Client ${userId} joined room_${userId}`);

    socket.on("disconnect", () => {
        console.log(`Client ${userId} disconnected`);
    });
});

async function init() {
    try {
        const centralRedis = await getRedisClient();
        centralRedis.subscribe("RESULT_CHANNEL", (message) => {
            try {
                const data = JSON.parse(message);
                const userId = data.userId;
                if (!userId) {
                    console.error("No userId in result:", data);
                    return;
                }
    
                const room = io.sockets.adapter.rooms.get(`room_${userId}`);
                if(room && room.size == 1) {
                    io.to(`room_${userId}`).emit("result", message);
                    console.log(`Sent result to room_${userId}`);
                } else {
                    console.log(`No clients in room_${userId}`);
                }
            } catch (error) {
                console.error("Error processing Redis message:", error);
            }
        });

        console.log("Redis subscription initialized");
    } catch (err) {
        console.error("Redis initialization failed:", err);
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}

httpServer.listen(port, () => {
    console.log(`WebSocket server running on port ${port}`);
});

init();