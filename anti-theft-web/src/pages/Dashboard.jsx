import { Link } from "react-router-dom";
import ResponsiveNav from "../components/ResponsiveNav";

/**
 * 控制台/仪表板页面
 *
 * 功能：
 * - 显示用户信息
 * - 显示系统概览
 * - 快速导航到其他功能
 * - 登出功能
 * - 响应式设计（桌面、平板、移动端）
 *
 * 注意：此为占位组件,完整实现在后续任务中
 */

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* 响应式导航栏 */}
      <ResponsiveNav />

      {/* 主内容区 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 欢迎标题 - 响应式字体大小 */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
          快速开始
        </h2>

        {/* 功能卡片网格 - 响应式布局 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 角色卡管理卡片 */}
          <Link
            to="/cards"
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow tap-target"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                角色卡管理
              </h2>
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              查看和管理您的所有角色卡
            </p>
          </Link>

          {/* 加密角色卡卡片 */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 opacity-50 cursor-not-allowed">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                加密角色卡
              </h2>
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              上传并加密新的角色卡
            </p>
            <p className="text-xs text-gray-500 mt-2">（功能开发中）</p>
          </div>

          {/* 使用指南卡片 */}
          <Link
            to="/guide"
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow tap-target"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                使用指南
              </h2>
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              查看加密和使用教程
            </p>
          </Link>

          {/* FAQ 卡片 */}
          <Link
            to="/faq"
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow tap-target"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                常见问题
              </h2>
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              查看常见问题和故障排查
            </p>
          </Link>

          {/* 设置卡片 */}
          <Link
            to="/settings"
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow tap-target"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                系统设置
              </h2>
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              配置服务器地址和其他设置
            </p>
          </Link>
        </div>

        {/* 提示信息 - 响应式间距和字体 */}
        <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">快速开始</h3>
          <ol className="text-xs sm:text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>点击"角色卡管理"查看您的角色卡列表</li>
            <li>创建新的角色卡记录并设置密码</li>
            <li>将 Card ID 和服务器地址添加到您的角色卡中</li>
            <li>分享加密后的角色卡给用户</li>
          </ol>
        </div>

        {/* 开发提示 - 响应式间距和字体 */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs sm:text-sm text-yellow-800">
            <strong>注意：</strong>{" "}
            此页面为占位组件，部分功能将在后续任务中实现。
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
