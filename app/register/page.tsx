'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    nickname: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 前端驗證
    if (formData.password !== formData.confirmPassword) {
      setError('密碼與確認密碼不一致');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('密碼長度至少需要 6 個字元');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          nickname: formData.nickname || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '註冊失敗');
        setLoading(false);
        return;
      }

      // 註冊成功，導向登入頁
      router.push('/login?registered=true');
    } catch (error) {
      console.error('Register error:', error);
      setError('註冊失敗，請稍後再試');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-semibold text-[var(--foreground)]">
            註冊帳號
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--muted)]">
            或{' '}
            <Link href="/login" className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-semibold">
              已有帳號？立即登入
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                電子郵件 *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                姓名 *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  placeholder="請輸入您的姓名"
                />
              </div>
            </div>

            <div>
              <label htmlFor="nickname" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                暱稱（選填）
              </label>
              <input
                id="nickname"
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                placeholder="請輸入您的暱稱"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                密碼 *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  placeholder="至少 6 個字元"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                確認密碼 *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--muted)]" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
                  placeholder="請再次輸入密碼"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? '註冊中...' : '註冊'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

