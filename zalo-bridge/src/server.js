import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { zaloClient } from "./zaloClient.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "zalo-bridge",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    ...zaloClient.getStatus(),
  });
});

// Zalo Connection & QR Status
app.get("/zalo/status", (req, res) => {
  res.json({
    success: true,
    data: zaloClient.getStatus(),
  });
});

// Switch Mode ("mock" | "real")
app.post("/zalo/mode", async (req, res) => {
  const { mode } = req.body;
  if (!mode || !["mock", "real"].includes(mode.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng chọn chế độ hợp lệ: 'mock' hoặc 'real'",
    });
  }

  try {
    const status = await zaloClient.setMode(mode.toLowerCase());
    res.json({
      success: true,
      message: `Đã chuyển sang chế độ [${mode.toUpperCase()}] thành công`,
      data: status,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi chuyển đổi chế độ: " + err.message,
    });
  }
});

// Generate fresh QR Code
app.post("/zalo/qr/generate", async (req, res) => {
  try {
    await zaloClient.startQrLogin();
    res.json({
      success: true,
      message: "Đang tạo mã QR đăng nhập Zalo mới...",
      data: zaloClient.getStatus(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi tạo mã QR: " + err.message,
    });
  }
});

// Logout / Disconnect Real Zalo
app.post("/zalo/logout", async (req, res) => {
  try {
    const status = await zaloClient.logout();
    res.json({
      success: true,
      message: "Đã đăng xuất tài khoản Zalo thành công",
      data: status,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi đăng xuất: " + err.message,
    });
  }
});

// Get List of Zalo Groups (Real or Mock based on active mode)
app.get("/zalo/groups", (req, res) => {
  const groups = zaloClient.getGroups();
  res.json({
    success: true,
    mode: zaloClient.mode,
    total: groups.length,
    data: groups,
  });
});

// Refresh Groups from Real Zalo
app.post("/zalo/groups/refresh", async (req, res) => {
  try {
    if (zaloClient.mode === "real") {
      await zaloClient.fetchRealGroups();
    }
    const groups = zaloClient.getGroups();
    res.json({
      success: true,
      mode: zaloClient.mode,
      total: groups.length,
      data: groups,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi làm mới danh sách nhóm: " + err.message,
    });
  }
});

// Manually trigger a message forward (for testing / simulation via bridge)
app.post("/zalo/simulate-incoming", async (req, res) => {
  const { zalo_group_id, sender_name, message_text, timestamp } = req.body;

  if (!zalo_group_id || !message_text) {
    return res.status(400).json({
      success: false,
      message: "zalo_group_id và message_text là hai trường bắt buộc",
    });
  }

  try {
    const result = await zaloClient.forwardMessageToBackend({
      zaloGroupId: zalo_group_id,
      messageId: `manual-bridge-${Date.now()}`,
      senderName: sender_name || "Lớp trưởng",
      messageText: message_text,
      timestamp: timestamp || new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Tin nhắn đã được chuyển tiếp thành công tới Backend",
      backendResponse: result,
    });
  } catch (error) {
    console.error("[ZaloBridge] Simulation error:", error.message);
    const status = error.response ? error.response.status : 500;
    res.status(status).json({
      success: false,
      message: error.response?.data?.message || error.message || "Lỗi khi gửi tới Backend",
      details: error.response?.data || null,
    });
  }
});

// Initialize Zalo client and start server
async function startServer() {
  await zaloClient.init();

  const server = app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`  🚀 UniSync Zalo Bridge running on port ${config.port}`);
    console.log(`  📡 Initial Mode: [${config.zaloMode.toUpperCase()}]`);
    console.log(`  🎯 Backend Webhook: ${config.backendUrl}`);
    console.log(`  🔗 Health: http://localhost:${config.port}/health`);
    console.log(`  👥 Groups: http://localhost:${config.port}/zalo/groups`);
    console.log(`  📱 Status: http://localhost:${config.port}/zalo/status`);
    console.log(`====================================================`);
  });

  process.on("SIGTERM", () => {
    console.log("[ZaloBridge] SIGTERM received, shutting down gracefully...");
    server.close(() => {
      console.log("[ZaloBridge] HTTP server closed.");
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error("[ZaloBridge] Fatal startup error:", err);
  process.exit(1);
});

export default app;
