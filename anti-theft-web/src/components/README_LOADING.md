# 加载状态组件文档

本文档介绍系统中的加载状态组件及其使用方法。

## 组件概述

系统提供了两个可复用的加载状态组件：

1. **LoadingSpinner** - 通用加载动画组件
2. **LoadingButton** - 带加载状态的按钮组件

## LoadingSpinner 组件

### 功能

可复用的加载动画组件，支持多种尺寸和显示模式。

### Props

| 属性       | 类型                 | 默认值 | 说明                         |
| ---------- | -------------------- | ------ | ---------------------------- |
| size       | 'sm' \| 'md' \| 'lg' | 'md'   | 加载动画大小                 |
| text       | string               | ''     | 可选的加载文本               |
| className  | string               | ''     | 额外的 CSS 类名              |
| inline     | boolean              | false  | 是否为内联模式（用于按钮内） |
| fullScreen | boolean              | false  | 是否全屏显示                 |

### 使用示例

#### 1. 标准模式（居中显示）

```jsx
import LoadingSpinner from '../components/LoadingSpinner';

// 基本用法
<LoadingSpinner />

// 带文本
<LoadingSpinner text="加载中..." />

// 大尺寸
<LoadingSpinner size="lg" text="正在处理..." />
```

#### 2. 内联模式（用于按钮内）

```jsx
<button disabled>
  <LoadingSpinner inline size="sm" text="提交中..." />
</button>
```

#### 3. 全屏模式

```jsx
{loading && <LoadingSpinner fullScreen text="正在加载数据..." />}
```

#### 4. 在页面中使用

```jsx
const MyPage = () => {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12">
        <LoadingSpinner size="lg" text="加载中..." />
      </div>
    );
  }

  return <div>页面内容</div>;
};
```

## LoadingButton 组件

### 功能

带加载状态的按钮组件，自动处理加载动画和禁用状态。

### Props

| 属性        | 类型                            | 默认值   | 说明                     |
| ----------- | ------------------------------- | -------- | ------------------------ |
| loading     | boolean                         | false    | 是否处于加载状态         |
| children    | ReactNode                       | -        | 按钮文本内容             |
| loadingText | string                          | -        | 加载时显示的文本（可选） |
| disabled    | boolean                         | false    | 是否禁用                 |
| className   | string                          | ''       | 额外的 CSS 类名          |
| type        | 'button' \| 'submit' \| 'reset' | 'button' | 按钮类型                 |
| onClick     | function                        | -        | 点击事件处理函数         |
| ...rest     | -                               | -        | 其他 button 属性         |

### 使用示例

#### 1. 基本用法

```jsx
import LoadingButton from '../components/LoadingButton';

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
      onClick={handleSubmit}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    >
      提交
    </LoadingButton>
  );
};
```

#### 2. 自定义加载文本

```jsx
<LoadingButton
  loading={loading}
  loadingText="提交中..."
  onClick={handleSubmit}
  className="px-4 py-2 bg-blue-600 text-white rounded-md"
>
  提交
</LoadingButton>
```

#### 3. 表单提交按钮

```jsx
<form onSubmit={handleSubmit}>
  <LoadingButton
    type="submit"
    loading={loading}
    loadingText="登录中..."
    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md"
  >
    登录
  </LoadingButton>
</form>
```

## 现有实现

系统中已经在以下页面和组件中实现了加载状态：

### 页面级加载状态

1. **Login.jsx** - 登录表单提交时显示加载状态
2. **Register.jsx** - 注册表单提交时显示加载状态
3. **CardList.jsx** - 获取角色卡列表时显示加载动画
4. **CardDetail.jsx** - 获取角色卡详情时显示加载动画
5. **Settings.jsx** - 保存设置时显示加载状态

### 组件级加载状态

1. **EncryptCardModal.jsx** - 加密角色卡时显示加载状态
2. **UpdatePasswordModal.jsx** - 更新密码时显示加载状态

## 加载状态最佳实践

### 1. 何时使用加载状态

- ✅ 所有 API 请求期间
- ✅ 文件上传/下载操作
- ✅ 数据处理操作（如加密、解析）
- ✅ 页面初始化加载数据时

### 2. 加载状态的实现模式

```jsx
const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/endpoint');
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="加载中..." />;
  }

  if (error) {
    return <div>错误: {error}</div>;
  }

  return <div>{/* 渲染数据 */}</div>;
};
```

### 3. 按钮加载状态

```jsx
const MyForm = () => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/api/endpoint', formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单字段 */}
      <LoadingButton
        type="submit"
        loading={submitting}
        loadingText="提交中..."
        className="px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        提交
      </LoadingButton>
    </form>
  );
};
```

### 4. 禁用输入字段

在加载期间，应该禁用所有输入字段：

```jsx
<input
  type="text"
  value={value}
  onChange={handleChange}
  disabled={loading}
  className="px-3 py-2 border rounded-md"
/>
```

### 5. 多个加载状态

当组件有多个异步操作时，使用不同的加载状态变量：

```jsx
const MyComponent = () => {
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 分别处理不同的加载状态
};
```

## 样式指南

### 加载动画颜色

- 主要操作：蓝色 (`border-blue-600`)
- 成功操作：绿色 (`border-green-600`)
- 危险操作：红色 (`border-red-600`)

### 加载文本

- 简洁明了，使用动词 + "中..."
- 示例：
  - ✅ "加载中..."
  - ✅ "提交中..."
  - ✅ "保存中..."
  - ✅ "删除中..."
  - ❌ "请稍候"
  - ❌ "正在处理您的请求"

## 可访问性

### ARIA 属性

为加载状态添加适当的 ARIA 属性：

```jsx
<button disabled={loading} aria-busy={loading}>
  {loading ? '加载中...' : '提交'}
</button>
```

### 屏幕阅读器支持

```jsx
<div role="status" aria-live="polite">
  {loading && <LoadingSpinner text="加载中..." />}
</div>
```

## 性能考虑

1. **避免过度渲染**：使用 `useState` 而不是频繁更新的状态
2. **合理的加载时间**：如果操作很快（< 200ms），可以不显示加载状态
3. **防抖/节流**：对于频繁触发的操作，使用防抖或节流

## 测试

### 单元测试示例

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoadingButton from './LoadingButton';

test('显示加载状态', () => {
  render(<LoadingButton loading={true}>提交</LoadingButton>);
  expect(screen.getByRole('button')).toBeDisabled();
});

test('加载完成后可点击', () => {
  const handleClick = jest.fn();
  render(
    <LoadingButton loading={false} onClick={handleClick}>
      提交
    </LoadingButton>
  );
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});
```

## 相关文件

- `src/components/LoadingSpinner.jsx` - 加载动画组件
- `src/components/LoadingButton.jsx` - 加载按钮组件
- `src/pages/Login.jsx` - 登录页面加载状态示例
- `src/pages/CardList.jsx` - 列表页面加载状态示例
- `src/components/EncryptCardModal.jsx` - 模态框加载状态示例
