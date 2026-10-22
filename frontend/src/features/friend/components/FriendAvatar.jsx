const avatarSizes = {
  sm: "h-11 w-11 rounded-2xl text-sm",
  md: "h-14 w-14 rounded-[20px] text-base",
};

export default function FriendAvatar({
  fullName,
  avatarUrl,
  size = "md",
}) {
  const displayName = fullName?.trim() || "Người dùng Conflict";
  const firstLetter = Array.from(displayName)[0]?.toUpperCase() || "?";
  const sizeClass = avatarSizes[size] ?? avatarSizes.md;

  if (avatarUrl?.trim()) {
    return (
      <img
        src={avatarUrl}
        alt=""
        aria-hidden="true"
        className={`${sizeClass} shrink-0 border-2 border-white object-cover shadow-[0_8px_22px_rgba(124,110,230,0.18)] ring-1 ring-[#E8E2FF]`}
        loading="lazy"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} grid shrink-0 place-items-center border-2 border-white bg-gradient-to-br from-[#9B8FF0] via-[#7C6EE6] to-[#FF8FB3] font-bold text-white shadow-[0_8px_22px_rgba(124,110,230,0.22)] ring-1 ring-[#E8E2FF]`}
    >
      {firstLetter}
    </span>
  );
}
