import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import logoWithoutText from "../assets/logowithouttext.png";
import justText from "../assets/justtext.png";

export default function Footer() {
  return (
    <footer className="bg-[#483A94] text-white text-sm mt-16 shadow-inner">
      <div className="mx-auto max-w-[1340px] px-6 py-10 sm:px-8 sm:py-12">
        {/* Top Section: Links & Language Switcher */}
        <div className="flex flex-col-reverse justify-between gap-8 md:flex-row md:items-start">
          {/* Navigation Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-14 lg:gap-20 flex-1">
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-white hover:underline transition">
                  Về UniSync
                </Link>
              </li>
              <li>
                <Link to="/timetable" className="text-white hover:underline transition">
                  Thời khóa biểu & Lịch học
                </Link>
              </li>
              <li>
                <Link to="/study" className="text-white hover:underline transition">
                  Góc học tập & Đề cương AI
                </Link>
              </li>
              <li>
                <Link to="/" className="text-white hover:underline transition">
                  Tính năng cốt lõi
                </Link>
              </li>
            </ul>

            <ul className="space-y-3">
              <li>
                <Link to="/friends" className="text-white hover:underline transition">
                  Mạng lưới bạn bè
                </Link>
              </li>
              <li>
                <Link to="/study" className="text-white hover:underline transition">
                  Trắc nghiệm & Flashcard
                </Link>
              </li>
              <li>
                <Link to="/timetable" className="text-white hover:underline transition">
                  Hướng dẫn kết nối Zalo
                </Link>
              </li>
              <li>
                <span className="text-white/80 hover:text-white cursor-pointer transition">
                  Điều khoản sử dụng
                </span>
              </li>
            </ul>

            <ul className="space-y-3">
              <li>
                <span className="text-white/80 hover:text-white cursor-pointer transition">
                  Chính sách quyền riêng tư
                </span>
              </li>
              <li>
                <span className="text-white/80 hover:text-white cursor-pointer transition">
                  Trung tâm trợ giúp
                </span>
              </li>
              <li>
                <a
                  href="mailto:support@unisync.edu.vn"
                  className="text-white/80 hover:text-white transition"
                >
                  Góp ý & Báo lỗi
                </a>
              </li>
            </ul>
          </div>

          {/* Language Switcher (Udemy signature button) */}
          <div className="shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2.5 rounded border border-white/80 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/15 transition-colors shadow-sm"
            >
              <Globe className="h-4 w-4" />
              <span>Tiếng Việt</span>
            </button>
          </div>
        </div>

        {/* Bottom Section: Logo & Copyright */}
        <div className="mt-12 pt-8 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="rounded-xl bg-white p-1.5 shadow-sm transition-transform group-hover:scale-105">
              <img
                src={logoWithoutText}
                alt="UniSync"
                className="h-6 w-6 object-contain"
              />
            </div>
            <img
              src={justText}
              alt="UniSync"
              className="h-6 w-auto object-contain brightness-0 invert transition-transform group-hover:scale-105"
            />
          </Link>

          <p className="text-xs text-white/80 font-medium">
            © 2026 UniSync. University + Synchronize.
          </p>
        </div>
      </div>
    </footer>
  );
}
