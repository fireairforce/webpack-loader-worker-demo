"use strict";

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
	if (self.__preloadedModules__ && self.__preloadedModules__[loader.path]) {
		const loadedModule = self.__preloadedModules__[loader.path];
		return handleResult(loader, loadedModule, callback);
	}

	self.postMessage({
		type: 'debug',
		message: `🔧 创建内置的 loader 实现: ${loader.path}`
	});

	const builtinModule = createBuiltinLoader(loader.path);
	
	if (!self.__preloadedModules__) {
		self.__preloadedModules__ = {};
	}
	self.__preloadedModules__[loader.path] = builtinModule;
	
	return handleResult(loader, builtinModule, callback);
}

function createBuiltinLoader(loaderPath) {
	const loaderName = loaderPath.replace(/^\.\//, '').replace(/\.js$/, '');
	
	switch (loaderName) {
		case 'css-loader':
			return function(source, map, meta) {
				try {
					const options = this.getOptions ? this.getOptions() : {};
					
					let processedCSS = source;
					
					if (!options.keepComments) {
						processedCSS = processedCSS.replace(/\/\*[\s\S]*?\*\//g, '');
					}
					
					processedCSS = processedCSS
						.replace(/^\s*[\r\n]/gm, '') // 移除空行
						.replace(/\s+/g, ' ') // 将多个空白字符合并为一个
						.trim();
					
					if (options.modules) {
						const className = 'css_' + Math.random().toString(36).substr(2, 9);
						processedCSS = processedCSS.replace(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g, `.${className}_$1`);
					}
					
					// 返回符合 css-loader 格式的结果
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

// 为 Web Worker 环境提供全局访问
if (typeof self !== 'undefined') {
	self.loadLoader = loadLoader;
} 