'use client';

import { useState, useEffect } from 'react';
import { Users, Eye, Clock, TrendingUp, Monitor, Smartphone, Tablet, BarChart3 } from 'lucide-react';

interface AnalyticsStats {
  totalVisitors: number;
  totalSessions: number;
  totalPageViews: number;
  avgSessionDuration: number;
  avgPageDuration: number;
  activeVisitors: number;
  popularPages: Array<{
    page_path: string;
    view_count: string;
    avg_duration: string;
    avg_scroll_depth: string;
  }>;
  deviceTypes: Array<{
    device_type: string;
    count: string;
  }>;
  visitorTypes: Array<{
    visitor_type: string;
    count: string;
  }>;
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/stats?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // 每 30 秒更新一次
    return () => clearInterval(interval);
  }, [period]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}分${secs}秒`;
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[var(--primary)] font-semibold text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 時間範圍選擇 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[var(--foreground)]">訪客統計</h2>
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                period === p
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-white border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)]'
              }`}
            >
              {p === 'today' ? '今天' : p === 'week' ? '本週' : '本月'}
            </button>
          ))}
        </div>
      </div>

      {/* 主要統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            {stats && (
              <div className="text-right">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {stats.totalVisitors.toLocaleString()}
                </div>
                <div className="text-sm text-[var(--muted)]">總訪客數</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            {stats && (
              <div className="text-right">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {stats.totalPageViews.toLocaleString()}
                </div>
                <div className="text-sm text-[var(--muted)]">總瀏覽數</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            {stats && (
              <div className="text-right">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {formatDuration(stats.avgSessionDuration)}
                </div>
                <div className="text-sm text-[var(--muted)]">平均會話時長</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            {stats && (
              <div className="text-right">
                <div className="text-2xl font-bold text-[var(--foreground)]">
                  {stats.activeVisitors}
                </div>
                <div className="text-sm text-[var(--muted)]">即時在線</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 詳細統計 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 熱門頁面 */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            熱門頁面
          </h3>
          {stats && stats.popularPages.length > 0 ? (
            <div className="space-y-3">
              {stats.popularPages.map((page, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[var(--border)]/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--foreground)] truncate">
                      {page.page_path || '/'}
                    </div>
                    <div className="text-sm text-[var(--muted)]">
                      {parseInt(page.view_count).toLocaleString()} 次瀏覽
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      {formatDuration(Math.round(parseFloat(page.avg_duration || '0')))}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      平均停留
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--muted)]">尚無資料</div>
          )}
        </div>

        {/* 裝置類型分布 */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            裝置類型分布
          </h3>
          {stats && stats.deviceTypes.length > 0 ? (
            <div className="space-y-3">
              {stats.deviceTypes.map((device, idx) => {
                const total = stats.deviceTypes.reduce((sum, d) => sum + parseInt(d.count), 0);
                const percentage = ((parseInt(device.count) / total) * 100).toFixed(1);
                const deviceName = device.device_type === 'mobile' ? '手機' : 
                                  device.device_type === 'tablet' ? '平板' : '桌面';
                
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.device_type)}
                        <span className="font-medium text-[var(--foreground)]">{deviceName}</span>
                      </div>
                      <div className="text-sm font-semibold text-[var(--foreground)]">
                        {parseInt(device.count).toLocaleString()} ({percentage}%)
                      </div>
                    </div>
                    <div className="w-full bg-[var(--border)] rounded-full h-2">
                      <div
                        className="bg-[var(--primary)] h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--muted)]">尚無資料</div>
          )}
        </div>
      </div>

      {/* 訪客類型 */}
      {stats && stats.visitorTypes.length > 0 && (
        <div className="bg-white rounded-xl border border-[var(--border)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">訪客類型</h3>
          <div className="grid grid-cols-2 gap-4">
            {stats.visitorTypes.map((type, idx) => {
              const isNew = type.visitor_type === 'new';
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${
                    isNew ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'
                  }`}
                >
                  <div className="text-sm text-[var(--muted)] mb-1">
                    {isNew ? '新訪客' : '回訪者'}
                  </div>
                  <div className="text-2xl font-bold text-[var(--foreground)]">
                    {parseInt(type.count).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

