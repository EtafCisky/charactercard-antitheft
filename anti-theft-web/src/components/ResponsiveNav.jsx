import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LogoutButton from "./LogoutButton";

/**
 * 响应式导航栏组件
 *
 * 功能：
 * - 桌面端：水平导航栏
 * - 平板端：紧凑型水平导航栏
 * - 移动端：汉堡菜单 + 侧边栏
 * - 自动高亮当前页面
 * - 用户信息显示
 * - 登出功能
 */

const ResponsiveNav = ({ title = "角色卡防盗管理系统" }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: "/dashboard", label: "控制台", icon: "🏠" },
    { path: "/cards", label: "角色卡", icon: "📋" },
    { path: "/guide", label: "指南", icon: "📖" },
    { path: "/faq", label: "FAQ", icon: "❓" },
    { path: "/settings", label: "设置", icon: "⚙️" },
  ];

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo/Title - Desktop & Tablet */}
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="text-lg sm:text-xl font-bold text-gray-800 truncate max-w-[200px] sm:max-w-none"
              >
                {title}
              </Link>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* User Info & Logout - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600 truncate max-w-[150px]">
                {user?.username || "用户"}
              </span>
              <LogoutButton />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 tap-target"
              aria-label="打开菜单"
            >
              {mobileMenuOpen ? (
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
              ) : (
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Tablet Navigation - Hidden on mobile and desktop */}
          <div className="hidden md:flex lg:hidden border-t border-gray-200 py-2 space-x-4 overflow-x-auto scrollbar-hide">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive(link.path)
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeMobileMenu}
          />

          {/* Sidebar */}
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-800 truncate">
                  {user?.username || "用户"}
                </span>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 tap-target"
                  aria-label="关闭菜单"
                >
                  <svg
                    className="h-5 w-5"
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
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto py-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-4 py-3 text-base font-medium transition-colors tap-target ${
                      isActive(link.path)
                        ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <LogoutButton className="w-full" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ResponsiveNav;
