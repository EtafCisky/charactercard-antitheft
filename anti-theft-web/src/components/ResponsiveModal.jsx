/**
 * 响应式模态框组件
 *
 * 功能：
 * - 桌面端：居中模态框
 * - 平板端：较大的模态框
 * - 移动端：全屏或接近全屏的模态框
 * - 支持滚动内容
 * - 可选的关闭按钮
 * - 背景遮罩
 *
 * Props:
 * - isOpen: 是否打开
 * - onClose: 关闭回调
 * - title: 标题
 * - children: 内容
 * - size: 尺寸 (sm, md, lg, xl, full)
 * - showCloseButton: 是否显示关闭按钮
 */

const ResponsiveModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div
        className={`bg-white w-full h-full sm:h-auto sm:rounded-lg shadow-xl ${sizeClasses[size]} sm:max-h-[90vh] flex flex-col`}
      >
        {/* 标题栏 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            {title && (
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 tap-target ml-auto"
                aria-label="关闭"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

export default ResponsiveModal;
