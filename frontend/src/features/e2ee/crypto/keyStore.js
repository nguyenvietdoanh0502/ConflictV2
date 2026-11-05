const DB_NAME = "unisync_e2ee_keystore";
const DB_VERSION = 1;
const STORE_NAME = "identity_keys";

function isIndexedDbSupported() {
  return typeof indexedDB !== "undefined";
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbSupported()) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function makeRecordId(userId, keyVersion) {
  return `${String(userId).toLowerCase()}:${Number(keyVersion)}`;
}

export async function savePrivateKeyToStore(userId, keyVersion, privateKey) {
  try {
    const db = await openDatabase();
    if (!db) return false;
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put({
        id: makeRecordId(userId, keyVersion),
        userId: String(userId).toLowerCase(),
        keyVersion: Number(keyVersion),
        privateKey,
        savedAt: Date.now(),
      });
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    return false;
  }
}

export async function loadPrivateKeyFromStore(userId, keyVersion) {
  try {
    const db = await openDatabase();
    if (!db) return null;
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(makeRecordId(userId, keyVersion));
      req.onsuccess = () => {
        db.close();
        resolve(req.result?.privateKey || null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function clearAllKeysFromStore() {
  try {
    const db = await openDatabase();
    if (!db) return;
    await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // ignore cleanup errors
  }
}

