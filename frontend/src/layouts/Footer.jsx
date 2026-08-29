import { Link } from "react-router-dom";

const footerColumns = [
  {
    title: "Khám phá",
    links: [
      { label: "Trang chủ", to: "/" },
      { label: "Bạn bè", to: "/friends" },
      { label: "Hồ sơ cá nhân", to: "/profile" },
    ],
  },
  {
    title: "Conflict",
    links: [
      { label: "Về chúng mình" },
      { label: "Không gian an toàn" },
      { label: "Góp ý sản phẩm" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Trung tâm trợ giúp" },
      { label: "Quyền riêng tư" },
      { label: "Điều khoản" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-white/80 bg-[#f0edf9]/75">
      <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-social-violet/20">
              <span className="grid h-11 w-11 place-items-center rounded-[16px] bg-gradient-to-br from-social-violet to-social-pink text-lg font-black text-white shadow-[0_8px_20px_rgba(124,110,230,0.22)]">C</span>
              <span className="text-xl font-black tracking-[-0.04em] text-social-ink">conflict</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-6 text-social-muted">
              Một góc nhỏ để bạn là chính mình, tìm đúng người và chia sẻ những điều thật dễ thương.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-xs font-bold text-social-violet">
              <span className="h-2 w-2 rounded-full bg-[#69c9ae]" />
              Luôn có chỗ cho vibe của bạn
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-extrabold text-social-ink">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((item) => (
                  <li key={item.label}>
                    {item.to ? (
                      <Link to={item.to} className="text-sm text-social-muted hover:text-social-violet">{item.label}</Link>
                    ) : (
                      <span className="text-sm text-social-muted">{item.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#ddd7ee] pt-6 text-xs text-social-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Conflict. Share your vibe.</p>
          <p>Được tạo nên cho những kết nối chân thành ✦</p>
        </div>
      </div>
    </footer>
  );
}
