import PropTypes from "prop-types";

/**
 * 表单输入组件 - 带验证反馈
 *
 * 功能：
 * - 实时显示验证错误
 * - 使用颜色和图标区分状态（success, error, warning）
 * - 提供清晰的错误提示
 * - 支持多种输入类型
 * - 支持显示/隐藏密码
 */

const FormInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  success,
  warning,
  placeholder,
  disabled,
  required,
  autoComplete,
  autoFocus,
  className = "",
  showPasswordToggle = false,
  onTogglePassword,
  showPassword = false,
  helpText,
}) => {
  // 确定输入框状态
  const hasError = !!error;
  const hasSuccess = !!success && !error;
  const hasWarning = !!warning && !error && !success;

  // 确定边框颜色
  const getBorderColor = () => {
    if (hasError)
      return "border-red-300 focus:ring-red-500 focus:border-red-500";
    if (hasSuccess)
      return "border-green-300 focus:ring-green-500 focus:border-green-500";
    if (hasWarning)
      return "border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500";
    return "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  };

  // 确定图标
  const getIcon = () => {
    if (hasError) {
      return (
        <svg
          className="w-5 h-5 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (hasSuccess) {
      return (
        <svg
          className="w-5 h-5 text-green-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    if (hasWarning) {
      return (
        <svg
          className="w-5 h-5 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${getBorderColor()} ${
            (hasError || hasSuccess || hasWarning) && !showPasswordToggle
              ? "pr-10"
              : showPasswordToggle
                ? "pr-20"
                : ""
          }`}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={hasError}
          aria-describedby={
            hasError
              ? `${name}-error`
              : hasSuccess
                ? `${name}-success`
                : hasWarning
                  ? `${name}-warning`
                  : helpText
                    ? `${name}-help`
                    : undefined
          }
        />

        {/* Status Icon and Password Toggle */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {/* Password Toggle Button */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={onTogglePassword}
              className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
              disabled={disabled}
              title={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          )}

          {/* Status Icon */}
          {!showPasswordToggle && getIcon()}
        </div>
      </div>

      {/* Error Message */}
      {hasError && (
        <div
          id={`${name}-error`}
          className="mt-1 flex items-start space-x-1"
          role="alert"
        >
          <svg
            className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {hasSuccess && (
        <div id={`${name}-success`} className="mt-1 flex items-start space-x-1">
          <svg
            className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Warning Message */}
      {hasWarning && (
        <div id={`${name}-warning`} className="mt-1 flex items-start space-x-1">
          <svg
            className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-yellow-600">{warning}</p>
        </div>
      )}

      {/* Help Text */}
      {helpText && !hasError && !hasSuccess && !hasWarning && (
        <p id={`${name}-help`} className="mt-1 text-xs text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

FormInput.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  success: PropTypes.string,
  warning: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  autoComplete: PropTypes.string,
  autoFocus: PropTypes.bool,
  className: PropTypes.string,
  showPasswordToggle: PropTypes.bool,
  onTogglePassword: PropTypes.func,
  showPassword: PropTypes.bool,
  helpText: PropTypes.string,
};

export default FormInput;
