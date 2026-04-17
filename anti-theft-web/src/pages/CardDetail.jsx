import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiClient from "../api/client";
import LogoutButton from "../components/LogoutButton";
import { useAuth } from "../contexts/AuthContext";

/**
 * 角色卡详情页面
 *
 * 功能：
 * - 显示角色卡完整信息（Card ID、名称、密码版本、创建时间、更新时间）
 * - 支持编辑角色卡名称
 * - 调用 PUT /api/cards/:id API 更新名称
 * - 显示更新成功提示
 */

const CardDetail = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState("");
  const [touched, setTouched] = useState(false);

  // 获取角色卡详情
  useEffect(() => {
    fetchCardDetail();
  }, [id]);

  const fetchCardDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/cards/${id}`);

      if (response.data.success) {
        setCard(response.data.card);
        setEditedName(response.data.card.card_name);
      } else {
        setError(response.data.message || "获取角色卡详情失败");
      }
    } catch (err) {
      console.error("获取角色卡详情失败:", err);
      setError(
        err.response?.data?.message || err.message || "网络错误，请稍后重试",
      );
    } finally {
      setLoading(false);
    }
  };

  // 开始编辑
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedName(card.card_name);
    setEditError("");
    setTouched(false);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName(card.card_name);
    setEditError("");
    setTouched(false);
  };

  // 处理名称变化
  const handleNameChange = (e) => {
    setEditedName(e.target.value);
    if (touched) {
      validateName(e.target.value);
    }
  };

  // 处理失焦
  const handleNameBlur = (e) => {
    setTouched(true);
    validateName(e.target.value);
  };

  // 验证名称
  const validateName = (name) => {
    if (!name.trim()) {
      setEditError("角色卡名称不能为空");
      return false;
    }
    setEditError("");
    return true;
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    setTouched(true);
    if (!validateName(editedName)) {
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      const response = await apiClient.put(`/api/cards/${id}`, {
        card_name: editedName.trim(),
      });

      if (response.data.success) {
        setCard({ ...card, card_name: editedName.trim() });
        setIsEditing(false);
        setTouched(false);
        showSuccess("角色卡名称更新成功！");
      } else {
        showError(response.data.message || "更新角色卡名称失败");
      }
    } catch (err) {
      console.error("更新角色卡名称失败:", err);
      showError(
        err.response?.data?.message || err.message || "网络错误，请稍后重试",
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/cards" className="text-blue-600 hover:text-blue-700">
                ← 返回角色卡列表
              </Link>
              <h1 className="text-xl font-bold text-gray-800">角色卡详情</h1>
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
      <div className="container mx-auto px-4 py-8">
        {/* 成功提示 - 移除，使用 Toast 通知 */}

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>错误：</strong> {error}
            </p>
            <button
              onClick={fetchCardDetail}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
            >
              重试
            </button>
          </div>
        )}

        {/* 加载状态 */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : card ? (
          /* 角色卡详情 */
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              角色卡信息
            </h2>

            <div className="space-y-6">
              {/* Card ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card ID
                </label>
                <div className="text-lg font-mono font-semibold text-blue-600">
                  {card.card_id}
                </div>
              </div>

              {/* 角色卡名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  角色卡名称
                </label>
                {isEditing ? (
                  <div className="flex items-start space-x-2">
                    <div className="flex-1">
                      <FormInput
                        name="cardName"
                        type="text"
                        value={editedName}
                        onChange={handleNameChange}
                        onBlur={handleNameBlur}
                        error={touched ? editError : ""}
                        placeholder="请输入角色卡名称"
                        disabled={updating}
                      />
                    </div>
                    <button
                      onClick={handleSaveEdit}
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 whitespace-nowrap"
                    >
                      {updating ? "保存中..." : "保存"}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={updating}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-200 whitespace-nowrap"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="text-lg text-gray-900">
                      {card.card_name}
                    </div>
                    <button
                      onClick={handleStartEdit}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      编辑
                    </button>
                  </div>
                )}
              </div>

              {/* 密码版本 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码版本
                </label>
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    v{card.password_version}
                  </span>
                </div>
              </div>

              {/* 创建时间 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  创建时间
                </label>
                <div className="text-gray-900">
                  {new Date(card.created_at).toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>

              {/* 更新时间 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  更新时间
                </label>
                <div className="text-gray-900">
                  {new Date(card.updated_at).toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 未找到角色卡 */
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              未找到角色卡
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              该角色卡可能已被删除或不存在
            </p>
            <button
              onClick={() => navigate("/cards")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              返回角色卡列表
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardDetail;
