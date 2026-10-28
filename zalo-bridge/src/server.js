import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { sessionManager } from "./sessionManager.js";

const app = express();

app.use(cors());
app.use(express.json());

// 1. Health Check (Public, no internal API key required)
app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "zalo-bridge",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    activeSessions: sessionManager.sessions.size,
  });
});

// 2. Security Middleware: Require Internal API Key for all bridge session endpoints
app.use((req, res, next) => {
  const apiKey = req.headers["x-internal-api-key"];
  if (config.internalApiKey && (!apiKey || apiKey !== config.internalApiKey)) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: X-Internal-Api-Key is missing or invalid",
    });
  }
  next();
});

// 3. Get Zalo Session Status for a specific user
app.get("/zalo/session/:userId/status", async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId parameter is required" });
  }

  try {
    const client = sessionManager.getOrCreate(userId);
    if (!client.initialized) {
      await client.init(true);
    }
    res.json({
      success: true,
      data: client.getStatus(),
    });
  } catch (err) {
    console.error(`[ZaloBridge][User:${userId}] Error getting status:`, err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy trạng thái phiên Zalo: " + err.message,
    });
  }
});

// 4. Generate fresh QR code for a specific user
app.post("/zalo/session/:userId/qr/generate", async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId parameter is required" });
  }

  try {
    const client = sessionManager.getOrCreate(userId);
    client.initialized = true;
    await client.startQrLogin(true);
    res.json({
      success: true,
      message: "Đang tạo mã QR đăng nhập Zalo mới...",
      data: client.getStatus(),
    });
  } catch (err) {
    console.error(`[ZaloBridge][User:${userId}] Error generating QR:`, err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo mã QR: " + err.message,
    });
  }
});

// 5. Logout / disconnect session for a specific user
app.post("/zalo/session/:userId/logout", async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId parameter is required" });
  }

  try {
    await sessionManager.remove(userId);
    res.json({
      success: true,
      message: "Đã đăng xuất tài khoản Zalo thành công",
    });
  } catch (err) {
    console.error(`[ZaloBridge][User:${userId}] Error logging out:`, err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi khi đăng xuất Zalo: " + err.message,
    });
  }
});

// 6. Get Zalo groups for a specific user
app.get("/zalo/session/:userId/groups", (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId parameter is required" });
  }

  try {
    const client = sessionManager.getOrCreate(userId);
    const groups = client.getGroups();
    res.json({
      success: true,
      total: groups.length,
      data: groups,
    });
  } catch (err) {
    console.error(`[ZaloBridge][User:${userId}] Error fetching groups:`, err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách nhóm Zalo: " + err.message,
    });
  }
});

// 7. Refresh Zalo groups from Zalo server for a specific user
app.post("/zalo/session/:userId/groups/refresh", async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId parameter is required" });
  }

  try {
    const client = sessionManager.getOrCreate(userId);
    await client.fetchRealGroups();
    const groups = client.getGroups();
    res.json({
      success: true,
      total: groups.length,
      data: groups,
    });
  } catch (err) {
    console.error(`[ZaloBridge][User:${userId}] Error refreshing groups:`, err.message);
    res.status(500).json({
      success: false,
      message: "Lỗi khi làm mới danh sách nhóm: " + err.message,
    });
  }
});

// Start HTTP Server
const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`  🚀 UniSync Zalo Multi-Session Bridge running on port ${config.port}`);
  console.log(`  🎯 Backend Webhook: ${config.backendUrl}`);
  console.log(`  📂 Sessions Directory: ${config.sessionsDir}`);
  console.log(`  🔗 Health: http://localhost:${config.port}/health`);
  console.log(`====================================================`);
  sessionManager.restoreSavedSessions();
});

process.on("SIGTERM", () => {
  console.log("[ZaloBridge] SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("[ZaloBridge] HTTP server closed.");
    process.exit(0);
  });
});

export default app;
