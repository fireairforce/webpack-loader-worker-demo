# Web Worker Loader 测试 Demo

这个 Demo 展示了如何在 Web Worker 中使用内置的 loader 功能，特别是 less-loader。

## 功能特性

- ✅ 在 Web Worker 中运行 loader 转换
- ✅ 内置 less-loader 支持
- ✅ 内置 css-loader 支持
- ✅ 内置 style-loader 支持
- ✅ 支持 loader 链式处理
- ✅ 实时调试信息输出

## 文件结构

```
public_worker_test/
├── index.html              # 主页面
├── js/
│   ├── main.js             # 主线程逻辑
│   ├── worker.js           # Web Worker 主文件
│   ├── worker-2.js         # 备用 Worker 文件
│   ├── lib-web/            # loader-runner 相关库
│   │   ├── LoaderLoadingError.js
│   │   ├── LoaderRunner.js
│   │   └── loadLoader.js
│   └── loaders/            # 内置 loader 实现
│       ├── less-loader-simple.js      # 简化的 less-loader
│       └── less-loader-web-worker.js  # webpack 打包的 less-loader
└── README.md               # 本文件
```

## 使用方法

1. 启动本地服务器：
   ```bash
   python3 -m http.server 8080
   ```

2. 打开浏览器访问：
   ```
   http://localhost:8080/public_worker_test/
   ```

3. 点击测试按钮：
   - **测试 CSS Loader**: 测试基本的 CSS 处理
   - **测试 Less Loader**: 测试 Less 语法转换
   - **测试 Loader 链**: 测试多个 loader 的链式处理

## Less Loader 功能

### 支持的 Less 语法

1. **变量定义和使用**:
   ```less
   @primary-color: #007bff;
   .button {
       background: @primary-color;
   }
   ```

2. **嵌套规则**:
   ```less
   .button {
       background: #007bff;
       &:hover {
           background: darken(@primary-color, 10%);
       }
   }
   ```

3. **函数调用**:
   ```less
   .button {
       background: darken(@primary-color, 10%);
       color: lighten(@text-color, 20%);
   }
   ```

### 转换示例

**输入 (Less)**:
```less
@primary-color: #007bff;
@border-radius: 5px;

.button {
    background: @primary-color;
    border-radius: @border-radius;
    
    &:hover {
        background: darken(@primary-color, 10%);
    }
}
```

**输出 (CSS)**:
```css
.button {
    background: #007bff;
    border-radius: 5px;
}

.button:hover {
    background: #007bff;
}
```

## 技术实现

### Worker 通信

Worker 和主线程通过 `postMessage` 进行通信：

```javascript
// 主线程发送转换请求
worker.postMessage({
    messageType: 'transform',
    id: 'unique-id',
    payload: [source, resourcePath, query, loaders, sourceMap, context]
});

// Worker 返回结果
self.postMessage({
    id: 'unique-id',
    result: {
        source: processedCSS,
        map: sourceMap
    }
});
```

### Loader 集成

Worker 内置了简化的 loader 实现：

1. **less-loader-simple.js**: 专门为 Worker 环境设计的简化版本
2. **LoaderRunner**: 用于处理复杂的 loader 链
3. **Context 对象**: 提供 loader 所需的上下文方法

### 错误处理

- 详细的错误信息输出
- 调试信息实时显示
- 优雅的错误恢复机制

## 扩展开发

### 添加新的 Loader

1. 在 `js/loaders/` 目录下创建新的 loader 文件
2. 在 `worker.js` 中加载并注册 loader
3. 在 `main.js` 中添加测试用例

### 自定义 Less 功能

可以修改 `less-loader-simple.js` 来添加更多 Less 功能：

- 更复杂的嵌套规则处理
- 混合 (mixins) 支持
- 更多内置函数
- 导入文件支持

## 注意事项

1. 这是一个演示项目，生产环境建议使用成熟的构建工具
2. Less 功能是简化实现，不支持所有 Less 语法
3. 性能优化和错误处理可以根据实际需求进一步完善

## 许可证

MIT License 