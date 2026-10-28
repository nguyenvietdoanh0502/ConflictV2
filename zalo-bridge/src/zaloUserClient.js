import fs from "fs";
import path from "path";
import axios from "axios";
import { config } from "./config.js";

export class ZaloUserClient {
  constructor(userId, sessionFilePath) {
    this.userId = userId;
    this.sessionFilePath = sessionFilePath;
    this.initialized = false;
    this.isConnected = false;
    this.api = null;
    this.sessionData = null;
    this.groups = [];
    this.user = null;
    this.qrCode = null; // base64 data url
    this.qrStatus = "idle"; // "idle" | "generating" | "ready" | "scanned" | "expired" | "declined" | "authenticated"
    this.scannedUser = null;
    this.isQrInProgress = false;
    this.qrAttemptId = 0;
  }

  async init(autoStartQr = true) {
    const sessionPath = path.resolve(this.sessionFilePath);
    const hasSavedSession = fs.existsSync(sessionPath);
    console.log(`[ZaloBridge][User:${this.userId}] Initializing (Saved Session: ${hasSavedSession})...`);

    if (hasSavedSession) {
      try {
        const raw = fs.readFileSync(sessionPath, "utf-8");
        this.sessionData = JSON.parse(raw);
        console.log(`[ZaloBridge][User:${this.userId}] Found saved session at ${sessionPath}. Attempting auto-login...`);
        const success = await this.loginWithSavedSession(this.sessionData);
        if (success) {
          this.initialized = true;
          return;
        }
      } catch (e) {
        console.warn(`[ZaloBridge][User:${this.userId}] Failed to read or parse saved session:`, e.message);
      }
    }

    if (autoStartQr) {
      console.log(`[ZaloBridge][User:${this.userId}] No valid session. Starting QR code generation...`);
      this.initialized = true;
      await this.startQrLogin(true);
    }
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
      console.warn(`[ZaloBridge][User:${this.userId}] Saved session login failed (possibly expired):`, err.message);
      // Remove invalid session file
      try {
        const sessionPath = path.resolve(this.sessionFilePath);
        if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath);
      } catch {}
      this.sessionData = null;
      return false;
    }
  }

  async startQrLogin(force = false) {
    if (this.isQrInProgress && !force) {
      console.log(`[ZaloBridge][User:${this.userId}] QR login already in progress.`);
      return;
    }

    this.qrAttemptId += 1;
    const currentAttempt = this.qrAttemptId;

    this.isQrInProgress = true;
    this.qrStatus = "generating";
    this.qrCode = null;
    this.scannedUser = null;
    this.isConnected = false;

    try {
      const zca = await import("zca-js");
      const Zalo = zca.Zalo;
      const zalo = new Zalo({ selfListen: true, checkUpdate: false });

      console.log(`[ZaloBridge][User:${this.userId}] Requesting new QR code from Zalo (attempt #${currentAttempt})...`);

      let savedCredentials = null;
      let resolveQrReady;
      const qrReadyPromise = new Promise((resolve) => {
        resolveQrReady = resolve;
      });
      const qrTimeout = setTimeout(() => resolveQrReady(), 8000);

      const apiPromise = zalo.loginQR({}, (event) => {
        if (this.qrAttemptId !== currentAttempt) return;

        console.log(`[ZaloBridge][User:${this.userId}] QR Event Type: ${event.type}`);

        switch (event.type) {
          case 0: { // QRCodeGenerated
            this.qrStatus = "ready";
            const img = event.data?.image || "";
            this.qrCode = img.startsWith("data:") ? img : `data:image/png;base64,${img}`;
            console.log(`[ZaloBridge][User:${this.userId}] QR Code generated successfully. Ready for scan.`);
            clearTimeout(qrTimeout);
            resolveQrReady();
            break;
          }
          case 1: { // QRCodeExpired
            this.qrStatus = "expired";
            this.isQrInProgress = false;
            console.log(`[ZaloBridge][User:${this.userId}] QR Code expired.`);
            clearTimeout(qrTimeout);
            resolveQrReady();
            break;
          }
          case 2: { // QRCodeScanned
            this.qrStatus = "scanned";
            this.scannedUser = {
              displayName: event.data?.display_name || "Người dùng Zalo",
              avatar: event.data?.avatar || null,
            };
            console.log(`[ZaloBridge][User:${this.userId}] QR scanned by: ${this.scannedUser.displayName}`);
            break;
          }
          case 3: { // QRCodeDeclined
            this.qrStatus = "declined";
            this.isQrInProgress = false;
            console.log(`[ZaloBridge][User:${this.userId}] QR login was declined on mobile device.`);
            clearTimeout(qrTimeout);
            resolveQrReady();
            break;
          }
          case 4: { // GotLoginInfo
            this.qrStatus = "authenticated";
            savedCredentials = event.data;
            console.log(`[ZaloBridge][User:${this.userId}] Credentials received. Finalizing session...`);
            break;
          }
          default:
            break;
        }
      });

      // Handle completion of QR scan in background so HTTP response returns immediately once QR image is ready
      apiPromise
        .then(async (api) => {
          if (this.qrAttemptId !== currentAttempt) return;
          await this.onLoginSuccess(api, savedCredentials);
        })
        .catch((err) => {
          if (this.qrAttemptId !== currentAttempt) return;
          console.error(`[ZaloBridge][User:${this.userId}] QR Login error:`, err?.message || err);
          if (!this.isConnected) {
            this.qrStatus = "expired";
          }
        })
        .finally(() => {
          if (this.qrAttemptId === currentAttempt) {
            this.isQrInProgress = false;
          }
          clearTimeout(qrTimeout);
          resolveQrReady();
        });

      // Wait only until the QR image is generated (or up to 8s timeout)
      await qrReadyPromise;
    } catch (err) {
      if (this.qrAttemptId === currentAttempt) {
        console.error(`[ZaloBridge][User:${this.userId}] QR Setup error:`, err.message);
        this.qrStatus = "expired";
        this.isQrInProgress = false;
      }
    }
  }

  async onLoginSuccess(api, credentials) {
    // Stop any previous listener if present
    try {
      if (this.api?.listener?.stop) {
        this.api.listener.stop();
      }
    } catch {}

    this.api = api;
    this.isConnected = true;
    this.initialized = true;
    this.qrStatus = "authenticated";
    this.qrCode = null;
    console.log(`[ZaloBridge][User:${this.userId}] Login successful! Fetching user account info and groups...`);

    // 1. Save session credentials to disk
    if (credentials) {
      try {
        const sessionPath = path.resolve(this.sessionFilePath);
        fs.writeFileSync(sessionPath, JSON.stringify(credentials, null, 2));
        this.sessionData = credentials;
        console.log(`[ZaloBridge][User:${this.userId}] Saved credentials to ${sessionPath}`);
      } catch (e) {
        console.warn(`[ZaloBridge][User:${this.userId}] Could not save session:`, e.message);
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
        console.log(`[ZaloBridge][User:${this.userId}] Logged in as: ${this.user.displayName} (UID: ${this.user.userId})`);
      }
    } catch (e) {
      console.warn(`[ZaloBridge][User:${this.userId}] Could not fetch profile:`, e.message);
      this.user = { displayName: "Tài khoản Zalo đã kết nối", avatar: null };
    }

    // 3. Fetch Groups
    await this.fetchRealGroups();

    // 4. Start real-time message listener
    try {
      if (api.listener && api.listener.on) {
        api.listener.on("connected", () => {
          console.log(`[ZaloBridge][User:${this.userId}] Real-time WebSocket listener connected to Zalo!`);
        });
        api.listener.on("closed", (code, reason) => {
          console.warn(`[ZaloBridge][User:${this.userId}] WebSocket closed (code: ${code}, reason: ${reason}). Auto-retrying...`);
        });
        api.listener.on("error", (err) => {
          console.error(`[ZaloBridge][User:${this.userId}] WebSocket error:`, err?.message || err);
        });
        api.listener.on("message", (msg) => {
          this.handleIncomingZaloMessage(msg);
        });

        api.listener.start({ retryOnClose: true });
        console.log(`[ZaloBridge][User:${this.userId}] Real-time group message listener started with auto-reconnection.`);
      }
    } catch (e) {
      console.warn(`[ZaloBridge][User:${this.userId}] Could not start listener:`, e.message);
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

        console.log(`[ZaloBridge][User:${this.userId}] Synced ${this.groups.length} real Zalo groups.`);
      }
    } catch (e) {
      console.warn(`[ZaloBridge][User:${this.userId}] Error fetching groups:`, e.message);
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
      console.log(`[ZaloBridge][User:${this.userId}] Ignored non-group message (type: ${msg.type}, threadId: ${msg.threadId})`);
      return;
    }

    // Extract Group ID
    const zaloGroupId = String(msg.threadId || msg.data?.idTo || msg.data?.grid || msg.groupId || "");
    if (!zaloGroupId) {
      console.warn(`[ZaloBridge][User:${this.userId}] Could not determine group ID from group message:`, msg);
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
        console.log(`[ZaloBridge][User:${this.userId}] Image detected in group [${zaloGroupId}], downloading from: ${imageUrl.substring(0, 80)}...`);
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
        console.log(`[ZaloBridge][User:${this.userId}] Downloaded image (${(imageBase64.length * 0.75 / 1024).toFixed(1)} KB, type: ${imageMimeType})`);
      } catch (err) {
        console.warn(`[ZaloBridge][User:${this.userId}] Could not download image directly: ${err.message}. Forwarding imageUrl only.`);
      }
    }

    if (!messageText && !imageBase64 && !imageUrl) {
      console.log(`[ZaloBridge][User:${this.userId}] Ignored non-text, non-image message in group [${zaloGroupId}] (sender: ${senderName})`);
      return;
    }

    console.log(`[ZaloBridge][User:${this.userId}] Group: [${zaloGroupId}], Sender: [${senderName}], Text: "${messageText}", HasImage: ${Boolean(imageBase64 || imageUrl)}`);

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
      console.log(`[ZaloBridge][User:${this.userId}] Forwarded to backend successfully:`, response?.data?.statusMessage || response?.status || "OK");
    } catch (err) {
      console.error(`[ZaloBridge][User:${this.userId}] Failed to forward message to backend:`, err.response?.data || err.message);
    }
  }

  /**
   * Forwards a message payload to Spring Boot Backend with user_id for strict per-student isolation
   */
  async forwardMessageToBackend({ zaloGroupId, messageId, senderName, messageText, imageUrl, imageBase64, imageMimeType, timestamp }) {
    const payload = {
      user_id: this.userId,
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

    console.log(`[ZaloBridge][User:${this.userId}] Forwarding to Backend: ${config.backendUrl} (hasImage: ${Boolean(imageBase64 || imageUrl)})`);
    const response = await axios.post(config.backendUrl, payload, { headers, timeout: 30000 });
    console.log(`[ZaloBridge][User:${this.userId}] Backend responded with status: ${response.status}`);
    return response.data;
  }

  async logout() {
    console.log(`[ZaloBridge][User:${this.userId}] Logging out Zalo session...`);
    this.qrAttemptId += 1;
    this.isQrInProgress = false;

    try {
      if (this.api?.listener?.stop) {
        this.api.listener.stop();
      }
    } catch {}

    try {
      const sessionPath = path.resolve(this.sessionFilePath);
      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
        console.log(`[ZaloBridge][User:${this.userId}] Deleted session file: ${sessionPath}`);
      }
    } catch (e) {
      console.warn(`[ZaloBridge][User:${this.userId}] Could not delete session file:`, e.message);
    }

    this.api = null;
    this.sessionData = null;
    this.user = null;
    this.isConnected = false;
    this.groups = [];
    this.qrCode = null;
    this.qrStatus = "idle";
    this.scannedUser = null;
    this.initialized = false;
  }

  getGroups() {
    return this.groups;
  }

  getStatus() {
    const sessionPath = path.resolve(this.sessionFilePath);
    const hasSavedSession = fs.existsSync(sessionPath);

    return {
      userId: this.userId,
      connected: this.isConnected,
      initialized: this.initialized,
      groupCount: this.groups.length,
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
