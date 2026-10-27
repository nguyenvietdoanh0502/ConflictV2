import fs from "fs";
import path from "path";
import axios from "axios";
import { config } from "./config.js";

// Sample group data for mock mode or development
export const MOCK_GROUPS = [
  { id: "group-it101", name: "Lập trình Web - K64", memberCount: 65, active: true },
  { id: "group-cs202", name: "Mạng máy tính - Lớp 2", memberCount: 72, active: true },
  { id: "group-db301", name: "Cơ sở dữ liệu - K64", memberCount: 58, active: true },
  { id: "group-math1", name: "Giải tích 2 - Nhóm 03", memberCount: 80, active: true },
  { id: "group-se404", name: "Kỹ thuật phần mềm - Nhóm đồ án", memberCount: 12, active: true },
];

class ZaloClient {
  constructor() {
    this.mode = config.zaloMode; // "mock" | "real"
    this.isConnected = false;
    this.api = null;
    this.sessionData = null;
    this.groups = [];
    this.user = null;
    this.qrCode = null; // base64 data url
    this.qrStatus = "idle"; // "idle" | "generating" | "ready" | "scanned" | "expired" | "declined" | "authenticated"
    this.scannedUser = null;
    this.isQrInProgress = false;
  }

  async init() {
    const sessionPath = path.resolve(config.sessionFilePath);
    const hasSavedSession = fs.existsSync(sessionPath);
    console.log(`[ZaloBridge] Initializing (Config Mode: [${this.mode.toUpperCase()}], Saved Session: ${hasSavedSession})...`);

    if (this.mode === "real" || hasSavedSession) {
      this.mode = "real";
      await this.initRealZalo();
    } else {
      this.initMockMode();
    }
  }

  initMockMode() {
    this.mode = "mock";
    this.isConnected = true;
    this.qrStatus = "idle";
    this.qrCode = null;
    this.scannedUser = null;
    this.user = {
      userId: "mock-student-id",
      displayName: "Tài khoản Giả lập (Mock)",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=UnisyncMock",
    };
    this.groups = [...MOCK_GROUPS];
    console.log(`[ZaloBridge] Mock Mode Active: ${this.groups.length} mock groups loaded.`);
  }

  async initRealZalo() {
    this.mode = "real";
    this.groups = [];
    const sessionPath = path.resolve(config.sessionFilePath);

    if (fs.existsSync(sessionPath)) {
      try {
        const raw = fs.readFileSync(sessionPath, "utf-8");
        this.sessionData = JSON.parse(raw);
        console.log(`[ZaloBridge] Found saved session at ${sessionPath}. Attempting auto-login...`);
        const success = await this.loginWithSavedSession(this.sessionData);
        if (success) return;
      } catch (e) {
        console.warn("[ZaloBridge] Failed to read or parse saved session:", e.message);
      }
    }

    // No valid session, wait for user to request QR or start QR login
    console.log("[ZaloBridge] Real mode ready. Starting QR code generation...");
    this.startQrLogin();
  }

