import { Link } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { useAuth } from "../contexts/AuthContext";

/**
 * 加密指南页面
 *
 * 功能：
 * - 说明角色卡加密流程
 * - 说明嵌入脚本的工作原理
 * - 提供加密前后对比示例
 * - 说明用户如何安装插件
 */

const Guide = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
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
              <h1 className="text-xl font-bold text-gray-800">加密指南</h1>
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 页面标题 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            角色卡加密使用指南
          </h2>
          <p className="text-gray-600">
            了解如何使用防盗系统保护您的角色卡创作
          </p>
        </div>

        {/* 第一部分：角色卡加密流程 */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
              1
            </span>
            角色卡加密流程
          </h3>

          <div className="space-y-4 text-gray-700">
            <p className="leading-relaxed">
              作为角色卡作者，您可以通过以下步骤加密您的角色卡：
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">
                步骤 1：登录管理界面
              </h4>
              <p className="text-sm text-blue-800">
                使用您的账号登录 Web 管理界面。如果还没有账号，请先注册。
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">
                步骤 2：创建角色卡记录
              </h4>
              <p className="text-sm text-blue-800">
                在"角色卡管理"页面点击"加密角色卡"按钮，上传您的角色卡 PNG
                文件， 设置密码，系统会自动生成唯一的 Card ID。
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">
                步骤 3：下载加密后的角色卡
              </h4>
              <p className="text-sm text-blue-800">
                系统会自动将防盗脚本嵌入到您的角色卡中，并生成加密后的 PNG
                文件供您下载。
                <strong>
                  注意：服务器不会保存您的角色卡 PNG 文件，只保存元数据。
                </strong>
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">
                步骤 4：分发加密角色卡
              </h4>
              <p className="text-sm text-blue-800">
                将加密后的角色卡分发给您的用户，并告知他们密码。
                用户需要安装防盗插件才能使用加密的角色卡。
              </p>
            </div>
          </div>
        </section>

        {/* 第二部分：嵌入脚本的工作原理 */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
              2
            </span>
            嵌入脚本的工作原理
          </h3>

          <div className="space-y-4 text-gray-700">
            <p className="leading-relaxed">
              加密后的角色卡中嵌入了一段防盗脚本，该脚本会在用户导入角色卡时自动执行。
              这是保护您角色卡的核心机制。
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                关键特性：不可关闭的弹窗
              </h4>
              <p className="text-sm text-yellow-800 mb-2">
                嵌入的脚本会显示一个<strong>无法关闭</strong>的密码输入弹窗。
                这个弹窗在任何情况下都无法关闭，包括：
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1 ml-4">
                <li>点击弹窗外部区域 ❌</li>
                <li>按 ESC 键 ❌</li>
                <li>点击关闭按钮（不提供关闭按钮）❌</li>
                <li>刷新页面（弹窗会重新出现）❌</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                唯一的关闭方式
              </h4>
              <p className="text-sm text-green-800">
                弹窗<strong>只有在以下所有条件同时满足时才能关闭</strong>：
              </p>
              <ol className="list-decimal list-inside text-sm text-green-800 space-y-1 ml-4 mt-2">
                <li>用户已安装防盗插件 ✅</li>
                <li>用户输入了正确的密码 ✅</li>
                <li>服务器验证成功 ✅</li>
              </ol>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                弹窗无法关闭的所有情况
              </h4>
              <ul className="list-disc list-inside text-sm text-red-800 space-y-1 ml-4">
                <li>未安装防盗插件 → 弹窗显示"请安装插件"提示，无法关闭</li>
                <li>密码错误 → 弹窗显示错误提示，无法关闭</li>
                <li>网络错误 → 弹窗显示错误提示，无法关闭</li>
                <li>服务器错误 → 弹窗显示错误提示，无法关闭</li>
                <li>Card ID 不存在 → 弹窗显示错误提示，无法关闭</li>
                <li>速率限制 → 弹窗显示错误提示，无法关闭</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 第三部分：加密前后对比 */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
              3
            </span>
            加密前后对比
          </h3>

          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              以下是角色卡加密前后的对比，帮助您理解加密过程的变化：
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* 加密前 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-gray-400 text-white rounded px-2 py-1 text-xs mr-2">
                    加密前
                  </span>
                  普通角色卡
                </h4>
                <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-700 space-y-2">
                  <div>
                    <span className="text-gray-500">// 角色卡数据</span>
                  </div>
                  <div>
                    <span className="text-blue-600">"name"</span>:{" "}
                    <span className="text-green-600">"角色名称"</span>,
                  </div>
                  <div>
                    <span className="text-blue-600">"description"</span>:{" "}
                    <span className="text-green-600">"..."</span>,
                  </div>
                  <div>
                    <span className="text-blue-600">"extensions"</span>: {"{"}
                  </div>
                  <div className="ml-4">
                    <span className="text-gray-500">// 无防盗配置</span>
                  </div>
                  <div>{"}"}</div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  ✅ 任何人都可以直接使用
                  <br />❌ 无版权保护
                </div>
              </div>

              {/* 加密后 */}
              <div className="border border-green-500 rounded-lg p-4 bg-green-50">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-green-600 text-white rounded px-2 py-1 text-xs mr-2">
                    加密后
                  </span>
                  受保护角色卡
                </h4>
                <div className="bg-white rounded p-3 text-xs font-mono text-gray-700 space-y-2">
                  <div>
                    <span className="text-gray-500">// 角色卡数据</span>
                  </div>
                  <div>
                    <span className="text-blue-600">"name"</span>:{" "}
                    <span className="text-green-600">"角色名称"</span>,
                  </div>
                  <div>
                    <span className="text-blue-600">"extensions"</span>: {"{"}
                  </div>
                  <div className="ml-4">
                    <span className="text-blue-600">"anti_theft"</span>: {"{"}
                  </div>
                  <div className="ml-8">
                    <span className="text-blue-600">"enabled"</span>:{" "}
                    <span className="text-orange-600">true</span>,
                  </div>
                  <div className="ml-8">
                    <span className="text-blue-600">"card_id"</span>:{" "}
                    <span className="text-green-600">"123456"</span>,
                  </div>
                  <div className="ml-8">
                    <span className="text-blue-600">"server_url"</span>:{" "}
                    <span className="text-green-600">"..."</span>,
                  </div>
                  <div className="ml-8">
                    <span className="text-blue-600">"locked"</span>:{" "}
                    <span className="text-orange-600">true</span>
                  </div>
                  <div className="ml-4">{"}"}</div>
                  <div className="ml-4">
                    <span className="text-blue-600">"anti_theft_script"</span>:{" "}
                    <span className="text-green-600">"..."</span>
                  </div>
                  <div>{"}"}</div>
                </div>
                <div className="mt-3 text-sm text-green-800">
                  ✅ 需要密码才能使用
                  <br />✅ 完整版权保护
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">关键变化</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • 添加了{" "}
                  <code className="bg-blue-100 px-1 rounded">anti_theft</code>{" "}
                  配置对象
                </li>
                <li>
                  • 嵌入了{" "}
                  <code className="bg-blue-100 px-1 rounded">
                    anti_theft_script
                  </code>{" "}
                  防盗脚本
                </li>
                <li>
                  • 生成了唯一的{" "}
                  <code className="bg-blue-100 px-1 rounded">card_id</code>
                </li>
                <li>
                  • 配置了服务器地址{" "}
                  <code className="bg-blue-100 px-1 rounded">server_url</code>
                </li>
                <li>
                  • 设置了锁定状态{" "}
                  <code className="bg-blue-100 px-1 rounded">locked: true</code>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 第四部分：用户如何安装插件 */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
              4
            </span>
            用户如何安装插件
          </h3>

          <div className="space-y-4 text-gray-700">
            <p className="leading-relaxed">
              您的用户需要安装 SillyTavern 防盗插件才能使用加密的角色卡。
              请将以下安装说明提供给您的用户：
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-5">
              <h4 className="font-bold text-gray-900 mb-4 text-lg">
                📦 插件安装步骤（用户端）
              </h4>

              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">下载插件</p>
                    <p className="text-sm text-gray-600 mt-1">
                      从插件仓库下载 SillyTavern 防盗插件文件
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      安装到 SillyTavern
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      将插件文件复制到 SillyTavern 的{" "}
                      <code className="bg-gray-200 px-1 rounded text-xs">
                        plugins
                      </code>{" "}
                      目录
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      重启 SillyTavern
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      重启 SillyTavern 以加载插件
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">
                    4
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      导入加密角色卡
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      导入您提供的加密角色卡，输入密码即可使用
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                重要提示
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1 ml-7">
                <li>• 如果用户未安装插件，将无法使用加密的角色卡</li>
                <li>• 弹窗会显示"请安装插件"提示，且无法关闭</li>
                <li>• 用户必须先安装插件，才能输入密码</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 第五部分：常见问题 */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
              ?
            </span>
            常见问题
          </h3>

          <div className="space-y-4">
            <div className="border-l-4 border-gray-300 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Q: 服务器会保存我的角色卡 PNG 文件吗？
              </h4>
              <p className="text-sm text-gray-700">
                A: <strong>不会。</strong>服务器只保存角色卡的元数据（Card
                ID、名称、密码哈希、版本号）， 不会保存 PNG
                文件本身。您的角色卡文件完全由您自己保管。
              </p>
            </div>

            <div className="border-l-4 border-gray-300 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Q: 如果我想更新密码怎么办？
              </h4>
              <p className="text-sm text-gray-700">
                A:
                在角色卡列表页面点击"更新密码"按钮即可。更新后，所有已解锁的用户
                在下次加载角色卡时会被要求重新输入新密码。
              </p>
            </div>

            <div className="border-l-4 border-gray-300 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Q: 用户可以绕过密码验证吗？
              </h4>
              <p className="text-sm text-gray-700">
                A: <strong>不能。</strong>嵌入的脚本会创建一个无法关闭的弹窗，
                只有在安装插件并输入正确密码后才能关闭。这是唯一的解锁方式。
              </p>
            </div>

            <div className="border-l-4 border-gray-300 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                Q: 我可以使用自己的服务器吗？
              </h4>
              <p className="text-sm text-gray-700">
                A: <strong>可以。</strong>
                系统支持自托管部署。您可以部署自己的服务器实例，
                完全控制您的数据和服务。
              </p>
            </div>
          </div>
        </section>

        {/* 底部操作按钮 */}
        <div className="flex justify-center space-x-4 mt-8">
          <Link
            to="/cards"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            开始加密角色卡
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            返回控制台
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Guide;
