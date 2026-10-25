import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  backendUrl: process.env.BACKEND_URL || "http://localhost:8080/api/v1/internal/zalo/messages",
  internalApiKey: process.env.INTERNAL_API_KEY || "unisync_internal_secret_key_2026",
  zaloMode: (process.env.ZALO_MODE || "mock").toLowerCase(), // "mock" or "real"
  sessionFilePath: process.env.SESSION_FILE_PATH || "./zalo_session.json",
};
