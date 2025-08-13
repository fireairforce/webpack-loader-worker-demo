"use strict";

// 直接定义全局函数，兼容 importScripts
function handleResult(loader, module, callback) {
	if (typeof module !== "function" && typeof module !== "object") {
		return callback(
			new self.LoaderLoadingError(
				`Module '${
					loader.path
				}' is not a loader (export function or es6 module)`
			)
		);
	}

	loader.normal = typeof module === "function" ? module : module.exports;
	loader.pitch = module.pitch;
	loader.raw = module.raw;

	// 添加调试信息
	if (typeof self.postMessage === 'function') {
		self.postMessage({
			type: 'debug',
			message: `🔧 handleResult: loader '${loader.path}' 设置完成`
		});
		self.postMessage({
			type: 'debug',
			message: `📋 loader.normal: ${typeof loader.normal}, loader.pitch: ${typeof loader.pitch}, loader.raw: ${loader.raw}`
		});
		self.postMessage({
			type: 'debug',
			message: `📋 loader 对象: ${JSON.stringify({
				path: loader.path,
				query: loader.query,
				normal: typeof loader.normal,
				pitch: typeof loader.pitch,
				raw: loader.raw
			})}`
		});
	}

	if (
		typeof loader.normal !== "function" &&
		typeof loader.pitch !== "function"
	) {
		return callback(
			new self.LoaderLoadingError(
				`Module '${
					loader.path
				}' is not a loader (must have normal or pitch function)`
			)
		);
	}
	callback();
}

function loadLoader(loader, callback) {
	// 首先检查是否已经预加载
	if (self.__preloadedModules__ && self.__preloadedModules__[loader.path]) {
		const loadedModule = self.__preloadedModules__[loader.path];
		return handleResult(loader, loadedModule, callback);
	}

	// 尝试通过 importScripts 动态加载 loader
	try {
		// 构建 loader 的 CDN URL - 使用更通用的方式
		let loaderUrl;
		
		if (loader.path === 'css-loader') {
			loaderUrl = 'https://unpkg.com/css-loader@6.10.0/dist/index.js';
		} else if (loader.path === 'style-loader') {
			loaderUrl = 'https://unpkg.com/style-loader@3.3.3/dist/index.js';
		} else if (loader.path === 'babel-loader') {
			loaderUrl = 'https://unpkg.com/babel-loader@9.1.3/dist/index.js';
		} else if (loader.path === 'ts-loader') {
			loaderUrl = 'https://unpkg.com/ts-loader@9.5.1/dist/index.js';
		} else if (loader.path === 'file-loader') {
			loaderUrl = 'https://unpkg.com/file-loader@6.2.0/dist/index.js';
		} else if (loader.path === 'url-loader') {
			loaderUrl = 'https://unpkg.com/url-loader@4.1.1/dist/index.js';
		} else {
			// 对于其他 loader，尝试通用的命名模式
			loaderUrl = `https://unpkg.com/${loader.path}/dist/index.js`;
		}

		// 添加调试信息
		if (typeof self.postMessage === 'function') {
			self.postMessage({
				type: 'debug',
				message: `🔧 开始从 UNPKG 加载 ${loader.path}: ${loaderUrl}`
			});
		}

		// 动态加载 loader
		importScripts(loaderUrl);
		
		// 添加调试信息
		if (typeof self.postMessage === 'function') {
			self.postMessage({
				type: 'debug',
				message: `🔧 成功加载脚本，尝试获取模块对象`
			});
		}
		
		// 尝试从全局作用域获取加载的模块
		// 大多数 loader 会暴露在全局作用域中
		let loadedModule = null;
		
		// 检查常见的全局变量名
		if (self[loader.path]) {
			loadedModule = self[loader.path];
		} else if (self[loader.path.replace('-', '')]) {
			loadedModule = self[loader.path.replace('-', '')];
		} else if (self[loader.path.replace(/-([a-z])/g, (g) => g[1].toUpperCase())]) {
			// 将 kebab-case 转换为 camelCase
			loadedModule = self[loader.path.replace(/-([a-z])/g, (g) => g[1].toUpperCase())];
		}
		
		// 添加调试信息
		if (typeof self.postMessage === 'function') {
			self.postMessage({
				type: 'debug',
				message: `🔧 模块获取结果: ${loadedModule ? '成功' : '失败'}, 类型: ${typeof loadedModule}`
			});
		}
		
		if (loadedModule) {
			// 将加载的模块存储到预加载模块中，避免重复加载
			if (!self.__preloadedModules__) {
				self.__preloadedModules__ = {};
			}
			self.__preloadedModules__[loader.path] = loadedModule;
			
			return handleResult(loader, loadedModule, callback);
		} else {
			// 如果无法找到模块，尝试从预加载的模块中查找
			const preloadedModule = self.__preloadedModules__ && self.__preloadedModules__[loader.path];
			if (preloadedModule) {
				return handleResult(loader, preloadedModule, callback);
			}
			
			return callback(new Error(
				`Failed to load loader '${loader.path}' from ${loaderUrl}. The loader might not be compatible with importScripts.`
			));
		}
		
	} catch (err) {
		// 添加调试信息
		if (typeof self.postMessage === 'function') {
			self.postMessage({
				type: 'debug',
				message: `❌ 加载 ${loader.path} 失败: ${err.message}`
			});
		}
		
		// 如果动态加载失败，尝试从预加载的模块中查找
		const preloadedModule = self.__preloadedModules__ && self.__preloadedModules__[loader.path];
		if (preloadedModule) {
			return handleResult(loader, preloadedModule, callback);
		}
		
		return callback(new Error(
			`Failed to load loader '${loader.path}': ${err.message}`
		));
	}
}

// 为 Web Worker 环境提供全局访问
if (typeof self !== 'undefined') {
	self.loadLoader = loadLoader;
} 