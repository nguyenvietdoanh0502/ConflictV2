import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../features/auth/authSelectors";

const stories = [
  { name: "An Nhiên", initial: "A", gradient: "from-[#FF8FB3] to-[#FFD8BE]", theme: "from-[#ffd4e2] via-[#ffc7b8] to-[#b8eadd]", emoji: "🌷" },
  { name: "Minh Khang", initial: "M", gradient: "from-[#7C6EE6] to-[#B7AEF7]", theme: "from-[#b6adf8] via-[#8b7fe5] to-[#554d88]", emoji: "🎧" },
  { name: "Hà Linh", initial: "L", gradient: "from-[#54B99F] to-[#B8EADD]", theme: "from-[#b8eadd] via-[#8ed5c3] to-[#e7f8f3]", emoji: "🌿" },
  { name: "Tuấn Anh", initial: "T", gradient: "from-[#F2B861] to-[#FFE9A9]", theme: "from-[#ffe9a9] via-[#ffd8be] to-[#f4a7bb]", emoji: "🌤️" },
  { name: "Mai Chi", initial: "C", gradient: "from-[#A98FE8] to-[#FF8FB3]", theme: "from-[#eedcff] via-[#ffcadb] to-[#fff0d7]", emoji: "✨" },
];

const contacts = [
  { name: "An Nhiên", initial: "A", gradient: "from-[#FF8FB3] to-[#FFD8BE]" },
  { name: "Minh Khang", initial: "M", gradient: "from-[#7C6EE6] to-[#B7AEF7]" },
  { name: "Hà Linh", initial: "L", gradient: "from-[#54B99F] to-[#B8EADD]" },
  { name: "Tuấn Anh", initial: "T", gradient: "from-[#F2B861] to-[#FFE9A9]" },
];

const posts = [
  {
    id: 1,
    author: "An Nhiên",
    initial: "A",
    gradient: "from-[#FF8FB3] to-[#FFD8BE]",
    time: "18 phút",
    content: "Một buổi chiều không có deadline, chỉ có nắng đẹp và hội bạn thân. Cuối tuần của mọi người thế nào rồi? 🌤️",
    visual: "sunset",
    reactions: "Minh Khang và 126 người khác",
    comments: "24 bình luận",
  },
  {
    id: 2,
    author: "Minh Khang",
    initial: "M",
    gradient: "from-[#7C6EE6] to-[#B7AEF7]",
    time: "1 giờ",
    content: "Nhắc nhẹ bản thân và những ai đang cần nghe điều này hôm nay:",
    visual: "quote",
    reactions: "Hà Linh và 89 người khác",
    comments: "16 bình luận",
  },
];

