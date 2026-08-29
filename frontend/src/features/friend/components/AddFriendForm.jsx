const feedbackClasses = {
  success: "border-[#B8EADD] bg-[#EFFBF7] text-[#317968]",
  error: "border-[#FFC6D8] bg-[#FFF1F6] text-[#A63E62]",
  info: "border-[#D8D1FF] bg-[#F3F0FF] text-[#5E52B7]",
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
      className="overflow-hidden rounded-[28px] border border-white/80 bg-[#FFF9FC] shadow-[0_18px_50px_rgba(77,62,140,0.10)] ring-1 ring-[#EEE9F8]"
    >
      <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
        <div className="bg-white/90 p-5 sm:p-7">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#F0EDFF] text-[#7C6EE6] shadow-[0_8px_18px_rgba(124,110,230,0.14)]" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 10a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM5 19c.9-2.5 3.5-4 7-4s6.1 1.5 7 4M18 5v4m-2-2h4" />
            </svg>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7C6EE6]">
            Thêm kết nối mới
          </p>
          <h3
            id="add-friend-title"
            className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-[#2F2A45] sm:text-2xl"
          >
            Gửi lời mời bằng mã người dùng
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#746E88]">
            Nhập mã theo định dạng RML-123456. Người nhận sẽ xuất hiện trong
            danh sách lời mời đã gửi cho đến khi họ phản hồi.
          </p>

          <form className="mt-5" onSubmit={handleSubmit}>
            <label
              htmlFor="friend-pin-code"
              className="text-sm font-bold text-[#453F5C]"
            >
              Mã người dùng của bạn bè
            </label>

            <div className="mt-2.5 flex flex-col gap-3 sm:flex-row">
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
                className="min-h-12 min-w-0 flex-1 rounded-2xl border border-[#DDD7F0] bg-[#FBFAFF] px-4 text-sm font-bold uppercase tracking-[0.08em] text-[#2F2A45] outline-none transition placeholder:font-medium placeholder:tracking-normal placeholder:text-[#77718C] hover:border-[#BEB5E8] focus:border-[#7C6EE6] focus:bg-white focus:ring-4 focus:ring-[#7C6EE6]/[.15] disabled:cursor-not-allowed disabled:bg-[#F3F1F8]"
              />

              <button
                type="submit"
                disabled={!onSubmit || isSubmitting}
                aria-busy={isSubmitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#7C6EE6] px-5 text-sm font-bold text-white shadow-[0_9px_20px_rgba(124,110,230,0.28)] transition hover:-translate-y-0.5 hover:bg-[#695BCF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/25 disabled:cursor-not-allowed disabled:bg-[#CFC9EC] disabled:shadow-none"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 3-7.5 18-4.2-8.3L1 8.5 21 3Zm-11.7 9.7L21 3" />
                </svg>
                {isSubmitting ? "Đang gửi..." : "Gửi lời mời"}
              </button>
            </div>

            <p
              id="friend-pin-code-hint"
              className="mt-2 text-xs leading-5 text-[#69627E]"
            >
              Gồm tiền tố RML, dấu gạch ngang và 6 chữ số.
            </p>

            {feedback?.message ? (
              <p
                id={feedbackId}
                role={feedback.type === "error" ? "alert" : "status"}
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${feedbackClass}`}
              >
                {feedback.message}
              </p>
            ) : null}
          </form>
        </div>

        <div className="relative flex min-h-64 flex-col justify-between overflow-hidden border-t border-[#E9E3F5] bg-gradient-to-br from-[#E7E2FF] via-[#F6E9FF] to-[#FFE7EF] p-5 sm:p-7 lg:border-l lg:border-t-0">
          <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#B8EADD]/60 blur-2xl" aria-hidden="true" />
          <span className="pointer-events-none absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-[#FFD8BE]/70 blur-2xl" aria-hidden="true" />
          <div>
            <div className="relative mb-5 grid h-12 w-12 place-items-center rounded-[18px] border border-white/80 bg-white/[.65] text-[#6B5ED0] shadow-sm" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 8.5V7a4 4 0 0 1 8 0v1.5M7 8.5h10a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 2-2Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v2" />
              </svg>
            </div>
            <p className="relative text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B5ED0]">
              Mã của bạn
            </p>
            <p className="relative mt-3 break-all font-mono text-2xl font-extrabold tracking-[0.08em] text-[#2F2A45] sm:text-3xl">
              {currentUserPinCode}
            </p>
            <p className="relative mt-2 text-xs leading-5 text-[#6F6883]">
              Chia sẻ mã này để người khác có thể gửi lời mời cho bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={onCopyPinCode}
            disabled={!onCopyPinCode}
            className="relative mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/90 bg-white/75 px-4 text-sm font-bold text-[#554D71] shadow-[0_8px_20px_rgba(77,62,140,0.10)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="8" y="8" width="11" height="11" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
            Sao chép mã
          </button>
        </div>
      </div>
    </section>
  );
}
