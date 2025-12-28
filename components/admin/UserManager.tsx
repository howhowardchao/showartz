'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { Trash2, Save, X, Edit2, CheckCircle, XCircle, Shield, User as UserIcon } from 'lucide-react';

export default function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMembership, setFilterMembership] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: id,
          ...editData,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        await fetchUsers();
        setEditingId(null);
        setEditData({});
        alert('更新成功');
      } else {
        const errorData = await response.json().catch(() => ({ error: '未知錯誤' }));
        alert(`更新失敗: ${errorData.error || '請檢查網路連線'}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('發生錯誤');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個會員嗎？此操作無法復原，將同時刪除該會員的所有地址資料。')) return;

    try {
      const response = await fetch(`/api/admin/users?userId=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await fetchUsers();
        alert('刪除成功');
      } else {
        const errorData = await response.json().catch(() => ({ error: '未知錯誤' }));
        alert(`刪除失敗: ${errorData.error || '請檢查網路連線'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('發生錯誤');
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `NT$${amount.toLocaleString('zh-TW')}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: { label: '啟用', className: 'bg-green-500/30 text-green-400' },
      inactive: { label: '停用', className: 'bg-gray-500/30 text-gray-400' },
      suspended: { label: '暫停', className: 'bg-red-500/30 text-red-400' },
    };
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-500/30 text-gray-400' };
    return (
      <span className={`px-2 py-1 rounded text-xs font-magic ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getMembershipBadge = (level: string) => {
    const levelMap: Record<string, { label: string; className: string }> = {
      regular: { label: '一般會員', className: 'bg-blue-500/30 text-blue-400' },
      premium: { label: '高級會員', className: 'bg-purple-500/30 text-purple-400' },
      vip: { label: 'VIP會員', className: 'bg-magic-gold/30 text-magic-gold' },
    };
    const levelInfo = levelMap[level] || { label: level, className: 'bg-gray-500/30 text-gray-400' };
    return (
      <span className={`px-2 py-1 rounded text-xs font-magic ${levelInfo.className}`}>
        {levelInfo.label}
      </span>
    );
  };

  const filteredUsers = users.filter((user) => {
    if (filterStatus !== 'all' && user.status !== filterStatus) return false;
    if (filterMembership !== 'all' && user.membership_level !== filterMembership) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-magic-gold font-magic text-xl magic-sparkle">
          載入中...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-magic-purple/20 rounded-lg border border-magic-gold/30 p-6 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-magic text-magic-gold">會員管理</h2>
      </div>

      {/* 篩選器 */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div>
          <label className="block text-magic-gold-light mb-1 text-sm">狀態篩選</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
          >
            <option value="all">全部</option>
            <option value="active">啟用</option>
            <option value="inactive">停用</option>
            <option value="suspended">暫停</option>
          </select>
        </div>
        <div>
          <label className="block text-magic-gold-light mb-1 text-sm">會員等級</label>
          <select
            value={filterMembership}
            onChange={(e) => setFilterMembership(e.target.value)}
            className="bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
          >
            <option value="all">全部</option>
            <option value="regular">一般會員</option>
            <option value="premium">高級會員</option>
            <option value="vip">VIP會員</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterStatus('all');
              setFilterMembership('all');
            }}
            className="bg-magic-purple/50 text-magic-gold-light px-4 py-2 rounded-lg font-magic hover:bg-magic-purple/70 transition-colors"
          >
            清除篩選
          </button>
        </div>
      </div>

      {/* 統計資訊 */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-magic-dark/50 rounded-lg border border-magic-purple/30 p-4">
          <div className="text-magic-gold-light text-sm">總會員數</div>
          <div className="text-2xl font-magic text-magic-gold">{users.length}</div>
        </div>
        <div className="bg-magic-dark/50 rounded-lg border border-magic-purple/30 p-4">
          <div className="text-magic-gold-light text-sm">啟用會員</div>
          <div className="text-2xl font-magic text-green-400">
            {users.filter((u) => u.status === 'active').length}
          </div>
        </div>
        <div className="bg-magic-dark/50 rounded-lg border border-magic-purple/30 p-4">
          <div className="text-magic-gold-light text-sm">VIP會員</div>
          <div className="text-2xl font-magic text-magic-gold">
            {users.filter((u) => u.membership_level === 'vip').length}
          </div>
        </div>
        <div className="bg-magic-dark/50 rounded-lg border border-magic-purple/30 p-4">
          <div className="text-magic-gold-light text-sm">總消費金額</div>
          <div className="text-xl font-magic text-magic-gold">
            {formatCurrency(users.reduce((sum, u) => sum + u.total_spent, 0))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-magic-purple/30">
              <th className="text-left p-3 text-magic-gold font-magic">會員資訊</th>
              <th className="text-left p-3 text-magic-gold font-magic">狀態</th>
              <th className="text-left p-3 text-magic-gold font-magic">會員等級</th>
              <th className="text-left p-3 text-magic-gold font-magic">積分</th>
              <th className="text-left p-3 text-magic-gold font-magic">消費金額</th>
              <th className="text-left p-3 text-magic-gold font-magic">註冊時間</th>
              <th className="text-left p-3 text-magic-gold font-magic">最後登入</th>
              <th className="text-left p-3 text-magic-gold font-magic">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-magic-purple/10">
                <td className="p-3">
                  <div>
                    <p className="text-magic-gold-light font-magic">{user.name}</p>
                    <p className="text-xs text-magic-gold-light/60">{user.email}</p>
                    {user.nickname && (
                      <p className="text-xs text-magic-gold-light/60">暱稱: {user.nickname}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      {editingId === user.id ? (
                        <label className="flex items-center gap-1 text-xs text-magic-gold-light cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editData.email_verified !== undefined ? editData.email_verified : user.email_verified}
                            onChange={(e) => setEditData({ ...editData, email_verified: e.target.checked })}
                            className="rounded"
                          />
                          <span>Email 已驗證</span>
                        </label>
                      ) : (
                        <>
                          {user.email_verified ? (
                            <span className="text-xs text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              已驗證
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              未驗證
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  {editingId === user.id ? (
                    <select
                      value={editData.status || user.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      className="bg-magic-dark border border-magic-purple/30 rounded px-2 py-1 text-magic-gold-light text-sm"
                    >
                      <option value="active">啟用</option>
                      <option value="inactive">停用</option>
                      <option value="suspended">暫停</option>
                    </select>
                  ) : (
                    getStatusBadge(user.status)
                  )}
                </td>
                <td className="p-3">
                  {editingId === user.id ? (
                    <select
                      value={editData.membership_level || user.membership_level}
                      onChange={(e) => setEditData({ ...editData, membership_level: e.target.value })}
                      className="bg-magic-dark border border-magic-purple/30 rounded px-2 py-1 text-magic-gold-light text-sm"
                    >
                      <option value="regular">一般會員</option>
                      <option value="premium">高級會員</option>
                      <option value="vip">VIP會員</option>
                    </select>
                  ) : (
                    getMembershipBadge(user.membership_level)
                  )}
                </td>
                <td className="p-3">
                  <span className="text-magic-gold-light text-sm">{user.total_points.toLocaleString()}</span>
                </td>
                <td className="p-3">
                  <span className="text-magic-gold-light text-sm">{formatCurrency(user.total_spent)}</span>
                </td>
                <td className="p-3">
                  <span className="text-magic-gold-light text-xs">{formatDate(user.created_at)}</span>
                </td>
                <td className="p-3">
                  <span className="text-magic-gold-light text-xs">
                    {user.last_login_at ? formatDate(user.last_login_at) : '從未登入'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {editingId === user.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(user.id)}
                          className="bg-magic-gold text-magic-dark px-3 py-1 rounded text-sm font-magic hover:bg-magic-gold-light transition-colors flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          儲存
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditData({});
                          }}
                          className="bg-magic-purple/50 text-magic-gold-light px-3 py-1 rounded text-sm font-magic hover:bg-magic-purple/70 transition-colors flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(user.id);
                            setEditData({
                              status: user.status,
                              membership_level: user.membership_level,
                              email_verified: user.email_verified,
                            });
                          }}
                          className="bg-magic-blue/50 text-magic-gold-light px-3 py-1 rounded text-sm font-magic hover:bg-magic-blue/70 transition-colors flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="bg-red-500/50 text-white px-3 py-1 rounded text-sm font-magic hover:bg-red-500/70 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-magic-gold-light">目前沒有符合條件的會員</p>
          </div>
        )}
      </div>
    </div>
  );
}

