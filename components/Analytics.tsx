'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // 只在客戶端執行
    if (typeof window === 'undefined') return;
    
    // 不在管理頁面追蹤
    if (pathname?.startsWith('/admin')) return;

    // 初始化訪客 ID（如果沒有）
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('visitor_id', visitorId);
    }

    // 生成 Session ID（每次頁面載入都是新 session，除非在 30 分鐘內）
    let sessionId = sessionStorage.getItem('session_id');
    const sessionTimestamp = sessionStorage.getItem('session_timestamp');
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    if (!sessionId || !sessionTimestamp || (now - parseInt(sessionTimestamp)) > thirtyMinutes) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);
      sessionStorage.setItem('session_timestamp', now.toString());
    }

    const pageEnterTime = Date.now();
    let scrollDepth = 0;
    let maxScrollDepth = 0;

    // 追蹤頁面進入
    const trackPageView = async () => {
      try {
        await fetch('/api/analytics/pageview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId,
            sessionId,
            pagePath: pathname,
            pageTitle: document.title,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            language: navigator.language,
          }),
        });
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    };

    // 追蹤滾動深度
    const trackScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const newScrollDepth = Math.round((scrollTop / docHeight) * 100);
        if (newScrollDepth > maxScrollDepth) {
          maxScrollDepth = newScrollDepth;
          scrollDepth = newScrollDepth;
        }
      }
    };

    // 追蹤頁面離開
    const trackPageExit = () => {
      const duration = Math.round((Date.now() - pageEnterTime) / 1000);
      
      fetch('/api/analytics/pageview/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          pagePath: pathname,
          duration,
          scrollDepth: maxScrollDepth,
        }),
      }).catch(console.error);
    };

    // 追蹤 Session 結束
    const trackSessionEnd = () => {
      fetch('/api/analytics/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(console.error);
    };

    // 初始化追蹤
    trackPageView();
    window.addEventListener('scroll', trackScroll, { passive: true });
    
    // 頁面離開時追蹤
    const handleBeforeUnload = () => {
      trackPageExit();
      trackSessionEnd();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 頁面可見性改變時追蹤
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackPageExit();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 定期更新滾動深度（每 5 秒）
    const scrollInterval = setInterval(() => {
      if (maxScrollDepth > 0) {
        trackScroll();
      }
    }, 5000);

    return () => {
      trackPageExit();
      window.removeEventListener('scroll', trackScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(scrollInterval);
    };
  }, [pathname]);

  return null;
}

