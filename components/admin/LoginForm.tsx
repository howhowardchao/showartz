'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // 確保接收 cookies
      });

      if (response.ok) {
        // 登入成功，重新檢查認證狀態並重新載入頁面
        window.location.href = '/admin';
      } else {
        const data = await response.json();
        setError(data.error || '登入失敗');
      }
    } catch (error) {
      setError('發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-magic-purple/20 rounded-lg border border-magic-gold/30 p-8 backdrop-blur-sm magic-glow">
        <h1 className="text-3xl font-magic text-magic-gold text-center mb-8">
          後台管理
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-magic-gold-light mb-2 font-magic">
              帳號
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light focus:outline-none focus:border-magic-gold focus:ring-1 focus:ring-magic-gold"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-magic-gold-light mb-2 font-magic">
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light focus:outline-none focus:border-magic-gold focus:ring-1 focus:ring-magic-gold"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-magic-gold text-magic-dark rounded-lg px-4 py-3 font-magic hover:bg-magic-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed magic-glow"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                登入中...
              </span>
            ) : (
              '登入'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

