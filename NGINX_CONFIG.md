# Nginx 配置 - 增加上傳文件大小限制

## 問題
上傳縮圖時出現 413 (Request Entity Too Large) 錯誤，這是因為 Nginx 的默認請求體大小限制太小。

## 解決方案

在 VPS 上編輯 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/showartz
```

在 `server` 區塊中添加或修改：

```nginx
server {
    listen 443 ssl;
    server_name showartz.com www.showartz.com;

    # 增加客戶端請求體大小限制（10MB）
    client_max_body_size 10M;

    # ... 其他配置 ...
}
```

然後重新載入 Nginx：

```bash
sudo nginx -t  # 測試配置是否正確
sudo systemctl reload nginx  # 重新載入配置
```

## 驗證

配置完成後，應該可以上傳最大 10MB 的文件。


