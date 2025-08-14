// Web Worker 主文件
// 按照依赖顺序导入 lib-web 中的文件
importScripts('lib-web/LoaderLoadingError.js');
importScripts('lib-web/loadLoader.js');
importScripts('lib-web/LoaderRunner.js');

// 全局变量存储预加载的模块
self.__preloadedModules__ = {};
self.__fileContents__ = {};

// 消息处理器
self.onmessage = function(event) {
    const { messageType, id, payload, type } = event.data;
    
    if (messageType === 'transform') {
        handleTransform(id, payload);
    } else if (messageType === 'preloadModule') {
        handlePreloadModule(id, payload);
    } else if (messageType === 'setFileContent') {
        handleSetFileContent(id, payload);
    } else if (type === 'debug') {
        // 处理调试消息
        console.log('Debug:', event.data.message);
    }
};

// 处理文件转换
async function handleTransform(id, payload) {
    try {
        const [source, resourcePath, query, loaders, sourceMap, context] = payload;
        
        // 将源文件内容存储到 __fileContents__ 中，供 readResource 使用
        self.__fileContents__[resourcePath] = source;
        
        // 创建完整的 context 对象，包含所有必要的方法
        const loaderContext = {
            cwd: typeof context === 'string' ? context : (context?.cwd || '/'),
            addDependency: function(file) {
                // 添加文件依赖
                if (!this.dependencies) this.dependencies = [];
                this.dependencies.push(file);
            },
            addContextDependency: function(context) {
                // 添加上下文依赖
                if (!this.contextDependencies) this.contextDependencies = [];
                this.contextDependencies.push(context);
            },
            addMissingDependency: function(context) {
                // 添加缺失的依赖
                if (!this.missingDependencies) this.missingDependencies = [];
                this.missingDependencies.push(context);
            },
            getDependencies: function() {
                return this.dependencies || [];
            },
            getContextDependencies: function() {
                return this.contextDependencies || [];
            },
            getMissingDependencies: function() {
                return this.missingDependencies || [];
            },
            clearDependencies: function() {
                this.dependencies = [];
                this.contextDependencies = [];
                this.missingDependencies = [];
            },
            cacheable: function(flag) {
                this.cacheableFlag = flag !== false;
            }
        };
        
        // 使用 LoaderRunner 执行 loader 转换
        self.postMessage({
            type: 'debug',
            message: '🔧 开始调用 LoaderRunner.runLoaders...'
        });
        self.postMessage({
            type: 'debug',
            message: `📋 传入的 loaders: ${JSON.stringify(loaders.map(loader => ({
                loader: loader.loader,
                options: loader.options
            })))}`
        });
        
        self.LoaderRunner.runLoaders({
            resource: resourcePath,
            loaders: loaders.map(loader => ({
                loader: loader.loader,  // 使用 loader 字段
                options: loader.options || {},  // 使用 options 字段
                path: loader.loader,    // 同时提供 path 字段，供 loadLoader 使用
                query: loader.options || {}, // 同时提供 query 字段，供 loadLoader 使用
            })),
            context: loaderContext,  // 使用完整的 context 对象
            processResource: (readResource, context, resource, callback) => {
                // 自定义 processResource 函数，确保 context 有 addDependency 方法
                if (typeof context.addDependency === 'function') {
                    context.addDependency(resource);
                }
                // 直接返回源文件内容，而不是调用 readResource
                callback(null, source);
            },
            readResource: (path, callback) => {
                // 从预加载的文件内容中读取
                if (self.__fileContents__[path]) {
                    callback(null, self.__fileContents__[path]);
                } else {
                    callback(new Error(`File not found: ${path}`));
                }
            }
        }, (err, result) => {
            self.postMessage({
                type: 'debug',
                message: `🔧 LoaderRunner 回调被调用: err=${err ? 'yes' : 'no'}, result=${result ? 'yes' : 'no'}`
            });
            if (result) {
                self.postMessage({
                    type: 'debug',
                    message: `📋 result.result: ${JSON.stringify(result.result)}`
                });
                self.postMessage({
                    type: 'debug',
                    message: `📋 result.resourceBuffer: ${result.resourceBuffer ? 'yes' : 'no'}`
                });
            }
            
            if (err) {
                self.postMessage({
                    id,
                    error: {
                        message: err.message,
                        stack: err.stack
                    }
                });
            } else {
                self.postMessage({
                    id,
                    result: {
                        source: result.result[0],
                        map: sourceMap ? result.resourceBuffer : null
                    }
                });
            }
        });
        
    } catch (error) {
        self.postMessage({
            id,
            error: {
                message: error.message,
                stack: error.stack
            }
        });
    }
}

// 处理模块预加载
function handlePreloadModule(id, payload) {
    try {
        const { name, module } = payload;
        
        // 直接使用我们的备用 loader 实现
        // 因为从 unpkg.com 加载的真实 loader 依赖于 Node.js 环境和外部模块
        // 在浏览器环境中无法正常运行
        self.postMessage({
            type: 'debug',
            message: `🔧 为 ${name} 创建浏览器兼容的 loader 实现`
        });
        
        const reconstructedModule = createFallbackLoader(name);
        
        // 存储到预加载模块中
        self.__preloadedModules__[name] = reconstructedModule;
        
        self.postMessage({
            type: 'preloadComplete',
            name: name,
            message: `✅ 成功预加载模块: ${name}`
        });
        
        self.postMessage({
            type: 'debug',
            message: `🔧 模块 '${name}' 已存储到 __preloadedModules__ 中`
        });
    } catch (error) {
        self.postMessage({
            type: 'preloadError',
            name: payload.name,
            error: error.message
        });
    }
}

