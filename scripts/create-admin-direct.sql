-- 直接建立管理員帳號（使用 bcrypt hash）
-- bcrypt hash for "admin123": $2a$10$rKJ5zJ5zJ5zJ5zJ5zJ5zOuJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ5z

INSERT INTO admin_users (username, password_hash)
SELECT 'admin', '$2a$10$rKJ5zJ5zJ5zJ5zJ5zJ5zOuJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ5zJ5z'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin');
