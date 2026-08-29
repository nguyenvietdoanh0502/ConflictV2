import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { selectCurrentUser } from "../../auth/authSelectors";
import LogoutConfirmModal from "../components/LogoutConfirmModal";
import UpdateProfileModal from "../components/UpdateProfileModal";

const genderLabels = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const profileNavigation = [
  {
    label: "Thông tin",
    description: "Hồ sơ và tài khoản",
    to: "/profile",
    end: true,
    icon: "profile",
    accent: "bg-[#EAE6FF] text-[#7C6EE6]",
  },
  {
    label: "Nội dung yêu thích",
    description: "Những điều bạn đã lưu",
    to: "/profile/favorites",
    icon: "heart",
    accent: "bg-[#FFE4ED] text-[#E66F98]",
  },
  {
    label: "Hoạt động gần đây",
    description: "Hành trình của bạn",
    to: "/profile/history",
    icon: "history",
    accent: "bg-[#FFE9D9] text-[#D47C4D]",
  },
];

function getCurrentSection(pathname) {
  return (
    profileNavigation.find((item) =>
      item.end ? pathname === item.to : pathname.startsWith(item.to),
    ) ?? profileNavigation[0]
  );
}

function formatDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) {
    return "Chưa cập nhật";
  }

  const [year, month, day] = dateOfBirth.split("-");
  return year && month && day ? `${day}/${month}/${year}` : dateOfBirth;
}

