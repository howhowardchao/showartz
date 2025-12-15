'use client';

import NextImage from 'next/image';
import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { Trash2, Plus, Save, X, RefreshCw } from 'lucide-react';

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    shopee_item_id: '',
    shopee_shop_id: '62981645',
    name: '',
    description: '',
    price: '',
    original_price: '',
    image_url: '',
    shopee_url: '',
    category: '',
    tags: '',
    stock: '0',
    sales_count: '0',
    rating: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const handlePinkoiSync = async () => {
    setSyncing(true);
    setSyncLogs([]);
    setShowLogs(true);
    try {
      const response = await fetch('/api/pinkoi/sync', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.logs) {
          setSyncLogs(result.logs);
        }
        const deactivatedMsg = result.deactivated ? `，已下架 ${result.deactivated} 個商品` : '';
        alert(`Pinkoi 同步完成：成功 ${result.success} 個，失敗 ${result.failed} 個，總共找到 ${result.total} 個商品${deactivatedMsg}`);
        await fetchProducts();
      } else {
        const errorData = await response.json().catch(() => ({ error: '未知錯誤' }));
        alert(`Pinkoi 同步失敗: ${errorData.error || '請檢查網路連線'}`);
      }
    } catch (error) {
      console.error('Error syncing Pinkoi products:', error);
      alert('發生錯誤');
    } finally {
      setSyncing(false);
    }
  };

  const handleAdd = async () => {
    try {
      const productData = {
        shopee_item_id: parseInt(newProduct.shopee_item_id),
        shopee_shop_id: parseInt(newProduct.shopee_shop_id),
        name: newProduct.name,
        description: newProduct.description || undefined,
        price: parseFloat(newProduct.price),
        original_price: newProduct.original_price ? parseFloat(newProduct.original_price) : undefined,
        image_url: newProduct.image_url || undefined,
        shopee_url: newProduct.shopee_url,
        category: newProduct.category || undefined,
        tags: newProduct.tags ? newProduct.tags.split(',').map(t => t.trim()) : undefined,
        stock: parseInt(newProduct.stock) || 0,
        sales_count: parseInt(newProduct.sales_count) || 0,
        rating: newProduct.rating ? parseFloat(newProduct.rating) : undefined,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
        credentials: 'include',
      });

      if (response.ok) {
        await fetchProducts();
        setNewProduct({
          shopee_item_id: '',
          shopee_shop_id: '62981645',
          name: '',
          description: '',
          price: '',
          original_price: '',
          image_url: '',
          shopee_url: '',
          category: '',
          tags: '',
          stock: '0',
          sales_count: '0',
          rating: '',
        });
        setShowAddForm(false);
        alert('新增成功');
      } else {
        const errorData = await response.json().catch(() => ({ error: '未知錯誤' }));
        alert(`新增失敗: ${errorData.error || '請檢查輸入資料'}`);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('發生錯誤');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
        credentials: 'include',
      });

      if (response.ok) {
        await fetchProducts();
        setEditingId(null);
        setEditData({});
        alert('更新成功');
      } else {
        const errorData = await response.json().catch(() => ({ error: '未知錯誤' }));
        alert(`更新失敗: ${errorData.error || '請檢查網路連線'}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('發生錯誤');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個商品嗎？此操作無法復原。')) return;

    try {
      console.log('[ProductManager] Attempting to delete product:', id);
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[ProductManager] Delete response:', data);
        await fetchProducts();
        alert('刪除成功');
      } else {
        const errorData = await response.json().catch(() => ({ error: '未知錯誤' }));
        console.error('[ProductManager] Delete failed:', errorData);
        alert(`刪除失敗: ${errorData.error || errorData.details || '請檢查後端日誌'}`);
      }
    } catch (error: unknown) {
      console.error('[ProductManager] Error deleting product:', error);
      const message = error instanceof Error ? error.message : '請檢查後端日誌';
      alert(`發生錯誤: ${message}`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(price);
  };

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
        <h2 className="text-2xl font-magic text-magic-gold">商品管理</h2>
        <div className="flex gap-3">
          <button
            disabled={true}
            className="bg-gray-500/30 text-gray-400 px-4 py-2 rounded-lg font-magic cursor-not-allowed flex items-center gap-2 opacity-50"
            title="蝦皮商品同步功能暫時停用"
          >
            <RefreshCw className="w-5 h-5" />
            同步蝦皮商品
          </button>
          <button
            onClick={handlePinkoiSync}
            disabled={syncing}
            className="bg-magic-purple/50 text-magic-gold-light px-4 py-2 rounded-lg font-magic hover:bg-magic-purple/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同步中...' : '同步 Pinkoi 商品'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-magic-gold text-magic-dark px-4 py-2 rounded-lg font-magic hover:bg-magic-gold-light transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            新增商品
          </button>
        </div>
      </div>

      {showLogs && syncLogs.length > 0 && (
        <div className="mb-6 p-4 bg-magic-dark/50 rounded-lg border border-magic-purple/30 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-magic text-magic-gold">同步日誌</h3>
            <button
              onClick={() => setShowLogs(false)}
              className="text-magic-gold-light hover:text-magic-gold"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-1 font-mono text-xs text-magic-gold-light">
            {syncLogs.map((log, idx) => (
              <div key={idx} className={log.includes('[ERROR]') ? 'text-red-400' : log.includes('[WARN]') ? 'text-yellow-400' : ''}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 p-4 bg-magic-dark/50 rounded-lg border border-magic-purple/30">
          <h3 className="text-xl font-magic text-magic-gold mb-4">新增商品</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-magic-gold-light mb-1">蝦皮商品 ID *</label>
              <input
                type="number"
                value={newProduct.shopee_item_id}
                onChange={(e) => setNewProduct({ ...newProduct, shopee_item_id: e.target.value })}
                className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
              />
            </div>
            <div>
              <label className="block text-magic-gold-light mb-1">商品名稱 *</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
              />
            </div>
            <div>
              <label className="block text-magic-gold-light mb-1">價格 *</label>
              <input
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
              />
            </div>
            <div>
              <label className="block text-magic-gold-light mb-1">原價</label>
              <input
                type="number"
                step="0.01"
                value={newProduct.original_price}
                onChange={(e) => setNewProduct({ ...newProduct, original_price: e.target.value })}
                className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
              />
            </div>
            <div>
              <label className="block text-magic-gold-light mb-1">蝦皮連結 *</label>
              <input
                type="url"
                value={newProduct.shopee_url}
                onChange={(e) => setNewProduct({ ...newProduct, shopee_url: e.target.value })}
                className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
              />
            </div>
            <div>
              <label className="block text-magic-gold-light mb-1">圖片 URL</label>
              <input
                type="url"
                value={newProduct.image_url}
                onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
              />
            </div>
            <div>
              <label className="block text-magic-gold-light mb-1">分類</label>
              <input
                type="text"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
              />
            </div>
            <div>
              <label className="block text-magic-gold-light mb-1">標籤（用逗號分隔）</label>
              <input
                type="text"
                value={newProduct.tags}
                onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value })}
                className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
                placeholder="情緒,專注,行動力"
              />
            </div>
            <div>
              <label className="block text-magic-gold-light mb-1">描述</label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full bg-magic-dark border border-magic-purple/30 rounded-lg px-4 py-2 text-magic-gold-light"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAdd}
              className="bg-magic-gold text-magic-dark px-4 py-2 rounded-lg font-magic hover:bg-magic-gold-light transition-colors flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              儲存
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-magic-purple/50 text-magic-gold-light px-4 py-2 rounded-lg font-magic hover:bg-magic-purple/70 transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              取消
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-magic-purple/30">
              <th className="text-left p-3 text-magic-gold font-magic">圖片</th>
              <th className="text-left p-3 text-magic-gold font-magic">商品名稱</th>
              <th className="text-left p-3 text-magic-gold font-magic">價格</th>
              <th className="text-left p-3 text-magic-gold font-magic">分類</th>
              <th className="text-left p-3 text-magic-gold font-magic">銷售</th>
              <th className="text-left p-3 text-magic-gold font-magic">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-magic-purple/10">
                <td className="p-3">
                  {product.image_url ? (
                    <div className="relative w-16 h-16 rounded overflow-hidden">
                      <NextImage
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-magic-purple/20 rounded flex items-center justify-center">
                      <span className="text-xs text-magic-gold-light">無圖</span>
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {editingId === product.id ? (
                    <input
                      type="text"
                      value={editData.name || product.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full bg-magic-dark border border-magic-purple/30 rounded px-2 py-1 text-magic-gold-light text-sm"
                    />
                  ) : (
                    <div>
                      <p className="text-magic-gold-light font-magic">{product.name}</p>
                      <p className="text-xs text-magic-gold-light/60">ID: {product.shopee_item_id}</p>
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {editingId === product.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.price || product.price}
                      onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                      className="w-full bg-magic-dark border border-magic-purple/30 rounded px-2 py-1 text-magic-gold-light text-sm"
                    />
                  ) : (
                    <span className="text-magic-gold font-magic">{formatPrice(product.price)}</span>
                  )}
                </td>
                <td className="p-3">
                  {editingId === product.id ? (
                    <input
                      type="text"
                      value={editData.category || product.category || ''}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                      className="w-full bg-magic-dark border border-magic-purple/30 rounded px-2 py-1 text-magic-gold-light text-sm"
                    />
                  ) : (
                    <span className="text-magic-gold-light text-sm">{product.category || '-'}</span>
                  )}
                </td>
                <td className="p-3">
                  <span className="text-magic-gold-light text-sm">{product.sales_count.toLocaleString()}</span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {editingId === product.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(product.id)}
                          className="bg-magic-gold text-magic-dark px-3 py-1 rounded text-sm font-magic hover:bg-magic-gold-light transition-colors"
                        >
                          儲存
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditData({});
                          }}
                          className="bg-magic-purple/50 text-magic-gold-light px-3 py-1 rounded text-sm font-magic hover:bg-magic-purple/70 transition-colors"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(product.id);
                            setEditData({});
                          }}
                          className="bg-magic-blue/50 text-magic-gold-light px-3 py-1 rounded text-sm font-magic hover:bg-magic-blue/70 transition-colors"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-500/50 text-white px-3 py-1 rounded text-sm font-magic hover:bg-red-500/70 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-magic-gold-light">目前沒有商品</p>
            <p className="text-magic-gold-light/70 text-sm mt-2">點擊「同步蝦皮商品」按鈕來同步商品</p>
          </div>
        )}
      </div>
    </div>
  );
}