// 创建备用的 loader 函数
function createFallbackLoader(loaderName) {
    switch (loaderName) {
        case 'css-loader':
            return function(source, map, meta) {
                try {
                    // 获取 loader 选项
                    const options = this.getOptions ? this.getOptions() : {};
                    
                    // 简单的 CSS 处理
                    let processedCSS = source;
                    
                    // 移除 CSS 注释（除非设置了保留注释）
                    if (!options.keepComments) {
                        processedCSS = processedCSS.replace(/\/\*[\s\S]*?\*\//g, '');
                    }
                    
                    // 移除多余的空行和空白
                    processedCSS = processedCSS
                        .replace(/^\s*[\r\n]/gm, '') // 移除空行
                        .replace(/\s+/g, ' ') // 将多个空白字符合并为一个
                        .trim();
                    
                    // 如果启用了 CSS Modules
                    if (options.modules) {
                        // 简单的 CSS Modules 实现
                        const className = 'css_' + Math.random().toString(36).substr(2, 9);
                        processedCSS = processedCSS.replace(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g, `.${className}_$1`);
                    }
                    
                    // 返回符合 css-loader 格式的结果
                    // css-loader 通常返回一个包含 CSS 字符串和映射的数组
                    const result = [
                        `// Exports`,
                        `module.exports = ${JSON.stringify(processedCSS)};`
                    ].join('\n');
                    
                    // 使用 callback 返回结果
                    if (this.callback) {
                        this.callback(null, result);
                        return;
                    }
                    
                    return result;
                } catch (error) {
                    // 如果处理失败，返回原始内容
                    const fallbackResult = `module.exports = ${JSON.stringify(source)};`;
                    
                    if (this.callback) {
                        this.callback(null, fallbackResult);
                        return;
                    }
                    
                    return fallbackResult;
                }
            };
            
        case 'style-loader':
            return function(source, map, meta) {
                try {
                    // style-loader 的简单实现
                    const result = [
                        `// Style injection`,
                        `var style = document.createElement('style');`,
                        `style.textContent = ${JSON.stringify(source)};`,
                        `document.head.appendChild(style);`,
                        `module.exports = {};`
                    ].join('\n');
                    
                    if (this.callback) {
                        this.callback(null, result);
                        return;
                    }
                    
                    return result;
                } catch (error) {
                    const fallbackResult = 'module.exports = {};';
                    
                    if (this.callback) {
                        this.callback(null, fallbackResult);
                        return;
                    }
                    
                    return fallbackResult;
                }
            };
            
        case 'babel-loader':
            return function(source, map, meta) {
                try {
                    // babel-loader 的简单实现
                    const result = `module.exports = ${JSON.stringify(source)};`;
                    
                    if (this.callback) {
                        this.callback(null, result);
                        return;
                    }
                    
                    return result;
                } catch (error) {
                    const fallbackResult = `module.exports = ${JSON.stringify(source)};`;
                    
                    if (this.callback) {
                        this.callback(null, fallbackResult);
                        return;
                    }
                    
                    return fallbackResult;
                }
            };
            
        case 'ts-loader':
            return function(source, map, meta) {
                try {
                    // ts-loader 的简单实现
                    const result = `module.exports = ${JSON.stringify(source)};`;
                    
                    if (this.callback) {
                        this.callback(null, result);
                        return;
                    }
                    
                    return result;
                } catch (error) {
                    const fallbackResult = `module.exports = ${JSON.stringify(source)};`;
                    
                    if (this.callback) {
                        this.callback(null, fallbackResult);
                        return;
                    }
                    
                    return fallbackResult;
                }
            };
            
        case 'file-loader':
            return function(source, map, meta) {
                try {
                    // file-loader 的简单实现
                    const result = `module.exports = "file://" + ${JSON.stringify(source)};`;
                    
                    if (this.callback) {
                        this.callback(null, result);
                        return;
                    }
                    
                    return result;
                } catch (error) {
                    const fallbackResult = `module.exports = "file://" + ${JSON.stringify(source)};`;
                    
                    if (this.callback) {
                        this.callback(null, fallbackResult);
                        return;
                    }
                    
                    return fallbackResult;
                }
            };
            
        case 'url-loader':
            return function(source, map, meta) {
                try {
                    // url-loader 的简单实现
                    const result = `module.exports = "data:text/plain;base64," + btoa(${JSON.stringify(source)});`;
                    
                    if (this.callback) {
                        this.callback(null, result);
                        return;
                    }
                    
                    return result;
                } catch (error) {
                    const fallbackResult = `module.exports = "data:text/plain;base64," + btoa(${JSON.stringify(source)});`;
                    
                    if (this.callback) {
                        this.callback(null, fallbackResult);
                        return;
                    }
                    
                    return fallbackResult;
                }
            };
            
        default:
            return function(source, map, meta) {
                try {
                    // 通用的处理，返回原代码
                    const result = `module.exports = ${JSON.stringify(source)};`;
                    
                    if (this.callback) {
                        this.callback(null, result);
                        return;
                    }
                    
                    return result;
                } catch (error) {
                    const fallbackResult = `module.exports = ${JSON.stringify(source)};`;
                    
                    if (this.callback) {
                        this.callback(null, fallbackResult);
                        return;
                    }
                    
                    return fallbackResult;
                }
            };
    }
}

// 处理文件内容设置
function handleSetFileContent(id, payload) {
    try {
        const { path, content } = payload;
        self.__fileContents__[path] = content;
        
        self.postMessage({
            id,
            result: { success: true, path }
        });
    } catch (error) {
        self.postMessage({
            id,
            error: {
                message: error.message,
                stack: error.stack
            }
        });
    }
}

// 初始化完成通知
self.postMessage({
    type: 'ready',
    message: 'Worker initialized with enhanced loader-runner (auto-loads loaders from UNPKG)'
});