function Avatar({ initial, gradient, imageUrl, size = "md" }) {
  const sizeClass = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";

  if (imageUrl) {
    return <img src={imageUrl} alt="" className={`${sizeClass} shrink-0 rounded-full object-cover ring-2 ring-white`} />;
  }

  return (
    <span className={`grid ${sizeClass} shrink-0 place-items-center rounded-full bg-gradient-to-br ${gradient} font-extrabold text-white ring-2 ring-white`} aria-hidden="true">
      {initial}
    </span>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m20 20-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LeftSidebar({ isAuthenticated, displayName, avatarUrl, avatarLetter }) {
  const profileTarget = isAuthenticated ? "/profile" : "/login";
  const friendTarget = isAuthenticated ? "/friends" : "/login";
  const items = [
    { label: "Bạn bè", icon: "👥", to: friendTarget, color: "bg-[#E8E4FB]" },
    { label: "Kỷ niệm", icon: "🕘", color: "bg-[#E6F6F1]" },
    { label: "Đã lưu", icon: "🔖", color: "bg-[#FFE9F0]" },
    { label: "Nhóm", icon: "🫶", color: "bg-[#FFF0DE]" },
  ];

  return (
    <aside className="sticky top-20 hidden max-h-[calc(100vh-5.5rem)] overflow-y-auto px-2 pb-6 lg:block" aria-label="Lối tắt">
      <nav className="space-y-1">
        <Link to={profileTarget} className="flex items-center gap-3 rounded-xl px-2 py-2.5 font-bold text-[#383247] hover:bg-white/80">
          <Avatar initial={avatarLetter} gradient="from-social-violet to-social-pink" imageUrl={avatarUrl} size="sm" />
          <span className="truncate text-sm">{isAuthenticated ? displayName : "Đăng nhập tài khoản"}</span>
        </Link>

        {items.map((item) => {
          const content = (
            <>
              <span className={`grid h-9 w-9 place-items-center rounded-xl text-base ${item.color}`} aria-hidden="true">{item.icon}</span>
              <span className="text-sm font-bold text-[#4A4459]">{item.label}</span>
            </>
          );

          return item.to ? (
            <Link key={item.label} to={item.to} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/80">{content}</Link>
          ) : (
            <div key={item.label} className="flex items-center gap-3 rounded-xl px-2 py-2 text-[#4A4459]">{content}</div>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-[#DDD9E6] pt-4">
        <p className="px-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#77718C]">Lối tắt của bạn</p>
        <div className="mt-3 flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#DCD6FF] to-[#FFD4E2] text-base" aria-hidden="true">☕</span>
          <span className="text-sm font-bold text-[#4A4459]">Hội chill cuối tuần</span>
        </div>
      </div>

      <p className="mt-5 px-2 text-[11px] leading-5 text-[#77718C]">Quyền riêng tư · Điều khoản · Trợ giúp · Conflict © 2026</p>
    </aside>
  );
}

function Stories({ avatarUrl, avatarLetter }) {
  return (
    <section aria-labelledby="stories-title" className="overflow-hidden">
      <div className="mb-3 flex items-center justify-between px-1">
        <h1 id="stories-title" className="text-lg font-extrabold text-[#332D42]">Tin</h1>
        <button type="button" disabled title="Tính năng đang được hoàn thiện" className="cursor-default rounded-lg px-3 py-1.5 text-sm font-bold text-social-violet">Xem tất cả</button>
      </div>

      <div className="feed-scroll flex snap-x gap-2.5 overflow-x-auto pb-2 outline-none focus-visible:ring-4 focus-visible:ring-social-violet/20" tabIndex={0} aria-label="Danh sách tin, dùng phím mũi tên để xem thêm">
        <article className="relative h-[188px] w-[112px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#DFDCE6] bg-white shadow-[0_1px_3px_rgba(47,42,69,0.10)] sm:w-[120px]">
          <div className="h-[132px] bg-gradient-to-br from-[#DCD6FF] via-[#C9C1F7] to-[#FFB9D0] p-3">
            <Avatar initial={avatarLetter} gradient="from-social-violet to-social-pink" imageUrl={avatarUrl} size="sm" />
          </div>
          <span className="absolute bottom-9 left-1/2 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-social-violet text-xl font-bold text-white" aria-hidden="true">+</span>
          <p className="absolute inset-x-1 bottom-2 text-center text-xs font-extrabold text-[#3D374B]">Tạo tin</p>
        </article>

        {stories.map((story) => (
          <article key={story.name} className={`relative h-[188px] w-[112px] shrink-0 snap-start overflow-hidden rounded-2xl bg-gradient-to-b ${story.theme} shadow-[0_1px_4px_rgba(47,42,69,0.14)] sm:w-[120px]`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/[.55] via-transparent to-white/10" />
            <div className="absolute left-3 top-3">
              <Avatar initial={story.initial} gradient={story.gradient} size="sm" />
            </div>
            <span className="absolute inset-0 grid place-items-center pt-4 text-4xl drop-shadow-md" aria-hidden="true">{story.emoji}</span>
            <p className="absolute inset-x-3 bottom-3 text-xs font-extrabold leading-4 text-white">{story.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Composer({ isAuthenticated, displayName, avatarUrl, avatarLetter }) {
  return (
    <section className="rounded-none border-y border-[#E1DEE8] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(47,42,69,0.08)] sm:rounded-2xl sm:border" aria-label="Tạo bài viết">
      <div className="flex items-center gap-3">
        <Avatar initial={avatarLetter} gradient="from-social-violet to-social-pink" imageUrl={avatarUrl} />
        {isAuthenticated ? (
          <button type="button" disabled title="Tính năng đăng bài đang được hoàn thiện" className="min-h-11 flex-1 cursor-default rounded-full bg-[#F1F0F4] px-4 text-left text-sm font-medium text-[#716A80]">
            {displayName}, bạn đang nghĩ gì?
          </button>
        ) : (
          <Link to="/login" className="flex min-h-11 flex-1 items-center rounded-full bg-[#F1F0F4] px-4 text-sm font-medium text-[#716A80] hover:bg-[#EAE8EF]">
            Đăng nhập để chia sẻ khoảnh khắc của bạn
          </Link>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 border-t border-[#ECE9F0] pt-2">
        {[
          ["🎥", "Video trực tiếp"],
          ["🖼️", "Ảnh / video"],
          ["😊", "Cảm xúc"],
        ].map(([icon, label]) => (
          <button key={label} type="button" disabled aria-label={label} title="Tính năng đang được hoàn thiện" className="flex min-h-10 cursor-default items-center justify-center gap-2 rounded-lg px-2 text-xs font-bold text-[#645D73] sm:text-sm">
            <span className="text-lg" aria-hidden="true">{icon}</span>
            <span className="hidden truncate sm:block">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PostVisual({ type }) {
  if (type === "quote") {
    return (
      <div className="relative grid aspect-[1.25] overflow-hidden bg-gradient-to-br from-[#B8EADD] via-[#E3F5EF] to-[#FFD8BE] p-8 text-center sm:aspect-[1.55]">
        <span className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-white/[.35]" />
        <span className="absolute -bottom-16 -right-12 h-52 w-52 rounded-full bg-[#7C6EE6]/[.15]" />
        <div className="relative m-auto max-w-md rounded-[24px] border border-white/80 bg-white/75 px-6 py-8 shadow-sm backdrop-blur-sm">
          <p className="text-xl font-black leading-snug tracking-[-0.03em] text-[#332D42] sm:text-2xl">“Bạn không cần hoàn hảo<br />để có một ngày thật vui.”</p>
          <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.15em] text-social-violet">tiny reminder ✦</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[1.25] overflow-hidden bg-gradient-to-b from-[#B9C9F2] via-[#F8C7C2] to-[#F6C88E] sm:aspect-[1.55]">
      <div className="absolute left-[10%] top-[12%] h-16 w-16 rounded-full bg-[#FFF2C6] shadow-[0_0_45px_rgba(255,242,198,0.9)]" />
      <div className="absolute inset-x-0 bottom-0 h-[46%] bg-[#7C6EE6]/30 [clip-path:polygon(0_48%,22%_14%,42%_45%,63%_3%,82%_36%,100%_12%,100%_100%,0_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[28%] bg-[#5A8D7D]/[.65] [clip-path:polygon(0_35%,18%_2%,39%_30%,61%_7%,81%_32%,100%_5%,100%_100%,0_100%)]" />
      <div className="absolute bottom-5 left-5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-extrabold text-[#5B5474] shadow-sm backdrop-blur">cuối tuần thật dịu 🌤️</div>
    </div>
  );
}

function PostCard({ post }) {
  return (
    <article className="overflow-hidden rounded-none border-y border-[#E1DEE8] bg-white shadow-[0_1px_2px_rgba(47,42,69,0.08)] sm:rounded-2xl sm:border">
      <header className="flex items-center gap-3 px-4 py-3">
        <Avatar initial={post.initial} gradient={post.gradient} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-extrabold text-[#332D42]">{post.author}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[#77718C]">
            {post.time} · <span role="img" aria-label="Công khai">🌐</span>
          </p>
        </div>
        <button type="button" disabled title="Tính năng đang được hoàn thiện" className="grid h-9 w-9 cursor-default place-items-center rounded-full text-[#77718C]" aria-label={`Tùy chọn bài viết của ${post.author}`}>
          <MoreIcon />
        </button>
      </header>

      <p className="px-4 pb-3 text-[15px] leading-6 text-[#3F394C]">{post.content}</p>
      <PostVisual type={post.visual} />

      <div className="px-4">
        <div className="flex items-center justify-between gap-3 border-b border-[#E9E6ED] py-3 text-xs font-medium text-[#77718C] sm:text-sm">
          <span className="flex min-w-0 items-center gap-2 truncate">
            <span className="inline-flex -space-x-1" aria-hidden="true">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-social-violet text-[10px] text-white ring-1 ring-white">♡</span>
              <span className="grid h-5 w-5 place-items-center rounded-full bg-social-pink text-[10px] text-white ring-1 ring-white">♥</span>
            </span>
            <span className="truncate">{post.reactions}</span>
          </span>
          <span className="shrink-0">{post.comments}</span>
        </div>

        <div className="grid grid-cols-3 py-1">
          {[
            ["♡", "Thích"],
            ["◌", "Bình luận"],
            ["↗", "Chia sẻ"],
          ].map(([icon, label]) => (
            <button key={label} type="button" disabled title="Tính năng đang được hoàn thiện" className="flex min-h-10 cursor-default items-center justify-center gap-2 rounded-lg text-sm font-bold text-[#665F74]">
              <span className="text-lg" aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}

function RightSidebar({ isAuthenticated }) {
  const friendTarget = isAuthenticated ? "/friends" : "/login";

  return (
    <aside className="sticky top-20 hidden max-h-[calc(100vh-5.5rem)] overflow-y-auto px-2 pb-6 xl:block" aria-label="Kết nối và liên hệ">
      <section className="rounded-2xl border border-[#E3E0E9] bg-white p-4 shadow-[0_1px_2px_rgba(47,42,69,0.06)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[#4A4459]">Gợi ý kết nối</h2>
          <Link to={friendTarget} className="rounded-lg px-2 py-1 text-xs font-bold text-social-violet hover:bg-[#EFECF9]">Xem tất cả</Link>
        </div>

        <div className="mt-3 space-y-3">
          {contacts.slice(0, 2).map((contact) => (
            <div key={contact.name} className="flex items-center gap-3">
              <Avatar initial={contact.initial} gradient={contact.gradient} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#3F394C]">{contact.name}</p>
                <p className="mt-0.5 text-[11px] text-[#77718C]">3 bạn chung</p>
              </div>
              <Link to={friendTarget} className="rounded-lg bg-[#ECE8FB] px-3 py-2 text-xs font-extrabold text-social-violet hover:bg-[#E2DCF8]">Kết nối</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 border-t border-[#DDD9E6] pt-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-extrabold text-[#625B70]">Người liên hệ</h2>
          <div className="flex items-center gap-1">
            <button type="button" disabled title="Tính năng đang được hoàn thiện" className="grid h-8 w-8 cursor-default place-items-center rounded-full text-[#77718C]" aria-label="Tìm người liên hệ"><SearchIcon /></button>
            <button type="button" disabled title="Tính năng đang được hoàn thiện" className="grid h-8 w-8 cursor-default place-items-center rounded-full text-[#77718C]" aria-label="Tùy chọn người liên hệ"><MoreIcon /></button>
          </div>
        </div>

        <ul className="mt-2 space-y-1">
          {contacts.map((contact) => (
            <li key={contact.name} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/80">
              <span className="relative">
                <Avatar initial={contact.initial} gradient={contact.gradient} size="sm" />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#F3F2F7] bg-[#55B99E]" aria-hidden="true" />
              </span>
              <span className="truncate text-sm font-bold text-[#4A4459]">{contact.name}</span>
              <span className="sr-only">Đang hoạt động</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

export default function HomePage() {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const displayName = user?.fullName?.trim() || user?.email || "bạn";
  const avatarUrl = user?.avatarUrl?.trim();
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <main className="mx-auto w-full max-w-[1460px] px-0 py-4 sm:px-4 lg:px-5">
      <div className="grid items-start justify-center gap-5 lg:grid-cols-[240px_minmax(0,680px)] xl:grid-cols-[240px_minmax(0,680px)_300px]">
        <LeftSidebar
          isAuthenticated={isAuthenticated}
          displayName={displayName}
          avatarUrl={avatarUrl}
          avatarLetter={avatarLetter}
        />

        <div className="min-w-0 space-y-4">
          <div className="px-3 sm:px-0">
            <Stories avatarUrl={avatarUrl} avatarLetter={avatarLetter} />
          </div>
          <Composer
            isAuthenticated={isAuthenticated}
            displayName={displayName}
            avatarUrl={avatarUrl}
            avatarLetter={avatarLetter}
          />
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>

        <RightSidebar isAuthenticated={isAuthenticated} />
      </div>

      <style>{`.feed-scroll { scrollbar-width: none; } .feed-scroll::-webkit-scrollbar { display: none; }`}</style>
    </main>
  );
}
