import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

function getSockJsUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
  try {
    const url = new URL(apiUrl);
    const httpProto = url.protocol === "https:" ? "https:" : "http:";
    return `${httpProto}//${url.host}/ws-sockjs`;
  } catch {
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL
        .replace(/^wss:/i, "https:")
        .replace(/^ws:/i, "http:")
        .replace(/\/ws\/?$/, "/ws-sockjs");
    }
    return "http://localhost:8080/ws-sockjs";
  }
}

class RealtimeService {
  constructor() {
    this.client = null;
    this.currentAccessToken = null;
    this.messageListeners = new Set();
    this.scheduleListeners = new Set();
    this.notificationListeners = new Set();
    this.statusListeners = new Set();
    this.status = "disconnected"; // "connecting" | "connected" | "disconnected" | "error"
    this.messageSubscription = null;
    this.scheduleSubscription = null;
    this.notificationSubscription = null;
  }

  updateStatus(newStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((listener) => {
      try {
        listener(newStatus);
      } catch (err) {
        console.error("Error in realtime status listener:", err);
      }
    });
  }

  connect(accessToken) {
    if (!accessToken) {
      this.disconnect();
      return;
    }

    // If already connected with this exact token, do nothing
    if (this.client && this.currentAccessToken === accessToken && this.client.connected) {
      return;
    }

    this.currentAccessToken = accessToken;
    this.updateStatus("connecting");

    // Deactivate existing client if any
    if (this.client) {
      this.client.deactivate();
    }

    const sockJsUrl = getSockJsUrl();

    this.client = new Client({
      webSocketFactory: () =>
        new SockJS(sockJsUrl, null, {
          transports: ["websocket", "xhr-streaming", "xhr-polling"],
        }),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {
        // Can be uncommented for local debugging
      },
      onConnect: () => {
        this.updateStatus("connected");

        // Subscribe to incoming messages
        try {
          this.messageSubscription = this.client.subscribe(
            "/user/queue/messages",
            (message) => {
              try {
                const parsed = JSON.parse(message.body);
                // Backend wraps in ApiResponse<ChatMessageDTO>
                const data = parsed.data || parsed;
                this.notifyMessageListeners(data);
              } catch (err) {
                console.error("Failed to parse incoming WebSocket message:", err);
              }
            }
          );
        } catch (err) {
          console.error("Failed to subscribe to /user/queue/messages:", err);
        }

        // Subscribe to real-time Schedule notifications (UniSync Zalo AI PoC)
        try {
          this.scheduleSubscription = this.client.subscribe(
            "/user/queue/schedule",
            (message) => {
              try {
                const parsed = JSON.parse(message.body);
                const data = parsed.data || parsed;
                this.notifyScheduleListeners(data);
              } catch (err) {
                console.error("Failed to parse incoming Schedule notification:", err);
              }
            }
          );
        } catch (err) {
          console.error("Failed to subscribe to /user/queue/schedule:", err);
        }

        // Subscribe to real-time User notifications (All types: schedule, today briefing, chat)
        try {
          this.notificationSubscription = this.client.subscribe(
            "/user/queue/notifications",
            (message) => {
              try {
                const parsed = JSON.parse(message.body);
                const data = parsed.data || parsed;
                this.notifyNotificationListeners(data);
              } catch (err) {
                console.error("Failed to parse incoming User notification:", err);
              }
            }
          );
        } catch (err) {
          console.error("Failed to subscribe to /user/queue/notifications:", err);
        }
      },
      onDisconnect: () => {
        this.updateStatus("disconnected");
      },
      onStompError: (frame) => {
        console.warn("STOMP protocol error:", frame.headers?.message || frame);
        this.updateStatus("error");
      },
      onWebSocketClose: () => {
        if (this.status !== "disconnected") {
          this.updateStatus("disconnected");
        }
      },
      onWebSocketError: (event) => {
        console.warn("WebSocket connection error:", event);
        this.updateStatus("error");
      },
    });

    this.client.activate();
  }

  disconnect() {
    this.currentAccessToken = null;
    if (this.messageSubscription) {
      try {
        this.messageSubscription.unsubscribe();
      } catch {
        // ignore
      }
      this.messageSubscription = null;
    }

    if (this.scheduleSubscription) {
      try {
        this.scheduleSubscription.unsubscribe();
      } catch {
        // ignore
      }
      this.scheduleSubscription = null;
    }

    if (this.notificationSubscription) {
      try {
        this.notificationSubscription.unsubscribe();
      } catch {
        // ignore
      }
      this.notificationSubscription = null;
    }

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.updateStatus("disconnected");
  }

  sendMessage(recipientId, content, extra = {}) {
    if (!this.client || !this.client.connected) {
      throw new Error("WEBSOCKET_NOT_CONNECTED");
    }

    const trimmed = (content || "").trim();
    if (!trimmed && !extra.sharedMaterialId) {
      throw new Error("EMPTY_MESSAGE");
    }

    this.client.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({
        recipientId,
        content: trimmed,
        ...extra,
      }),
    });
  }

  notifyMessageListeners(message) {
    this.messageListeners.forEach((listener) => {
      try {
        listener(message);
      } catch (err) {
        console.error("Error in message listener:", err);
      }
    });
  }

  notifyScheduleListeners(notification) {
    this.scheduleListeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.error("Error in schedule listener:", err);
      }
    });
  }

  notifyNotificationListeners(notification) {
    this.notificationListeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.error("Error in notification listener:", err);
      }
    });
  }

  onMessage(callback) {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  onScheduleUpdate(callback) {
    this.scheduleListeners.add(callback);
    return () => {
      this.scheduleListeners.delete(callback);
    };
  }

  onNotification(callback) {
    this.notificationListeners.add(callback);
    return () => {
      this.notificationListeners.delete(callback);
    };
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  isConnected() {
    return Boolean(this.client && this.client.connected);
  }
}

export const realtimeService = new RealtimeService();
