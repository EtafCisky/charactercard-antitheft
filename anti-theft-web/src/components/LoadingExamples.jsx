import { useState } from "react";
import LoadingButton from "./LoadingButton";
import LoadingSpinner from "./LoadingSpinner";

/**
 * LoadingExamples 组件
 *
 * 展示加载状态组件的各种用法示例
 * 仅用于开发和文档目的
 */

const LoadingExamples = () => {
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);

  const simulateApiCall = (setLoading) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          加载状态组件示例
        </h1>

        {/* LoadingSpinner 示例 */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            LoadingSpinner 组件
          </h2>

          <div className="space-y-6">
            {/* 小尺寸 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                小尺寸 (sm)
              </h3>
              <div className="p-4 bg-gray-50 rounded">
                <LoadingSpinner size="sm" text="加载中..." />
              </div>
            </div>

            {/* 中等尺寸 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                中等尺寸 (md) - 默认
              </h3>
              <div className="p-4 bg-gray-50 rounded">
                <LoadingSpinner size="md" text="加载中..." />
              </div>
            </div>

            {/* 大尺寸 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                大尺寸 (lg)
              </h3>
              <div className="p-4 bg-gray-50 rounded">
                <LoadingSpinner size="lg" text="加载中..." />
              </div>
            </div>

            {/* 内联模式 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                内联模式 (inline)
              </h3>
              <div className="p-4 bg-gray-50 rounded">
                <button
                  disabled
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  <LoadingSpinner inline size="sm" text="处理中..." />
                </button>
              </div>
            </div>

            {/* 全屏模式 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                全屏模式 (fullScreen)
              </h3>
              <div className="p-4 bg-gray-50 rounded">
                <button
                  onClick={() => {
                    setLoading1(true);
                    setTimeout(() => setLoading1(false), 2000);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  显示全屏加载
                </button>
                {loading1 && (
                  <LoadingSpinner fullScreen text="正在加载数据..." />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* LoadingButton 示例 */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            LoadingButton 组件
          </h2>

          <div className="space-y-6">
            {/* 基本用法 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                基本用法
              </h3>
              <div className="p-4 bg-gray-50 rounded space-x-4">
                <LoadingButton
                  loading={loading2}
                  onClick={() => simulateApiCall(setLoading2)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  提交
                </LoadingButton>
              </div>
            </div>

            {/* 自定义加载文本 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                自定义加载文本
              </h3>
              <div className="p-4 bg-gray-50 rounded space-x-4">
                <LoadingButton
                  loading={loading3}
                  loadingText="提交中..."
                  onClick={() => simulateApiCall(setLoading3)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  提交
                </LoadingButton>
              </div>
            </div>

            {/* 不同样式 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                不同样式的按钮
              </h3>
              <div className="p-4 bg-gray-50 rounded space-x-4">
                <LoadingButton
                  loading={false}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  主要按钮
                </LoadingButton>
                <LoadingButton
                  loading={false}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  成功按钮
                </LoadingButton>
                <LoadingButton
                  loading={false}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  危险按钮
                </LoadingButton>
                <LoadingButton
                  loading={false}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  次要按钮
                </LoadingButton>
              </div>
            </div>

            {/* 禁用状态 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                禁用状态
              </h3>
              <div className="p-4 bg-gray-50 rounded space-x-4">
                <LoadingButton
                  disabled={true}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  禁用按钮
                </LoadingButton>
                <LoadingButton
                  loading={true}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  加载中
                </LoadingButton>
              </div>
            </div>
          </div>
        </section>

        {/* 实际使用场景 */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            实际使用场景
          </h2>

          <div className="space-y-6">
            {/* 表单提交 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                表单提交
              </h3>
              <div className="p-4 bg-gray-50 rounded">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    simulateApiCall(setLoading1);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      用户名
                    </label>
                    <input
                      type="text"
                      disabled={loading1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入用户名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      密码
                    </label>
                    <input
                      type="password"
                      disabled={loading1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入密码"
                    />
                  </div>
                  <LoadingButton
                    type="submit"
                    loading={loading1}
                    loadingText="登录中..."
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    登录
                  </LoadingButton>
                </form>
              </div>
            </div>

            {/* 数据加载 */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                数据加载
              </h3>
              <div className="p-4 bg-gray-50 rounded">
                {loading2 ? (
                  <div className="py-8">
                    <LoadingSpinner size="lg" text="正在加载数据..." />
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 mb-4">数据已加载</p>
                    <button
                      onClick={() => simulateApiCall(setLoading2)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      重新加载
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 代码示例 */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            代码示例
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                LoadingSpinner
              </h3>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-md overflow-x-auto text-sm">
                {`import LoadingSpinner from './components/LoadingSpinner';

// 基本用法
<LoadingSpinner />

// 带文本
<LoadingSpinner text="加载中..." />

// 大尺寸
<LoadingSpinner size="lg" text="正在处理..." />

// 全屏模式
{loading && <LoadingSpinner fullScreen text="加载中..." />}`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                LoadingButton
              </h3>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-md overflow-x-auto text-sm">
                {`import LoadingButton from './components/LoadingButton';

const MyComponent = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.post('/api/endpoint', data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingButton
      loading={loading}
      loadingText="提交中..."
      onClick={handleSubmit}
      className="px-4 py-2 bg-blue-600 text-white rounded-md"
    >
      提交
    </LoadingButton>
  );
};`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoadingExamples;
