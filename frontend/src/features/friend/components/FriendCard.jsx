import FriendAvatar from "./FriendAvatar";

function formatFriendsSince(value) {
  if (!value) {
    return "Đã kết bạn";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Đã kết bạn";
  }

  return `Bạn bè từ ${new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)}`;
}

export default function FriendCard({
  friend,
  onRemove,
  isRemoving = false,
}) {
  const displayName = friend?.user?.fullName?.trim() || "Người dùng Conflict";

  return (
    <article
      aria-busy={isRemoving}
      className="group flex h-full flex-col gap-4 rounded-[22px] border border-[#E8E2FF] bg-white/90 p-4 shadow-[0_10px_30px_rgba(77,62,140,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-[#CEC5FF] hover:shadow-[0_16px_38px_rgba(77,62,140,0.13)] motion-reduce:transform-none sm:flex-row sm:items-center"
    >
      <FriendAvatar
        fullName={displayName}
        avatarUrl={friend?.user?.avatarUrl}
      />

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-bold text-[#2F2A45]">
          {displayName}
        </h4>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#77708F]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#B8EADD]" aria-hidden="true" />
          {formatFriendsSince(friend?.friendsSince)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onRemove?.(friend)}
        disabled={!onRemove || isRemoving}
        aria-label={`Hủy kết bạn với ${displayName}`}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#FFD0DE] bg-[#FFF5F8] px-4 text-xs font-bold text-[#C85078] transition hover:border-[#FF8FB3] hover:bg-[#FFE8F0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF8FB3]/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7.5h4.5m0 0L17.75 5.75M19.5 7.5l-1.75 1.75M13.5 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm2.25 7.25a7.75 7.75 0 0 0-12.5 0" />
        </svg>
        {isRemoving ? "Đang xóa..." : "Hủy kết bạn"}
      </button>
    </article>
  );
}
