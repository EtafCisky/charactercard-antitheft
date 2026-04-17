import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * 受保护路由组件
 *
 * 功能：
 * - 检查用户是否已认证
 * - 未认证用户重定向到登录页
 * - 保存当前路径，登录后可以返回
 * - 显示加载状态
 */

/**
 * ProtectedRoute 组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 需要保护的子组件
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 如果正在加载认证状态，显示加载指示器
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    // 保存当前路径，登录后可以返回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已认证，渲染子组件
  return children;
};

export default ProtectedRoute;
