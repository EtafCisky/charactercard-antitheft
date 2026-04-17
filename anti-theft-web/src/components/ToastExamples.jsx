import { useToast } from "../contexts/ToastContext";

/**
 * Toast 通知示例组件
 *
 * 此组件展示了如何使用 Toast 通知系统
 * 仅用于开发和测试目的
 */

const ToastExamples = () => {
  const { showSuccess, showError, showWarning, clearAll } = useToast();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Toast 通知示例
      </h2>

      <div className="space-y-4">
        {/* 成功通知 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            成功通知
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => showSuccess("操作成功！")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              默认成功 (3秒)
            </button>
            <button
              onClick={() => showSuccess("这条消息会停留更久", 5000)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              长时间成功 (5秒)
            </button>
            <button
              onClick={() => showSuccess("需要手动关闭", 0)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              不自动消失
            </button>
          </div>
        </div>

        {/* 错误通知 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            错误通知
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => showError("操作失败，请重试")}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              默认错误 (5秒)
            </button>
            <button
              onClick={() => showError("网络连接失败", 7000)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              长时间错误 (7秒)
            </button>
            <button
              onClick={() =>
                showError("严重错误：数据库连接失败，请联系管理员", 0)
              }
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              严重错误
            </button>
          </div>
        </div>

        {/* 警告通知 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            警告通知
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => showWarning("请注意：此操作不可撤销")}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              默认警告 (4秒)
            </button>
            <button
              onClick={() => showWarning("密码即将过期", 6000)}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              长时间警告 (6秒)
            </button>
            <button
              onClick={() => showWarning("重要提示：请备份数据", 0)}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              重要警告
            </button>
          </div>
        </div>

        {/* 多个通知 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            多个通知
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                showSuccess("第一条消息");
                setTimeout(() => showWarning("第二条消息"), 500);
                setTimeout(() => showError("第三条消息"), 1000);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              显示多条通知
            </button>
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              清除所有通知
            </button>
          </div>
        </div>

        {/* 实际场景示例 */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            实际场景示例
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => showSuccess("角色卡创建成功")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              创建成功
            </button>
            <button
              onClick={() => showSuccess("密码更新成功")}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              更新成功
            </button>
            <button
              onClick={() => showError("密码验证失败")}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              验证失败
            </button>
            <button
              onClick={() => showWarning("已达到最大创建数量")}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              达到限制
            </button>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
          使用说明
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• 通知会从右侧滑入</li>
          <li>• 可以点击 X 按钮手动关闭</li>
          <li>• 默认会自动消失（可配置时间）</li>
          <li>• 支持同时显示多个通知</li>
          <li>• 响应式设计，适配移动端</li>
        </ul>
      </div>
    </div>
  );
};

export default ToastExamples;
