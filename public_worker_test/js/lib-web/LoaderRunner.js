/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

const Buffer = (typeof globalThis !== 'undefined' && globalThis.Buffer) || 
               (typeof self !== 'undefined' && self.Buffer) || 
               (typeof window !== 'undefined' && window.Buffer) ||
               null; // 移除对 buffer 模块的依赖

// Web Worker 环境下的文件读取函数
function readFile(path, callback) {
	// 在 Web Worker 中，文件读取需要通过 postMessage 与主线程通信
	// 或者使用预加载的文件内容
	if (self.__fileContents__ && self.__fileContents__[path]) {
		return callback(null, self.__fileContents__[path]);
	}
	
	// 如果没有预加载的文件内容，尝试通过 postMessage 请求
	if (self.postMessage) {
		const requestId = Math.random().toString(36).substr(2, 9);
		
		// 设置响应处理器
		const responseHandler = (event) => {
			if (event.data.type === 'fileResponse' && event.data.requestId === requestId) {
				self.removeEventListener('message', responseHandler);
				if (event.data.error) {
					callback(new Error(event.data.error));
				} else {
					callback(null, event.data.content);
				}
			}
		};
		
		self.addEventListener('message', responseHandler);
		
		// 发送文件读取请求
		self.postMessage({
			type: 'readFile',
			requestId,
			path
		});
		
		// 设置超时
		setTimeout(() => {
			self.removeEventListener('message', responseHandler);
			callback(new Error(`File read timeout for: ${path}`));
		}, 10000);
	} else {
		callback(new Error(`Cannot read file in Web Worker: ${path}`));
	}
}

function utf8BufferToString(buf) {
	const str = buf.toString("utf8");
	if (str.charCodeAt(0) === 0xfeff) {
		return str.slice(1);
	}
	return str;
}

