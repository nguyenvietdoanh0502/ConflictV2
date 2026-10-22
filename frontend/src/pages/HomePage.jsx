import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../features/auth/authSelectors";
import ContactsSidebar from "../features/chat/components/ContactsSidebar";

function FeatureCard({ icon, title, description, badge, to, accent }) {
  const content = (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-white/80 bg-white/85 p-6 shadow-card backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-soft">
      <div>
        <div className="flex items-center justify-between">
          <span className={`grid h-12 w-12 place-items-center rounded-2xl ${accent} text-2xl shadow-sm`}>
            {icon}
          </span>
          {badge && (
            <span className="rounded-full bg-[#EAE6FF] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-social-violet">
              {badge}
            </span>
          )}
        </div>
        <h3 className="mt-4 text-lg font-extrabold text-social-ink group-hover:text-social-violet transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-social-muted">
          {description}
        </p>
      </div>
      {to && (
        <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-social-violet">
          <span>Khám phá ngay</span>
          <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );

  return to ? <Link to={to} className="block focus:outline-none">{content}</Link> : content;
}

export default function HomePage() {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const displayName = user?.fullName?.trim() || user?.email || "Sinh viên";
  const avatarUrl = user?.avatarUrl?.trim();
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F7FC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {isAuthenticated ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_330px]">
            {/* Left Column: Dashboard & Features */}
            <div className="min-w-0 space-y-8">
              {/* Logged in Hero Banner */}
              <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#7C6EE6] via-[#8C7FE9] to-[#FF8FB3] p-7 text-white shadow-soft sm:p-10">
              <span className="absolute -right-12 -top-12 h-56 w-56 rounded-full border-[28px] border-white/10" aria-hidden="true" />
              <span className="absolute -bottom-16 right-1/4 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-20 w-20 shrink-0 rounded-full border-4 border-white/90 object-cover shadow-card sm:h-24 sm:w-24"
                    />
                  ) : (
                    <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-white/90 bg-white/20 text-3xl font-extrabold text-white shadow-card sm:h-24 sm:w-24">
                      {avatarLetter}
                    </span>
                  )}
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold tracking-wide backdrop-blur">
                      <span className="h-2 w-2 rounded-full bg-[#B8EADD]" />
                      Trợ lý học vụ UniSync
                    </span>
                    <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                      Chào mừng trở lại, {displayName}! 👋
                    </h1>
                    <p className="mt-1 text-sm font-medium text-white/85">
                      Hôm nay bạn muốn quản lý lịch học hay cùng bạn bè ôn tập?
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/friends"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-social-violet shadow-card transition hover:-translate-y-0.5 hover:bg-[#FFF9FC]"
                  >
                    Mạng lưới bạn bè
                  </Link>
                  <Link
                    to="/profile"
                    className="inline-flex items-center justify-center rounded-2xl bg-white/15 px-5 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:bg-white/25"
                  >
                    Hồ sơ cá nhân
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Access Grid */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-social-ink">Trung tâm Học vụ & Tính năng</h2>
                  <p className="text-xs text-social-muted">Các module trong lộ trình phát triển UniSync</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <FeatureCard
                  icon="📅"
                  title="Thời khóa biểu Thông minh"
                  description="Xem lịch học theo ngày, tuần, tháng với phân loại màu trực quan: học bù, thi cử, deadline."
                  badge="Giai đoạn 1"
                  accent="bg-[#EAE6FF] text-[#7C6EE6]"
                />
                <FeatureCard
                  icon="✨"
                  title="Đồng bộ Zalo AI"
                  description="Ghép nhóm chat lớp học, AI tự động phát hiện thông báo nghỉ học, học bù và ghim vào lịch."
                  badge="Giai đoạn 3"
                  accent="bg-[#FFE5EE] text-[#FF8FB3]"
                />
                <FeatureCard
                  icon="🎮"
                  title="Đề cương & Minigame"
                  description="Tải lên PDF/Word đề cương, AI sinh bản tóm tắt và minigame trắc nghiệm, lật thẻ khái niệm."
                  badge="Giai đoạn 2"
                  accent="bg-[#E5F7F1] text-[#41957F]"
                />
                <FeatureCard
                  icon="👥"
                  title="Kết nối Bạn bè"
                  description="Tìm bạn học, kết nối bằng mã cá nhân, quản lý danh sách bạn bè và cùng nhau thi đua."
                  badge="Sẵn sàng"
                  to="/friends"
                  accent="bg-[#FFF0E5] text-[#D47C4D]"
                />
                <FeatureCard
                  icon="🔔"
                  title="Nhắc nhở Đa kênh"
                  description="Tự động quét lịch thi, học bù và thông báo kịp thời qua Toast, Web Push và Email."
                  badge="Giai đoạn 4"
                  accent="bg-[#FFF9DB] text-[#A68A00]"
                />
                <FeatureCard
                  icon="💬"
                  title="Thách đấu & Trò chuyện"
                  description="Nhắn tin trực tiếp thời gian thực, gửi thẻ đề cương ôn tập và thách đấu minigame."
                  badge="Giai đoạn 4"
                  to="/friends"
                  accent="bg-[#F1EAFE] text-[#7C6EE6]"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Facebook-style Contacts Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <ContactsSidebar />
            </div>
          </div>
        </div>
        ) : (
          /* Public Landing Page */
          <div className="space-y-12 py-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-social-violet/20 bg-social-violet/10 px-4 py-1.5 text-xs font-bold text-social-violet">
                <span>✦</span> SICT WEB/APP CHALLENGE – CLB Tin học HIT
              </span>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-social-ink sm:text-5xl lg:text-6xl">
                Đồng bộ Học vụ & Ôn thi <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-social-violet via-[#8F82ED] to-social-pink bg-clip-text text-transparent">
                  Thông minh cùng AI
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-social-muted sm:text-lg">
                <strong>UniSync</strong> giải quyết triệt để tình trạng trôi thông báo lịch học trên Zalo,
                tự động cập nhật thời khóa biểu và biến đề cương dài hàng chục trang thành minigame ôn tập hấp dẫn.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  to="/register"
                  className="rounded-full bg-social-violet px-8 py-3.5 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-[#6E60DC]"
                >
                  Bắt đầu ngay miễn phí
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-[#DCD6F6] bg-white px-8 py-3.5 text-sm font-extrabold text-social-ink shadow-sm transition hover:bg-[#FAF9FF]"
                >
                  Đăng nhập
                </Link>
              </div>
            </div>

            {/* Core Values */}
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-[28px] border border-white/80 bg-white/70 p-6 shadow-card backdrop-blur">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EAE6FF] text-2xl">⚡</div>
                <h3 className="mt-4 text-lg font-extrabold text-social-ink">AI Zalo-to-Calendar</h3>
                <p className="mt-2 text-sm leading-6 text-social-muted">
                  Kết nối nhóm Zalo môn học với cơ chế Whitelist bảo mật. AI nhận diện lịch nghỉ, học bù và ghim vào lịch chuẩn xác.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/80 bg-white/70 p-6 shadow-card backdrop-blur">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFE5EE] text-2xl">🎯</div>
                <h3 className="mt-4 text-lg font-extrabold text-social-ink">Syllabus-to-Minigame</h3>
                <p className="mt-2 text-sm leading-6 text-social-muted">
                  Bóc tách đề cương PDF/Word thành tóm tắt Markdown và bộ câu hỏi trắc nghiệm tốc độ, lật thẻ ghép cặp khái niệm.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/80 bg-white/70 p-6 shadow-card backdrop-blur">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E5F7F1] text-2xl">🤝</div>
                <h3 className="mt-4 text-lg font-extrabold text-social-ink">Social Learning</h3>
                <p className="mt-2 text-sm leading-6 text-social-muted">
                  Kết nối bạn cùng lớp, chat thời gian thực và thách đấu điểm minigame ôn thi để tạo động lực học tập mỗi ngày.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
