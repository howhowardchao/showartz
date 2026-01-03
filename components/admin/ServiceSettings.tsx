'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface RateLimitSettings {
  conversation_limit_ms: number;
  cooldown_ms: number;
}

interface ServiceSettings {
  guest: RateLimitSettings;
  member: RateLimitSettings;
}

export default function ServiceSettings() {
  const [settings, setSettings] = useState<ServiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/service-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        setMessage({ type: 'error', text: '載入設定失敗' });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: '載入設定時發生錯誤' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    // 前端驗證：檢查數值範圍
    const validateRange = (
      value: number,
      min: number,
      max: number,
      fieldName: string
    ): string | null => {
      if (isNaN(value) || value < min || value > max) {
        return `${fieldName} 必須在 ${min / 1000} 秒到 ${max / 1000} 秒之間`;
      }
      return null;
    };

    const errors: string[] = [];
    
    const guestConvError = validateRange(
      settings.guest.conversation_limit_ms,
      60000,
      600000,
      '訪客對話時間限制'
    );
    if (guestConvError) errors.push(guestConvError);

    const guestCoolError = validateRange(
      settings.guest.cooldown_ms,
      30000,
      600000,
      '訪客冷卻期'
    );
    if (guestCoolError) errors.push(guestCoolError);

    const memberConvError = validateRange(
      settings.member.conversation_limit_ms,
      60000,
      600000,
      '會員對話時間限制'
    );
    if (memberConvError) errors.push(memberConvError);

    const memberCoolError = validateRange(
      settings.member.cooldown_ms,
      30000,
      600000,
      '會員冷卻期'
    );
    if (memberCoolError) errors.push(memberCoolError);

    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors.join('、') });
      setSaving(false);
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/service-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: '設定已成功儲存' });
        // 3 秒後清除訊息
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || '儲存失敗' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: '儲存時發生錯誤' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (
    type: 'guest' | 'member',
    field: 'conversation_limit_ms' | 'cooldown_ms',
    value: number
  ) => {
    if (!settings) return;
    // 確保值是有效的數字
    if (isNaN(value) || value <= 0) {
      return; // 忽略無效值
    }
    setSettings({
      ...settings,
      [type]: {
        ...settings[type],
        [field]: value,
      },
    });
  };

  const formatTime = (ms: number): string => {
    if (isNaN(ms) || ms <= 0) return '0 秒';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes} 分 ${seconds % 60} 秒`;
    }
    return `${seconds} 秒`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-[var(--muted)]">
        無法載入設定
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[var(--border)] rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-6">
          服務設定
        </h2>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 未登入訪客設定 */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">
            未登入訪客設定
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                對話時間限制（秒）
              </label>
              <input
                type="number"
                min="60"
                max="600"
                step="30"
                value={isNaN(settings.guest.conversation_limit_ms) ? '' : Math.floor(settings.guest.conversation_limit_ms / 1000)}
                onChange={(e) => {
                  const seconds = parseInt(e.target.value, 10);
                  if (!isNaN(seconds) && seconds > 0) {
                    updateSetting(
                      'guest',
                      'conversation_limit_ms',
                      seconds * 1000
                    );
                  }
                }}
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30"
              />
              <p className="mt-1 text-sm text-[var(--muted)]">
                目前設定：{formatTime(settings.guest.conversation_limit_ms)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                冷卻期（秒）
              </label>
              <input
                type="number"
                min="30"
                max="600"
                step="30"
                value={isNaN(settings.guest.cooldown_ms) ? '' : Math.floor(settings.guest.cooldown_ms / 1000)}
                onChange={(e) => {
                  const seconds = parseInt(e.target.value, 10);
                  if (!isNaN(seconds) && seconds > 0) {
                    updateSetting(
                      'guest',
                      'cooldown_ms',
                      seconds * 1000
                    );
                  }
                }}
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30"
              />
              <p className="mt-1 text-sm text-[var(--muted)]">
                目前設定：{formatTime(settings.guest.cooldown_ms)}
              </p>
            </div>
          </div>
        </div>

        {/* 登入會員設定 */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">
            登入會員設定
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                對話時間限制（秒）
              </label>
              <input
                type="number"
                min="60"
                max="600"
                step="30"
                value={isNaN(settings.member.conversation_limit_ms) ? '' : Math.floor(settings.member.conversation_limit_ms / 1000)}
                onChange={(e) => {
                  const seconds = parseInt(e.target.value, 10);
                  if (!isNaN(seconds) && seconds > 0) {
                    updateSetting(
                      'member',
                      'conversation_limit_ms',
                      seconds * 1000
                    );
                  }
                }}
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30"
              />
              <p className="mt-1 text-sm text-[var(--muted)]">
                目前設定：{formatTime(settings.member.conversation_limit_ms)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                冷卻期（秒）
              </label>
              <input
                type="number"
                min="30"
                max="600"
                step="30"
                value={isNaN(settings.member.cooldown_ms) ? '' : Math.floor(settings.member.cooldown_ms / 1000)}
                onChange={(e) => {
                  const seconds = parseInt(e.target.value, 10);
                  if (!isNaN(seconds) && seconds > 0) {
                    updateSetting(
                      'member',
                      'cooldown_ms',
                      seconds * 1000
                    );
                  }
                }}
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/30"
              />
              <p className="mt-1 text-sm text-[var(--muted)]">
                目前設定：{formatTime(settings.member.cooldown_ms)}
              </p>
            </div>
          </div>
        </div>

        {/* 儲存按鈕 */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                儲存中...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                儲存設定
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

