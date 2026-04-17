import React, { createContext, useCallback, useContext, useState } from "react";
import Toast from "../components/Toast";

/**
 * Toast 通知上下文
 *
 * 功能：
 * - 全局管理 Toast 通知
 * - 提供添加通知的方法
 * - 自动管理通知的显示和移除
 * - 支持多个通知同时显示
 */

const ToastContext = createContext(null);

/**
 * 自定义 Hook：使用 Toast 上下文
 * @returns {Object} Toast 上下文对象
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

/**
 * Toast 提供者组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * 移除指定的 Toast
   * @param {string} id - Toast ID
   */
  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  /**
   * 添加新的 Toast
   * @param {Object} options - Toast 配置
   * @param {string} options.type - 通知类型 ('success' | 'error' | 'warning')
   * @param {string} options.message - 通知消息
   * @param {number} [options.duration=3000] - 自动消失时间（毫秒），0 表示不自动消失
   * @returns {string} Toast ID
   */
  const addToast = useCallback(
    ({ type = "success", message, duration = 3000 }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newToast = {
        id,
        type,
        message,
        duration,
      };

      setToasts((prevToasts) => [...prevToasts, newToast]);

      return id;
    },
    [],
  );

  /**
   * 显示成功通知
   * @param {string} message - 通知消息
   * @param {number} [duration=3000] - 自动消失时间（毫秒）
   * @returns {string} Toast ID
   */
  const showSuccess = useCallback(
    (message, duration = 3000) => {
      return addToast({ type: "success", message, duration });
    },
    [addToast],
  );

  /**
   * 显示错误通知
   * @param {string} message - 通知消息
   * @param {number} [duration=5000] - 自动消失时间（毫秒）
   * @returns {string} Toast ID
   */
  const showError = useCallback(
    (message, duration = 5000) => {
      return addToast({ type: "error", message, duration });
    },
    [addToast],
  );

  /**
   * 显示警告通知
   * @param {string} message - 通知消息
   * @param {number} [duration=4000] - 自动消失时间（毫秒）
   * @returns {string} Toast ID
   */
  const showWarning = useCallback(
    (message, duration = 4000) => {
      return addToast({ type: "warning", message, duration });
    },
    [addToast],
  );

  /**
   * 清除所有通知
   */
  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // 上下文值
  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    clearAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast 容器 */}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col items-end"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastContext;
