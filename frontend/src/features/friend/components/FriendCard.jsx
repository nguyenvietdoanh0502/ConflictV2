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
    <article className="flex flex-col gap-4 rounded-xl border border-[#2A2A2A] bg-[#101010] p-4 sm:flex-row sm:items-center">
      <FriendAvatar
        fullName={displayName}
        avatarUrl={friend?.user?.avatarUrl}
      />

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-bold text-white">
          {displayName}
        </h4>
        <p className="mt-1 text-xs text-[#777777]">
          {formatFriendsSince(friend?.friendsSince)}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onRemove?.(friend)}
        disabled={!onRemove || isRemoving}
        aria-label={`Hủy kết bạn với ${displayName}`}
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#4A3030] px-3.5 text-xs font-semibold text-[#F08B8B] transition hover:border-[#E50000] hover:bg-[#E50000] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50000]/60 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRemoving ? "Đang xóa..." : "Hủy kết bạn"}
      </button>
    </article>
  );
}