const PATH_QUERY_FRAGMENT_REGEXP =
	/^((?:\0.|[^?#\0])*)(\?(?:\0.|[^#\0])*)?(#.*)?$/;

/**
 * @param {string} str the path with query and fragment
 * @returns {{ path: string, query: string, fragment: string }} parsed parts
 */
function parsePathQueryFragment(str) {
	const match = PATH_QUERY_FRAGMENT_REGEXP.exec(str);
	return {
		path: match[1].replace(/\0(.)/g, "$1"),
		query: match[2] ? match[2].replace(/\0(.)/g, "$1") : "",
		fragment: match[3] || "",
	};
}

function dirname(path) {
	if (path === "/") return "/";
	const i = path.lastIndexOf("/");
	const j = path.lastIndexOf("\\");
	const i2 = path.indexOf("/");
	const j2 = path.indexOf("\\");
	const idx = i > j ? i : j;
	const idx2 = i > j ? i2 : j2;
	if (idx < 0) return path;
	if (idx === idx2) return path.slice(0, idx + 1);
	return path.slice(0, idx);
}

function createLoaderObject(loader) {
	const obj = {
		path: null,
		query: null,
		fragment: null,
		options: null,
		ident: null,
		normal: null,
		pitch: null,
		raw: null,
		data: null,
		pitchExecuted: false,
		normalExecuted: false,
	};
	Object.defineProperty(obj, "request", {
		enumerable: true,
		get() {
			return (
				obj.path.replace(/#/g, "\0#") +
				obj.query.replace(/#/g, "\0#") +
				obj.fragment
			);
		},
		set(value) {
			if (typeof value === "string") {
				const splittedRequest = parsePathQueryFragment(value);
				obj.path = splittedRequest.path;
				obj.query = splittedRequest.query;
				obj.fragment = splittedRequest.fragment;
				obj.options = undefined;
				obj.ident = undefined;
			} else {
				if (!value.loader) {
					throw new Error(
						`request should be a string or object with loader and options (${JSON.stringify(
							value
						)})`
					);
				}
				obj.path = value.loader;
				obj.fragment = value.fragment || "";
				obj.type = value.type;
				obj.options = value.options;
				obj.ident = value.ident;
				
				// 修复：确保 query 字段被正确设置
				if (obj.options === null) {
					obj.query = "";
				} else if (obj.options === undefined) {
					obj.query = "";
				} else if (typeof obj.options === "string") {
					obj.query = `?${obj.options}`;
				} else if (obj.ident) {
					obj.query = `??${obj.ident}`;
				} else if (typeof obj.options === "object" && obj.options.ident) {
					obj.query = `??${obj.options.ident}`;
				} else {
					obj.query = `?${JSON.stringify(obj.options)}`;
				}
				
				// 添加调试信息
				if (typeof self !== 'undefined' && self.postMessage) {
					self.postMessage({
						type: 'debug',
						message: `🔧 createLoaderObject: path=${obj.path}, query=${obj.query}, options=${JSON.stringify(obj.options)}`
					});
				}
			}
		},
	});
	obj.request = loader;
	if (Object.preventExtensions) {
		Object.preventExtensions(obj);
	}
	return obj;
}

function runSyncOrAsync(fn, context, args, callback) {
	let isSync = true;
	let isDone = false;
	let isError = false; // internal error
	let reportedError = false;

	// eslint-disable-next-line func-name-matching
	const innerCallback = (context.callback = function innerCallback() {
		if (isDone) {
			if (reportedError) return; // ignore
			throw new Error("callback(): The callback was already called.");
		}

		isDone = true;
		isSync = false;

		try {
			callback.apply(null, arguments);
		} catch (err) {
			isError = true;
			throw err;
		}
	});

	context.async = function async() {
		if (isDone) {
			if (reportedError) return; // ignore
			throw new Error("async(): The callback was already called.");
		}

		isSync = false;

		return innerCallback;
	};

	try {
		const result = (function LOADER_EXECUTION() {
			return fn.apply(context, args);
		})();
		if (isSync) {
			isDone = true;
			if (result === undefined) return callback();
			if (
				result &&
				typeof result === "object" &&
				typeof result.then === "function"
			) {
				return result.then((r) => {
					callback(null, r);
				}, callback);
			}
			return callback(null, result);
		}
	} catch (err) {
		if (isError) throw err;
		if (isDone) {
			// loader is already "done", so we cannot use the callback function
			// for better debugging we print the error on the console
			if (typeof err === "object" && err.stack) {
				// eslint-disable-next-line no-console
				console.error(err.stack);
			} else {
				// eslint-disable-next-line no-console
				console.error(err);
			}
			return;
		}
		isDone = true;
		reportedError = true;
		callback(err);
	}
}

function convertArgs(args, raw) {
	if (!raw && Buffer && Buffer.isBuffer(args[0])) {
		args[0] = utf8BufferToString(args[0]);
	} else if (raw && typeof args[0] === "string") {
		args[0] = Buffer.from(args[0], "utf8");
	}
}

function iterateNormalLoaders(options, loaderContext, args, callback) {
	// 添加调试信息
	if (typeof self !== 'undefined' && self.postMessage) {
		self.postMessage({
			type: 'debug',
			message: `🔧 iterateNormalLoaders 被调用, loaderIndex=${loaderContext.loaderIndex}, loaders.length=${loaderContext.loaders.length}`
		});
	}
	
	if (loaderContext.loaderIndex < 0) return callback(null, args);

	const currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];

	// 添加调试信息
	if (typeof self !== 'undefined' && self.postMessage) {
		self.postMessage({
			type: 'debug',
			message: `🔧 当前 loader: ${currentLoaderObject.path}, normalExecuted=${currentLoaderObject.normalExecuted}`
		});
	}

	// iterate
	if (currentLoaderObject.normalExecuted) {
		loaderContext.loaderIndex--;
		return iterateNormalLoaders(options, loaderContext, args, callback);
	}

	const fn = currentLoaderObject.normal;
	currentLoaderObject.normalExecuted = true;
	if (!fn) return iterateNormalLoaders(options, loaderContext, args, callback);

	// 添加调试信息
	if (typeof self !== 'undefined' && self.postMessage) {
		self.postMessage({
			type: 'debug',
			message: `🔧 准备执行 loader function, args[0] 长度: ${args[0] ? args[0].length : 'undefined'}`
		});
	}

	convertArgs(args, currentLoaderObject.raw);

	runSyncOrAsync(fn, loaderContext, args, function runSyncOrAsyncCallback(err) {
		// 添加调试信息
		if (typeof self !== 'undefined' && self.postMessage) {
			self.postMessage({
				type: 'debug',
				message: `🔧 loader 执行完成, err=${err ? 'yes' : 'no'}, 结果参数数量: ${arguments.length}`
			});
		}
		
		if (err) return callback(err);

		const args = Array.prototype.slice.call(arguments, 1);
		iterateNormalLoaders(options, loaderContext, args, callback);
	});
}

function processResource(options, loaderContext, callback) {
	// 添加调试信息
	if (typeof self !== 'undefined' && self.postMessage) {
		self.postMessage({
			type: 'debug',
			message: `🔧 processResource 被调用，resource: ${loaderContext.resource}`
		});
	}
	
	const resource = loaderContext.resource;
	if (!resource) return callback(null, []);

	options.processResource(
		options.readResource || readFile,
		loaderContext,
		resource,
		function processResourceCallback(err, buffer) {
			// 添加调试信息
			if (typeof self !== 'undefined' && self.postMessage) {
				self.postMessage({
					type: 'debug',
					message: `🔧 processResource 回调，err=${err ? 'yes' : 'no'}，buffer长度: ${buffer ? buffer.length : 'undefined'}`
				});
			}
			
			if (err) return callback(err);
			options.resourceBuffer = buffer;
			
			// 设置 loaderIndex 为最后一个 loader，准备从后往前执行 normal loaders
			loaderContext.loaderIndex = loaderContext.loaders.length - 1;
			
			// 添加调试信息
			if (typeof self !== 'undefined' && self.postMessage) {
				self.postMessage({
					type: 'debug',
					message: `🔧 processResource 完成，开始执行 normal loaders，loaderIndex=${loaderContext.loaderIndex}`
				});
			}
			
			// 调用 iterateNormalLoaders 来执行所有 normal loader 函数
			iterateNormalLoaders(options, loaderContext, [buffer], callback);
		}
	);
}

function iteratePitchingLoaders(options, loaderContext, callback) {
	// 添加调试信息
	if (typeof self !== 'undefined' && self.postMessage) {
		self.postMessage({
			type: 'debug',
			message: `🔧 iteratePitchingLoaders 被调用，loaderIndex=${loaderContext.loaderIndex}，loaders.length=${loaderContext.loaders.length}`
		});
	}
	
	// abort after last loader
	if (loaderContext.loaderIndex >= loaderContext.loaders.length) {
		if (typeof self !== 'undefined' && self.postMessage) {
			self.postMessage({
				type: 'debug',
				message: `🔧 Pitching 阶段完成，开始 processResource`
			});
		}
		return processResource(options, loaderContext, callback);
	}

	const currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];

	// 添加调试信息
	if (typeof self !== 'undefined' && self.postMessage) {
		self.postMessage({
			type: 'debug',
			message: `🔧 当前 pitching loader: ${currentLoaderObject.path}，pitchExecuted=${currentLoaderObject.pitchExecuted}`
		});
	}

	// iterate
	if (currentLoaderObject.pitchExecuted) {
		loaderContext.loaderIndex++;
		return iteratePitchingLoaders(options, loaderContext, callback);
	}

	// load loader module
	loadLoader(currentLoaderObject, (err) => {
		if (err) {
			loaderContext.cacheable(false);
			return callback(err);
		}
		const fn = currentLoaderObject.pitch;
		currentLoaderObject.pitchExecuted = true;
		if (!fn) {
			if (typeof self !== 'undefined' && self.postMessage) {
				self.postMessage({
					type: 'debug',
					message: `🔧 没有 pitch 函数，继续下一个 loader`
				});
			}
			return iteratePitchingLoaders(options, loaderContext, callback);
		}

		if (typeof self !== 'undefined' && self.postMessage) {
			self.postMessage({
				type: 'debug',
				message: `🔧 执行 pitch 函数`
			});
		}

		runSyncOrAsync(
			fn,
			loaderContext,
			[
				loaderContext.remainingRequest,
				loaderContext.previousRequest,
				(currentLoaderObject.data = {}),
			],
			function runSyncOrAsyncCallback(err) {
				if (err) return callback(err);
				const args = Array.prototype.slice.call(arguments, 1);
				// Determine whether to continue the pitching process based on
				// argument values (as opposed to argument presence) in order
				// to support synchronous and asynchronous usages.
				const hasArg = args.some((value) => value !== undefined);
				if (hasArg) {
					if (typeof self !== 'undefined' && self.postMessage) {
						self.postMessage({
							type: 'debug',
							message: `🔧 Pitch 返回了结果，跳转到 normal loaders`
						});
					}
					loaderContext.loaderIndex--;
					iterateNormalLoaders(options, loaderContext, args, callback);
				} else {
					if (typeof self !== 'undefined' && self.postMessage) {
						self.postMessage({
							type: 'debug',
							message: `🔧 Pitch 没有返回结果，继续 pitching`
						});
					}
					iteratePitchingLoaders(options, loaderContext, callback);
				}
			}
		);
	});
}

// 创建 LoaderRunner 类
class LoaderRunner {
	static getContext(resource) {
		const { path } = parsePathQueryFragment(resource);
		return dirname(path);
	}

	static runLoaders(options, callback) {
		// read options
		const resource = options.resource || "";
		let loaders = options.loaders || [];
		const loaderContext = options.context || {};
		const processResource =
			options.processResource ||
			((readResource, context, resource, callback) => {
				context.addDependency(resource);
				readResource(resource, callback);
			}).bind(null, options.readResource || readFile);

		//
		const splittedResource = resource && parsePathQueryFragment(resource);
		const resourcePath = splittedResource ? splittedResource.path : undefined;
		const resourceQuery = splittedResource ? splittedResource.query : undefined;
		const resourceFragment = splittedResource
			? splittedResource.fragment
			: undefined;
		const contextDirectory = resourcePath ? dirname(resourcePath) : null;

		// execution state
		let requestCacheable = true;
		const fileDependencies = [];
		const contextDependencies = [];
		const missingDependencies = [];

		// prepare loader objects
		loaders = loaders.map(createLoaderObject);

		loaderContext.context = contextDirectory;
		loaderContext.loaderIndex = 0;
		loaderContext.loaders = loaders;
		loaderContext.resourcePath = resourcePath;
		loaderContext.resourceQuery = resourceQuery;
		loaderContext.resourceFragment = resourceFragment;
		loaderContext.async = null;
		loaderContext.callback = null;
		loaderContext.cacheable = function cacheable(flag) {
			if (flag === false) {
				requestCacheable = false;
			}
		};
		loaderContext.dependency = loaderContext.addDependency =
			function addDependency(file) {
				fileDependencies.push(file);
			};
		loaderContext.addContextDependency =
			function addContextDependency(context) {
				contextDependencies.push(context);
			};
		loaderContext.addMissingDependency =
			function addMissingDependency(context) {
				missingDependencies.push(context);
			};
		loaderContext.getDependencies = function getDependencies() {
			return fileDependencies.slice();
		};
		loaderContext.getContextDependencies = function getContextDependencies() {
			return contextDependencies.slice();
		};
		loaderContext.getMissingDependencies = function getMissingDependencies() {
			return missingDependencies.slice();
		};
		loaderContext.clearDependencies = function clearDependencies() {
			fileDependencies.length = 0;
			contextDependencies.length = 0;
			missingDependencies.length = 0;
			requestCacheable = true;
		};
		loaderContext.resource = resource;
		loaderContext.readResource = options.readResource || readFile;

		Object.defineProperty(loaderContext, "request", {
			enumerable: true,
			get() {
				return loaderContext.loaders
					.map((loader) => loader.request)
					.concat(loaderContext.resource || "")
					.join("!");
			},
		});
		Object.defineProperty(loaderContext, "remainingRequest", {
			enumerable: true,
			get() {
				if (
					loaderContext.loaderIndex >= loaderContext.loaders.length - 1 &&
					!loaderContext.resource
				) {
					return "";
				}
				return loaderContext.loaders
					.slice(loaderContext.loaderIndex + 1)
					.map((loader) => loader.request)
					.concat(loaderContext.resource || "")
					.join("!");
			},
		});
		Object.defineProperty(loaderContext, "currentRequest", {
			enumerable: true,
			get() {
				return loaderContext.loaders
					.slice(loaderContext.loaderIndex)
					.map((loader) => loader.request)
					.concat(loaderContext.resource || "")
					.join("!");
			},
		});
		Object.defineProperty(loaderContext, "previousRequest", {
			enumerable: true,
			get() {
				return loaderContext.loaders
					.slice(0, loaderContext.loaderIndex)
					.map((loader) => loader.request)
					.join("!");
			},
		});
		Object.defineProperty(loaderContext, "query", {
			enumerable: true,
			get() {
				const entry = loaderContext.loaders[loaderContext.loaderIndex];
				return entry.options && typeof entry.options === "object"
					? entry.options
					: entry.query;
			},
		});
		Object.defineProperty(loaderContext, "data", {
			enumerable: true,
			get() {
				return loaderContext.loaders[loaderContext.loaderIndex].data;
			},
		});

		// finish loader context
		if (Object.preventExtensions) {
			Object.preventExtensions(loaderContext);
		}

		const processOptions = {
			resourceBuffer: null,
			processResource,
		};
		iteratePitchingLoaders(processOptions, loaderContext, (err, result) => {
			if (err) {
				return callback(err, {
					cacheable: requestCacheable,
					fileDependencies,
					contextDependencies,
					missingDependencies,
				});
			}
			callback(null, {
				result,
				resourceBuffer: processOptions.resourceBuffer,
				cacheable: requestCacheable,
				fileDependencies,
				contextDependencies,
				missingDependencies,
			});
		});
	}
}

// 为 Web Worker 环境提供全局访问
if (typeof self !== 'undefined') {
	self.LoaderRunner = LoaderRunner;
} 