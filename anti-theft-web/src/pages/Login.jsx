import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

/**
 * 登录页面
 *
 * 功能：
 * - 用户登录表单（用户名、密码输入框）
 * - 表单验证（必填项检查）
 * - 登录 API 调用（POST /api/auth/login）
 * - 保存 JWT token 到 localStorage
 * - 登录成功后跳转到控制台
 * - 显示错误提示（用户名或密码错误）
 * - 响应式设计（支持桌面、平板、移动设备）
 */

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  // 表单状态
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // 验证错误状态
  const [errors, setErrors] = useState({});

  // 加载状态
  const [loading, setLoading] = useState(false);

  // 密码显示状态
  const [showPassword, setShowPassword] = useState(false);

  // 字段触摸状态（用于实时验证）
  const [touched, setTouched] = useState({});

  /**
   * 处理输入变化
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 实时验证（仅在字段已被触摸后）
    if (touched[name]) {
      validateField(name, value);
    }
  };

  /**
   * 处理输入失焦
   */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, value);
  };

  /**
   * 验证单个字段
   */
  const validateField = (name, value) => {
    let error = "";

    if (name === "username") {
      if (!value.trim()) {
        error = "请输入用户名";
      }
    } else if (name === "password") {
      if (!value) {
        error = "请输入密码";
      }
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    return !error;
  };

  /**
   * 表单验证
   * @returns {boolean} 验证是否通过
   */
  const validateForm = () => {
    const newErrors = {};

    // 验证用户名（必填）
    if (!formData.username.trim()) {
      newErrors.username = "请输入用户名";
    }

    // 验证密码（必填）
    if (!formData.password) {
      newErrors.password = "请输入密码";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 表单验证
    if (!validateForm()) {
      return;
    }

    // 设置加载状态
    setLoading(true);

    try {
      // 调用登录 API
      const response = await apiClient.post("/api/auth/login", {
        username: formData.username.trim(),
        password: formData.password,
      });

      // 检查响应
      if (response.data.success && response.data.token) {
        // 保存 token 和用户信息
        login(response.data.token, response.data.user);

        // 显示成功通知
        showSuccess("登录成功！");

        // 获取重定向路径（如果有）
        const from = location.state?.from?.pathname || "/dashboard";

        // 跳转到控制台或之前的页面
        navigate(from, { replace: true });
      } else {
        // 处理意外的响应格式
        showError(response.data.message || "登录失败，请重试");
      }
    } catch (error) {
      // 处理错误
      if (error.response) {
        // 服务器返回错误响应
        const message = error.response.data?.message || "登录失败";

        // 根据状态码显示不同的错误消息
        if (error.response.status === 401) {
          showError("用户名或密码错误");
        } else if (error.response.status === 429) {
          showError("请求过于频繁，请稍后再试");
        } else if (error.response.status >= 500) {
          showError("服务器错误，请稍后再试");
        } else {
          showError(message);
        }
      } else if (error.request) {
        // 请求已发送但没有收到响应
        showError("无法连接到服务器，请检查网络连接");
      } else {
        // 其他错误
        showError("登录失败，请重试");
      }

      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6">
          登录
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 用户名输入框 */}
          <FormInput
            label="用户名"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.username ? errors.username : ""}
            placeholder="请输入用户名"
            disabled={loading}
            required
            autoComplete="username"
          />

          {/* 密码输入框 */}
          <FormInput
            label="密码"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password ? errors.password : ""}
            placeholder="请输入密码"
            disabled={loading}
            required
            autoComplete="current-password"
            showPasswordToggle={true}
            onTogglePassword={() => setShowPassword(!showPassword)}
            showPassword={showPassword}
          />

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                登录中...
              </span>
            ) : (
              "登录"
            )}
          </button>
        </form>

        {/* 注册链接 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            还没有账号？{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
