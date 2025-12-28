'use client';

interface IGPost {
  id: string;
  image: string;
  href: string;
  alt: string;
}

const posts: IGPost[] = [
  {
    id: 'ig-1',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    href: 'https://www.instagram.com/showartz',
    alt: '手作包款展示',
  },
  {
    id: 'ig-2',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    href: 'https://www.instagram.com/showartz',
    alt: '生活擺飾與花藝',
  },
  {
    id: 'ig-3',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    href: 'https://www.instagram.com/showartz',
    alt: '質感配件細節',
  },
  {
    id: 'ig-4',
    image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=800&q=80',
    href: 'https://www.instagram.com/showartz',
    alt: '場景佈置靈感',
  },
  {
    id: 'ig-5',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    href: 'https://www.instagram.com/showartz',
    alt: '穿搭實拍',
  },
  {
    id: 'ig-6',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    href: 'https://www.instagram.com/showartz',
    alt: '桌面小物',
  },
];

export default function IGGallery() {
  return (
    <section className="container mx-auto px-4 py-6 md:py-10">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <p className="text-sm text-[var(--muted)]">Instagram 精選</p>
          <h3 className="text-2xl font-semibold text-[var(--foreground)]">跟著實拍逛逛</h3>
        </div>
        <a
          href="https://www.instagram.com/showartz"
          target="_blank"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)] text-white text-sm font-semibold shadow-md hover:bg-[var(--primary-dark)] transition-colors"
        >
          前往 IG
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.href}
            target="_blank"
            className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={post.image}
                alt={post.alt}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
        ))}
      </div>

      <a
        href="https://www.instagram.com/showartz"
        target="_blank"
        className="mt-4 inline-flex md:hidden items-center justify-center gap-2 px-4 py-2 w-full rounded-lg bg-[var(--primary)] text-white text-sm font-semibold shadow-md hover:bg-[var(--primary-dark)] transition-colors"
      >
        前往 IG
      </a>
    </section>
  );
}

