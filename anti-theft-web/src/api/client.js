import axios from "axios";

/**
 * API 客户端配置
 *
 * 功能：
 * - 配置 axios 实例（baseURL, timeout）
 * - 请求拦截器：自动添加 JWT token
 * - 响应拦截器：处理 401 错误并重定向到登录页
 */

/**
 * 获取 API 服务器地址
 *
 * 优先级：
 * 1. localStorage 中的自定义地址（用户在设置页面配置）
 * 2. 环境变量 VITE_API_BASE_URL
 * 3. 自动检测：使用当前访问的域名/IP + 端口 3000
 *
 * 自动检测逻辑：
 * - 如果访问 http://192.168.1.100，则 API 地址为 http://192.168.1.100:3000
 * - 如果访问 https://yourdomain.com，则 API 地址为 https://yourdomain.com:3000
 * - 如果访问 http://localhost:5173，则 API 地址为 http://localhost:3000
 */
function getDefaultBaseURL() {
  // 1. 检查 localStorage 中的自定义地址
  const customUrl = localStorage.getItem("custom_server_url");
  if (customUrl) {
    return customUrl;
  }

  // 2. 检查环境变量
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }

  // 3. 自动检测：使用当前访问的域名/IP + 端口 3000
  const protocol = window.location.protocol; // http: 或 https:
  const hostname = window.location.hostname; // 域名或 IP

  // 如果是开发环境的 Vite 端口（5173），使用 3000 端口
  // 如果是生产环境，也使用 3000 端口
  return `${protocol}//${hostname}:3000`;
}

const DEFAULT_BASE_URL = getDefaultBaseURL();

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 10000, // 10 秒超时
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 请求拦截器
 * 自动从 localStorage 读取 JWT token 并添加到请求头
 */
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem("auth_token");

    // 如果 token 存在，添加到 Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // 请求错误处理
    return Promise.reject(error);
  },
);

/**
 * 响应拦截器
 * 处理 401 错误：清除 token 并重定向到登录页
 */
apiClient.interceptors.response.use(
  (response) => {
    // 成功响应直接返回
    return response;
  },
  (error) => {
    // 检查是否是 401 未授权错误
    if (error.response && error.response.status === 401) {
      // 清除本地存储的 token
      localStorage.removeItem("auth_token");

      // 重定向到登录页
      // 使用 window.location 而不是 router，因为这是在 axios 拦截器中
      // 保存当前路径，登录后可以返回
      const currentPath = window.location.pathname;
      if (currentPath !== "/login") {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    // 返回错误，让调用者可以进一步处理
    return Promise.reject(error);
  },
);

/**
 * 导出配置好的 axios 实例
 */
export default apiClient;

/**
 * 辅助函数：更新 baseURL（用于自托管服务器）
 * @param {string} newBaseUrl - 新的服务器地址
 */
export const updateBaseUrl = (newBaseUrl) => {
  apiClient.defaults.baseURL = newBaseUrl;
};

/**
 * 辅助函数：设置认证 token
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
};

/**
 * 辅助函数：获取当前 token
 * @returns {string|null} - 当前存储的 token
 */
export const getAuthToken = () => {
  return localStorage.getItem("auth_token");
};

/**
 * 辅助函数：清除认证信息
 */
export const clearAuth = () => {
  localStorage.removeItem("auth_token");
};
