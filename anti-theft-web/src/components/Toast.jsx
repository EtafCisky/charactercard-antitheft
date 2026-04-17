import { useEffect } from "react";

/**
 * Toast 通知组件
 *
 * 功能：
 * - 显示成功、错误、警告通知
 * - 自动消失功能
 * - 支持手动关闭
 * - 动画效果
 *
 * Props:
 * - id: string - 唯一标识符
 * - type: 'success' | 'error' | 'warning' - 通知类型
 * - message: string - 通知消息
 * - duration: number - 自动消失时间（毫秒），0 表示不自动消失
 * - onClose: function - 关闭回调函数
 */

const Toast = ({ id, type = "success", message, duration = 3000, onClose }) => {
  // 自动消失
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  // 根据类型设置样式
  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-800",
          text: "text-green-800 dark:text-green-200",
          icon: (
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "error":
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          text: "text-red-800 dark:text-red-200",
          icon: (
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      case "warning":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          border: "border-yellow-200 dark:border-yellow-800",
          text: "text-yellow-800 dark:text-yellow-200",
          icon: (
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ),
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-800",
          border: "border-gray-200 dark:border-gray-700",
          text: "text-gray-800 dark:text-gray-200",
          icon: null,
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`
        flex items-start gap-3 p-4 mb-3 rounded-lg border
        ${styles.bg} ${styles.border} ${styles.text}
        shadow-lg
        animate-slide-in-right
        max-w-md w-full
      `}
      role="alert"
      aria-live="polite"
    >
      {/* 图标 */}
      {styles.icon && <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>}

      {/* 消息内容 */}
      <div className="flex-1 text-sm font-medium break-words">{message}</div>

      {/* 关闭按钮 */}
      <button
        type="button"
        onClick={() => onClose(id)}
        className={`
          flex-shrink-0 ml-auto -mx-1.5 -my-1.5
          rounded-lg p-1.5
          inline-flex items-center justify-center h-8 w-8
          hover:bg-black/10 dark:hover:bg-white/10
          focus:ring-2 focus:ring-offset-2 focus:ring-current
          transition-colors
        `}
        aria-label="关闭通知"
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
