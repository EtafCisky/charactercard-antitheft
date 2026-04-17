import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * 登出按钮组件
 *
 * 功能：
 * - 显示登出按钮
 * - 调用 AuthContext 的 logout 函数
 * - 清除 localStorage 中的 token 和用户信息
 * - 跳转到登录页
 *
 * 使用示例：
 * <LogoutButton />
 * <LogoutButton className="custom-class" />
 */

const LogoutButton = ({ className = "" }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  /**
   * 处理登出操作
   */
  const handleLogout = () => {
    // 调用 AuthContext 的 logout 函数
    // 这会清除 localStorage 中的 auth_token 和 user_info
    logout();

    // 跳转到登录页
    navigate("/login", { replace: true });
  };

  return (
    <button
      onClick={handleLogout}
      className={
        className ||
        "px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
      }
    >
      登出
    </button>
  );
};

export default LogoutButton;
