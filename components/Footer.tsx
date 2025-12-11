'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-magic-purple/30 bg-magic-dark/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center space-y-2">
          <p className="text-magic-gold-light text-sm md:text-base font-magic">
            © {currentYear} 藝棧 Showartz. All rights reserved.
          </p>
          <p className="text-magic-gold-light/80 text-xs md:text-sm">
            聯絡信箱：<a 
              href="mailto:service@showartz.com" 
              className="text-magic-gold hover:text-magic-gold-light transition-colors underline"
            >
              service@showartz.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

