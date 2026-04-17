import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../contexts/AuthContext";

/**
 * 注册页面
 *
 * 功能：
 * - 用户注册表单（用户名、邮箱、密码、确认密码）
 * - 表单验证（邮箱格式、密码匹配、必填项检查）
 * - 注册 API 调用（POST /api/auth/register）
 * - 注册成功后自动登录并跳转到控制台
 * - 显示错误提示（用户名已存在、邮箱已存在等）
 * - 响应式设计（支持桌面、平板、移动设备）
 */

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  // 表单状态
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // 验证错误状态
  const [errors, setErrors] = useState({});

  // 加载状态
  const [loading, setLoading] = useState(false);

  // 密码显示状态
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
   * 验证邮箱格式
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   */
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * 验证单个字段
   */
  const validateField = (name, value) => {
    let error = "";

    if (name === "username") {
      if (!value.trim()) {
        error = "请输入用户名";
      } else if (value.trim().length < 3) {
        error = "用户名至少需要 3 个字符";
      } else if (value.trim().length > 50) {
        error = "用户名不能超过 50 个字符";
      }
    } else if (name === "email") {
      if (!value.trim()) {
        error = "请输入邮箱地址";
      } else if (!isValidEmail(value.trim())) {
        error = "请输入有效的邮箱地址";
      }
    } else if (name === "password") {
      if (!value) {
        error = "请输入密码";
      } else if (value.length < 1 || value.length > 100) {
        error = "密码长度必须在 1-100 个字符之间";
      }
    } else if (name === "confirmPassword") {
      if (!value) {
        error = "请确认密码";
      } else if (formData.password !== value) {
        error = "两次输入的密码不一致";
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
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "用户名至少需要 3 个字符";
    } else if (formData.username.trim().length > 50) {
      newErrors.username = "用户名不能超过 50 个字符";
    }

    // 验证邮箱（必填 + 格式）
    if (!formData.email.trim()) {
      newErrors.email = "请输入邮箱地址";
    } else if (!isValidEmail(formData.email.trim())) {
      newErrors.email = "请输入有效的邮箱地址";
    }

    // 验证密码（必填 + 长度）
    if (!formData.password) {
      newErrors.password = "请输入密码";
    } else if (formData.password.length < 1 || formData.password.length > 100) {
      newErrors.password = "密码长度必须在 1-100 个字符之间";
    }

    // 验证确认密码（必填 + 匹配）
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "请确认密码";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "两次输入的密码不一致";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 标记所有字段为已触摸
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // 表单验证
    if (!validateForm()) {
      return;
    }

    // 设置加载状态
    setLoading(true);

    try {
      // 调用注册 API
      const response = await apiClient.post("/api/auth/register", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // 检查响应
      if (response.data.success && response.data.token) {
        // 注册成功，自动登录
        login(response.data.token, response.data.user);

        // 显示成功通知
        showSuccess("注册成功！");

        // 跳转到控制台
        navigate("/dashboard", { replace: true });
      } else {
        // 处理意外的响应格式
        showError(response.data.message || "注册失败，请重试");
      }
    } catch (error) {
      // 处理错误
      if (error.response) {
        // 服务器返回错误响应
        const message = error.response.data?.message || "注册失败";

        // 根据状态码和消息显示不同的错误
        if (error.response.status === 400) {
          // 验证错误或用户名/邮箱已存在
          showError(message);
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
        showError("注册失败，请重试");
      }

      console.error("Register error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6">
          注册
        </h2>

        {/* API 错误提示 - 移除，使用 Toast 通知 */}

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
            helpText="3-50 个字符"
          />

          {/* 邮箱输入框 */}
          <FormInput
            label="邮箱"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email ? errors.email : ""}
            placeholder="请输入邮箱地址"
            disabled={loading}
            required
            autoComplete="email"
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
            autoComplete="new-password"
            showPasswordToggle={true}
            onTogglePassword={() => setShowPassword(!showPassword)}
            showPassword={showPassword}
            helpText="1-100 个字符"
          />

          {/* 确认密码输入框 */}
          <FormInput
            label="确认密码"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.confirmPassword ? errors.confirmPassword : ""}
            placeholder="请再次输入密码"
            disabled={loading}
            required
            autoComplete="new-password"
            showPasswordToggle={true}
            onTogglePassword={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            showPassword={showConfirmPassword}
          />

          {/* 注册按钮 */}
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
                注册中...
              </span>
            ) : (
              "注册"
            )}
          </button>
        </form>

        {/* 登录链接 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            已有账号？{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
