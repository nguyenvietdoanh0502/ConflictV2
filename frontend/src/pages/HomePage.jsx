import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Calendar,
  Sparkles,
  BookOpen,
  Users,
  Bell,
  MessageSquare,
} from "lucide-react";
import { selectIsAuthenticated } from "../features/auth/authSelectors";
import ContactsSidebar from "../features/chat/components/ContactsSidebar";

function FeatureCard({ icon, title, description, to }) {
  const content = (
    <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-white/80 bg-white/85 p-6 shadow-card backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-soft">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EAE6FF] text-social-violet border border-social-violet/15 shadow-xs transition-colors group-hover:bg-social-violet group-hover:text-white">
            {icon}
          </span>
        </div>
        <h3 className="mt-4 text-base sm:text-lg font-bold text-social-ink group-hover:text-social-violet transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-xs sm:text-sm leading-6 text-social-muted flex-1">
          {description}
        </p>
      </div>
      <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-social-violet pt-3 border-t border-[#F0EEF8]">
        <span>Khám phá ngay</span>
        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block h-full focus:outline-none">
      {content}
    </Link>
  ) : (
    <div className="h-full">{content}</div>
  );
}

export default function HomePage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F7FC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {isAuthenticated ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_330px]">
            {/* Left Column: Dashboard & Features */}
            <div className="min-w-0 space-y-6">
              {/* Quick Access Grid */}
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-social-ink">
                      Trung tâm Học vụ & Tính năng
                    </h2>
                    <p className="text-xs sm:text-sm text-social-muted mt-1 font-medium">
                      Truy cập nhanh các công cụ học tập, thời khóa biểu và kết nối sinh viên
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 auto-rows-fr">
                  <FeatureCard
                    icon={<Calendar className="h-5 w-5" strokeWidth={2} />}
                    title="Thời khóa biểu Thông minh"
                    description="Xem lịch học theo ngày, tuần, tháng với phân loại màu trực quan: học bù, thi cử, deadline."
                    to="/timetable"
                  />
                  <FeatureCard
                    icon={<Sparkles className="h-5 w-5" strokeWidth={2} />}
                    title="Đồng bộ Zalo AI"
                    description="Ghép nhóm chat lớp học, AI tự động phát hiện thông báo nghỉ học, học bù và ghim vào lịch."
                    to="/timetable"
                  />
                  <FeatureCard
                    icon={<BookOpen className="h-5 w-5" strokeWidth={2} />}
                    title="Đề cương & Minigame"
                    description="Tải lên PDF/Word đề cương, AI sinh bản tóm tắt và minigame trắc nghiệm, lật thẻ khái niệm."
                    to="/study"
                  />
                  <FeatureCard
                    icon={<Users className="h-5 w-5" strokeWidth={2} />}
                    title="Kết nối Bạn bè"
                    description="Tìm bạn học, kết nối bằng mã cá nhân, quản lý danh sách bạn bè và cùng nhau thi đua."
                    to="/friends"
                  />
                  <FeatureCard
                    icon={<Bell className="h-5 w-5" strokeWidth={2} />}
                    title="Nhắc nhở Đa kênh"
                    description="Tự động quét lịch thi, học bù và thông báo kịp thời."
                  />
                  <FeatureCard
                    icon={<MessageSquare className="h-5 w-5" strokeWidth={2} />}
                    title="Thách đấu & Trò chuyện"
                    description="Nhắn tin trực tiếp thời gian thực, gửi thẻ đề cương ôn tập và thách đấu minigame."
                    to="/friends"
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
              <h1 className="mt-6 text-4xl font-black tracking-tight text-social-ink sm:text-5xl lg:text-6xl">
                Đồng bộ Học vụ & Ôn thi <br className="hidden sm:inline" />
                <span className="text-social-violet">
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
                  Bắt đầu ngay
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
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EAE6FF] text-social-violet">
                  <Calendar className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-social-ink">Zalo to Calendar</h3>
                <p className="mt-2 text-sm leading-6 text-social-muted">
                  Kết nối nhóm Zalo môn học với cơ chế Whitelist bảo mật. AI nhận diện lịch nghỉ, học bù và ghim vào lịch chuẩn xác.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/80 bg-white/70 p-6 shadow-card backdrop-blur">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EAE6FF] text-social-violet">
                  <BookOpen className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-lg font-extrabold text-social-ink">Syllabus to Minigame</h3>
                <p className="mt-2 text-sm leading-6 text-social-muted">
                  Bóc tách đề cương PDF/Word thành tóm tắt Markdown và bộ câu hỏi trắc nghiệm tốc độ, lật thẻ ghép cặp khái niệm.
                </p>
              </div>
              <div className="rounded-[28px] border border-white/80 bg-white/70 p-6 shadow-card backdrop-blur">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EAE6FF] text-social-violet">
                  <Users className="h-5 w-5" strokeWidth={2} />
                </div>
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
