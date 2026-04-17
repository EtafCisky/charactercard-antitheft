import PropTypes from "prop-types";
import { useState } from "react";
import apiClient from "../api/client";
import { readPngMetadata, writePngMetadata } from "../utils/pngMetadata";
import { generateAntiTheftScript } from "../utils/scriptGenerator";

/**
 * 加密角色卡模态框组件
 *
 * 功能：
 * - PNG 文件上传
 * - 解析角色卡元数据
 * - 加密表单（角色卡名称、密码输入）
 * - 创建角色卡记录 API 调用
 * - 生成防盗脚本代码
 * - 嵌入脚本到 extensions.anti_theft_script
 * - 设置 extensions.anti_theft 配置
 * - 将修改后的元数据写回 PNG 文件
 * - 提供下载加密后的角色卡 PNG
 * - 显示成功消息和 Card ID
 */

const EncryptCardModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: 上传, 2: 配置, 3: 完成
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [cardName, setCardName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [encryptedBlob, setEncryptedBlob] = useState(null);

  // 密码显示状态
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 字段验证错误
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // 重置状态
  const resetState = () => {
    setStep(1);
    setFile(null);
    setMetadata(null);
    setCardName("");
    setPassword("");
    setConfirmPassword("");
    setLoading(false);
    setError(null);
    setResult(null);
    setEncryptedBlob(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
    setTouched({});
  };

  // 处理字段变化
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === "cardName") setCardName(value);
    else if (name === "password") setPassword(value);
    else if (name === "confirmPassword") setConfirmPassword(value);

    // 实时验证（仅在字段已被触摸后）
    if (touched[name]) {
      validateField(name, value);
    }
  };

  // 处理字段失焦
  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, value);
  };

  // 验证单个字段
  const validateField = (name, value) => {
    let error = "";

    if (name === "cardName") {
      if (!value.trim()) {
        error = "请输入角色卡名称";
      }
    } else if (name === "password") {
      if (!value) {
        error = "请输入密码";
      } else if (value.length < 1 || value.length > 100) {
        error = "密码长度必须在 1-100 字符之间";
      }
    } else if (name === "confirmPassword") {
      if (!value) {
        error = "请确认密码";
      } else if (password !== value) {
        error = "两次输入的密码不一致";
      }
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    return !error;
  };

  // 验证所有字段
  const validateAllFields = () => {
    const cardNameValid = validateField("cardName", cardName);
    const passwordValid = validateField("password", password);
    const confirmPasswordValid = validateField(
      "confirmPassword",
      confirmPassword,
    );

    setTouched({
      cardName: true,
      password: true,
      confirmPassword: true,
    });

    return cardNameValid && passwordValid && confirmPasswordValid;
  };

  // 处理文件上传
  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    // 验证文件类型
    if (!uploadedFile.type.startsWith("image/png")) {
      setError("请上传 PNG 格式的角色卡文件");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 解析 PNG 元数据
      const parsedMetadata = await readPngMetadata(uploadedFile);

      // 验证元数据结构
      if (!parsedMetadata.data) {
        throw new Error("角色卡格式错误：缺少 data 字段");
      }

      setFile(uploadedFile);
      setMetadata(parsedMetadata);

      // 自动填充角色卡名称
      if (parsedMetadata.data.name) {
        setCardName(parsedMetadata.data.name);
      }

      setStep(2);
    } catch (err) {
      console.error("解析 PNG 元数据失败:", err);
      setError(
        err.message ||
          "解析角色卡失败，请确保这是有效的 SillyTavern 角色卡文件",
      );
    } finally {
      setLoading(false);
    }
  };

  // 处理加密
  const handleEncrypt = async () => {
    // 验证输入
    if (!validateAllFields()) {
      setError("请检查并修正表单错误");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. 创建角色卡记录
      const response = await apiClient.post("/api/cards", {
        card_name: cardName.trim(),
        password: password,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "创建角色卡记录失败");
      }

      const { card_id, password_version } = response.data;

      // 2. 获取当前 API 服务器地址
      // 优先使用 apiClient 配置的地址，如果为空则自动检测
      let serverUrl = apiClient.defaults.baseURL;

      if (!serverUrl || serverUrl === "") {
        // 自动检测：使用当前访问的域名/IP + 端口 3000
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        serverUrl = `${protocol}//${hostname}:3000`;
      }

      // 3. 生成防盗脚本
      const antiTheftScript = generateAntiTheftScript(card_id, serverUrl);

      // 4. 修改元数据
      const updatedMetadata = {
        ...metadata,
        data: {
          ...metadata.data,
          extensions: {
            ...metadata.data.extensions,
            anti_theft: {
              enabled: true,
              card_id: card_id,
              server_url: serverUrl,
              locked: true,
              password_version: password_version,
            },
            anti_theft_script: antiTheftScript,
          },
        },
      };

      // 5. 将修改后的元数据写回 PNG
      const encryptedPngBlob = await writePngMetadata(file, updatedMetadata);

      // 6. 保存结果
      setResult({
        card_id,
        card_name: cardName,
        password_version,
        server_url: serverUrl,
      });
      setEncryptedBlob(encryptedPngBlob);
      setStep(3);

      // 通知父组件刷新列表
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("加密失败:", err);
      setError(
        err.response?.data?.message || err.message || "加密失败，请重试",
      );
    } finally {
      setLoading(false);
    }
  };

  // 下载加密后的角色卡
  const handleDownload = () => {
    if (!encryptedBlob || !result) return;

    const url = URL.createObjectURL(encryptedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.card_name}_encrypted.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 关闭模态框
  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {step === 1 && "上传角色卡"}
            {step === 2 && "配置加密"}
            {step === 3 && "加密完成"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4">
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* 步骤 1: 上传文件 */}
          {step === 1 && (
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  请上传 SillyTavern 角色卡 PNG
                  文件。系统将解析角色卡元数据并生成加密版本。
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={loading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      {loading ? "正在解析..." : "点击上传或拖拽文件到此处"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      仅支持 PNG 格式
                    </p>
                  </label>
                </div>
              </div>

              {metadata && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>✓ 解析成功</strong>
                    <br />
                    角色卡名称: {metadata.data?.name || "未命名"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 步骤 2: 配置加密 */}
          {step === 2 && (
            <div>
              <FormInput
                label="角色卡名称"
                name="cardName"
                type="text"
                value={cardName}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                error={touched.cardName ? errors.cardName : ""}
                placeholder="请输入角色卡名称"
                disabled={loading}
                required
                helpText="用于在管理界面中识别此角色卡"
                className="mb-4"
              />

              <FormInput
                label="密码"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                error={touched.password ? errors.password : ""}
                placeholder="请输入密码"
                disabled={loading}
                required
                showPasswordToggle={true}
                onTogglePassword={() => setShowPassword(!showPassword)}
                showPassword={showPassword}
                helpText="用户需要输入此密码才能使用角色卡（1-100 字符）"
                className="mb-4"
              />

              <FormInput
                label="确认密码"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                error={touched.confirmPassword ? errors.confirmPassword : ""}
                placeholder="请再次输入密码"
                disabled={loading}
                required
                showPasswordToggle={true}
                onTogglePassword={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                showPassword={showConfirmPassword}
                className="mb-4"
              />

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>ℹ 说明</strong>
                  <br />
                  • 系统将生成防盗脚本并嵌入到角色卡中
                  <br />
                  • 用户导入角色卡后需要输入密码才能使用
                  <br />• 服务器地址:{" "}
                  {(() => {
                    let url = apiClient.defaults.baseURL;
                    if (!url || url === "") {
                      const protocol = window.location.protocol;
                      const hostname = window.location.hostname;
                      url = `${protocol}//${hostname}:3000`;
                    }
                    return url;
                  })()}
                </p>
              </div>
            </div>
          )}

          {/* 步骤 3: 完成 */}
          {step === 3 && result && (
            <div>
              <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-md text-center">
                <svg
                  className="mx-auto h-16 w-16 text-green-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-bold text-green-800 mb-2">
                  加密成功！
                </h3>
                <p className="text-sm text-green-700">
                  角色卡已成功加密，请下载加密后的文件
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <span className="text-sm font-medium text-gray-700">
                    Card ID:
                  </span>
                  <span className="text-sm font-mono font-bold text-blue-600">
                    {result.card_id}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <span className="text-sm font-medium text-gray-700">
                    角色卡名称:
                  </span>
                  <span className="text-sm text-gray-900">
                    {result.card_name}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <span className="text-sm font-medium text-gray-700">
                    密码版本:
                  </span>
                  <span className="text-sm text-gray-900">
                    v{result.password_version}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <span className="text-sm font-medium text-gray-700">
                    服务器地址:
                  </span>
                  <span className="text-sm text-gray-900 break-all">
                    {result.server_url}
                  </span>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                下载加密后的角色卡
              </button>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>⚠ 重要提示</strong>
                  <br />
                  • 请妥善保管密码，用户需要密码才能使用角色卡
                  <br />
                  • 加密后的角色卡文件已包含防盗脚本
                  <br />• 用户需要安装防盗插件才能正常使用
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          {step === 1 && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
              disabled={loading}
            >
              取消
            </button>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                disabled={loading}
              >
                上一步
              </button>
              <button
                onClick={handleEncrypt}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? "加密中..." : "开始加密"}
              </button>
            </>
          )}

          {step === 3 && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EncryptCardModal;

EncryptCardModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
