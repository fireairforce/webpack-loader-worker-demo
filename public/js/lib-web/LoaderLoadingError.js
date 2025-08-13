"use strict";

// 直接定义全局类，兼容 importScripts
class LoaderLoadingError extends Error {
	constructor(message) {
		super(message);
		this.name = "LoaderLoadingError";
	}
}

// 为 Web Worker 环境提供全局访问
if (typeof self !== 'undefined') {
	self.LoaderLoadingError = LoaderLoadingError;
} 