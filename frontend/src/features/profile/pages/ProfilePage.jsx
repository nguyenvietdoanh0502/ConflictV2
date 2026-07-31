import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { selectCurrentUser } from "../../auth/authSelectors";
import LogoutConfirmModal from "../components/LogoutConfirmModal";

const profileNavigation = [
  {
    label: "Thông tin",
    description: "Hồ sơ và tài khoản",
    to: "/profile",
    end: true,
  },
  {
    label: "Phim yêu thích",
    description: "Danh sách đã lưu",
    to: "/profile/favorites",
  },
  {
    label: "Lịch sử xem",
    description: "Nội dung đã xem",
    to: "/profile/history",
  },
];

function getCurrentSection(pathname) {
  return (
    profileNavigation.find((item) =>
      item.end ? pathname === item.to : pathname.startsWith(item.to),
    ) ?? profileNavigation[0]
  );
}

export default function ProfilePage() {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  const displayName =
    user?.fullName?.trim() || user?.email || "Người dùng Conflict";
  const email = user?.email || "Chưa cập nhật email";
  const avatarUrl = user?.avatarUrl?.trim();
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const currentSection = getCurrentSection(location.pathname);

  const openLogoutModal = useCallback(() => {
    setIsLogoutModalOpen(true);
  }, []);

  const closeLogoutModal = useCallback(() => {
    setIsLogoutModalOpen(false);
  }, []);

  const handleConfirmLogout = useCallback(() => {
    setIsLogoutModalOpen(false);

    // Gắn logic gọi API logout của bạn tại đây.
  }, []);

  return (
    <section
      className="relative min-h-[calc(100vh-88px)] overflow-hidden bg-[#141414] px-4 py-8 text-white sm:px-8 sm:py-10 lg:px-12 lg:py-12"
      style={{ fontFamily: '"Manrope", sans-serif' }}
    >
      <div
        className="pointer-events-none absolute -left-32 top-16 h-80 w-80 rounded-full bg-[#E50000]/10 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#E50000]/5 blur-[130px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-[1280px] items-start gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-[#262626] bg-[#0F0F0F] shadow-[0_24px_70px_rgba(0,0,0,0.28)] lg:sticky lg:top-28">
          <div className="border-b border-[#262626] bg-gradient-to-br from-[#1F1F1F] via-[#161616] to-[#0F0F0F] p-6">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`Ảnh đại diện của ${displayName}`}
                    className="h-20 w-20 rounded-2xl border border-[#404040] object-cover shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                  />
                ) : (
                  <span className="grid h-20 w-20 place-items-center rounded-2xl border border-[#FF3333]/40 bg-gradient-to-br from-[#E50000] to-[#990000] text-2xl font-bold text-white shadow-[0_12px_30px_rgba(229,0,0,0.2)]">
                    {avatarLetter}
                  </span>
                )}

                <span
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-[3px] border-[#161616] bg-[#22C55E]"
                  aria-label="Đang hoạt động"
                  title="Đang hoạt động"
                />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E50000]">
                  Tài khoản của tôi
                </p>
                <h1 className="mt-2 truncate text-xl font-bold text-white">
                  {displayName}
                </h1>
                <p className="mt-1 truncate text-sm text-[#999999]">{email}</p>
              </div>
            </div>
          </div>

          <nav
            className="space-y-2 p-4"
            aria-label="Điều hướng hồ sơ người dùng"
          >
            {profileNavigation.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-xl border px-3 py-3.5 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50000]/70",
                    isActive
                      ? "border-[#E50000]/45 bg-[#E50000]/10 text-white shadow-[inset_3px_0_0_#E50000]"
                      : "border-transparent text-[#B3B3B3] hover:border-[#333333] hover:bg-[#1A1A1A] hover:text-white",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "grid h-10 w-10 shrink-0 place-items-center rounded-lg border text-xs font-bold transition",
                        isActive
                          ? "border-[#E50000]/50 bg-[#E50000] text-white"
                          : "border-[#333333] bg-[#1A1A1A] text-[#808080] group-hover:border-[#4A4A4A] group-hover:text-[#E4E4E7]",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#777777]">
                        {item.description}
                      </span>
                    </span>

                    <span
                      className={[
                        "text-lg transition duration-200",
                        isActive
                          ? "text-[#FF3333]"
                          : "text-[#555555] group-hover:translate-x-0.5 group-hover:text-[#B3B3B3]",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-[#262626] px-5 py-4">
            <p className="text-xs leading-5 text-[#666666]">
              Quản lý thông tin cá nhân và hoạt động xem phim của bạn tại
              Conflict.
            </p>
          </div>
        </aside>

        <div className="relative min-h-[680px] overflow-hidden rounded-2xl border border-[#262626] bg-[#0F0F0F] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
          <header className="border-b border-[#262626] bg-[#141414]/80 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E50000]">
                  Hồ sơ người dùng
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {currentSection.label}
                </h2>
                <p className="mt-2 text-sm text-[#888888]">
                  {currentSection.description}
                </p>
              </div>

              <span className="rounded-full border border-[#333333] bg-[#1A1A1A] px-3 py-1.5 text-xs font-medium text-[#B3B3B3]">
                Conflict Member
              </span>
            </div>
          </header>

          <div
            className="min-h-[500px] px-5 pb-28 pt-6 sm:px-7 sm:pt-8"
            aria-label={`Nội dung ${currentSection.label.toLowerCase()}`}
          >
            <Outlet />
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-end border-t border-[#262626] bg-[#0F0F0F]/95 px-5 py-5 backdrop-blur sm:px-7">
            <button
              type="button"
              onClick={openLogoutModal}
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#E50000]/60 bg-transparent px-5 text-sm font-semibold text-[#FF4D4D] transition hover:border-[#E50000] hover:bg-[#E50000] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E50000]/20"
              aria-haspopup="dialog"
            >
              <span
                className="text-lg transition group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                ↗
              </span>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        onConfirm={handleConfirmLogout}
      />
    </section>
  );
}
