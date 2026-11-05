import {
  deriveConversationKey,
  decryptText,
  encryptText,
  exportPublicKeySpki,
  generateIdentityKeyPair,
  importPublicKeySpki,
  unwrapPrivateKey,
  wrapPrivateKey,
} from "./crypto/e2eeCrypto";
import {
  clearAllKeysFromStore,
  loadPrivateKeyFromStore,
  savePrivateKeyToStore,
} from "./crypto/keyStore";

class E2eeSession {
  constructor() {
    this.userId = null;
    this.activeKeyVersion = null;
    this.privateKeys = new Map(); // version -> CryptoKey
    this.peerPublicKeys = new Map(); // peerId -> Map<version, CryptoKey>
    this.peerActiveVersions = new Map(); // peerId -> number | null
    this.conversationKeys = new Map(); // cacheKey -> CryptoKey
    this.decryptedCache = new Map(); // messageId -> string
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Error in E2EE session listener:", err);
      }
    });
  }

  hasUnlockedKey(version = this.activeKeyVersion) {
    if (!version) return false;
    return this.privateKeys.has(Number(version));
  }

  ensureUserContext(normUserId) {
    if (this.userId && this.userId !== normUserId) {
      this.privateKeys.clear();
      this.conversationKeys.clear();
      this.decryptedCache.clear();
    }
    this.userId = normUserId;
  }

  async tryRestoreFromStore(userId, keyVersion) {
    if (!userId || !keyVersion) return false;
    const normUserId = String(userId).toLowerCase();
    const ver = Number(keyVersion);
    this.ensureUserContext(normUserId);
    this.activeKeyVersion = ver;

    if (this.privateKeys.has(ver)) {
      return true;
    }

    const storedKey = await loadPrivateKeyFromStore(normUserId, ver);
    if (storedKey) {
      this.privateKeys.set(ver, storedKey);
      this.notify();
      return true;
    }
    return false;
  }

  async createKeyBundleForPin(pin) {
    const keyPair = await generateIdentityKeyPair();
    const publicKey = await exportPublicKeySpki(keyPair.publicKey);
    const wrapped = await wrapPrivateKey(keyPair.privateKey, pin);
    const nonExtractablePrivate = await unwrapPrivateKey(wrapped, pin, false);
    return {
      requestPayload: {
        publicKey,
        ...wrapped,
      },
      nonExtractablePrivate,
    };
  }

  async activateLocalKey(userId, keyVersion, privateKey, remember = true) {
    const normUserId = String(userId).toLowerCase();
    const ver = Number(keyVersion);
    this.ensureUserContext(normUserId);
    this.activeKeyVersion = ver;
    this.privateKeys.set(ver, privateKey);
    if (remember) {
      await savePrivateKeyToStore(normUserId, ver, privateKey);
    }
    this.notify();
  }

  async unlockWithPin(userId, keyDto, pin, remember = true) {
    const ver = Number(keyDto.keyVersion);
    const privateKey = await unwrapPrivateKey(keyDto, pin, false);
    await this.activateLocalKey(userId, ver, privateKey, remember);
    return privateKey;
  }

  async rewrapBackupWithNewPin(keyDto, currentPin, newPin) {
    const extractableKey = await unwrapPrivateKey(keyDto, currentPin, true);
    const newWrapped = await wrapPrivateKey(extractableKey, newPin);
    const nonExtractableKey = await unwrapPrivateKey(newWrapped, newPin, false);
    return {
      requestPayload: newWrapped,
      nonExtractableKey,
    };
  }

  async ingestPeerPublicKeys(peerUserId, publicKeyList = []) {
    if (!peerUserId) return null;
    const normPeerId = String(peerUserId).toLowerCase();
    let versionMap = this.peerPublicKeys.get(normPeerId);
    if (!versionMap) {
      versionMap = new Map();
      this.peerPublicKeys.set(normPeerId, versionMap);
    }

    let activeVer = null;
    for (const item of publicKeyList) {
      const ver = Number(item.keyVersion);
      if (!ver || !item.publicKey) continue;
      if (!versionMap.has(ver)) {
        try {
          const imported = await importPublicKeySpki(item.publicKey);
          versionMap.set(ver, imported);
        } catch (err) {
          console.error("Failed to import peer E2EE public key:", err);
        }
      }
      if (item.active) {
        activeVer = ver;
      }
    }

    this.peerActiveVersions.set(normPeerId, activeVer);
    this.notify();
    return activeVer;
  }

  getPeerActiveVersion(peerUserId) {
    if (!peerUserId) return null;
    return this.peerActiveVersions.get(String(peerUserId).toLowerCase()) ?? null;
  }

  hasPeerKeyVersion(peerUserId, keyVersion) {
    if (!peerUserId || !keyVersion) return false;
    const versionMap = this.peerPublicKeys.get(String(peerUserId).toLowerCase());
    return Boolean(versionMap?.has(Number(keyVersion)));
  }

  async getConversationKey(myUserId, myKeyVersion, peerUserId, peerKeyVersion) {
    const normMe = String(myUserId).toLowerCase();
    const normPeer = String(peerUserId).toLowerCase();
    const myVer = Number(myKeyVersion);
    const peerVer = Number(peerKeyVersion);

    const cacheKey = `${normMe}:${myVer}|${normPeer}:${peerVer}`;
    if (this.conversationKeys.has(cacheKey)) {
      return this.conversationKeys.get(cacheKey);
    }

    let myPrivateKey = this.privateKeys.get(myVer);
    if (!myPrivateKey) {
      myPrivateKey = await loadPrivateKeyFromStore(normMe, myVer);
      if (myPrivateKey) {
        this.privateKeys.set(myVer, myPrivateKey);
      }
    }
    if (!myPrivateKey) {
      return null;
    }

    const peerVersionMap = this.peerPublicKeys.get(normPeer);
    const peerPublicKey = peerVersionMap?.get(peerVer);
    if (!peerPublicKey) {
      return null;
    }

    const convKey = await deriveConversationKey(myPrivateKey, peerPublicKey, {
      myUserId: normMe,
      myKeyVersion: myVer,
      peerUserId: normPeer,
      peerKeyVersion: peerVer,
    });
    this.conversationKeys.set(cacheKey, convKey);
    return convKey;
  }

  async encryptForPeer(myUserId, peerUserId, plaintext) {
    const normMe = String(myUserId).toLowerCase();
    const normPeer = String(peerUserId).toLowerCase();
    const myVer = this.activeKeyVersion;
    const peerVer = this.peerActiveVersions.get(normPeer);

    if (!myVer || !peerVer) {
      return null;
    }

    const convKey = await this.getConversationKey(normMe, myVer, normPeer, peerVer);
    if (!convKey) {
      return null;
    }

    const { content, iv } = await encryptText(convKey, plaintext, normMe, normPeer);
    return {
      content,
      iv,
      senderKeyVersion: myVer,
      recipientKeyVersion: peerVer,
    };
  }

  async decryptMessage(message, currentUserId) {
    if (!message || !message.encrypted) {
      return {
        displayContent: message?.content || "",
        cryptoState: "plain",
      };
    }

    if (message.id && this.decryptedCache.has(message.id)) {
      return {
        displayContent: this.decryptedCache.get(message.id),
        cryptoState: "decrypted",
      };
    }

    if (!currentUserId) {
      return {
        displayContent: "Nhập mã PIN để xem tin nhắn mã hóa",
        cryptoState: "locked",
      };
    }

    const normMe = String(currentUserId).toLowerCase();
    const normSender = String(message.senderId).toLowerCase();
    const normRecipient = String(message.recipientId).toLowerCase();
    const isOutgoing = normSender === normMe;

    const myKeyVersion = isOutgoing
      ? Number(message.senderKeyVersion)
      : Number(message.recipientKeyVersion);
    const peerUserId = isOutgoing ? normRecipient : normSender;
    const peerKeyVersion = isOutgoing
      ? Number(message.recipientKeyVersion)
      : Number(message.senderKeyVersion);

    if (!this.privateKeys.has(myKeyVersion)) {
      const restored = await loadPrivateKeyFromStore(normMe, myKeyVersion);
      if (restored) {
        this.privateKeys.set(myKeyVersion, restored);
      } else if (!this.hasUnlockedKey()) {
        return {
          displayContent: "Nhập mã PIN để xem tin nhắn mã hóa",
          cryptoState: "locked",
        };
      } else {
        return {
          displayContent: "Không thể giải mã (khóa đã được đặt lại)",
          cryptoState: "failed",
        };
      }
    }

    const convKey = await this.getConversationKey(
      normMe,
      myKeyVersion,
      peerUserId,
      peerKeyVersion
    );
    if (!convKey) {
      return {
        displayContent: "Đang tải khóa giải mã...",
        cryptoState: "pending",
      };
    }

    try {
      const plaintext = await decryptText(convKey, {
        content: message.content,
        iv: message.iv,
        senderId: normSender,
        recipientId: normRecipient,
      });
      if (message.id) {
        this.decryptedCache.set(message.id, plaintext);
      }
      return {
        displayContent: plaintext,
        cryptoState: "decrypted",
      };
    } catch {
      return {
        displayContent: "Không thể giải mã tin nhắn này",
        cryptoState: "failed",
      };
    }
  }

  async wipe() {
    this.userId = null;
    this.activeKeyVersion = null;
    this.privateKeys.clear();
    this.peerPublicKeys.clear();
    this.peerActiveVersions.clear();
    this.conversationKeys.clear();
    this.decryptedCache.clear();
    await clearAllKeysFromStore();
    this.notify();
  }
}

export const e2eeSession = new E2eeSession();

