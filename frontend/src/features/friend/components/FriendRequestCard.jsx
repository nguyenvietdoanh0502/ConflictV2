import FriendAvatar from "./FriendAvatar";

function formatRequestTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function FriendRequestCard({
  request,
  direction = "incoming",
  onAccept,
  onRemove,
  isBusy = false,
}) {
  const isIncoming = direction === "incoming";
  const displayName = request?.user?.fullName?.trim() || "Người dùng Conflict";
  const dateLabel = formatRequestTime(request?.createdAt);

  return (
    <article className="rounded-xl border border-[#2A2A2A] bg-[#101010] p-4">
      <div className="flex items-center gap-3">
        <FriendAvatar
          fullName={displayName}
          avatarUrl={request?.user?.avatarUrl}
          size="sm"
        />

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold text-white">
            {displayName}
          </h4>
          <p className="mt-1 text-xs text-[#777777]">
            {dateLabel
              ? `${isIncoming ? "Đã nhận" : "Đã gửi"} ngày ${dateLabel}`
              : "Đang chờ phản hồi"}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-300">
          Đang chờ
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        {isIncoming ? (
          <button
            type="button"
            onClick={() => onAccept?.(request)}
            disabled={!onAccept || isBusy}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#E50000] px-4 text-xs font-semibold text-white transition hover:bg-[#FF1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50000]/60 disabled:cursor-not-allowed disabled:bg-[#4A1B1B] disabled:text-[#A77A7A]"
          >
            {isBusy ? "Đang xử lý..." : "Chấp nhận"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => onRemove?.(request)}
          disabled={!onRemove || isBusy}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#444444] px-4 text-xs font-semibold text-[#BDBDBD] transition hover:border-[#666666] hover:bg-[#202020] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50000]/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isIncoming ? "Từ chối" : "Hủy lời mời"}
        </button>
      </div>
    </article>
  );
}
