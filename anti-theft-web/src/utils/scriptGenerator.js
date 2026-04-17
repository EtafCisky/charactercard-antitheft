/**
 * 防盗脚本生成器
 *
 * 功能：
 * - 生成嵌入到角色卡中的防盗脚本
 * - 脚本包含不可关闭的密码弹窗
 * - 插件检测和密码验证逻辑
 * - 密码验证成功是唯一关闭弹窗的方式
 */

/**
 * 生成防盗脚本
 * @param {string} cardId - 角色卡 ID
 * @param {string} serverUrl - API 服务器地址
 * @returns {string} - 完整的防盗脚本代码（IIFE）
 */
export function generateAntiTheftScript(cardId, serverUrl) {
  // 移除 serverUrl 末尾的斜杠
  const cleanServerUrl = serverUrl.replace(/\/$/, "");

  return `(function() {
  'use strict';
  
  const CARD_ID = '${cardId}';
  const SERVER_URL = '${cleanServerUrl}';
  
  // 检查是否已经显示过弹窗（防止重复显示）
  if (window.__antiTheftDialogShown) {
    return;
  }
  
  // 检查锁定状态
  function isLocked() {
    try {
      const context = getContext();
      if (!context || !context.characters || context.characterId === undefined) {
        return true; // 无法获取上下文，默认锁定
      }
      
      const character = context.characters[context.characterId];
      if (!character || !character.data) {
        return true;
      }
      
      const antiTheft = character.data.extensions?.anti_theft;
      if (!antiTheft) {
        return false; // 未配置防盗，不锁定
      }
      
      return antiTheft.enabled === true && antiTheft.locked === true;
    } catch (e) {
      console.error('检查锁定状态失败:', e);
      return true; // 出错时默认锁定
    }
  }
  
  // 检测插件是否已安装
  function detectPlugin() {
    return typeof window.AntiTheftPlugin !== 'undefined' &&
           typeof window.AntiTheftPlugin.verifyPassword === 'function';
  }
  
  // 创建不可关闭的弹窗
  function createNonDismissibleDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'anti-theft-dialog';
    dialog.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    \`;
    
    const content = document.createElement('div');
    content.style.cssText = \`
      background: white;
      border-radius: 12px;
      padding: 32px;
      max-width: 450px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    \`;
    
    content.innerHTML = \`
      <div style="text-align: center; margin-bottom: 24px;">
        <svg style="width: 64px; height: 64px; margin: 0 auto; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
        </svg>
        <h2 style="margin: 16px 0 8px; font-size: 24px; font-weight: 600; color: #1f2937;">角色卡已加密</h2>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">请输入密码以解锁此角色卡</p>
      </div>
      
      <div class="message-area" style="margin-bottom: 16px; min-height: 24px;"></div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #374151;">密码</label>
        <input 
          type="password" 
          class="password-input" 
          placeholder="请输入密码"
          style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; outline: none;"
        />
      </div>
      
      <button 
        class="submit-button"
        style="width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 500; cursor: pointer; transition: background 0.2s;"
        onmouseover="this.style.background='#2563eb'"
        onmouseout="this.style.background='#3b82f6'"
      >
        验证密码
      </button>
      
      <div class="loading" style="display: none; text-align: center; margin-top: 16px;">
        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
      
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .password-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .submit-button:disabled {
          background: #9ca3af !important;
          cursor: not-allowed;
        }
      </style>
    \`;
    
    dialog.appendChild(content);
    
    // 禁用所有关闭方式
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        e.stopPropagation();
        e.preventDefault();
      }
    });
    
    return dialog;
  }
  
  // 密码验证处理
  async function handlePasswordSubmit(dialog, password) {
    const submitButton = dialog.querySelector('.submit-button');
    const messageArea = dialog.querySelector('.message-area');
    const loadingIndicator = dialog.querySelector('.loading');
    const passwordInput = dialog.querySelector('.password-input');
    
    // 显示加载状态
    submitButton.disabled = true;
    loadingIndicator.style.display = 'block';
    messageArea.innerHTML = '';
    
    try {
      // 调用插件 API
      const result = await window.AntiTheftPlugin.verifyPassword(
        CARD_ID,
        password,
        SERVER_URL
      );
      
      if (result.success) {
        // 验证成功：关闭弹窗（唯一关闭方式）
        messageArea.innerHTML = '<div style="padding: 12px; background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 6px; color: #065f46; font-size: 14px;"><strong>✓ 验证成功！</strong><br>正在加载角色卡...</div>';
        
        setTimeout(() => {
          dialog.remove();
          window.__antiTheftDialogShown = false;
        }, 1000);
      } else {
        // 验证失败：显示错误，弹窗保持打开
        messageArea.innerHTML = \`<div style="padding: 12px; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 6px; color: #991b1b; font-size: 14px;"><strong>✗ 验证失败</strong><br>\${result.message || '密码错误，请重试'}</div>\`;
        submitButton.disabled = false;
        passwordInput.value = '';
        passwordInput.focus();
      }
    } catch (error) {
      // 网络错误：显示错误，弹窗保持打开
      console.error('密码验证错误:', error);
      messageArea.innerHTML = \`<div style="padding: 12px; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 6px; color: #991b1b; font-size: 14px;"><strong>✗ 网络错误</strong><br>\${error.message || '无法连接到服务器，请检查网络连接'}</div>\`;
      submitButton.disabled = false;
    } finally {
      loadingIndicator.style.display = 'none';
    }
  }
  
  // 设置弹窗
  function setupDialog(dialog) {
    const hasPlugin = detectPlugin();
    const passwordInput = dialog.querySelector('.password-input');
    const submitButton = dialog.querySelector('.submit-button');
    const messageArea = dialog.querySelector('.message-area');
    
    if (!hasPlugin) {
      // 未安装插件：禁用输入
      passwordInput.disabled = true;
      submitButton.disabled = true;
      messageArea.innerHTML = \`
        <div style="padding: 12px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; color: #92400e; font-size: 14px;">
          <strong>⚠ 请安装防盗插件</strong><br>
          此角色卡需要安装防盗插件才能使用。<br>
          <a href="https://github.com/your-repo/plugin" target="_blank" style="color: #1d4ed8; text-decoration: underline;">点击下载插件</a>
        </div>
      \`;
      return;
    }
    
    // 已安装插件：启用输入
    passwordInput.disabled = false;
    submitButton.disabled = false;
    
    // 自动聚焦密码输入框
    setTimeout(() => passwordInput.focus(), 100);
    
    // 绑定提交事件
    submitButton.addEventListener('click', async () => {
      const password = passwordInput.value.trim();
      if (password) {
        await handlePasswordSubmit(dialog, password);
      }
    });
    
    // 支持 Enter 键提交
    passwordInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        const password = passwordInput.value.trim();
        if (password) {
          await handlePasswordSubmit(dialog, password);
        }
      }
    });
  }
  
  // 禁用 ESC 键
  function disableEscapeKey(e) {
    if (e.key === 'Escape' && document.getElementById('anti-theft-dialog')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  
  // 初始化
  function init() {
    if (isLocked()) {
      window.__antiTheftDialogShown = true;
      
      const dialog = createNonDismissibleDialog();
      document.body.appendChild(dialog);
      setupDialog(dialog);
      
      // 禁用 ESC 键
      document.addEventListener('keydown', disableEscapeKey, true);
    }
  }
  
  // 等待 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();`;
}
