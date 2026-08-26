const feedbackClasses = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error: "border-[#E50000]/35 bg-[#E50000]/10 text-[#FF8A8A]",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

export default function AddFriendForm({
  currentUserPinCode = "RML-••••••",
  pinCode,
  onPinCodeChange,
  onSubmit,
  onCopyPinCode,
  isSubmitting = false,
  feedback,
}) {
  const controlledInputProps =
    typeof pinCode === "string" ? { value: pinCode } : {};

  const handleSubmit = (event) => {
    if (!onSubmit) {
      event.preventDefault();
      return;
    }

    onSubmit(event);
  };

  const feedbackClass =
    feedbackClasses[feedback?.type] ?? feedbackClasses.info;
  const feedbackId = feedback?.message ? "friend-form-feedback" : undefined;

  return (
    <section
      aria-labelledby="add-friend-title"
      className="overflow-hidden rounded-2xl border border-[#2B2B2B] bg-[#141414]"
    >
      <div className="grid gap-px bg-[#2B2B2B] lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.55fr)]">
        <div className="bg-[#141414] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E50000]">
            Thêm kết nối mới
          </p>
          <h3
            id="add-friend-title"
            className="mt-2 text-xl font-bold text-white"
          >
            Gửi lời mời bằng mã người dùng
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8C8C8C]">
            Nhập mã theo định dạng RML-123456. Người nhận sẽ xuất hiện trong
            danh sách lời mời đã gửi cho đến khi họ phản hồi.
          </p>

          <form className="mt-5" onSubmit={handleSubmit}>
            <label
              htmlFor="friend-pin-code"
              className="text-sm font-semibold text-[#D6D6D6]"
            >
              Mã người dùng của bạn bè
            </label>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                {...controlledInputProps}
                id="friend-pin-code"
                name="pinCode"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={10}
                pattern="[Rr][Mm][Ll]-[0-9]{6}"
                placeholder="RML-123456"
                onChange={onPinCodeChange}
                disabled={isSubmitting}
                aria-describedby={
                  feedbackId
                    ? `friend-pin-code-hint ${feedbackId}`
                    : "friend-pin-code-hint"
                }
                aria-invalid={feedback?.type === "error"}
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#363636] bg-[#0F0F0F] px-4 text-sm font-semibold uppercase tracking-[0.08em] text-white outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-[#5F5F5F] hover:border-[#4A4A4A] focus:border-[#E50000] focus:ring-4 focus:ring-[#E50000]/10"
              />

              <button
                type="submit"
                disabled={!onSubmit || isSubmitting}
                aria-busy={isSubmitting}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#E50000] px-5 text-sm font-semibold text-white transition hover:bg-[#FF1A1A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E50000]/25 disabled:cursor-not-allowed disabled:bg-[#4A1B1B] disabled:text-[#A77A7A]"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi lời mời"}
              </button>
            </div>

            <p
              id="friend-pin-code-hint"
              className="mt-2 text-xs leading-5 text-[#6F6F6F]"
            >
              Gồm tiền tố RML, dấu gạch ngang và 6 chữ số.
            </p>

            {feedback?.message ? (
              <p
                id={feedbackId}
                role={feedback.type === "error" ? "alert" : "status"}
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${feedbackClass}`}
              >
                {feedback.message}
              </p>
            ) : null}
          </form>
        </div>

        <div className="flex flex-col justify-between bg-gradient-to-br from-[#1D1D1D] to-[#101010] p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#777777]">
              Mã của bạn
            </p>
            <p className="mt-3 break-all font-mono text-2xl font-bold tracking-[0.08em] text-white">
              {currentUserPinCode}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#777777]">
              Chia sẻ mã này để người khác có thể gửi lời mời cho bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={onCopyPinCode}
            disabled={!onCopyPinCode}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#3A3A3A] bg-[#191919] px-4 text-sm font-semibold text-[#D6D6D6] transition hover:border-[#5A5A5A] hover:bg-[#222222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50000]/60 disabled:cursor-not-allowed disabled:text-[#666666]"
          >
            Sao chép mã
          </button>
        </div>
      </div>
    </section>
  );
}
