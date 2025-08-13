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
        const { moduleName, moduleCode } = payload;
        
        // 安全地创建模块
        const moduleFunc = new Function('module', 'exports', moduleCode + '\nreturn module.exports;');
        const module = { exports: {} };
        const result = moduleFunc(module, module.exports);
        
        // 存储到预加载模块中
        self.__preloadedModules__[moduleName] = result;
        
        self.postMessage({
            id,
            result: { success: true, moduleName }
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
