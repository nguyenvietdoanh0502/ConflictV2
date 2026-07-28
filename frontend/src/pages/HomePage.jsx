import { Link } from "react-router-dom";

const categories = [
  {
    name: "Hành động",
    images: [
      "/home/posters/poster-01.jpg",
      "/home/posters/poster-02.jpg",
      "/home/posters/poster-03.jpg",
      "/home/posters/poster-04.jpg",
    ],
  },
  {
    name: "Phiêu lưu",
    images: [
      "/home/posters/poster-05.jpg",
      "/home/posters/poster-06.jpg",
      "/home/posters/poster-07.jpg",
      "/home/posters/poster-08.jpg",
    ],
  },
  {
    name: "Hài",
    images: [
      "/home/posters/poster-09.jpg",
      "/home/posters/poster-10.jpg",
      "/home/posters/poster-11.jpg",
      "/home/posters/poster-12.jpg",
    ],
  },
  {
    name: "Chính kịch",
    images: [
      "/home/posters/poster-13.jpg",
      "/home/posters/poster-14.jpg",
      "/home/posters/poster-15.jpg",
      "/home/posters/poster-16.jpg",
    ],
  },
  {
    name: "Kinh dị",
    images: [
      "/home/posters/poster-17.jpg",
      "/home/posters/poster-18.jpg",
      "/home/posters/poster-19.jpg",
      "/home/posters/poster-20.jpg",
    ],
  },
];

const trendingMovies = [
  {
    title: "Black Panther",
    image: "/home/posters/poster-02.jpg",
    meta: "2 giờ 14 phút",
    badge: "IMDb 8.6",
  },
  {
    title: "The Batman",
    image: "/home/posters/poster-03.jpg",
    meta: "2 giờ 56 phút",
    badge: "Top 10",
  },
  {
    title: "Expendables 3",
    image: "/home/posters/poster-04.jpg",
    meta: "2 giờ 06 phút",
    badge: "4K",
  },
  {
    title: "Good Newwz",
    image: "/home/posters/poster-09.jpg",
    meta: "2 giờ 12 phút",
    badge: "IMDb 7.4",
  },
  {
    title: "Joker",
    image: "/home/posters/poster-14.jpg",
    meta: "2 giờ 02 phút",
    badge: "Top 10",
  },
  {
    title: "Scream",
    image: "/home/posters/poster-18.jpg",
    meta: "1 giờ 54 phút",
    badge: "4K",
  },
];

const latestMovies = [
  {
    title: "Archer",
    image: "/home/posters/poster-05.jpg",
    meta: "2024",
    badge: "Mới",
  },
  {
    title: "Jungle Cruise",
    image: "/home/posters/poster-06.jpg",
    meta: "2023",
    badge: "4K",
  },
  {
    title: "Central Intelligence",
    image: "/home/posters/poster-10.jpg",
    meta: "2024",
    badge: "Mới",
  },
  {
    title: "Bhool Bhulaiyaa 2",
    image: "/home/posters/poster-11.jpg",
    meta: "2023",
    badge: "HD",
  },
  {
    title: "Us",
    image: "/home/posters/poster-17.jpg",
    meta: "2024",
    badge: "Mới",
  },
  {
    title: "The Human Centipede",
    image: "/home/posters/poster-20.jpg",
    meta: "2022",
    badge: "HD",
  },
];