function NavigationIcon({ name }) {
  const sharedProps = {
    "aria-hidden": "true",
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "friends") {
    return (
      <svg {...sharedProps}>
        <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
        <circle cx="10" cy="7.5" r="3.5" />
        <path d="M16 4.5a3.5 3.5 0 0 1 0 6.8M20 20v-1.5a3.5 3.5 0 0 0-2.7-3.4" />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg {...sharedProps}>
        <path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    );
  }

  if (name === "history") {
    return (
      <svg {...sharedProps}>
        <path d="M3.5 12a8.5 8.5 0 1 0 2.1-5.6L3.5 8.5" />
        <path d="M3.5 4v4.5H8M12 7.5V12l3 2" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function DetailIcon({ name }) {
  const sharedProps = {
    "aria-hidden": "true",
    className: "h-5 w-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    mail: (
      <svg {...sharedProps}>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    ),
    calendar: (
      <svg {...sharedProps}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    ),
    gender: (
      <svg {...sharedProps}>
        <circle cx="9" cy="15" r="5" />
        <path d="m13 11 7-7M15 4h5v5" />
      </svg>
    ),
    location: (
      <svg {...sharedProps}>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
    code: (
      <svg {...sharedProps}>
        <rect x="3" y="4" width="18" height="16" rx="4" />
        <path d="m9 9-3 3 3 3M15 9l3 3-3 3" />
      </svg>
    ),
    check: (
      <svg {...sharedProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16.5 9" />
      </svg>
    ),
  };

  return icons[name] ?? <NavigationIcon name="profile" />;
}

function ProfileDetail({ accent, icon, label, value, wide = false }) {
  return (
    <div
      className={`group rounded-[22px] border border-white/80 bg-white/75 p-4 shadow-[0_12px_32px_rgba(79,70,125,0.07)] transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_38px_rgba(79,70,125,0.11)] sm:p-5 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <dt className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[#77718D]">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${accent}`}
        >
          <DetailIcon name={icon} />
        </span>
        {label}
      </dt>
      <dd className="mt-3 break-words pl-[52px] text-sm font-semibold leading-6 text-[#2F2A45]">
        {value}
      </dd>
    </div>
  );
}

function PlannedSection({ section }) {
  return (
    <section className="grid min-h-[460px] place-items-center rounded-[26px] border border-dashed border-[#dcd5f1] bg-gradient-to-br from-white to-[#f6f3ff] px-6 py-12 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br from-[#e7e2ff] to-[#ffe5ee] text-2xl text-social-violet shadow-card" aria-hidden="true">
          ✦
        </span>
        <span className="mt-5 inline-flex rounded-full bg-[#e5f7f1] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#398f7c]">
          Sắp ra mắt
        </span>
        <h3 className="mt-4 text-2xl font-extrabold tracking-[-0.03em] text-social-ink">
          {section.label} đang được hoàn thiện
        </h3>
        <p className="mt-3 text-sm leading-6 text-social-muted">
          Tụi mình đang chuẩn bị một trải nghiệm thật chỉn chu cho góc này. Các tính năng hiện có vẫn hoạt động bình thường.
        </p>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isUpdateProfileModalOpen, setIsUpdateProfileModalOpen] =
    useState(false);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  const displayName =
    user?.fullName?.trim() || user?.email || "Người dùng Conflict";
  const email = user?.email || "Chưa cập nhật email";
  const avatarUrl = user?.avatarUrl?.trim();
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const normalizedPathname = location.pathname.replace(/\/+$/, "") || "/";
  const currentSection = getCurrentSection(normalizedPathname);
  const isProfileInfoSection =
    normalizedPathname === "/profile";
  const isPlannedSection = [
    "/profile/favorites",
    "/profile/history",
  ].includes(normalizedPathname);

  const openUpdateProfileModal = useCallback(() => {
    setIsUpdateProfileModalOpen(true);
  }, []);

  const closeUpdateProfileModal = useCallback(() => {
    setIsUpdateProfileModalOpen(false);
  }, []);

  const openLogoutModal = useCallback(() => {
    setIsLogoutModalOpen(true);
  }, []);

  const closeLogoutModal = useCallback(() => {
    setIsLogoutModalOpen(false);
  }, []);

  const handleConfirmLogout = useCallback(() => {
    setIsLogoutModalOpen(false);
  }, []);

  return (
    <section
      className="min-h-[calc(100vh-4rem)] bg-[#F3F2F7] px-3 py-5 text-[#2F2A45] sm:px-6 sm:py-7 lg:px-8"
    >
      <div className="mx-auto grid w-full max-w-[1320px] items-start gap-5 lg:grid-cols-[296px_minmax(0,1fr)] lg:gap-6">
        <aside className="overflow-hidden rounded-[28px] border border-white/80 bg-white/[.85] shadow-[0_22px_60px_rgba(92,80,150,0.12)] backdrop-blur-xl lg:self-start">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#EAE6FF] via-[#FFF3F8] to-[#FFF0E4] px-5 pb-6 pt-7">
            <span
              className="absolute -right-7 -top-8 h-24 w-24 rounded-full border-[18px] border-white/[.45]"
              aria-hidden="true"
            />
            <span
              className="absolute bottom-5 right-7 h-3 w-3 rounded-full bg-[#FF8FB3]/70"
              aria-hidden="true"
            />

            <div className="relative flex items-center gap-4 lg:block">
              <div className="relative w-fit shrink-0">
                <span className="absolute -inset-1.5 rounded-full bg-white/[.65]" />
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`Ảnh đại diện của ${displayName}`}
                    className="relative h-20 w-20 rounded-full border-4 border-white object-cover shadow-[0_12px_28px_rgba(124,110,230,0.2)] lg:h-24 lg:w-24"
                  />
                ) : (
                  <span className="relative grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-[#8F82ED] to-[#FF8FB3] text-2xl font-extrabold text-white shadow-[0_12px_28px_rgba(124,110,230,0.2)] lg:h-24 lg:w-24 lg:text-3xl">
                    {avatarLetter}
                  </span>
                )}
                <span
                  className="absolute bottom-0.5 right-0.5 h-5 w-5 rounded-full border-[4px] border-white bg-[#67C9AE]"
                  aria-label="Đang hoạt động"
                  title="Đang hoạt động"
                />
              </div>

              <div className="relative min-w-0 lg:mt-4">
                <span className="inline-flex items-center rounded-full bg-white/75 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7C6EE6] shadow-sm">
                  My space
                </span>
                <h1 className="mt-2 truncate text-xl font-extrabold tracking-tight text-[#2F2A45]">
                  {displayName}
                </h1>
                <p className="mt-1 truncate text-xs font-medium text-[#746D87]">
                  {email}
                </p>
              </div>
            </div>
          </div>

          <nav
            className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-1 lg:p-4"
            aria-label="Điều hướng hồ sơ người dùng"
          >
            {profileNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "group flex min-w-0 items-center gap-2.5 rounded-[18px] border px-3 py-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#7C6EE6]/20 sm:flex-col sm:items-start lg:flex-row lg:items-center",
                    isActive
                      ? "border-[#D8D1FF] bg-[#F1EEFF] text-[#4D426F] shadow-[0_8px_22px_rgba(124,110,230,0.11)]"
                      : "border-transparent text-[#716B82] hover:border-[#EEEAF8] hover:bg-[#FAF9FF] hover:text-[#2F2A45]",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-colors duration-200 ${
                        isActive
                          ? "bg-[#7C6EE6] text-white shadow-[0_8px_18px_rgba(124,110,230,0.28)]"
                          : item.accent
                      }`}
                    >
                      <NavigationIcon name={item.icon} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold sm:mt-1 lg:mt-0 lg:text-sm">
                        {item.label}
                      </span>
                      <span className="mt-0.5 hidden truncate text-[11px] font-medium text-[#6F6880] lg:block">
                        {item.description}
                      </span>
                    </span>

                    <svg
                      aria-hidden="true"
                      className={`hidden h-4 w-4 shrink-0 transition-colors duration-200 lg:block ${
                        isActive
                          ? "text-[#7C6EE6]"
                          : "text-[#C0BACB] group-hover:text-[#7C6EE6]"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="m9 18 6-6-6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mx-4 mb-4 rounded-[22px] bg-[#FFF4F8] p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FFE0EA] text-base">
                <span aria-hidden="true">✦</span>
              </span>
              <div>
                <p className="text-xs font-extrabold text-[#574E71]">
                  Góc nhỏ của bạn
                </p>
                <p className="mt-1 text-[11px] font-medium leading-5 text-[#6F6880]">
                  Cập nhật hồ sơ để bạn bè nhận ra bạn dễ hơn nhé.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#F0ECF7] p-4">
            <button
              type="button"
              onClick={openLogoutModal}
              className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-[#FFD2E0] bg-[#FFF7FA] px-4 text-sm font-bold text-[#D86288] transition hover:border-[#FFADC6] hover:bg-[#FFE9F0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF8FB3]/20"
              aria-haspopup="dialog"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4 transition group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 17l5-5-5-5M15 12H3" />
                <path d="M14 4h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-4" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </aside>

        <main className="min-w-0 overflow-hidden rounded-[28px] border border-white/80 bg-[#FFF9FC]/90 shadow-[0_22px_60px_rgba(92,80,150,0.11)] backdrop-blur-xl">
          <header className="relative overflow-hidden border-b border-[#EEE9F6] bg-white/60 px-5 py-5 sm:px-7 sm:py-6 lg:px-8">
            <span
              className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-[#EAE6FF]/80"
              aria-hidden="true"
            />
            <span
              className="absolute right-16 top-4 h-7 w-7 rounded-full bg-[#B8EADD]/[.65]"
              aria-hidden="true"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#7C6EE6]">
                  <span className="h-2 w-2 rounded-full bg-[#FF8FB3]" />
                  Hồ sơ cá nhân
                </div>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#2F2A45] sm:text-3xl">
                  {currentSection.label}
                </h2>
                <p className="mt-1.5 text-sm font-medium text-[#6F6880]">
                  {currentSection.description}
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-[#DCD6F6] bg-[#F4F1FF] px-3.5 py-2 text-xs font-bold text-[#6559B9]">
                <span
                  className="h-2 w-2 rounded-full bg-[#7C6EE6]"
                  aria-hidden="true"
                />
                Conflict Member
              </span>
            </div>
          </header>

          <div
            className="min-h-[540px] px-4 py-5 sm:px-7 sm:py-7 lg:px-8 lg:py-8"
            aria-label={`Nội dung ${currentSection.label.toLowerCase()}`}
          >
            {isProfileInfoSection ? (
              <div className="space-y-5 sm:space-y-6">
                <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#7C6EE6] via-[#8D7FE8] to-[#A792EC] p-5 text-white shadow-[0_18px_44px_rgba(124,110,230,0.22)] sm:p-7">
                  <span
                    className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[24px] border-white/10"
                    aria-hidden="true"
                  />
                  <span
                    className="absolute -bottom-10 right-1/3 h-28 w-28 rounded-full bg-[#FFB9D0]/20 blur-xl"
                    aria-hidden="true"
                  />

                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={`Ảnh đại diện của ${displayName}`}
                          className="h-20 w-20 shrink-0 rounded-full border-4 border-white/90 object-cover shadow-[0_12px_28px_rgba(47,42,69,0.2)] sm:h-24 sm:w-24"
                        />
                      ) : (
                        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-white/90 bg-[#FF8FB3] text-2xl font-extrabold text-white shadow-[0_12px_28px_rgba(47,42,69,0.2)] sm:h-24 sm:w-24 sm:text-3xl">
                          {avatarLetter}
                        </span>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/70">
                          Xin chào, mình là
                        </p>
                        <h3 className="mt-1.5 truncate text-xl font-extrabold sm:text-2xl">
                          {displayName}
                        </h3>
                        <p className="mt-1 truncate text-sm font-medium text-white/75">
                          {email}
                        </p>
                        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[.15] px-3 py-1.5 text-[11px] font-bold backdrop-blur">
                          <span className="h-2 w-2 rounded-full bg-[#B8EADD]" />
                          Đang hoạt động
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openUpdateProfileModal}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[16px] bg-white px-5 text-sm font-extrabold text-[#6559B9] shadow-[0_10px_24px_rgba(47,42,69,0.14)] transition hover:-translate-y-0.5 hover:bg-[#FFF9FC] hover:shadow-[0_14px_28px_rgba(47,42,69,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/[.35]"
                      aria-haspopup="dialog"
                    >
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                      </svg>
                      Chỉnh sửa hồ sơ
                    </button>
                  </div>
                </section>

                <section className="rounded-[26px] border border-[#ECE7F5] bg-[#F9F7FF] p-4 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-2 sm:mb-5">
                    <div>
                      <p className="text-lg font-extrabold text-[#2F2A45]">
                        Về mình
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#6F6880]">
                        Những thông tin giúp bạn bè hiểu bạn hơn
                      </p>
                    </div>
                    <span className="rounded-full bg-[#E8F7F2] px-3 py-1.5 text-[11px] font-bold text-[#3C907A]">
                      Thông tin riêng tư
                    </span>
                  </div>

                  <dl className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <ProfileDetail
                      accent="bg-[#EAE6FF] text-[#7C6EE6]"
                      icon="profile"
                      label="Họ và tên"
                      value={user?.fullName?.trim() || "Chưa cập nhật"}
                    />
                    <ProfileDetail
                      accent="bg-[#FFE5EE] text-[#DC6E93]"
                      icon="mail"
                      label="Email"
                      value={user?.email || "Chưa cập nhật"}
                    />
                    <ProfileDetail
                      accent="bg-[#FFF0E5] text-[#CE7A4D]"
                      icon="calendar"
                      label="Ngày sinh"
                      value={formatDateOfBirth(user?.dateOfBirth)}
                    />
                    <ProfileDetail
                      accent="bg-[#E4F7F1] text-[#41957F]"
                      icon="gender"
                      label="Giới tính"
                      value={genderLabels[user?.gender] || "Chưa cập nhật"}
                    />
                    <ProfileDetail
                      accent="bg-[#E5F3FF] text-[#578FBD]"
                      icon="location"
                      label="Địa chỉ"
                      value={user?.address?.trim() || "Chưa cập nhật"}
                      wide
                    />
                    <ProfileDetail
                      accent="bg-[#F1EAFE] text-[#8464B3]"
                      icon="code"
                      label="Mã người dùng"
                      value={user?.pinCode || "Chưa cập nhật"}
                    />
                    <ProfileDetail
                      accent="bg-[#E4F7F1] text-[#41957F]"
                      icon="check"
                      label="Trạng thái tài khoản"
                      value="Đang hoạt động"
                    />
                  </dl>
                </section>
              </div>
            ) : isPlannedSection ? (
              <PlannedSection section={currentSection} />
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>

      {isUpdateProfileModalOpen && (
        <UpdateProfileModal
          isOpen={isUpdateProfileModalOpen}
          onClose={closeUpdateProfileModal}
        />
      )}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        onConfirm={handleConfirmLogout}
      />
    </section>
  );
}
