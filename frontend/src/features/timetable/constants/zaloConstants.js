/**
 * Constants & Utility functions for Zalo Groups in UniSync
 */

export const DEFAULT_MOCK_GROUPS = [
  { id: "group-it101", name: "Lập trình Web - K64", memberCount: 65, active: true },
  { id: "group-cs202", name: "Mạng máy tính - Lớp 2", memberCount: 72, active: true },
  { id: "group-db301", name: "Cơ sở dữ liệu - K64", memberCount: 58, active: true },
  { id: "group-math1", name: "Giải tích 2 - Nhóm 03", memberCount: 80, active: true },
  { id: "group-se404", name: "Kỹ thuật phần mềm - Nhóm đồ án", memberCount: 12, active: true },
  { id: "group-os606", name: "Hệ điều hành - K64", memberCount: 62, active: true },
  { id: "group-algo707", name: "Thuật toán ứng dụng - Lớp 01", memberCount: 74, active: true },
  { id: "group-ai505", name: "Trí tuệ nhân tạo - Nhóm 02", memberCount: 85, active: true },
  { id: "group-sec808", name: "An toàn và bảo mật hệ thống", memberCount: 50, active: true },
  { id: "group-proj909", name: "Đồ án chuyên ngành CNTT", memberCount: 28, active: true },
];

/**
 * Remove Vietnamese accents for fast, flexible searching
 * e.g., "lap trinh" matches "Lập trình Web"
 */
export function removeVietnameseAccents(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Vietnamese Collator for accurate alphabetical sorting
 * Handles Vietnamese alphabet: A, Ă, Â, B, C, D, Đ, E, Ê, G, H, I, K, L, M, N, O, Ô, Ơ, P, Q, R, S, T, U, Ư, V, X, Y
 */
const viCollator = new Intl.Collator("vi", { sensitivity: "base", numeric: true });

/**
 * Sorts an array of Zalo groups alphabetically by name using Vietnamese collation
 */
export function sortZaloGroupsAlphabetically(groups = []) {
  if (!Array.isArray(groups)) return [];
  return [...groups].sort((a, b) => {
    const nameA = a?.name || a?.zaloGroupName || "";
    const nameB = b?.name || b?.zaloGroupName || "";
    return viCollator.compare(nameA, nameB);
  });
}

/**
 * Filters Zalo groups by search query (accent-insensitive & matches both name and ID)
 */
export function filterZaloGroups(groups = [], query = "") {
  if (!Array.isArray(groups)) return [];
  const normalizedQuery = removeVietnameseAccents(query);
  if (!normalizedQuery) return groups;

  return groups.filter((g) => {
    const name = g?.name || g?.zaloGroupName || "";
    const id = g?.id || g?.zaloGroupId || "";
    const normalizedName = removeVietnameseAccents(name);
    const normalizedId = removeVietnameseAccents(id);

    return normalizedName.includes(normalizedQuery) || normalizedId.includes(normalizedQuery);
  });
}

/**
 * Groups sorted Zalo groups by their first letter
 * e.g. "C" -> [ "Cơ sở dữ liệu..." ], "Đ" -> [ "Đồ án..." ]
 */
export function groupZaloGroupsByLetter(sortedGroups = []) {
  if (!Array.isArray(sortedGroups)) return [];
  const map = new Map();

  for (const group of sortedGroups) {
    const name = (group?.name || group?.zaloGroupName || "").trim();
    const firstChar = name.length > 0 ? name.charAt(0).toUpperCase() : "#";
    if (!map.has(firstChar)) {
      map.set(firstChar, []);
    }
    map.get(firstChar).push(group);
  }

  return Array.from(map.entries());
}