function SectionHeading({ title, description }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#999999] sm:text-base">
          {description}
        </p>
      </div>

      <div className="hidden items-center gap-2 rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-2 sm:flex">
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-[#1F1F1F] bg-[#1A1A1A]">
          <img
            className="h-5 w-5 rotate-180"
            src="/home/icons/arrow.svg"
            alt=""
          />
        </span>
        <span className="h-1 w-6 rounded-full bg-[#E50000]" />
        <span className="h-1 w-3 rounded-full bg-[#333333]" />
        <span className="h-1 w-3 rounded-full bg-[#333333]" />
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-[#1F1F1F] bg-[#1A1A1A]">
          <img className="h-5 w-5" src="/home/icons/arrow.svg" alt="" />
        </span>
      </div>
    </div>
  );
}

function MovieRow({ movies }) {
  return (
    <div className="home-scroll -mx-5 mt-8 flex snap-x gap-4 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-5 lg:overflow-visible lg:px-0">
      {movies.map((movie) => (
        <article
          key={movie.title}
          className="group min-w-[170px] snap-start rounded-xl border border-[#262626] bg-[#1A1A1A] p-3 transition duration-300 hover:-translate-y-1 hover:border-[#404040] sm:min-w-[210px] lg:min-w-0"
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[#0F0F0F]">
            <img
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              src={movie.image}
              alt={`Poster phim ${movie.title}`}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <span className="absolute left-2.5 top-2.5 rounded-md bg-[#E50000] px-2 py-1 text-[10px] font-semibold text-white">
              {movie.badge}
            </span>
          </div>

          <div className="px-1 pb-1 pt-4">
            <h3 className="truncate text-sm font-semibold text-white sm:text-base">
              {movie.title}
            </h3>
            <div className="mt-2 flex items-center justify-between text-xs text-[#999999]">
              <span>{movie.meta}</span>
              <span className="rounded-md border border-[#262626] bg-[#141414] px-2 py-1">
                Full HD
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <main
      className="min-h-screen overflow-hidden bg-[#141414] text-white"
      style={{ fontFamily: '"Manrope", sans-serif' }}
    >
      <style>
        {`@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap");
        .home-scroll { scrollbar-width: none; }
        .home-scroll::-webkit-scrollbar { display: none; }`}
      </style>

      <section className="relative min-h-[760px] overflow-hidden">
        <img
          className="absolute inset-0 h-full w-full object-cover object-top"
          src="/login/streamvibe-hero.jpg"
          alt=""
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#141414]/80 via-[#141414]/20 to-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/30 via-transparent to-[#141414]/30" />

        <header className="relative z-20 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
          <img
            className="h-auto w-[145px] sm:w-[166px]"
            src="/home/icons/logo.svg"
            alt="StreamVibe"
          />

          <nav
            className="hidden items-center gap-1 rounded-xl border-4 border-[#1F1F1F] bg-[#0F0F0F] p-2 lg:flex"
            aria-label="Điều hướng chính"
          >
            <span className="rounded-lg bg-[#1A1A1A] px-5 py-3 text-sm font-medium text-white">
              Trang chủ
            </span>
            {["Phim & Chương trình", "Hỗ trợ", "Gói dịch vụ"].map((item) => (
              <span
                key={item}
                className="px-5 py-3 text-sm text-[#BFBFBF]"
              >
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
            <Link
              to="/login"
              className="rounded-lg bg-[#E50000] px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(229,0,0,0.2)] transition hover:bg-[#FF1919] focus:outline-none focus:ring-4 focus:ring-[#E50000]/25 sm:px-5 sm:text-sm"
            >
              Đăng nhập
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[640px] max-w-4xl flex-col items-center justify-end px-5 pb-20 pt-32 text-center sm:px-8 sm:pb-24">
          <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-medium text-[#E4E4E7] backdrop-blur">
            Hàng ngàn bộ phim đang chờ bạn khám phá
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-[58px]">
            Trải nghiệm xem phim tuyệt vời nhất
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#B3B3B3] sm:text-base lg:text-lg">
            Thưởng thức những bộ phim bom tấn, series hấp dẫn và chương trình
            yêu thích của bạn mọi lúc, mọi nơi với chất lượng hình ảnh tốt nhất.
          </p>
          <button
            type="button"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#E50000] px-6 py-4 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(229,0,0,0.22)] transition hover:bg-[#FF1919] focus:outline-none focus:ring-4 focus:ring-[#E50000]/25 sm:text-base"
          >
            <img className="h-5 w-5" src="/home/icons/play.svg" alt="" />
            Bắt đầu xem ngay
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <section className="py-16 sm:py-20 lg:py-24">
          <SectionHeading
            title="Khám phá đa dạng thể loại"
            description="Từ hành động kịch tính đến hài hước nhẹ nhàng, luôn có một thế giới nội dung phù hợp với tâm trạng của bạn."
          />

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:mt-10 xl:grid-cols-5 xl:gap-5">
            {categories.map((category) => (
              <article
                key={category.name}
                className="group rounded-xl border border-[#262626] bg-[#1A1A1A] p-3 transition duration-300 hover:-translate-y-1 hover:border-[#404040] sm:p-4"
              >
                <div className="relative grid h-44 grid-cols-2 gap-1.5 overflow-hidden rounded-lg sm:h-52">
                  {category.images.map((image) => (
                    <img
                      key={image}
                      className="h-full min-h-0 w-full object-cover"
                      src={image}
                      alt=""
                      loading="lazy"
                    />
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1A1A1A]" />
                </div>

                <div className="flex items-center justify-between gap-3 px-1 pb-1 pt-3">
                  <h3 className="text-sm font-semibold text-white sm:text-base">
                    {category.name}
                  </h3>
                  <img
                    className="h-5 w-5 transition group-hover:translate-x-1"
                    src="/home/icons/arrow.svg"
                    alt=""
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-[#1F1F1F] py-16 sm:py-20">
          <SectionHeading
            title="Đang thịnh hành"
            description="Những tựa phim đang được cộng đồng StreamVibe xem và bàn luận nhiều nhất tuần này."
          />
          <MovieRow movies={trendingMovies} />
        </section>

        <section className="border-t border-[#1F1F1F] py-16 sm:py-20">
          <SectionHeading
            title="Mới cập nhật"
            description="Danh sách nội dung vừa được thêm vào thư viện để bạn luôn có điều mới mẻ để thưởng thức."
          />
          <MovieRow movies={latestMovies} />
        </section>

        <section className="relative my-16 overflow-hidden rounded-2xl border border-[#262626] sm:my-20">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="/login/streamvibe-hero.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/95 to-[#E50000]/35" />

          <div className="relative flex flex-col items-start justify-between gap-7 px-6 py-10 sm:px-10 sm:py-12 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Bắt đầu trải nghiệm miễn phí ngay hôm nay
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#B3B3B3] sm:text-base">
                Tham gia StreamVibe và khám phá kho nội dung giải trí không giới
                hạn trên mọi thiết bị.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg bg-[#E50000] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#FF1919] focus:outline-none focus:ring-4 focus:ring-[#E50000]/25"
            >
              Dùng thử miễn phí
            </button>
          </div>
        </section>
      </div>

      <footer className="border-t border-[#1F1F1F] bg-[#0F0F0F]">
        <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
            <div>
              <img
                className="w-[150px]"
                src="/home/icons/logo.svg"
                alt="StreamVibe"
                loading="lazy"
              />
              <p className="mt-5 max-w-xs text-sm leading-6 text-[#999999]">
                Không gian giải trí trực tuyến dành cho những người yêu điện
                ảnh và các series chất lượng.
              </p>
            </div>

            {[
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
            ].map((column) => (
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
            <p>© 2026 StreamVibe. Bản Home demo giao diện.</p>
            <p>Các chức năng sẽ được tích hợp sau.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