  async loginWithSavedSession(credentials) {
    try {
      const zca = await import("zca-js");
      const Zalo = zca.Zalo;
      const zalo = new Zalo({ selfListen: true, checkUpdate: false });
      const api = await zalo.login(credentials);
      await this.onLoginSuccess(api, credentials);
      return true;
    } catch (err) {
      console.warn("[ZaloBridge] Saved session login failed (possibly expired):", err.message);
      // Remove invalid session file
      try {
        const sessionPath = path.resolve(config.sessionFilePath);
        if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath);
      } catch {}
      this.sessionData = null;
      return false;
    }
  }

  async startQrLogin() {
    if (this.isQrInProgress) {
      console.log("[ZaloBridge] QR login already in progress.");
      return;
    }

    this.isQrInProgress = true;
    this.qrStatus = "generating";
    this.qrCode = null;
    this.scannedUser = null;
    this.isConnected = false;

    try {
      const zca = await import("zca-js");
      const Zalo = zca.Zalo;
      const zalo = new Zalo({ selfListen: true, checkUpdate: false });

      console.log("[ZaloBridge] Requesting new QR code from Zalo...");

      let savedCredentials = null;

      const apiPromise = zalo.loginQR({}, (event) => {
        console.log(`[ZaloBridge QR Event] Type: ${event.type}`);

        switch (event.type) {
          case 0: { // QRCodeGenerated
            this.qrStatus = "ready";
            const img = event.data?.image || "";
            this.qrCode = img.startsWith("data:") ? img : `data:image/png;base64,${img}`;
            console.log("[ZaloBridge] QR Code generated successfully. Ready for scan.");
            break;
          }
          case 1: { // QRCodeExpired
            this.qrStatus = "expired";
            console.log("[ZaloBridge] QR Code expired.");
            break;
          }
          case 2: { // QRCodeScanned
            this.qrStatus = "scanned";
            this.scannedUser = {
              displayName: event.data?.display_name || "Người dùng Zalo",
              avatar: event.data?.avatar || null,
            };
            console.log(`[ZaloBridge] QR scanned by: ${this.scannedUser.displayName}`);
            break;
          }
          case 3: { // QRCodeDeclined
            this.qrStatus = "declined";
            console.log("[ZaloBridge] QR login was declined on mobile device.");
            break;
          }
          case 4: { // GotLoginInfo
            this.qrStatus = "authenticated";
            savedCredentials = event.data;
            console.log("[ZaloBridge] Credentials received. Finalizing session...");
            break;
          }
          default:
            break;
        }
      });

      const api = await apiPromise;
      await this.onLoginSuccess(api, savedCredentials);
    } catch (err) {
      console.error("[ZaloBridge] QR Login error:", err.message);
      this.qrStatus = "expired";
    } finally {
      this.isQrInProgress = false;
    }
  }

  async onLoginSuccess(api, credentials) {
    this.api = api;
    this.isConnected = true;
    this.qrStatus = "authenticated";
    this.qrCode = null;
    console.log("[ZaloBridge] Login successful! Fetching user account info and groups...");

    // 1. Save session credentials to disk
    if (credentials) {
      try {
        const sessionPath = path.resolve(config.sessionFilePath);
        fs.writeFileSync(sessionPath, JSON.stringify(credentials, null, 2));
        this.sessionData = credentials;
        console.log(`[ZaloBridge] Saved credentials to ${sessionPath}`);
      } catch (e) {
        console.warn("[ZaloBridge] Could not save session:", e.message);
      }
    }

    // 2. Fetch User Profile
    try {
      if (api.fetchAccountInfo) {
        const accountInfo = await api.fetchAccountInfo();
        const profile = accountInfo?.profile || accountInfo || {};
        this.user = {
          userId: profile.userId || profile.uid || "zalo-user",
          displayName: profile.displayName || profile.name || "Tài khoản Zalo",
          avatar: profile.avatar || profile.avatarUrl || null,
        };
        console.log(`[ZaloBridge] Logged in as: ${this.user.displayName} (UID: ${this.user.userId})`);
      }
    } catch (e) {
      console.warn("[ZaloBridge] Could not fetch profile:", e.message);
      this.user = { displayName: "Tài khoản Zalo đã kết nối", avatar: null };
    }

    // 3. Fetch Groups
    await this.fetchRealGroups();

    // 4. Start real-time message listener
    try {
      if (api.listener && api.listener.on) {
        api.listener.on("connected", () => {
          console.log("[ZaloBridge Listener] Real-time WebSocket listener connected to Zalo!");
        });
        api.listener.on("closed", (code, reason) => {
          console.warn(`[ZaloBridge Listener] WebSocket closed (code: ${code}, reason: ${reason}). Auto-retrying...`);
        });
        api.listener.on("error", (err) => {
          console.error("[ZaloBridge Listener] WebSocket error:", err?.message || err);
        });
        api.listener.on("message", (msg) => {
          this.handleIncomingZaloMessage(msg);
        });

        api.listener.start({ retryOnClose: true });
        console.log("[ZaloBridge] Real-time group message listener started with auto-reconnection.");
      }
    } catch (e) {
      console.warn("[ZaloBridge] Could not start listener:", e.message);
    }
  }

  async fetchRealGroups() {
    if (!this.api) return;
    try {
      if (this.api.getAllGroups) {
        const allGroupsRes = await this.api.getAllGroups();
        const gridVerMap = allGroupsRes?.gridVerMap || {};
        const groupIds = Object.keys(gridVerMap);

        if (groupIds.length > 0 && this.api.getGroupInfo) {
          try {
            const groupInfoRes = await this.api.getGroupInfo(groupIds);
            const gridInfoMap = groupInfoRes?.gridInfoMap || {};
            this.groups = groupIds.map((id) => {
              const info = gridInfoMap[id] || {};
              return {
                id: String(id),
                name: info.name || `Nhóm Zalo ${id}`,
                memberCount: info.totalMember || (info.memVerList ? info.memVerList.length : 0),
                active: true,
                avatar: info.avatar || null,
              };
            });
          } catch {
            this.groups = groupIds.map((id) => ({
              id: String(id),
              name: `Nhóm Zalo ${id}`,
              memberCount: 0,
              active: true,
            }));
          }
        } else {
          this.groups = [];
        }

        console.log(`[ZaloBridge] Synced ${this.groups.length} real Zalo groups.`);
      }
    } catch (e) {
      console.warn("[ZaloBridge] Error fetching groups:", e.message);
    }
  }

  async handleIncomingZaloMessage(msg) {
    if (!msg) return;

    // In zca-js, GroupMessage has msg.type === 1 (ThreadType.Group), threadId is data.idTo
    const isGroup =
      msg.type === 1 ||
      msg.type === "group" ||
      msg.isGroup === true ||
      Boolean(msg.data && msg.data.idTo && msg.data.idTo !== msg.data.uidFrom);

    if (!isGroup) {
      console.log(`[ZaloBridge Listener] Ignored non-group message (type: ${msg.type}, threadId: ${msg.threadId})`);
      return;
    }

    // Extract Group ID
    const zaloGroupId = String(msg.threadId || msg.data?.idTo || msg.data?.grid || msg.groupId || "");
    if (!zaloGroupId) {
      console.warn("[ZaloBridge Listener] Could not determine group ID from group message:", msg);
      return;
    }

    // Extract Message ID
    const messageId = String(
      msg.data?.msgId ||
      msg.data?.cliMsgId ||
      msg.msgId ||
      msg.id ||
      `msg-${Date.now()}`
    );

    // Extract Sender Name (msg.data.dName in zca-js GroupMessage)
    const senderName =
      msg.data?.dName ||
      msg.senderName ||
      msg.sender?.name ||
      (msg.isSelf ? this.user?.displayName : null) ||
      "Thành viên nhóm";

    // Extract Image and Caption/Text
    let messageText = "";
    let imageUrl = "";

    if (typeof msg.data?.content === "string") {
      try {
        const parsed = JSON.parse(msg.data.content);
        if (parsed && typeof parsed === "object") {
          imageUrl = parsed.rawUrl || parsed.hdUrl || parsed.normalUrl || parsed.href || parsed.url || parsed.thumb || "";
          messageText = parsed.desc || parsed.description || parsed.title || parsed.msg || "";
        } else {
          messageText = msg.data.content;
        }
      } catch {
        messageText = msg.data.content;
      }
    } else if (msg.data?.content && typeof msg.data.content === "object") {
      const c = msg.data.content;
      imageUrl = c.rawUrl || c.hdUrl || c.normalUrl || c.href || c.url || c.thumb || "";
      messageText = c.desc || c.description || c.title || c.msg || "";

      // Also check c.params (often JSON string containing media URLs)
      if (typeof c.params === "string") {
        try {
          const p = JSON.parse(c.params);
          if (p && typeof p === "object") {
            imageUrl = imageUrl || p.rawUrl || p.hdUrl || p.normalUrl || p.thumbUrl || p.url || "";
            messageText = messageText || p.desc || p.description || p.title || "";
          }
        } catch {}
      }
    } else if (typeof msg.content === "string") {
      messageText = msg.content;
    } else if (typeof msg.text === "string") {
      messageText = msg.text;
    }

    // Top-level fallback for photo URLs
    if (!imageUrl) {
      imageUrl = msg.data?.rawUrl || msg.data?.hdUrl || msg.data?.normalUrl || msg.data?.thumbUrl || msg.data?.url || msg.url || "";
    }

    messageText = (messageText || "").trim();
    imageUrl = (imageUrl || "").trim();

    // Check if there is an image to download
    let imageBase64 = null;
    let imageMimeType = "image/jpeg";

    if (imageUrl) {
      try {
        console.log(`[ZaloBridge Listener] Image detected in group [${zaloGroupId}], downloading from: ${imageUrl.substring(0, 80)}...`);
        const imgRes = await axios.get(imageUrl, {
          responseType: "arraybuffer",
          timeout: 15000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        imageBase64 = Buffer.from(imgRes.data).toString("base64");
        const ct = imgRes.headers["content-type"];
        if (ct && ct.startsWith("image/")) {
          imageMimeType = ct;
        }
        console.log(`[ZaloBridge Listener] Downloaded image (${(imageBase64.length * 0.75 / 1024).toFixed(1)} KB, type: ${imageMimeType})`);
      } catch (err) {
        console.warn(`[ZaloBridge Listener] Could not download image directly: ${err.message}. Forwarding imageUrl only.`);
      }
    }

    if (!messageText && !imageBase64 && !imageUrl) {
      console.log(`[ZaloBridge Listener] Ignored non-text, non-image message in group [${zaloGroupId}] (sender: ${senderName})`);
      return;
    }

    console.log(`[ZaloBridge Real Listener] Group: [${zaloGroupId}], Sender: [${senderName}], Text: "${messageText}", HasImage: ${Boolean(imageBase64 || imageUrl)}`);

    try {
      const response = await this.forwardMessageToBackend({
        zaloGroupId,
        messageId,
        senderName,
        messageText,
        imageUrl: imageUrl || null,
        imageBase64: imageBase64 || null,
        imageMimeType,
        timestamp: new Date().toISOString(),
      });
      console.log(`[ZaloBridge Real Listener] Forwarded to backend successfully:`, response?.data?.statusMessage || response?.status || "OK");
    } catch (err) {
      console.error("[ZaloBridge Real Listener] Failed to forward message to backend:", err.response?.data || err.message);
    }
  }

  /**
   * Forwards a message payload to Spring Boot Backend
   */
  async forwardMessageToBackend({ zaloGroupId, messageId, senderName, messageText, imageUrl, imageBase64, imageMimeType, timestamp }) {
    const payload = {
      zalo_group_id: zaloGroupId,
      message_id: messageId || `bridge-${Date.now()}`,
      sender_name: senderName || "Thành viên nhóm",
      message_text: messageText || "",
      image_url: imageUrl || null,
      image_base64: imageBase64 || null,
      image_mime_type: imageMimeType || "image/jpeg",
      timestamp: timestamp || new Date().toISOString(),
    };

    const headers = {
      "Content-Type": "application/json",
      "X-Internal-Api-Key": config.internalApiKey,
    };

    console.log(`[ZaloBridge] Forwarding to Backend: ${config.backendUrl} (hasImage: ${Boolean(imageBase64 || imageUrl)})`);
    const response = await axios.post(config.backendUrl, payload, { headers, timeout: 30000 });
    console.log(`[ZaloBridge] Backend responded with status: ${response.status}`);
    return response.data;
  }

  async setMode(targetMode) {
    const m = (targetMode || "mock").toLowerCase();
    if (m === this.mode && (this.isConnected || this.qrStatus === "ready")) {
      return this.getStatus();
    }

    console.log(`[ZaloBridge] Switching mode from [${this.mode.toUpperCase()}] to [${m.toUpperCase()}]...`);

    if (m === "mock") {
      this.initMockMode();
    } else if (m === "real") {
      await this.initRealZalo();
    }

    return this.getStatus();
  }

  async logout() {
    console.log("[ZaloBridge] Logging out real Zalo session...");
    try {
      if (this.api?.listener?.stop) {
        this.api.listener.stop();
      }
    } catch {}

    try {
      const sessionPath = path.resolve(config.sessionFilePath);
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
        console.log(`[ZaloBridge] Deleted session file: ${sessionPath}`);
      }
    } catch (e) {
      console.warn("[ZaloBridge] Could not delete session file:", e.message);
    }

    this.api = null;
    this.sessionData = null;
    this.user = null;
    this.isConnected = false;
    this.groups = [];
    this.qrCode = null;
    this.qrStatus = "idle";
    this.scannedUser = null;

    return this.getStatus();
  }

  getGroups() {
    if (this.mode === "mock") {
      return MOCK_GROUPS;
    }
    return this.groups;
  }

  getStatus() {
    const sessionPath = path.resolve(config.sessionFilePath);
    const hasSavedSession = fs.existsSync(sessionPath);

    return {
      connected: this.isConnected,
      mode: this.mode,
      groupCount: this.getGroups().length,
      user: this.user,
      qrCode: this.qrCode,
      qrStatus: this.qrStatus,
      scannedUser: this.scannedUser,
      hasSavedSession,
      backendUrl: config.backendUrl,
      timestamp: new Date().toISOString(),
    };
  }
}

export const zaloClient = new ZaloClient();
