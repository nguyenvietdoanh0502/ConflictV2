import path from "path";
import fs from "fs";
import { config } from "./config.js";
import { ZaloUserClient } from "./zaloUserClient.js";

class SessionManager {
  constructor() {
    this.sessions = new Map(); // userId (string) -> ZaloUserClient
    this.sessionsDir = path.resolve(config.sessionsDir);
    // Tạo thư mục nếu chưa có
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  getOrCreate(userId) {
    if (!this.sessions.has(userId)) {
      const sessionFile = path.join(this.sessionsDir, `${userId}.json`);
      const client = new ZaloUserClient(userId, sessionFile);
      this.sessions.set(userId, client);
    }
    return this.sessions.get(userId);
  }

  get(userId) {
    return this.sessions.get(userId) || null;
  }

  async remove(userId) {
    const client = this.sessions.get(userId);
    if (client) {
      await client.logout();
      this.sessions.delete(userId);
    }
  }

  async restoreSavedSessions() {
    try {
      if (!fs.existsSync(this.sessionsDir)) return;
      const files = fs.readdirSync(this.sessionsDir).filter((f) => f.endsWith(".json"));
      if (files.length === 0) return;

      console.log(`[SessionManager] Found ${files.length} saved session(s) on disk. Auto-restoring listeners...`);
      for (const file of files) {
        const userId = path.basename(file, ".json");
        if (userId) {
          const client = this.getOrCreate(userId);
          client.init(false).catch((err) => {
            console.warn(`[SessionManager] Failed to auto-restore session for user ${userId}:`, err.message);
          });
        }
      }
    } catch (err) {
      console.warn("[SessionManager] Could not scan sessions directory:", err.message);
    }
  }
}

export const sessionManager = new SessionManager();
