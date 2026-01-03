// 聊天限時和冷卻管理系統（支援動態設定和會員狀態）

import { getServiceSetting } from './db';

interface IPState {
  conversationStartTime: number | null; // 對話開始時間（毫秒）
  cooldownEndTime: number | null; // 冷卻結束時間（毫秒）
}

interface UserState {
  conversationStartTime: number | null;
  cooldownEndTime: number | null;
}

// 內存存儲（生產環境建議使用 Redis）
const ipStates = new Map<string, IPState>();
const userStates = new Map<string, UserState>();

// 設定快取（避免每次都查資料庫）
let settingsCache: {
  guest: { conversation_limit_ms: number; cooldown_ms: number } | null;
  member: { conversation_limit_ms: number; cooldown_ms: number } | null;
  lastUpdated: number;
} = {
  guest: null,
  member: null,
  lastUpdated: 0,
};

const CACHE_TTL = 60000; // 快取 1 分鐘

// 清理過期的狀態（每 10 分鐘清理一次）
setInterval(() => {
  const now = Date.now();
  for (const [ip, state] of ipStates.entries()) {
    if (
      state.cooldownEndTime &&
      state.cooldownEndTime < now &&
      (!state.conversationStartTime || state.conversationStartTime + 180000 < now)
    ) {
      ipStates.delete(ip);
    }
  }
  for (const [userId, state] of userStates.entries()) {
    if (
      state.cooldownEndTime &&
      state.cooldownEndTime < now &&
      (!state.conversationStartTime || state.conversationStartTime + 300000 < now)
    ) {
      userStates.delete(userId);
    }
  }
}, 10 * 60 * 1000); // 10 分鐘

/**
 * 獲取速率限制設定（帶快取）
 */
export async function getRateLimitSettings(isMember: boolean): Promise<{
  conversation_limit_ms: number;
  cooldown_ms: number;
}> {
  const now = Date.now();
  const cacheKey = isMember ? 'member' : 'guest';
  
  // 檢查快取是否有效
  if (
    settingsCache[cacheKey] &&
    now - settingsCache.lastUpdated < CACHE_TTL
  ) {
    return settingsCache[cacheKey]!;
  }

  try {
    // 從資料庫讀取設定
    const settingKey = isMember ? 'rate_limit_member' : 'rate_limit_guest';
    const setting = await getServiceSetting(settingKey);
    
    if (setting && setting.setting_value) {
      const limits = setting.setting_value as {
        conversation_limit_ms: number;
        cooldown_ms: number;
      };
      
      // 更新快取
      settingsCache[cacheKey] = limits;
      settingsCache.lastUpdated = now;
      
      return limits;
    }
  } catch (error) {
    console.error('[Chat Limiter] Error loading settings:', error);
  }

  // 如果讀取失敗，使用預設值
  const defaults = isMember
    ? { conversation_limit_ms: 300000, cooldown_ms: 60000 } // 會員：5分鐘對話，1分鐘冷卻
    : { conversation_limit_ms: 180000, cooldown_ms: 300000 }; // 訪客：3分鐘對話，5分鐘冷卻

  settingsCache[cacheKey] = defaults;
  return defaults;
}

/**
 * 清除設定快取（當管理員更新設定時調用）
 */
export function clearSettingsCache(): void {
  settingsCache = {
    guest: null,
    member: null,
    lastUpdated: 0,
  };
}

/**
 * 獲取客戶端 IP 地址
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP.trim();
  }
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  return 'unknown';
}

/**
 * 檢查是否可以開始新對話（支援會員和訪客）
 */
export async function canStartConversation(
  identifier: string,
  isMember: boolean = false
): Promise<{ allowed: boolean; reason?: string }> {
  const state = isMember
    ? userStates.get(identifier)
    : ipStates.get(identifier);
  const now = Date.now();

  if (!state) {
    return { allowed: true };
  }

  const limits = await getRateLimitSettings(isMember);

  // 檢查是否在冷卻期
  if (state.cooldownEndTime && state.cooldownEndTime > now) {
    return {
      allowed: false,
      reason: 'cooldown',
    };
  }

  // 檢查是否有進行中的對話且未超時
  if (state.conversationStartTime) {
    const elapsed = now - state.conversationStartTime;
    if (elapsed < limits.conversation_limit_ms) {
      return { allowed: true };
    } else {
      // 對話已超時，進入冷卻期
      state.conversationStartTime = null;
      state.cooldownEndTime = now + limits.cooldown_ms;
      return {
        allowed: false,
        reason: 'timeout',
      };
    }
  }

  return { allowed: true };
}

/**
 * 開始新對話
 */
export async function startConversation(
  identifier: string,
  isMember: boolean = false
): Promise<void> {
  const limits = await getRateLimitSettings(isMember);
  
  if (isMember) {
    const state = userStates.get(identifier) || {
      conversationStartTime: null,
      cooldownEndTime: null,
    };
    state.conversationStartTime = Date.now();
    state.cooldownEndTime = null;
    userStates.set(identifier, state);
  } else {
    const state = ipStates.get(identifier) || {
      conversationStartTime: null,
      cooldownEndTime: null,
    };
    state.conversationStartTime = Date.now();
    state.cooldownEndTime = null;
    ipStates.set(identifier, state);
  }
}

/**
 * 檢查對話是否仍在時間限制內
 */
export async function isConversationActive(
  identifier: string,
  isMember: boolean = false
): Promise<{ active: boolean; reason?: string }> {
  const state = isMember
    ? userStates.get(identifier)
    : ipStates.get(identifier);
    
  if (!state || !state.conversationStartTime) {
    return { active: false, reason: 'no_conversation' };
  }

  const limits = await getRateLimitSettings(isMember);
  const now = Date.now();
  const elapsed = now - state.conversationStartTime;

  if (elapsed >= limits.conversation_limit_ms) {
    state.conversationStartTime = null;
    state.cooldownEndTime = now + limits.cooldown_ms;
    return {
      active: false,
      reason: 'timeout',
    };
  }

  return { active: true };
}

/**
 * 結束對話並進入冷卻期
 */
export async function endConversation(
  identifier: string,
  isMember: boolean = false
): Promise<void> {
  const limits = await getRateLimitSettings(isMember);
  const state = isMember
    ? userStates.get(identifier)
    : ipStates.get(identifier);
    
  if (state) {
    state.conversationStartTime = null;
    state.cooldownEndTime = Date.now() + limits.cooldown_ms;
  }
}

/**
 * 獲取冷卻期剩餘時間（秒）
 */
export function getCooldownRemaining(
  identifier: string,
  isMember: boolean = false
): number | null {
  const state = isMember
    ? userStates.get(identifier)
    : ipStates.get(identifier);
    
  if (!state || !state.cooldownEndTime) {
    return null;
  }

  const now = Date.now();
  const remaining = state.cooldownEndTime - now;
  return remaining > 0 ? Math.ceil(remaining / 1000) : null;
}
