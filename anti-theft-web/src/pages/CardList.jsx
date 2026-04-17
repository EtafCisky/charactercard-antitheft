import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import EncryptCardModal from "../components/EncryptCardModal";
import ResponsiveNav from "../components/ResponsiveNav";
import UpdatePasswordModal from "../components/UpdatePasswordModal";
import { useAuth } from "../contexts/AuthContext";

/**
 * 角色卡列表页面
 *
 * 功能：
 * - 显示用户的所有角色卡
 * - 角色卡信息展示（Card ID、名称、密码版本、创建时间）
 * - 加载状态显示
 * - 空状态提示
 * - 快速操作（编辑、删除、更新密码）
 */

const CardList = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEncryptModalOpen, setIsEncryptModalOpen] = useState(false);
  const [isUpdatePasswordModalOpen, setIsUpdatePasswordModalOpen] =
    useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name } or null

  // 获取角色卡列表
  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/api/cards");

      if (response.data.success) {
        setCards(response.data.cards || []);
      } else {
        setError(response.data.message || "获取角色卡列表失败");
      }
    } catch (err) {
      console.error("获取角色卡列表失败:", err);
      setError(
        err.response?.data?.message || err.message || "网络错误，请稍后重试",
      );
    } finally {
      setLoading(false);
    }
  };

  // 处理加密成功
  const handleEncryptSuccess = () => {
    fetchCards(); // 刷新列表
  };

  // 处理更新密码按钮点击
  const handleUpdatePasswordClick = (card) => {
    setSelectedCard(card);
    setIsUpdatePasswordModalOpen(true);
  };

  // 处理更新密码成功
  const handleUpdatePasswordSuccess = () => {
    fetchCards(); // 刷新列表
  };

  // 处理删除按钮点击
  const handleDeleteClick = (card) => {
    setDeleteConfirm({ id: card.id, name: card.card_name });
  };

  // 取消删除
  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  // 确认删除
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await apiClient.delete(`/api/cards/${deleteConfirm.id}`);

      if (response.data.success) {
        // 删除成功，刷新列表
        setDeleteConfirm(null);
        fetchCards();
      } else {
        setError(response.data.message || "删除失败");
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error("删除角色卡失败:", err);
      setError(
        err.response?.data?.message || err.message || "删除失败，请稍后重试",
      );
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 响应式导航栏 */}
      <ResponsiveNav title="角色卡管理" />

      {/* 主内容区 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* 操作栏 */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            我的角色卡
          </h2>
          <button
            onClick={() => setIsEncryptModalOpen(true)}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-sm font-medium tap-target"
          >
            + 加密角色卡
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 sm:mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>错误：</strong> {error}
            </p>
            <button
              onClick={fetchCards}
              className="mt-2 text-sm text-red-600 hover:text-red-700 underline tap-target"
            >
              重试
            </button>
          </div>
        )}

        {/* 加载状态 */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : cards.length === 0 ? (
          /* 空状态提示 */
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              还没有角色卡
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              点击上方按钮创建您的第一个角色卡记录
            </p>
          </div>
        ) : (
          <>
            {/* 桌面端和平板端：表格布局 */}
            <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Card ID
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        角色卡名称
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        密码版本
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        创建时间
                      </th>
                      <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cards.map((card) => (
                      <tr key={card.id} className="hover:bg-gray-50">
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-semibold text-blue-600">
                            {card.card_id}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {card.card_name}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            v{card.password_version}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(card.created_at).toLocaleDateString(
                            "zh-CN",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            },
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/cards/${card.id}`}
                              className="text-blue-600 hover:text-blue-900 tap-target flex items-center"
                            >
                              编辑
                            </Link>
                            <button
                              onClick={() => handleUpdatePasswordClick(card)}
                              className="text-green-600 hover:text-green-900 tap-target min-h-[44px]"
                            >
                              更新密码
                            </button>
                            <button
                              onClick={() => handleDeleteClick(card)}
                              className="text-red-600 hover:text-red-900 tap-target min-h-[44px]"
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 移动端：卡片布局 */}
            <div className="md:hidden space-y-4">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-lg shadow-md p-4 space-y-3"
                >
                  {/* Card ID - 突出显示 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase font-medium">
                      Card ID
                    </span>
                    <span className="text-base font-mono font-bold text-blue-600">
                      {card.card_id}
                    </span>
                  </div>

                  {/* 角色卡名称 */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="text-xs text-gray-500 uppercase font-medium mb-1">
                      角色卡名称
                    </div>
                    <div className="text-base font-medium text-gray-900">
                      {card.card_name}
                    </div>
                  </div>

                  {/* 密码版本和创建时间 */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-medium mb-1">
                        密码版本
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        v{card.password_version}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase font-medium mb-1">
                        创建时间
                      </div>
                      <div className="text-sm text-gray-700">
                        {new Date(card.created_at).toLocaleDateString("zh-CN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                    <Link
                      to={`/cards/${card.id}`}
                      className="w-full px-4 py-3 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium tap-target"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleUpdatePasswordClick(card)}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium tap-target"
                    >
                      更新密码
                    </button>
                    <button
                      onClick={() => handleDeleteClick(card)}
                      className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium tap-target"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 删除确认对话框 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">确认删除</h3>
            <p className="text-sm text-gray-600 mb-6">
              确定要删除角色卡 <strong>{deleteConfirm.name}</strong> 吗？
              <br />
              此操作无法撤销。
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 tap-target"
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 tap-target"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 加密角色卡模态框 */}
      <EncryptCardModal
        isOpen={isEncryptModalOpen}
        onClose={() => setIsEncryptModalOpen(false)}
        onSuccess={handleEncryptSuccess}
      />

      {/* 更新密码模态框 */}
      <UpdatePasswordModal
        isOpen={isUpdatePasswordModalOpen}
        onClose={() => {
          setIsUpdatePasswordModalOpen(false);
          setSelectedCard(null);
        }}
        onSuccess={handleUpdatePasswordSuccess}
        card={selectedCard}
      />
    </div>
  );
};

export default CardList;
