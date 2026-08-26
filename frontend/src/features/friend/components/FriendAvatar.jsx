const avatarSizes = {
  sm: "h-11 w-11 rounded-xl text-sm",
  md: "h-14 w-14 rounded-2xl text-base",
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
        className={`${sizeClass} shrink-0 border border-[#3A3A3A] object-cover`}
        loading="lazy"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} grid shrink-0 place-items-center border border-[#E50000]/35 bg-gradient-to-br from-[#E50000] to-[#8A0000] font-bold text-white`}
    >
      {firstLetter}
    </span>
  );
}
