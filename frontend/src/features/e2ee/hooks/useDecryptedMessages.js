import { useEffect, useState } from "react";
import { e2eeSession } from "../e2eeSession";

export function useDecryptedMessages(messages, currentUserId) {
  const [versionTick, setVersionTick] = useState(0);
  const [decryptedMap, setDecryptedMap] = useState({});

  useEffect(() => {
    return e2eeSession.subscribe(() => {
      setVersionTick((prev) => prev + 1);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function runDecryption() {
      if (!Array.isArray(messages) || messages.length === 0) {
        return;
      }

      const updates = {};
      for (const msg of messages) {
        if (!msg?.id || !msg.encrypted) continue;
        const result = await e2eeSession.decryptMessage(msg, currentUserId);
        updates[msg.id] = result;
      }

      if (!cancelled && Object.keys(updates).length > 0) {
        setDecryptedMap((prev) => ({ ...prev, ...updates }));
      }
    }

    runDecryption();

    return () => {
      cancelled = true;
    };
  }, [messages, currentUserId, versionTick]);

  return (messages || []).map((msg) => {
    if (!msg?.encrypted) {
      return {
        ...msg,
        displayContent: msg?.content || "",
        cryptoState: "plain",
      };
    }

    const resolved = decryptedMap[msg.id];
    if (resolved) {
      return {
        ...msg,
        displayContent: resolved.displayContent,
        cryptoState: resolved.cryptoState,
      };
    }

    return {
      ...msg,
      displayContent: "Đang giải mã tin nhắn...",
      cryptoState: "pending",
    };
  });
}

