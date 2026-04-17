import PropTypes from "prop-types";
import { useState } from "react";
import apiClient from "../api/client";

/**
 * 更新密码模态框组件
 *
 * 功能：
 * - 密码更新表单（新密码、确认密码）
 * - 表单验证（密码匹配、长度要求）
 * - 更新密码 API 调用
 * - 显示新的密码版本号
 * - 提示用户所有已解锁实例将重新锁定
 */

const UpdatePasswordModal = ({ isOpen, onClose, onSuccess, card }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [generatingPassword, setGeneratingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 重置状态
  const resetState = () => {
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
    setError(null);
    setSuccess(null);
    setGeneratingPassword(false);
    setShowPassword(false);
    setCopySuccess(false);
  };

  // 处理关闭
  const handleClose = () => {
    resetState();
    onClose();
  };

  // 生成随机密码
  const handleGeneratePassword = async () => {
    setGeneratingPassword(true);
    setError(null);

    try {
      const response = await apiClient.post(
        `/api/cards/${card.id}/password/random`,
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "生成随机密码失败");
      }

      // 设置生成的密码到两个输入框
      const generatedPassword = response.data.password;
      setNewPassword(generatedPassword);
      setConfirmPassword(generatedPassword);
      setShowPassword(true); // 自动显示密码以便用户查看
    } catch (err) {
      console.error("生成随机密码失败:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "生成随机密码失败，请重试",
      );
    } finally {
      setGeneratingPassword(false);
    }
  };

  // 复制密码到剪贴板
  const handleCopyPassword = async () => {
    if (!newPassword) return;

    try {
      await navigator.clipboard.writeText(newPassword);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
      setError("复制到剪贴板失败");
    }
  };

  // 计算密码强度
  const calculatePasswordStrength = (password) => {
    if (!password) return { level: "无", color: "gray", width: "0%" };

    let strength = 0;
    // 长度
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (password.length >= 16) strength += 1;
    // 包含小写字母
    if (/[a-z]/.test(password)) strength += 1;
    // 包含大写字母
    if (/[A-Z]/.test(password)) strength += 1;
    // 包含数字
    if (/[0-9]/.test(password)) strength += 1;
    // 包含特殊字符
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    if (strength <= 2)
      return { level: "弱", color: "red", width: "33%", bgColor: "bg-red-500" };
    if (strength <= 4)
      return {
        level: "中",
        color: "yellow",
        width: "66%",
        bgColor: "bg-yellow-500",
      };
    return {
      level: "强",
      color: "green",
      width: "100%",
      bgColor: "bg-green-500",
    };
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  // 处理密码更新
  const handleUpdatePassword = async () => {
    // 验证输入
    if (!newPassword) {
      setError("请输入新密码");
      return;
    }

    if (newPassword.length < 1 || newPassword.length > 100) {
      setError("密码长度必须在 1-100 字符之间");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 调用更新密码 API
      const response = await apiClient.put(`/api/cards/${card.id}/password`, {
        new_password: newPassword,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "密码更新失败");
      }

      // 显示成功消息
      setSuccess({
        message: response.data.message || "密码更新成功",
        password_version: response.data.password_version,
      });

      // 通知父组件刷新列表
      if (onSuccess) {
        onSuccess();
      }

      // 2秒后自动关闭
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error("更新密码失败:", err);
      setError(
        err.response?.data?.message || err.message || "更新密码失败，请重试",
      );
    } finally {
      setLoading(false);
    }
  };

  // 处理 Enter 键提交
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleUpdatePassword();
    }
  };

  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">更新密码</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg
              className="w-6 h-6"
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

        {/* 内容 */}
        <div className="px-6 py-4">
          {/* 角色卡信息 */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                角色卡名称:
              </span>
              <span className="text-sm text-gray-900">{card.card_name}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Card ID:
              </span>
              <span className="text-sm font-mono font-semibold text-blue-600">
                {card.card_id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                当前密码版本:
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                v{card.password_version}
              </span>
            </div>
          </div>

          {/* 警告提示 */}
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>⚠ 重要提示</strong>
              <br />
              更新密码后，所有已解锁的角色卡实例将重新锁定。
              <br />
              用户需要使用新密码重新验证才能继续使用。
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* 成功提示 */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                <strong>✓ {success.message}</strong>
                <br />
                新密码版本: v{success.password_version}
              </p>
            </div>
          )}

          {/* 表单 */}
          {!success && (
            <>
              {/* 生成随机密码按钮 */}
              <div className="mb-4">
                <button
                  onClick={handleGeneratePassword}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={loading || generatingPassword}
                >
                  {generatingPassword ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      生成中...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                        />
                      </svg>
                      生成随机密码
                    </>
                  )}
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新密码 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入新密码"
                    disabled={loading}
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
                    {/* 显示/隐藏密码按钮 */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                      disabled={loading}
                      title={showPassword ? "隐藏密码" : "显示密码"}
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                    {/* 复制密码按钮 */}
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                      disabled={loading || !newPassword}
                      title="复制密码"
                    >
                      {copySuccess ? (
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">密码长度: 1-100 字符</p>
                  {/* 密码强度指示器 */}
                  {newPassword && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">强度:</span>
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.bgColor} transition-all duration-300`}
                          style={{ width: passwordStrength.width }}
                        ></div>
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          passwordStrength.color === "red"
                            ? "text-red-600"
                            : passwordStrength.color === "yellow"
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {passwordStrength.level}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  确认新密码 <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请再次输入新密码"
                  disabled={loading}
                />
              </div>
            </>
          )}
        </div>

        {/* 底部按钮 */}
        {!success && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
              disabled={loading}
            >
              取消
            </button>
            <button
              onClick={handleUpdatePassword}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? "更新中..." : "更新密码"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

UpdatePasswordModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  card: PropTypes.shape({
    id: PropTypes.number.isRequired,
    card_id: PropTypes.string.isRequired,
    card_name: PropTypes.string.isRequired,
    password_version: PropTypes.number.isRequired,
  }),
};

export default UpdatePasswordModal;
