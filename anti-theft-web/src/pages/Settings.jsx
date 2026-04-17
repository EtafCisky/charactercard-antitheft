import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient, { updateBaseUrl } from "../api/client";
import LogoutButton from "../components/LogoutButton";
import { useAuth } from "../contexts/AuthContext";

/**
 * 设置页面组件
 *
 * 功能：
 * - 显示当前服务器地址
 * - 允许用户配置自定义服务器地址
 * - 提供服务器地址格式说明
 * - 实现地址格式验证
 * - 说明自托管服务器配置方法
 */

function Settings() {
  const { user } = useAuth();
  const [serverUrl, setServerUrl] = useState("");
  const [originalUrl, setOriginalUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 从 localStorage 或 apiClient 获取当前服务器地址
  useEffect(() => {
    const savedUrl = localStorage.getItem("custom_server_url");
    let currentUrl = savedUrl || apiClient.defaults.baseURL || "";

    // 如果为空，显示自动检测的地址
    if (!currentUrl || currentUrl === "") {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      currentUrl = `${protocol}//${hostname}:3000`;
    }

    setServerUrl(currentUrl);
    setOriginalUrl(currentUrl);
  }, []);

  /**
   * 验证服务器地址格式
   * @param {string} url - 要验证的 URL
   * @returns {boolean} - 是否有效
   */
  const validateServerUrl = (url) => {
    if (!url) {
      setError("服务器地址不能为空");
      return false;
    }

    // 验证 URL 格式
    try {
      const urlObj = new URL(url);

      // 只允许 http 和 https 协议
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        setError("服务器地址必须使用 http:// 或 https:// 协议");
        return false;
      }

      // 生产环境建议使用 HTTPS
      if (
        import.meta.env.PROD &&
        urlObj.protocol === "http:" &&
        !urlObj.hostname.includes("localhost") &&
        !urlObj.hostname.includes("127.0.0.1")
      ) {
        setError("生产环境建议使用 HTTPS 协议以确保安全");
        return false;
      }

      setError("");
      return true;
    } catch (e) {
      setError(
        "无效的服务器地址格式，请输入完整的 URL（如 https://api.example.com）",
      );
      return false;
    }
  };

  /**
   * 测试服务器连接
   * @param {string} url - 要测试的服务器地址
   * @returns {Promise<boolean>} - 连接是否成功
   */
  const testServerConnection = async (url) => {
    try {
      const response = await fetch(`${url}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (e) {
      return false;
    }
  };

  /**
   * 保存服务器地址
   */
  const handleSave = async () => {
    // 验证格式
    if (!validateServerUrl(serverUrl)) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // 测试服务器连接
      const isConnected = await testServerConnection(serverUrl);

      if (!isConnected) {
        setError("无法连接到服务器，请检查地址是否正确或服务器是否正常运行");
        setIsLoading(false);
        return;
      }

      // 保存到 localStorage
      localStorage.setItem("custom_server_url", serverUrl);

      // 更新 apiClient 的 baseURL
      updateBaseUrl(serverUrl);

      setOriginalUrl(serverUrl);
      setIsEditing(false);
      setSuccess("服务器地址已更新");

      // 3 秒后清除成功消息
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(`保存失败：${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 取消编辑
   */
  const handleCancel = () => {
    setServerUrl(originalUrl);
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  /**
   * 重置为默认地址
   */
  const handleReset = () => {
    const defaultUrl = import.meta.env.VITE_API_BASE_URL || "";
    setServerUrl(defaultUrl);
    localStorage.removeItem("custom_server_url");
    updateBaseUrl(defaultUrl);
    setOriginalUrl(defaultUrl);
    setIsEditing(false);
    setSuccess("已重置为默认服务器地址");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="text-blue-600 hover:text-blue-700"
              >
                ← 返回控制台
              </Link>
              <h1 className="text-xl font-bold text-gray-800">系统设置</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.username || "用户"}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页面标题 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">服务器配置</h2>
            <p className="mt-2 text-sm text-gray-600">
              配置 API 服务器地址和连接设置
            </p>
          </div>

          {/* 服务器地址配置 */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              服务器地址配置
            </h2>

            {/* 当前服务器地址显示 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                当前服务器地址
              </label>
              {!isEditing ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <code className="text-sm text-gray-800">
                    {serverUrl || "未配置（使用默认地址）"}
                  </code>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    修改
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="https://api.example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "测试连接中..." : "保存"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      重置为默认
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* 成功提示 */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* 服务器地址格式说明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                服务器地址格式说明
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>必须包含完整的协议（http:// 或 https://）</li>
                <li>必须包含域名或 IP 地址</li>
                <li>可以包含端口号（如 :3000）</li>
                <li>不要在末尾添加斜杠（/）</li>
                <li>生产环境建议使用 HTTPS 协议</li>
              </ul>
              <div className="mt-3">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  有效格式示例：
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    <code className="bg-white px-2 py-1 rounded">
                      https://api.example.com
                    </code>
                  </li>
                  <li>
                    <code className="bg-white px-2 py-1 rounded">
                      http://localhost:3000
                    </code>
                  </li>
                  <li>
                    <code className="bg-white px-2 py-1 rounded">
                      https://154.9.228.252:3000
                    </code>
                  </li>
                </ul>
              </div>
            </div>

            {/* 自托管服务器配置说明 */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                自托管服务器配置方法
              </h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  如果您想使用自己的服务器而不是官方服务器，请按照以下步骤操作：
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    在您的服务器上部署角色卡防盗系统后端
                    <ul className="list-disc list-inside ml-6 mt-1 text-gray-600">
                      <li>使用 Docker 一键部署（推荐）</li>
                      <li>或使用 Windows 原生部署</li>
                      <li>详见部署文档</li>
                    </ul>
                  </li>
                  <li>
                    确保服务器可以从外网访问
                    <ul className="list-disc list-inside ml-6 mt-1 text-gray-600">
                      <li>配置防火墙规则</li>
                      <li>配置域名解析（推荐）</li>
                      <li>配置 SSL 证书（生产环境必需）</li>
                    </ul>
                  </li>
                  <li>
                    在此页面输入您的服务器地址并保存
                    <ul className="list-disc list-inside ml-6 mt-1 text-gray-600">
                      <li>系统会自动测试连接</li>
                      <li>连接成功后即可使用</li>
                    </ul>
                  </li>
                  <li>
                    使用自托管服务器加密的角色卡
                    <ul className="list-disc list-inside ml-6 mt-1 text-gray-600">
                      <li>嵌入脚本会自动使用您配置的服务器地址</li>
                      <li>用户验证时会连接到您的服务器</li>
                    </ul>
                  </li>
                </ol>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>注意：</strong>
                    更改服务器地址后，新加密的角色卡将使用新的服务器地址。已加密的角色卡仍然使用原来的服务器地址。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
