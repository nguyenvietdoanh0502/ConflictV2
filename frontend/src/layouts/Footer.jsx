import logoMark from "../assets/logo2.png";
import logoWordmark from "../assets/logo3.png";

const footerColumns = [
  {
    title: "Khám phá",
    links: ["Trang chủ", "Phim", "Series", "Thể loại"],
  },
  {
    title: "Hỗ trợ",
    links: ["Liên hệ", "Câu hỏi thường gặp", "Trung tâm trợ giúp"],
  },
  {
    title: "Pháp lý",
    links: ["Điều khoản", "Quyền riêng tư", "Cookie"],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#1F1F1F] bg-[#0F0F0F]">
      <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <img
                className="h-11 w-11 shrink-0 object-contain"
                src={logoMark}
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
              <img
                className="h-8 w-auto object-contain"
                src={logoWordmark}
                alt="Conflict"
                loading="lazy"
              />
            </div>
            <p className="mt-5 max-w-xs text-sm leading-6 text-[#999999]">
              Không gian giải trí trực tuyến dành cho những người yêu điện ảnh
              và các series chất lượng.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-white">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link} className="text-sm text-[#999999]">
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#1F1F1F] pt-6 text-xs text-[#666666] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Conflict. Bản Home demo giao diện.</p>
          <p>Các chức năng sẽ được tích hợp sau.</p>
        </div>
      </div>
    </footer>
  );
}
