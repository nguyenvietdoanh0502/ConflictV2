const BRIDGE_URL = import.meta.env.VITE_ZALO_BRIDGE_URL || "http://localhost:3001";

export async function fetchBridgeStatus() {
  try {
    const res = await fetch(`${BRIDGE_URL}/zalo/status`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn("[ZaloBridgeApi] Status check failed:", err.message);
    return null;
  }
}

export async function switchBridgeMode(mode) {
  const res = await fetch(`${BRIDGE_URL}/zalo/mode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Không thể chuyển chế độ");
  return json.data;
}

export async function generateBridgeQr() {
  const res = await fetch(`${BRIDGE_URL}/zalo/qr/generate`, {
    method: "POST",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Không thể tạo mã QR");
  return json.data;
}

export async function logoutBridge() {
  const res = await fetch(`${BRIDGE_URL}/zalo/logout`, {
    method: "POST",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi khi đăng xuất");
  return json.data;
}

export async function fetchBridgeGroups() {
  try {
    const res = await fetch(`${BRIDGE_URL}/zalo/groups`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn("[ZaloBridgeApi] Failed to fetch groups:", err.message);
    return [];
  }
}

export async function refreshBridgeGroups() {
  const res = await fetch(`${BRIDGE_URL}/zalo/groups/refresh`, {
    method: "POST",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Lỗi khi làm mới danh sách nhóm");
  return json.data || [];
}
