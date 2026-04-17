/**
 * LoadingSpinner 组件
 *
 * 可复用的加载动画组件，支持多种尺寸和样式
 *
 * Props:
 * - size: 'sm' | 'md' | 'lg' - 加载动画大小（默认 'md'）
 * - text: string - 可选的加载文本
 * - className: string - 额外的 CSS 类名
 * - inline: boolean - 是否为内联模式（用于按钮内）
 * - fullScreen: boolean - 是否全屏显示
 */

const LoadingSpinner = ({
  size = "md",
  text = "",
  className = "",
  inline = false,
  fullScreen = false,
}) => {
  // 尺寸映射
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;

  // 内联模式（用于按钮内）
  if (inline) {
    return (
      <span className={`flex items-center justify-center ${className}`}>
        <svg
          className={`animate-spin -ml-1 mr-3 ${size === "sm" ? "h-4 w-4" : "h-5 w-5"} text-white`}
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
        {text}
      </span>
    );
  }

  // 全屏模式
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <div
            className={`inline-block animate-spin rounded-full ${spinnerSize} border-b-2 border-blue-600`}
          ></div>
          {text && <p className="mt-4 text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }

  // 标准模式（居中显示）
  return (
    <div className={`text-center ${className}`}>
      <div
        className={`inline-block animate-spin rounded-full ${spinnerSize} border-b-2 border-blue-600`}
      ></div>
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
