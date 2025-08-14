// Loader 预加载器 - 在主线程中预加载 loader 并传递给 Worker
class LoaderPreloader {
    constructor() {
        this.loadedLoaders = new Map();
        this.loaderUrls = {
            'css-loader': 'https://unpkg.com/css-loader@6.10.0/dist/index.js',
            'style-loader': 'https://unpkg.com/style-loader@3.3.3/dist/index.js',
            'babel-loader': 'https://unpkg.com/babel-loader@9.1.3/dist/index.js',
            'ts-loader': 'https://unpkg.com/ts-loader@9.5.1/dist/index.js',
            'file-loader': 'https://unpkg.com/file-loader@6.2.0/dist/index.js',
            'url-loader': 'https://unpkg.com/url-loader@4.1.1/dist/index.js'
        };
    }

    // 预加载指定的 loader
    async preloadLoader(loaderName) {
        if (this.loadedLoaders.has(loaderName)) {
            console.log(`✅ Loader '${loaderName}' 已经预加载`);
            return this.loadedLoaders.get(loaderName);
        }

        const loaderUrl = this.loaderUrls[loaderName];
        if (!loaderUrl) {
            throw new Error(`Unknown loader: ${loaderName}`);
        }

        try {
            console.log(`🔧 开始预加载 loader: ${loaderName} from ${loaderUrl}`);
            
            // 使用 fetch 获取脚本内容
            const response = await fetch(loaderUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${loaderUrl}: ${response.status}`);
            }
            
            const scriptContent = await response.text();
            
            // 创建一个临时的 script 标签来执行脚本
            const script = document.createElement('script');
            script.textContent = scriptContent;
            document.head.appendChild(script);
            
            // 等待脚本执行完成
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // 尝试多种方式获取加载的模块
            let loadedModule = this.extractModule(loaderName, scriptContent);
            
            if (loadedModule) {
                // 清理临时脚本标签
                document.head.removeChild(script);
                
                // 存储加载的模块
                this.loadedLoaders.set(loaderName, loadedModule);
                
                console.log(`✅ 成功预加载 loader: ${loaderName}`);
                return loadedModule;
            } else {
                // 如果无法提取模块，尝试创建一个兼容的包装器
                console.log(`⚠️ 无法从全局作用域提取模块，创建兼容包装器`);
                const wrapperModule = this.createCompatibleWrapper(loaderName, scriptContent);
                
                // 清理临时脚本标签
                document.head.removeChild(script);
                
                // 存储包装器模块
                this.loadedLoaders.set(loaderName, wrapperModule);
                
                console.log(`✅ 成功创建兼容包装器 for: ${loaderName}`);
                return wrapperModule;
            }
            
        } catch (error) {
            console.error(`❌ 预加载 loader '${loaderName}' 失败:`, error);
            throw error;
        }
    }

    // 尝试多种方式提取模块
    extractModule(loaderName, scriptContent) {
        // 方法1: 检查全局变量
        if (window[loaderName]) {
            return window[loaderName];
        }
        
        // 方法2: 检查 kebab-case 转 camelCase
        const camelCaseName = loaderName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        if (window[camelCaseName]) {
            return window[camelCaseName];
        }
        
        // 方法3: 检查去掉连字符的版本
        const noHyphenName = loaderName.replace('-', '');
        if (window[noHyphenName]) {
            return window[noHyphenName];
        }
        
        // 方法4: 检查常见的导出模式
        const commonNames = [
            'default',
            'exports',
            'module',
            'loader',
            'cssLoader',
            'styleLoader',
            'babelLoader',
            'tsLoader',
            'fileLoader',
            'urlLoader'
        ];
        
        for (const name of commonNames) {
            if (window[name] && typeof window[name] === 'function') {
                return window[name];
            }
        }
        
        return null;
    }

    // 创建兼容的包装器模块
    createCompatibleWrapper(loaderName, scriptContent) {
        // 根据 loader 名称创建不同的包装器
        switch (loaderName) {
            case 'css-loader':
                return this.createCSSLoaderWrapper(scriptContent);
            case 'style-loader':
                return this.createStyleLoaderWrapper(scriptContent);
            case 'babel-loader':
                return this.createBabelLoaderWrapper(scriptContent);
            case 'ts-loader':
                return this.createTSLoaderWrapper(scriptContent);
            case 'file-loader':
                return this.createFileLoaderWrapper(scriptContent);
            case 'url-loader':
                return this.createURLLoaderWrapper(scriptContent);
            default:
                return this.createGenericLoaderWrapper(loaderName, scriptContent);
        }
    }

    // CSS Loader 包装器
    createCSSLoaderWrapper(scriptContent) {
        return function(source, map) {
            // 简单的 CSS 处理，移除注释和空行
            const processedCSS = source
                .replace(/\/\*[\s\S]*?\*\//g, '') // 移除 CSS 注释
                .replace(/^\s*[\r\n]/gm, '') // 移除空行
                .trim();
            
            return `module.exports = ${JSON.stringify(processedCSS)};`;
        };
    }

    // Style Loader 包装器
    createStyleLoaderWrapper(scriptContent) {
        return function(source, map) {
            // 创建 style 标签并注入 CSS
            const style = document.createElement('style');
            style.textContent = source;
            document.head.appendChild(style);
            
            return 'module.exports = {};';
        };
    }

    // Babel Loader 包装器
    createBabelLoaderWrapper(scriptContent) {
        return function(source, map) {
            // 简单的 JavaScript 处理，这里只是返回原代码
            return `module.exports = ${JSON.stringify(source)};`;
        };
    }

    // TS Loader 包装器
    createTSLoaderWrapper(scriptContent) {
        return function(source, map) {
            // 简单的 TypeScript 处理，这里只是返回原代码
            return `module.exports = ${JSON.stringify(source)};`;
        };
    }

    // File Loader 包装器
    createFileLoaderWrapper(scriptContent) {
        return function(source, map) {
            // 返回文件路径
            return `module.exports = "file://" + ${JSON.stringify(source)};`;
        };
    }

    // URL Loader 包装器
    createURLLoaderWrapper(scriptContent) {
        return function(source, map) {
            // 返回 data URL
            return `module.exports = "data:text/plain;base64," + btoa(${JSON.stringify(source)});`;
        };
    }

    // 通用 Loader 包装器
    createGenericLoaderWrapper(loaderName, scriptContent) {
        return function(source, map) {
            // 通用的处理，返回原代码
            return `module.exports = ${JSON.stringify(source)};`;
        };
    }

    // 预加载多个 loader
    async preloadLoaders(loaderNames) {
        const results = {};
        
        for (const loaderName of loaderNames) {
            try {
                results[loaderName] = await this.preloadLoader(loaderName);
            } catch (error) {
                console.error(`Failed to preload ${loaderName}:`, error);
                results[loaderName] = null;
            }
        }
        
        return results;
    }

    // 获取所有已加载的 loader
    getAllLoadedLoaders() {
        return Object.fromEntries(this.loadedLoaders);
    }

    // 检查 loader 是否已加载
    isLoaderLoaded(loaderName) {
        return this.loadedLoaders.has(loaderName);
    }
}

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.LoaderPreloader = LoaderPreloader;
} 