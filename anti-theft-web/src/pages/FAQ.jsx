import { Link } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import { useAuth } from "../contexts/AuthContext";

/**
 * FAQ 页面 - 常见问题解答
 *
 * 功能：
 * - 17.3.1 编写常见问题解答
 * - 17.3.2 提供故障排查指南
 * - 17.3.3 说明"请安装防盗插件"提示的含义
 * - 17.3.4 提供插件下载链接
 * - 17.3.5 提供联系支持方式
 */

const FAQ = () => {
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
              <h1 className="text-xl font-bold text-gray-800">常见问题</h1>
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
            常见问题解答 (FAQ)
          </h2>
          <p className="text-gray-600">
            查找关于角色卡防盗系统的常见问题和解决方案
          </p>
        </div>

        {/* 快速导航 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">快速导航</h3>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <a href="#general" className="text-blue-700 hover:text-blue-900">
              • 常见问题
            </a>
            <a
              href="#troubleshooting"
              className="text-blue-700 hover:text-blue-900"
            >
              • 故障排查
            </a>
            <a
              href="#plugin-install"
              className="text-blue-700 hover:text-blue-900"
            >
              • 插件安装说明
            </a>
            <a href="#support" className="text-blue-700 hover:text-blue-900">
              • 联系支持
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

{
  /* 第一部分：常见问题 - 17.3.1 */
}
<section id="general" className="bg-white rounded-lg shadow-md p-6 mb-6">
  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
    <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
      ?
    </span>
    常见问题
  </h3>

  <div className="space-y-6">
    {/* Q1: 什么是角色卡防盗系统 */}
    <div className="border-l-4 border-blue-500 pl-4">
      <h4 className="font-semibold text-gray-900 mb-2">
        Q1: 什么是角色卡防盗系统？
      </h4>
      <p className="text-sm text-gray-700 leading-relaxed">
        A: 角色卡防盗系统是一个三层架构的保护系统，包括 SillyTavern 客户端插件、
        云服务器后端和 Web 管理界面。它通过在角色卡中嵌入防盗脚本，
        要求用户输入密码才能使用角色卡，从而保护您的创作内容不被未经授权使用。
      </p>
    </div>

    {/* Q2: 服务器会保存我的角色卡文件吗 */}
    <div className="border-l-4 border-blue-500 pl-4">
      <h4 className="font-semibold text-gray-900 mb-2">
        Q2: 服务器会保存我的角色卡 PNG 文件吗？
      </h4>
      <p className="text-sm text-gray-700 leading-relaxed">
        A: <strong>不会。</strong>服务器只保存角色卡的元数据（Card
        ID、名称、密码哈希、版本号）， 不会保存 PNG 文件本身。加密流程为：上传
        PNG → 解析元数据 → 生成并嵌入脚本 → 下载加密后的
        PNG。您的角色卡文件完全由您自己保管。
      </p>
    </div>

    {/* Q3: 如何更新密码 */}
    <div className="border-l-4 border-blue-500 pl-4">
      <h4 className="font-semibold text-gray-900 mb-2">
        Q3: 如果我想更新角色卡密码怎么办？
      </h4>
      <p className="text-sm text-gray-700 leading-relaxed">
        A: 在角色卡列表页面找到对应的角色卡，点击"更新密码"按钮即可。
        更新后，密码版本号会自动递增，所有已解锁的用户在下次加载角色卡时
        会被要求重新输入新密码。这个机制可以在密码泄露时保护您的内容。
      </p>
    </div>

    {/* Q4: 用户可以绕过密码验证吗 */}
    <div className="border-l-4 border-blue-500 pl-4">
      <h4 className="font-semibold text-gray-900 mb-2">
        Q4: 用户可以绕过密码验证吗？
      </h4>
      <p className="text-sm text-gray-700 leading-relaxed">
        A: <strong>不能。</strong>嵌入的脚本会创建一个无法关闭的弹窗，
        禁用了所有关闭方式（ESC 键、点击外部、关闭按钮等）。
        只有在用户安装了防盗插件并输入正确密码后，弹窗才会关闭。
        这是唯一的解锁方式。
      </p>
    </div>

    {/* Q5: 可以使用自己的服务器吗 */}
    <div className="border-l-4 border-blue-500 pl-4">
      <h4 className="font-semibold text-gray-900 mb-2">
        Q5: 我可以使用自己的服务器吗？
      </h4>
      <p className="text-sm text-gray-700 leading-relaxed">
        A: <strong>可以。</strong>系统支持多租户和自托管部署。
        您可以部署自己的服务器实例，完全控制您的数据和服务。
        在设置页面配置您的服务器地址即可。
      </p>
    </div>

    {/* Q6: 密码安全吗 */}
    <div className="border-l-4 border-blue-500 pl-4">
      <h4 className="font-semibold text-gray-900 mb-2">
        Q6: 密码是如何存储的？安全吗？
      </h4>
      <p className="text-sm text-gray-700 leading-relaxed">
        A: 所有密码都使用 bcrypt 算法加密存储（salt rounds: 12），
        服务器永不存储明文密码。生产环境强制使用 HTTPS 加密通信，
        并实施了速率限制（每 IP 10次/分钟，每 Card ID 5次/分钟）
        来防止暴力破解攻击。
      </p>
    </div>

    {/* Q7: 如何分享加密角色卡 */}
    <div className="border-l-4 border-blue-500 pl-4">
      <h4 className="font-semibold text-gray-900 mb-2">
        Q7: 如何分享加密后的角色卡？
      </h4>
      <p className="text-sm text-gray-700 leading-relaxed">
        A: 加密后，下载生成的 PNG 文件，然后通过您喜欢的方式分享给用户
        （如网盘、社交媒体等）。同时告知用户密码和插件下载地址。
        用户需要先安装防盗插件，然后导入角色卡并输入密码才能使用。
      </p>
    </div>
  </div>
</section>;

{
  /* 第二部分：故障排查指南 - 17.3.2 */
}
<section
  id="troubleshooting"
  className="bg-white rounded-lg shadow-md p-6 mb-6"
>
  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
    <span className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
      🔧
    </span>
    故障排查指南
  </h3>

  <div className="space-y-6">
    {/* 问题1: 无法连接到服务器 */}
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h4 className="font-semibold text-red-900 mb-3 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        问题：无法连接到服务器
      </h4>
      <div className="text-sm text-red-800 space-y-2">
        <p>
          <strong>症状：</strong>显示"无法连接到服务器，请检查网络连接"错误
        </p>
        <p>
          <strong>可能原因：</strong>
        </p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>网络连接问题</li>
          <li>服务器地址配置错误</li>
          <li>服务器维护或宕机</li>
          <li>防火墙阻止连接</li>
        </ul>
        <p>
          <strong>解决方案：</strong>
        </p>
        <ol className="list-decimal list-inside ml-4 space-y-1">
          <li>检查您的网络连接是否正常</li>
          <li>在设置页面确认服务器地址是否正确</li>
          <li>尝试在浏览器中访问服务器地址，确认服务器是否在线</li>
          <li>检查防火墙设置，确保允许访问服务器端口</li>
          <li>如果使用自托管服务器，检查服务器是否正常运行</li>
        </ol>
      </div>
    </div>

    {/* 问题2: 密码验证失败 */}
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        问题：密码验证失败
      </h4>
      <div className="text-sm text-yellow-800 space-y-2">
        <p>
          <strong>症状：</strong>输入密码后显示"密码错误"
        </p>
        <p>
          <strong>可能原因：</strong>
        </p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>密码输入错误（注意大小写）</li>
          <li>作者已更新密码</li>
          <li>Card ID 不存在于服务器</li>
        </ul>
        <p>
          <strong>解决方案：</strong>
        </p>
        <ol className="list-decimal list-inside ml-4 space-y-1">
          <li>仔细检查密码，注意大小写和特殊字符</li>
          <li>联系角色卡作者确认当前密码</li>
          <li>如果看到"作者已更新密码"提示，请向作者索取新密码</li>
          <li>确认您使用的是最新版本的角色卡文件</li>
        </ol>
      </div>
    </div>

    {/* 问题3: Card ID 不存在 */}
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        问题：角色卡未在服务器注册
      </h4>
      <div className="text-sm text-purple-800 space-y-2">
        <p>
          <strong>症状：</strong>显示"角色卡未在服务器注册，请联系作者"
        </p>
        <p>
          <strong>可能原因：</strong>
        </p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>作者尚未在服务器上创建该角色卡记录</li>
          <li>作者已删除该角色卡记录</li>
          <li>连接到了错误的服务器</li>
        </ul>
        <p>
          <strong>解决方案：</strong>
        </p>
        <ol className="list-decimal list-inside ml-4 space-y-1">
          <li>联系角色卡作者，确认角色卡是否已在服务器注册</li>
          <li>确认您连接的服务器地址是否正确</li>
          <li>如果作者使用自托管服务器，确认服务器地址配置</li>
        </ol>
      </div>
    </div>

    {/* 问题4: 速率限制 */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
        问题：请求过于频繁
      </h4>
      <div className="text-sm text-blue-800 space-y-2">
        <p>
          <strong>症状：</strong>显示"请求过于频繁，请在 X 秒后重试"
        </p>
        <p>
          <strong>原因：</strong>触发了速率限制保护机制（防止暴力破解）
        </p>
        <p>
          <strong>限制规则：</strong>
        </p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>每个 IP 地址：10 次/分钟</li>
          <li>每个 Card ID：5 次/分钟</li>
        </ul>
        <p>
          <strong>解决方案：</strong>
        </p>
        <ol className="list-decimal list-inside ml-4 space-y-1">
          <li>等待倒计时结束后再次尝试</li>
          <li>确保输入正确的密码，避免多次失败</li>
          <li>如果持续遇到此问题，联系系统管理员</li>
        </ol>
      </div>
    </div>

    {/* 问题5: 加密失败 */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
            clipRule="evenodd"
          />
        </svg>
        问题：角色卡加密失败
      </h4>
      <div className="text-sm text-gray-700 space-y-2">
        <p>
          <strong>症状：</strong>上传角色卡后无法完成加密
        </p>
        <p>
          <strong>可能原因：</strong>
        </p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>上传的文件不是有效的角色卡 PNG 文件</li>
          <li>角色卡元数据格式不正确</li>
          <li>网络传输中断</li>
          <li>服务器错误</li>
        </ul>
        <p>
          <strong>解决方案：</strong>
        </p>
        <ol className="list-decimal list-inside ml-4 space-y-1">
          <li>确认上传的是从 SillyTavern 导出的角色卡 PNG 文件</li>
          <li>检查文件大小是否合理（通常小于 10MB）</li>
          <li>尝试重新上传</li>
          <li>如果问题持续，联系技术支持</li>
        </ol>
      </div>
    </div>
  </div>
</section>;

{
  /* 第三部分：插件安装说明 - 17.3.3 和 17.3.4 */
}
<section id="plugin-install" className="bg-white rounded-lg shadow-md p-6 mb-6">
  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
    <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
      📦
    </span>
    插件安装说明
  </h3>

  {/* 17.3.3 说明"请安装防盗插件"提示的含义 */}
  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
    <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
      什么是"请安装防盗插件"提示？
    </h4>
    <div className="text-sm text-yellow-800 space-y-2">
      <p>
        当您导入加密的角色卡时，如果看到<strong>"请安装防盗插件"</strong>提示，
        这意味着：
      </p>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>您的 SillyTavern 尚未安装防盗插件</li>
        <li>密码输入功能被禁用，无法输入密码</li>
        <li>弹窗无法关闭，直到您安装插件</li>
      </ul>
      <p className="mt-3">
        <strong>这是正常的保护机制。</strong>
        防盗插件负责与服务器通信验证密码，没有插件就无法解锁角色卡。
        请按照下面的步骤安装插件。
      </p>
    </div>
  </div>

  {/* 17.3.4 提供插件下载链接 */}
  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-5 mb-6">
    <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
      <svg
        className="w-6 h-6 mr-2 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      插件下载
    </h4>

    <div className="space-y-3">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-900">官方 GitHub 仓库</span>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            推荐
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          从 GitHub 下载最新版本的防盗插件
        </p>
        <a
          href="https://github.com/your-org/sillytavern-anti-theft-plugin"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
              clipRule="evenodd"
            />
          </svg>
          前往 GitHub 下载
        </a>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-900">备用下载地址</span>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          如果无法访问 GitHub，可以使用备用下载地址
        </p>
        <a
          href="https://example.com/downloads/anti-theft-plugin.zip"
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          备用下载
        </a>
      </div>
    </div>
  </div>

  {/* 安装步骤 */}
  <div className="space-y-4">
    <h4 className="font-bold text-gray-900 text-lg">安装步骤</h4>

    <div className="space-y-3">
      <div className="flex items-start">
        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
          1
        </span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 mb-1">下载插件文件</p>
          <p className="text-sm text-gray-600">
            从上方链接下载插件压缩包，解压到本地文件夹
          </p>
        </div>
      </div>

      <div className="flex items-start">
        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
          2
        </span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 mb-1">
            找到 SillyTavern 插件目录
          </p>
          <p className="text-sm text-gray-600 mb-2">
            打开 SillyTavern 安装目录，找到{" "}
            <code className="bg-gray-200 px-1 rounded text-xs">plugins</code>{" "}
            文件夹
          </p>
          <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-700">
            SillyTavern/plugins/
          </div>
        </div>
      </div>

      <div className="flex items-start">
        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
          3
        </span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 mb-1">复制插件文件</p>
          <p className="text-sm text-gray-600 mb-2">
            将解压后的插件文件夹复制到 plugins 目录中
          </p>
          <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-700">
            SillyTavern/plugins/anti-theft-plugin/
          </div>
        </div>
      </div>

      <div className="flex items-start">
        <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
          4
        </span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 mb-1">重启 SillyTavern</p>
          <p className="text-sm text-gray-600">
            完全关闭 SillyTavern，然后重新启动以加载插件
          </p>
        </div>
      </div>

      <div className="flex items-start">
        <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
          ✓
        </span>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 mb-1">验证安装</p>
          <p className="text-sm text-gray-600">
            导入加密的角色卡，如果能看到密码输入框（而不是"请安装插件"提示），
            说明插件已成功安装
          </p>
        </div>
      </div>
    </div>
  </div>

  {/* 安装提示 */}
  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
    <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
      安装提示
    </h4>
    <ul className="text-sm text-blue-800 space-y-1 ml-7">
      <li>• 确保下载的是最新版本的插件</li>
      <li>
        • 插件文件夹名称应为{" "}
        <code className="bg-blue-100 px-1 rounded">anti-theft-plugin</code>
      </li>
      <li>• 如果插件无法加载，检查 SillyTavern 控制台是否有错误信息</li>
      <li>• 某些防病毒软件可能会误报，请添加信任</li>
    </ul>
  </div>
</section>;

        {/* 第四部分：联系支持 - 17.3.5 */}
        <section id="support" className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
              💬
            </span>
            联系支持
          </h3>

          <div className="space-y-6">
            <p className="text-gray-700 leading-relaxed">
              如果您在使用过程中遇到问题，或者上述 FAQ 和故障排查指南无法解决您的问题，
              可以通过以下方式联系我们获取帮助：
            </p>

            {/* GitHub Issues */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
              <div className="flex items-start">
                <div className="bg-gray-900 rounded-lg p-3 mr-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">GitHub Issues</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    报告 Bug、提出功能建议或查看已知问题
                  </p>
                  <a
                    href="https://github.com/your-org/sillytavern-anti-theft/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    前往 GitHub Issues
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Discord 社区 */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-indigo-400 transition-colors">
              <div className="flex items-start">
                <div className="bg-indigo-600 rounded-lg p-3 mr-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Discord 社区</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    加入我们的 Discord 服务器，与其他用户交流和获取实时帮助
                  </p>
                  <a
                    href="https://discord.gg/your-invite-code"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    加入 Discord
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* 电子邮件 */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-green-400 transition-colors">
              <div className="flex items-start">
                <div className="bg-green-600 rounded-lg p-3 mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">电子邮件支持</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    发送邮件给我们的技术支持团队，我们会在 24-48 小时内回复
                  </p>
                  <a
                    href="mailto:support@example.com"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    support@example.com
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* 文档和教程 */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-yellow-400 transition-colors">
              <div className="flex items-start">
                <div className="bg-yellow-600 rounded-lg p-3 mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">文档和教程</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    查看完整的使用文档、API 文档和视频教程
                  </p>
                  <Link
                    to="/guide"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    查看使用指南
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* 提交问题时的建议 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">提交问题时请提供以下信息：</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>问题的详细描述和重现步骤</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>错误信息截图或日志</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>SillyTavern 版本号</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>防盗插件版本号</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>操作系统和浏览器信息</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>是否使用自托管服务器</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 底部操作按钮 */}
        <div className="flex justify-center space-x-4 mt-8">
          <Link
            to="/guide"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            查看使用指南
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

export default FAQ;
