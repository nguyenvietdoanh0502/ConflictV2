import { Link } from "react-router-dom";
import logoMark from "../assets/logo2.png";
import logoWordmark from "../assets/logo3.png";
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../features/auth/authSelectors";

export default function Header() {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const displayName =
    user?.fullName?.trim() || user?.email || "Người dùng";
  const avatarUrl = user?.avatarUrl?.trim();
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#262626]/80 bg-[#0F0F0F]/90 shadow-[0_8px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#0F0F0F]/75">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12 lg:py-5">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg transition hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50000]/70"
          aria-label="Về trang chủ Conflict"
        >
          <img
            className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
            src={logoMark}
            alt=""
            aria-hidden="true"
          />
          <img
            className="h-7 w-auto object-contain sm:h-8"
            src={logoWordmark}
            alt="Conflict"
          />
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-xl border-4 border-[#1F1F1F] bg-[#0F0F0F] p-2 lg:flex"
          aria-label="Điều hướng chính"
        >
          <Link
            to="/"
            className="rounded-lg bg-[#1A1A1A] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#262626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50000]/70"
          >
            Trang chủ
          </Link>
          {["Phim & Chương trình", "Hỗ trợ", "Gói dịch vụ"].map((item) => (
            <span key={item} className="px-5 py-3 text-sm text-[#BFBFBF]">
              {item}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-5">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg transition hover:bg-black/30"
            aria-label="Tìm kiếm"
          >
            <img
              className="h-6 w-6"
              src="/home/icons/search.svg"
              alt=""
            />
          </button>

          <button
            type="button"
            className="relative hidden h-9 w-9 place-items-center rounded-lg transition hover:bg-black/30 sm:grid"
            aria-label="Thông báo"
          >
            <img className="h-6 w-6" src="/home/icons/bell.svg" alt="" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-[#141414] bg-[#E50000]" />
          </button>

          {isAuthenticated && user ? (
            <Link
              to="/profile"
              className="flex max-w-[220px] items-center gap-3 rounded-xl border border-[#333333] bg-[#1A1A1A] px-2.5 py-2 transition hover:border-[#E50000]/60 hover:bg-[#262626]"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Ảnh đại diện của ${displayName}`}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E50000] text-sm font-bold text-white">
                  {avatarLetter}
                </span>
              )}

              <span className="hidden truncate text-sm font-semibold text-white sm:block">
                {displayName}
              </span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg bg-[#E50000] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Đăng nhập
              </Link>

              <Link
                to="/register"
                className="rounded-lg border border-[#E50000] px-5 py-2.5 text-sm font-semibold text-[#FF3333]"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
