# Webpack Loader Worker Demo

这是一个演示如何在 Web Worker 中使用 webpack loader-runner 的项目。

## 功能特性

- 🚀 使用 Web Worker 运行 webpack loaders，避免阻塞主线程
- 🔧 支持自定义 loader 开发
- 📊 实时进度显示和性能监控
- 🧪 多种 loader 组合测试

## 项目结构

```
webpack-loader-worker-demo/
├── public/
│   ├── index.html          # 主页面
│   └── js/
│       ├── main.js         # 主线程逻辑
│       └── worker.js       # Web Worker 实现
├── simple-loader.js        # 自定义 webpack loader
├── server.js               # 开发服务器
└── package.json
```

## 自定义 Loader

### Simple Loader

`simple-loader.js` 是一个简单的 webpack loader 示例，它会：

1. 为每个文件添加处理头注释
2. 将 `console.log` 转换为 `console.info`
3. 为 TypeScript 文件添加类型增强注释
4. 为 CSS 文件添加处理完成注释

```javascript
// 使用方式
{
    loader: 'simple-loader',
    options: {}
}
```

### Loader 工作原理

1. **主线程**：发送文件内容和 loader 配置到 Worker
2. **Worker 线程**：使用 loader-runner 执行 loader 处理
3. **结果返回**：处理后的内容通过消息传递返回主线程

## 使用方法

### 启动项目

```bash
# 安装依赖
npm install

# 启动开发服务器
node server.js
```

### 浏览器测试

1. 打开 `http://localhost:3000`
2. 点击"测试 Simple Loader"按钮
3. 观察处理结果和输出

### 开发自定义 Loader

1. 创建新的 loader 文件（如 `my-loader.js`）
2. 实现 loader 函数
3. 在 main.js 中配置使用
4. 在 worker.js 中添加相应的处理逻辑

## Loader 开发规范

### 基本结构

```javascript
module.exports = function(source, map, meta) {
    const callback = this.async();
    
    // 处理逻辑
    let processedSource = source;
    
    // 返回结果
    callback(null, processedSource, map, meta);
};
```

### 上下文对象 (this)

- `this.resourcePath`: 文件路径
- `this.async()`: 异步处理
- `this.callback()`: 同步处理
- `this.query`: loader 选项

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **Web Worker**: 多线程处理
- **Webpack Loader Runner**: loader 执行引擎
- **Node.js**: 开发服务器

## 注意事项

1. Web Worker 环境中无法使用 Node.js 模块
2. Loader 需要适配浏览器环境
3. 文件系统操作需要通过消息传递实现
4. 复杂 loader 可能需要额外的 polyfill

## 扩展功能

- 支持更多 loader 类型
- 添加文件上传功能
- 实现 loader 链式处理
- 添加错误处理和重试机制
- 支持 source map 生成

## 许可证

MIT License 