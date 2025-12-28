'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[var(--border)] bg-white/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center space-y-2">
          <p className="text-[var(--foreground)] text-sm md:text-base font-semibold">
            © {currentYear} 藝棧 Showartz. All rights reserved.
          </p>
          <p className="text-[var(--muted)] text-xs md:text-sm">
            聯絡信箱：<a 
              href="mailto:service@showartz.com" 
              className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors underline"
            >
              service@showartz.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

