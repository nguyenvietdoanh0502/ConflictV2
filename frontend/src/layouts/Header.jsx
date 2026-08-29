import { Link, NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../features/auth/authSelectors";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="m3.5 10.7 8.5-7 8.5 7v8.1a1.7 1.7 0 0 1-1.7 1.7h-4.2v-6.2H9.4v6.2H5.2a1.7 1.7 0 0 1-1.7-1.7v-8.1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path
        d="M8.7 11.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Zm6.6-1.1a3 3 0 1 0 0-6m-12 16v-2.1c0-2.7 2.4-4.8 5.4-4.8s5.4 2.1 5.4 4.8V20H3.3Zm12.2-6.5c2.8.1 5.2 1.8 5.2 4.4V20h-3.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4.5 20c.7-4 3.4-6.1 7.5-6.1s6.8 2.1 7.5 6.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="m20 20-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Zm-8 11h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrandMark() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-full bg-social-violet text-white shadow-[0_5px_14px_rgba(124,110,230,0.30)]">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
        <path
          d="M6.5 5.5h11A3.5 3.5 0 0 1 21 9v4a3.5 3.5 0 0 1-3.5 3.5h-5L8 20v-3.5H6.5A3.5 3.5 0 0 1 3 13V9a3.5 3.5 0 0 1 3.5-3.5Z"
          fill="currentColor"
        />
        <path d="M8 11h8" stroke="#7C6EE6" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

const navItems = [
  { label: "Trang chủ", to: "/", end: true, icon: HomeIcon },
  { label: "Bạn bè", to: "/friends", protected: true, icon: FriendsIcon },
  { label: "Hồ sơ", to: "/profile", end: true, protected: true, icon: ProfileIcon },
];

const roundButtonClass =
  "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F0EEF8] text-[#4F4965] hover:bg-[#E8E4F7] hover:text-social-violet focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-social-violet/20 disabled:cursor-default disabled:hover:bg-[#F0EEF8] disabled:hover:text-[#4F4965]";

export default function Header() {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const displayName = user?.fullName?.trim() || user?.email || "Người dùng";
  const avatarUrl = user?.avatarUrl?.trim();
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const visibleNavItems = navItems.filter((item) => !item.protected || isAuthenticated);

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-[#E5E2EC] bg-white shadow-[0_2px_10px_rgba(47,42,69,0.07)]">
      <a
        href="#main-content"
        className="absolute left-3 top-2 z-[60] -translate-y-20 rounded-xl bg-social-violet px-4 py-2 text-sm font-bold text-white focus:translate-y-0 focus:outline-none focus:ring-4 focus:ring-social-violet/25"
      >
        Đi đến nội dung chính
      </a>

      <div className="grid h-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 px-3 sm:gap-3 lg:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/"
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-social-violet/20"
            aria-label="Về trang chủ Conflict"
          >
            <BrandMark />
          </Link>

          <button
            type="button"
            disabled
            title="Tính năng tìm kiếm đang được hoàn thiện"
            className={`${roundButtonClass} lg:hidden`}
            aria-label="Tìm kiếm trên Conflict"
          >
            <SearchIcon />
          </button>

          <button
            type="button"
            disabled
            title="Tính năng tìm kiếm đang được hoàn thiện"
            className="hidden h-10 w-[220px] cursor-default items-center gap-2.5 rounded-full bg-[#F3F2F7] px-4 text-left text-sm font-medium text-[#77718C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-social-violet/20 lg:flex xl:w-[250px]"
            aria-label="Tìm kiếm trên Conflict"
          >
            <SearchIcon />
            <span className="truncate">Tìm kiếm trên Conflict</span>
          </button>
        </div>

        <nav className="flex h-full min-w-0 items-center justify-center" aria-label="Điều hướng chính">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) =>
                  `group relative h-full w-12 items-center justify-center border-b-[3px] pt-[3px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-social-violet/20 sm:w-16 md:w-24 lg:w-28 ${item.to === "/profile" ? "hidden sm:flex" : "flex"} ${
                    isActive
                      ? "border-social-violet text-social-violet"
                      : "border-transparent text-[#77718C] hover:bg-[#F5F3FA] hover:text-[#4F4965]"
                  }`
                }
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl transition-colors group-hover:bg-white/60">
                  <Icon />
                </span>
                <span className="sr-only">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          {isAuthenticated && user ? (
            <>
              <button
                type="button"
                disabled
                className={`${roundButtonClass} hidden sm:grid`}
                aria-label="Tạo nội dung mới"
                title="Tính năng tạo nội dung đang được hoàn thiện"
              >
                <PlusIcon />
              </button>

              <button
                type="button"
                disabled
                className={`${roundButtonClass} relative`}
                aria-label="Thông báo mới"
                title="Tính năng thông báo đang được hoàn thiện"
              >
                <BellIcon />
                <span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full border-2 border-white bg-social-pink" aria-hidden="true" />
              </button>

              <Link
                to="/profile"
                className="rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-social-violet/20"
                aria-label={`Mở hồ sơ của ${displayName}`}
                title={displayName}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-[#E8E4F7]"
                  />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-social-violet to-social-pink text-sm font-extrabold text-white ring-2 ring-[#E8E4F7]">
                    {avatarLetter}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-full px-3 py-2 text-sm font-bold text-[#4F4965] hover:bg-[#F3F2F7] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-social-violet/20 sm:block"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-social-violet px-3.5 py-2.5 text-xs font-bold text-white shadow-[0_5px_14px_rgba(124,110,230,0.24)] hover:bg-[#6E60DC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-social-violet/20 sm:px-5 sm:text-sm"
              >
                Tham gia
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
