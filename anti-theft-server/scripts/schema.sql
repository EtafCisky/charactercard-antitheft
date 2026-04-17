-- ============================================
-- SillyTavern 角色卡防盗插件 - 数据库架构
-- ============================================
-- 版本: 1.0.0
-- 创建日期: 2024-01-15
-- 说明: 此文件定义了防盗系统所需的所有数据库表结构和索引
-- ============================================

-- 设置字符集和排序规则
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================
-- 表 1: users (用户表)
-- ============================================
-- 存储角色卡作者的账号信息
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  -- 主键：用户唯一标识符
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- 用户名：唯一，用于登录
  username VARCHAR(50) UNIQUE NOT NULL,
  
  -- 电子邮件：唯一，用于账号恢复和通知
  email VARCHAR(100) UNIQUE NOT NULL,
  
  -- 密码哈希：使用 bcrypt 加密存储
  password_hash VARCHAR(255) NOT NULL,
  
  -- 创建时间：账号注册时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 更新时间：账号信息最后修改时间
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 索引：加速用户名查询（登录）
  INDEX idx_username (username),
  
  -- 索引：加速邮箱查询
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='用户账号表，存储角色卡作者的认证信息';

-- ============================================
-- 表 2: character_cards (角色卡表)
-- ============================================
-- 存储受保护的角色卡记录和密码信息
-- ============================================

CREATE TABLE IF NOT EXISTS character_cards (
  -- 主键：角色卡记录唯一标识符
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- 角色卡ID：6-8位数字字符串，唯一，用于密码验证
  card_id VARCHAR(20) UNIQUE NOT NULL,
  
  -- 用户ID：外键，关联到 users 表
  user_id INT NOT NULL,
  
  -- 角色卡名称：便于作者识别和管理
  card_name VARCHAR(100) NOT NULL,
  
  -- 密码哈希：使用 bcrypt 加密存储
  password_hash VARCHAR(255) NOT NULL,
  
  -- 密码版本号：每次更新密码时递增，用于版本控制
  password_version INT DEFAULT 1,
  
  -- 创建时间：角色卡记录创建时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 更新时间：角色卡信息最后修改时间
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 外键约束：关联到 users 表，级联删除
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- 索引：加速 card_id 查询（密码验证）
  INDEX idx_card_id (card_id),
  
  -- 索引：加速按用户查询角色卡列表
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='角色卡记录表，存储受保护的角色卡信息和密码';

-- ============================================
-- 索引说明
-- ============================================
-- 
-- users 表索引：
-- - idx_username: 用于登录时快速查找用户
-- - idx_email: 用于邮箱查找和验证
-- 
-- character_cards 表索引：
-- - idx_card_id: 用于密码验证时快速查找角色卡（高频查询）
-- - idx_user_id: 用于查询某个用户的所有角色卡
-- 
-- ============================================

-- ============================================
-- 数据完整性约束
-- ============================================
-- 
-- 1. username 和 email 必须唯一（UNIQUE 约束）
-- 2. card_id 必须唯一（UNIQUE 约束）
-- 3. user_id 必须存在于 users 表中（外键约束）
-- 4. 删除用户时自动删除其所有角色卡（ON DELETE CASCADE）
-- 5. password_version 默认值为 1
-- 
-- ============================================

-- ============================================
-- 使用示例
-- ============================================
-- 
-- 创建用户：
-- INSERT INTO users (username, email, password_hash) 
-- VALUES ('author123', 'author@example.com', '$2b$12$...');
-- 
-- 创建角色卡：
-- INSERT INTO character_cards (card_id, user_id, card_name, password_hash) 
-- VALUES ('123456', 1, '我的角色', '$2b$12$...');
-- 
-- 查询用户的所有角色卡：
-- SELECT * FROM character_cards WHERE user_id = 1;
-- 
-- 验证密码（查询角色卡）：
-- SELECT password_hash, password_version FROM character_cards WHERE card_id = '123456';
-- 
-- 更新密码：
-- UPDATE character_cards 
-- SET password_hash = '$2b$12$...', password_version = password_version + 1 
-- WHERE id = 1;
-- 
-- ============================================
