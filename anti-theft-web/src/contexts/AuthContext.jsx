import React, { createContext, useContext, useEffect, useState } from "react";
import { clearAuth, getAuthToken, setAuthToken } from "../api/client";

/**
 * 认证上下文
 *
 * 功能：
 * - 管理用户认证状态
 * - 提供登录、登出功能
 * - 从 localStorage 恢复认证状态
 * - 提供用户信息存储
 */

const AuthContext = createContext(null);

/**
 * 自定义 Hook：使用认证上下文
 * @returns {Object} 认证上下文对象
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * 认证提供者组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 */
export const AuthProvider = ({ children }) => {
  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 用户信息
  const [user, setUser] = useState(null);

  // 加载状态（用于初始化时从 localStorage 恢复状态）
  const [loading, setLoading] = useState(true);

  /**
   * 初始化：从 localStorage 恢复认证状态
   */
  useEffect(() => {
    const initAuth = () => {
      const token = getAuthToken();
      const storedUser = localStorage.getItem("user_info");

      if (token && storedUser) {
        try {
          const userInfo = JSON.parse(storedUser);
          setIsAuthenticated(true);
          setUser(userInfo);
        } catch (error) {
          console.error("Failed to parse user info:", error);
          // 如果解析失败，清除无效数据
          clearAuth();
          localStorage.removeItem("user_info");
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * 登录函数
   * @param {string} token - JWT token
   * @param {Object} userInfo - 用户信息对象
   */
  const login = (token, userInfo) => {
    // 保存 token 到 localStorage
    setAuthToken(token);

    // 保存用户信息到 localStorage
    localStorage.setItem("user_info", JSON.stringify(userInfo));

    // 更新状态
    setIsAuthenticated(true);
    setUser(userInfo);
  };

  /**
   * 登出函数
   */
  const logout = () => {
    // 清除 token
    clearAuth();

    // 清除用户信息
    localStorage.removeItem("user_info");

    // 更新状态
    setIsAuthenticated(false);
    setUser(null);
  };

  /**
   * 更新用户信息
   * @param {Object} updatedUserInfo - 更新后的用户信息
   */
  const updateUser = (updatedUserInfo) => {
    const newUserInfo = { ...user, ...updatedUserInfo };
    localStorage.setItem("user_info", JSON.stringify(newUserInfo));
    setUser(newUserInfo);
  };

  // 上下文值
  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
