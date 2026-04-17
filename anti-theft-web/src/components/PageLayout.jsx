import ResponsiveNav from "./ResponsiveNav";

/**
 * 页面布局组件
 *
 * 功能：
 * - 提供统一的页面布局结构
 * - 包含响应式导航栏
 * - 响应式内容容器
 * - 可选的返回按钮
 * - 可选的页面标题
 *
 * Props:
 * - title: 页面标题
 * - showBackButton: 是否显示返回按钮
 * - backTo: 返回链接地址
 * - backLabel: 返回按钮文本
 * - children: 页面内容
 * - maxWidth: 最大宽度 (sm, md, lg, xl, 2xl, full)
 */

import { Link } from "react-router-dom";

const PageLayout = ({
  title,
  showBackButton = false,
  backTo = "/dashboard",
  backLabel = "返回",
  children,
  maxWidth = "full",
}) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "",
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ResponsiveNav title={title} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* 返回按钮和标题 */}
        {(showBackButton || title) && (
          <div className="mb-4 sm:mb-6">
            {showBackButton && (
              <Link
                to={backTo}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-3 tap-target"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {backLabel}
              </Link>
            )}
            {title && (
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                {title}
              </h1>
            )}
          </div>
        )}

        {/* 内容区域 */}
        <div
          className={`${maxWidthClasses[maxWidth]} ${maxWidth !== "full" ? "mx-auto" : ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
