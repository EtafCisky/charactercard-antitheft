/**
 * API Client 使用示例
 *
 * 这个文件展示了如何在实际应用中使用 API 客户端
 * 注意：这是示例代码，不会在生产环境中使用
 */

import apiClient, { clearAuth, setAuthToken, updateBaseUrl } from "./client";

// ============================================
// 示例 1: 用户认证
// ============================================

/**
 * 用户注册
 */
export async function registerUser(username, email, password) {
  try {
    const response = await apiClient.post("/api/auth/register", {
      username,
      email,
      password,
    });

    if (response.data.success) {
      // 注册成功，保存 token
      setAuthToken(response.data.token);
      return { success: true, user: response.data.user };
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "注册失败",
    };
  }
}

/**
 * 用户登录
 */
export async function loginUser(username, password) {
  try {
    const response = await apiClient.post("/api/auth/login", {
      username,
      password,
    });

    if (response.data.success) {
      // 登录成功，保存 token
      setAuthToken(response.data.token);
      return { success: true, user: response.data.user };
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "登录失败",
    };
  }
}

/**
 * 用户登出
 */
export function logoutUser() {
  clearAuth();
  window.location.href = "/login";
}

// ============================================
// 示例 2: 角色卡管理
// ============================================

/**
 * 获取角色卡列表
 */
export async function getCardList() {
  try {
    const response = await apiClient.get("/api/cards");
    return {
      success: true,
      cards: response.data.cards,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "获取列表失败",
    };
  }
}

/**
 * 创建角色卡
 */
export async function createCard(cardName, password) {
  try {
    const response = await apiClient.post("/api/cards", {
      card_name: cardName,
      password,
    });

    return {
      success: true,
      cardId: response.data.card_id,
      passwordVersion: response.data.password_version,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "创建失败",
    };
  }
}

/**
 * 更新角色卡名称
 */
export async function updateCardName(cardId, newName) {
  try {
    const response = await apiClient.put(`/api/cards/${cardId}`, {
      card_name: newName,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "更新失败",
    };
  }
}

/**
 * 删除角色卡
 */
export async function deleteCard(cardId) {
  try {
    await apiClient.delete(`/api/cards/${cardId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "删除失败",
    };
  }
}

// ============================================
// 示例 3: 密码管理
// ============================================

/**
 * 更新角色卡密码
 */
export async function updateCardPassword(cardId, newPassword) {
  try {
    const response = await apiClient.put(`/api/cards/${cardId}/password`, {
      new_password: newPassword,
    });

    return {
      success: true,
      passwordVersion: response.data.password_version,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "密码更新失败",
    };
  }
}

/**
 * 生成随机密码
 */
export async function generateRandomPassword(cardId) {
  try {
    const response = await apiClient.post(
      `/api/cards/${cardId}/password/random`,
    );

    return {
      success: true,
      password: response.data.password,
      passwordVersion: response.data.password_version,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "生成失败",
    };
  }
}

// ============================================
// 示例 4: 公开验证 API（无需认证）
// ============================================

/**
 * 验证角色卡密码
 */
export async function verifyCardPassword(cardId, password) {
  try {
    const response = await apiClient.post("/api/verify", {
      card_id: cardId,
      password,
    });

    return {
      success: response.data.success,
      passwordVersion: response.data.password_version,
    };
  } catch (error) {
    if (error.response?.status === 429) {
      return {
        success: false,
        message: "请求过于频繁，请稍后再试",
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || "验证失败",
    };
  }
}

/**
 * 获取密码版本号
 */
export async function getPasswordVersion(cardId) {
  try {
    const response = await apiClient.get(`/api/cards/${cardId}/version`);
    return {
      success: true,
      passwordVersion: response.data.password_version,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "获取版本失败",
    };
  }
}

// ============================================
// 示例 5: 自托管服务器配置
// ============================================

/**
 * 切换到自托管服务器
 */
export function switchToCustomServer(serverUrl) {
  // 验证 URL 格式
  try {
    new URL(serverUrl);
    updateBaseUrl(serverUrl);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: "无效的服务器地址",
    };
  }
}

// ============================================
// 示例 6: 错误处理最佳实践
// ============================================

/**
 * 带完整错误处理的 API 调用示例
 */
export async function apiCallWithErrorHandling() {
  try {
    const response = await apiClient.get("/api/cards");

    // 成功处理
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    // 错误分类处理
    if (error.response) {
      // 服务器返回错误响应
      const status = error.response.status;
      const message = error.response.data?.message;

      switch (status) {
        case 400:
          return { success: false, message: `输入错误: ${message}` };
        case 401:
          // 401 会被拦截器自动处理，这里不会执行到
          return { success: false, message: "未授权" };
        case 403:
          return { success: false, message: "权限不足" };
        case 404:
          return { success: false, message: "资源不存在" };
        case 429:
          return { success: false, message: "请求过于频繁" };
        case 500:
          return { success: false, message: "服务器错误" };
        default:
          return { success: false, message: message || "请求失败" };
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应（网络错误）
      return {
        success: false,
        message: "网络连接失败，请检查网络设置",
      };
    } else {
      // 其他错误（请求配置错误等）
      return {
        success: false,
        message: `请求错误: ${error.message}`,
      };
    }
  }
}
