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

	// 不再尝试从外部 URL 加载，而是等待主线程预加载
	self.postMessage({
		type: 'debug',
		message: `🔧 等待主线程预加载 loader: ${loader.path}`
	});

	// 返回错误，提示需要预加载
	return callback(new Error(
		`Loader '${loader.path}' not found. Please preload it from the main thread first.`
	));
}

// 为 Web Worker 环境提供全局访问
if (typeof self !== 'undefined') {
	self.loadLoader = loadLoader;
} 