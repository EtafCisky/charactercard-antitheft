# Toast 通知系统使用指南

## 概述

Toast 通知系统提供了一个全局的、非侵入式的通知机制，用于向用户显示成功、错误和警告消息。

## 功能特性

- ✅ 支持三种通知类型：成功（success）、错误（error）、警告（warning）
- ✅ 自动消失功能（可配置时间）
- ✅ 手动关闭按钮
- ✅ 平滑的动画效果
- ✅ 支持多个通知同时显示
- ✅ 响应式设计，适配移动端
- ✅ 无障碍访问支持（ARIA 标签）

## 基本使用

### 1. 在组件中使用 Toast

```jsx
import { useToast } from "../contexts/ToastContext";

function MyComponent() {
  const { showSuccess, showError, showWarning } = useToast();

  const handleSuccess = () => {
    showSuccess("操作成功！");
  };

  const handleError = () => {
    showError("操作失败，请重试");
  };

  const handleWarning = () => {
    showWarning("请注意：此操作不可撤销");
  };

  return (
    <div>
      <button onClick={handleSuccess}>显示成功通知</button>
      <button onClick={handleError}>显示错误通知</button>
      <button onClick={handleWarning}>显示警告通知</button>
    </div>
  );
}
```

### 2. 自定义持续时间

```jsx
// 默认持续时间
showSuccess("默认 3 秒后消失");

// 自定义持续时间（5 秒）
showSuccess("5 秒后消失", 5000);

// 不自动消失（需要手动关闭）
showSuccess("不会自动消失", 0);
```

### 3. 在 API 调用中使用

```jsx
import { useToast } from "../contexts/ToastContext";
import apiClient from "../api/client";

function CardList() {
  const { showSuccess, showError } = useToast();

  const deleteCard = async (cardId) => {
    try {
      await apiClient.delete(`/api/cards/${cardId}`);
      showSuccess("角色卡删除成功");
      // 刷新列表...
    } catch (error) {
      showError(error.response?.data?.message || "删除失败，请重试");
    }
  };

  return (
    // ...
  );
}
```

### 4. 在表单提交中使用

```jsx
import { useToast } from "../contexts/ToastContext";

function LoginForm() {
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await login(username, password);
      showSuccess("登录成功！");
      // 跳转到控制台...
    } catch (error) {
      if (error.response?.status === 401) {
        showError("用户名或密码错误");
      } else {
        showError("登录失败，请检查网络连接");
      }
    }
  };

  return (
    // ...
  );
}
```

## API 参考

### useToast Hook

返回一个包含以下方法的对象：

#### showSuccess(message, duration?)

显示成功通知。

- **参数**：
  - `message` (string): 通知消息
  - `duration` (number, 可选): 自动消失时间（毫秒），默认 3000
- **返回值**: Toast ID (string)

#### showError(message, duration?)

显示错误通知。

- **参数**：
  - `message` (string): 通知消息
  - `duration` (number, 可选): 自动消失时间（毫秒），默认 5000
- **返回值**: Toast ID (string)

#### showWarning(message, duration?)

显示警告通知。

- **参数**：
  - `message` (string): 通知消息
  - `duration` (number, 可选): 自动消失时间（毫秒），默认 4000
- **返回值**: Toast ID (string)

#### addToast(options)

添加自定义通知。

- **参数**：
  - `options.type` ('success' | 'error' | 'warning'): 通知类型
  - `options.message` (string): 通知消息
  - `options.duration` (number, 可选): 自动消失时间（毫秒），默认 3000
- **返回值**: Toast ID (string)

#### removeToast(id)

手动移除指定的通知。

- **参数**：
  - `id` (string): Toast ID

#### clearAll()

清除所有通知。

## 使用场景示例

### 1. 用户操作反馈

```jsx
// 创建成功
showSuccess("角色卡创建成功");

// 更新成功
showSuccess("密码更新成功");

// 删除成功
showSuccess("角色卡已删除");
```

### 2. 错误处理

```jsx
// 网络错误
showError("网络连接失败，请检查网络设置");

// 验证错误
showError("密码长度必须在 8-100 个字符之间");

// 权限错误
showError("您没有权限执行此操作");

// 服务器错误
showError("服务器错误，请稍后重试");
```

### 3. 警告提示

```jsx
// 操作警告
showWarning("此操作不可撤销，请确认");

// 状态警告
showWarning("密码已过期，请更新密码");

// 限制警告
showWarning("已达到最大创建数量限制");
```

### 4. 复杂场景

```jsx
// 批量操作
const deleteMultipleCards = async (cardIds) => {
  const { showSuccess, showError, showWarning } = useToast();

  if (cardIds.length === 0) {
    showWarning("请至少选择一个角色卡");
    return;
  }

  try {
    await Promise.all(cardIds.map((id) => apiClient.delete(`/api/cards/${id}`)));
    showSuccess(`成功删除 ${cardIds.length} 个角色卡`);
  } catch (error) {
    showError("部分角色卡删除失败");
  }
};

// 带重试的操作
const retryableOperation = async () => {
  const { showSuccess, showError, showWarning } = useToast();
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      await someApiCall();
      showSuccess("操作成功");
      return;
    } catch (error) {
      attempts++;
      if (attempts < maxAttempts) {
        showWarning(`操作失败，正在重试 (${attempts}/${maxAttempts})`);
      } else {
        showError("操作失败，已达到最大重试次数");
      }
    }
  }
};
```

## 样式定制

Toast 组件使用 Tailwind CSS 进行样式设计，支持深色模式。如果需要自定义样式，可以修改 `Toast.jsx` 中的类名。

### 颜色方案

- **成功**: 绿色 (green-50, green-800)
- **错误**: 红色 (red-50, red-800)
- **警告**: 黄色 (yellow-50, yellow-800)

### 动画

Toast 使用 `slide-in-right` 动画从右侧滑入，动画定义在 `index.css` 中。

## 最佳实践

1. **消息简洁明了**：通知消息应该简短、清晰，避免冗长的文本
2. **选择合适的类型**：根据操作结果选择正确的通知类型
3. **合理设置持续时间**：
   - 成功消息：3 秒（默认）
   - 错误消息：5 秒（默认）
   - 警告消息：4 秒（默认）
   - 重要信息：设置为 0（不自动消失）
4. **避免过度使用**：不要为每个小操作都显示通知
5. **提供可操作的信息**：错误消息应该告诉用户如何解决问题

## 无障碍访问

Toast 组件包含以下无障碍特性：

- `role="alert"`: 标识为警告区域
- `aria-live="polite"`: 屏幕阅读器会在适当时机读取
- `aria-label`: 关闭按钮有明确的标签
- 键盘可访问：关闭按钮支持键盘操作

## 故障排查

### 通知不显示

1. 确保 `ToastProvider` 已在 `App.jsx` 中正确包裹
2. 检查是否正确导入 `useToast` hook
3. 确认 `index.css` 中包含动画样式

### 通知位置不正确

检查 `ToastProvider` 中的容器样式，确保 `fixed` 定位和 `z-index` 设置正确。

### 动画不流畅

确保 `index.css` 中的 `@keyframes` 动画已正确定义。

## 未来改进

可能的功能扩展：

- [ ] 支持自定义图标
- [ ] 支持操作按钮（如"撤销"）
- [ ] 支持进度条显示
- [ ] 支持通知位置配置（顶部、底部、左侧、右侧）
- [ ] 支持通知音效
- [ ] 支持通知历史记录
