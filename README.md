# Webpack Loader Runner Worker Demo

这是一个演示如何使用 Web Worker 来运行 webpack loaders 的项目。通过将 loader 处理放在 Worker 线程中，可以避免阻塞主线程的 UI 渲染和用户交互。

## 🚀 功能特性

- **非阻塞处理**: 使用 Web Worker 在后台线程处理文件转换
- **支持多种 Loaders**: 支持 TypeScript、Babel、CSS 等各种 webpack loaders
- **实时进度显示**: 显示处理进度和状态
- **结果展示**: 清晰展示转换后的代码和 source map
- **错误处理**: 完善的错误处理和用户提示

## 🛠️ 技术栈

- **前端**: 原生 JavaScript + HTML + CSS
- **Worker**: Web Worker + loader-runner
- **服务器**: Express.js
- **包管理**: pnpm

## 📦 安装依赖

```bash
pnpm install
```

## 🚀 启动项目

```bash
pnpm start
# 或者
npm start
```

然后在浏览器中访问 `http://localhost:3000`

## 💡 使用方法

### 1. 处理文件
点击"处理文件"按钮，系统会使用示例 TypeScript 代码和 Babel loader 进行转换。

### 2. 测试 Loaders
点击"测试 Loaders"按钮，系统会运行多个测试用例，包括：
- TypeScript + Babel 转换
- CSS + PostCSS 处理

### 3. 监控状态
- 观察进度条显示处理进度
- 查看控制台输出了解处理详情
- 查看结果展示区域获取转换后的代码

## 🔧 核心实现

### Worker 通信协议
```javascript
// 主线程发送消息
worker.postMessage({
  messageType: 'transform',
  id: 'unique-id',
  payload: [content, filename, query, loaders, sourceMap, cwd]
});

// Worker 返回结果
self.postMessage({
  id: 'unique-id',
  result: { source, map, assets, warnings, errors }
});
```

### Loader 处理流程
1. 主线程发送文件内容和 loader 配置
2. Worker 使用 `loader-runner` 执行转换
3. 返回转换结果和 source map
4. 主线程展示处理结果

## 📁 项目结构

```
webpack-loader-worker-demo/
├── public/
│   ├── index.html          # 主页面
│   └── js/
│       ├── main.js         # 主线程逻辑
│       └── worker.js       # Worker 线程逻辑
├── package.json            # 项目配置
├── server.js               # Express 服务器
└── README.md               # 项目说明
```

## 🎯 应用场景

- **构建工具**: 在浏览器中实时预览构建结果
- **代码编辑器**: 实时语法检查和转换
- **在线 IDE**: 支持多种语言的在线编译环境
- **教学演示**: 展示 webpack loader 的工作原理

## 🔍 注意事项

1. **浏览器兼容性**: 需要支持 Web Worker 的现代浏览器
2. **Loader 依赖**: 某些 loaders 可能需要额外的 polyfill
3. **文件大小**: 大型文件处理时注意内存使用
4. **错误处理**: 确保 Worker 错误不会影响主线程

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## �� 许可证

MIT License 