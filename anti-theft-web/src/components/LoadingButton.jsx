/**
 * LoadingButton 组件
 *
 * 带加载状态的按钮组件
 *
 * Props:
 * - loading: boolean - 是否处于加载状态
 * - children: ReactNode - 按钮文本内容
 * - loadingText: string - 加载时显示的文本（可选）
 * - disabled: boolean - 是否禁用
 * - className: string - 额外的 CSS 类名
 * - type: 'button' | 'submit' | 'reset' - 按钮类型
 * - onClick: function - 点击事件处理函数
 * - ...rest: 其他 button 属性
 */

const LoadingButton = ({
  loading = false,
  children,
  loadingText,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...rest
}) => {
  const isDisabled = loading || disabled;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${className} ${isDisabled ? "cursor-not-allowed opacity-75" : ""}`}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {loadingText || children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
