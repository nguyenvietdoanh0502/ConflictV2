const DEFAULT_PBKDF2_ITERATIONS = 600_000;
const HKDF_SALT = "unisync-e2ee-v1";
export const E2EE_PIN_LENGTH = 8;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getCrypto() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto;
  }
  throw new Error("WEBCRYPTO_NOT_SUPPORTED");
}

export function isValidE2eePin(pin) {
  return typeof pin === "string" && Array.from(pin).length === E2EE_PIN_LENGTH;
}

export function bytesToBase64(bytes) {
  const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof globalThis.Buffer !== "undefined") {
    return globalThis.Buffer.from(uint8).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < uint8.byteLength; i += 1) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64) {
  const cleaned = String(base64 || "").trim();
  if (typeof globalThis.Buffer !== "undefined") {
    return new Uint8Array(globalThis.Buffer.from(cleaned, "base64"));
  }
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function generateIdentityKeyPair() {
  const webCrypto = getCrypto();
  return webCrypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
}

export async function exportPublicKeySpki(publicKey) {
  const webCrypto = getCrypto();
  const spkiBuffer = await webCrypto.subtle.exportKey("spki", publicKey);
  return bytesToBase64(spkiBuffer);
}

export async function importPublicKeySpki(spkiBase64) {
  const webCrypto = getCrypto();
  const spkiBytes = base64ToBytes(spkiBase64);
  return webCrypto.subtle.importKey(
    "spki",
    spkiBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
}

async function deriveWrappingKey(pin, saltBytes, iterations = DEFAULT_PBKDF2_ITERATIONS) {
  const webCrypto = getCrypto();
  const baseKey = await webCrypto.subtle.importKey(
    "raw",
    textEncoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return webCrypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBytes,
      iterations,
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function wrapPrivateKey(
  privateKey,
  pin,
  iterations = DEFAULT_PBKDF2_ITERATIONS
) {
  if (!isValidE2eePin(pin)) {
    throw new Error("E2EE_INVALID_PIN_LENGTH");
  }
  const webCrypto = getCrypto();
  const pkcs8Buffer = await webCrypto.subtle.exportKey("pkcs8", privateKey);
  const saltBytes = webCrypto.getRandomValues(new Uint8Array(16));
  const ivBytes = webCrypto.getRandomValues(new Uint8Array(12));
  const wrappingKey = await deriveWrappingKey(pin, saltBytes, iterations);

  const encryptedBuffer = await webCrypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    wrappingKey,
    pkcs8Buffer
  );

  return {
    encryptedPrivateKey: bytesToBase64(encryptedBuffer),
    kdfSalt: bytesToBase64(saltBytes),
    wrapIv: bytesToBase64(ivBytes),
    kdfIterations: iterations,
  };
}

export async function unwrapPrivateKey(bundle, pin, extractable = false) {
  if (!isValidE2eePin(pin)) {
    throw new Error("E2EE_WRONG_PIN");
  }
  const webCrypto = getCrypto();
  const saltBytes = base64ToBytes(bundle.kdfSalt);
  const ivBytes = base64ToBytes(bundle.wrapIv);
  const cipherBytes = base64ToBytes(bundle.encryptedPrivateKey);
  const iterations = Number(bundle.kdfIterations) || DEFAULT_PBKDF2_ITERATIONS;

  const wrappingKey = await deriveWrappingKey(pin, saltBytes, iterations);
  let pkcs8Buffer;
  try {
    pkcs8Buffer = await webCrypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes },
      wrappingKey,
      cipherBytes
    );
  } catch {
    throw new Error("E2EE_WRONG_PIN");
  }

  return webCrypto.subtle.importKey(
    "pkcs8",
    pkcs8Buffer,
    { name: "ECDH", namedCurve: "P-256" },
    extractable,
    ["deriveBits"]
  );
}

export async function deriveConversationKey(
  myPrivateKey,
  peerPublicKey,
  { myUserId, myKeyVersion, peerUserId, peerKeyVersion }
) {
  const webCrypto = getCrypto();
  const sharedBits = await webCrypto.subtle.deriveBits(
    { name: "ECDH", public: peerPublicKey },
    myPrivateKey,
    256
  );

  const hkdfKey = await webCrypto.subtle.importKey(
    "raw",
    sharedBits,
    "HKDF",
    false,
    ["deriveKey"]
  );

  const participants = [
    { id: String(myUserId).toLowerCase(), ver: Number(myKeyVersion) },
    { id: String(peerUserId).toLowerCase(), ver: Number(peerKeyVersion) },
  ].sort((a, b) => a.id.localeCompare(b.id));

  const infoStr = `chat|${participants[0].id}:${participants[0].ver}|${participants[1].id}:${participants[1].ver}`;

  return webCrypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: textEncoder.encode(HKDF_SALT),
      info: textEncoder.encode(infoStr),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function buildAdditionalData(senderId, recipientId) {
  return textEncoder.encode(
    `${String(senderId).toLowerCase()}>${String(recipientId).toLowerCase()}|v1`
  );
}

export async function encryptText(convKey, plaintext, senderId, recipientId) {
  const webCrypto = getCrypto();
  const ivBytes = webCrypto.getRandomValues(new Uint8Array(12));
  const aad = buildAdditionalData(senderId, recipientId);
  const cipherBuffer = await webCrypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
      additionalData: aad,
    },
    convKey,
    textEncoder.encode(plaintext)
  );
  return {
    content: bytesToBase64(cipherBuffer),
    iv: bytesToBase64(ivBytes),
  };
}

export async function decryptText(
  convKey,
  { content, iv, senderId, recipientId }
) {
  const webCrypto = getCrypto();
  const ivBytes = base64ToBytes(iv);
  const cipherBytes = base64ToBytes(content);
  const aad = buildAdditionalData(senderId, recipientId);
  const plainBuffer = await webCrypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes,
      additionalData: aad,
    },
    convKey,
    cipherBytes
  );
  return textDecoder.decode(plainBuffer);
}
