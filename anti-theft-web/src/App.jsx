import { lazy } from "react";
import {
    Navigate,
    Route,
    BrowserRouter as Router,
    Routes,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";

// 使用 React.lazy 进行代码分割
// 登录和注册页面立即加载（首屏需要）
import Login from "./pages/Login";
import Register from "./pages/Register";

// 其他页面按需加载
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CardList = lazy(() => import("./pages/CardList"));
const CardDetail = lazy(() => import("./pages/CardDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const Guide = lazy(() => import("./pages/Guide"));
// const FAQ = lazy(() => import("./pages/FAQ")); // Temporarily disabled due to syntax error

/**
 * 主应用组件
 *
 * 功能：
 * - 配置 React Router
 * - 提供认证上下文
 * - 定义所有路由
 * - 实现受保护路由
 *
 * 路由结构：
 * - /login - 登录页（公开）
 * - /register - 注册页（公开）
 * - /dashboard - 控制台（需要认证）
 * - /cards - 角色卡列表（需要认证）
 * - /cards/:id - 角色卡详情（需要认证）
 * - /settings - 设置页（需要认证）
 * - /guide - 使用指南（需要认证）
 * - /faq - 常见问题（需要认证）
 * - / - 重定向到 /dashboard
 */

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Routes>
              {/* 公开路由 */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* 受保护路由 */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cards"
                element={
                  <ProtectedRoute>
                    <CardList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cards/:id"
                element={
                  <ProtectedRoute>
                    <CardDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guide"
                element={
                  <ProtectedRoute>
                    <Guide />
                  </ProtectedRoute>
                }
              />
              {/* FAQ temporarily disabled due to syntax error
              <Route
                path="/faq"
                element={
                  <ProtectedRoute>
                    <FAQ />
                  </ProtectedRoute>
                }
              />
              */}

              {/* 默认路由：重定向到控制台 */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* 404 路由：重定向到控制台 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
