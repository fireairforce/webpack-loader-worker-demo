"use strict";

// 直接定义全局变量，兼容 importScripts
// 注意：这里需要先加载 LoaderRunner.js 和 LoaderLoadingError.js

// 为 Web Worker 环境提供全局访问
if (typeof self !== 'undefined') {
	// 这些类将在 LoaderRunner.js 中定义
	// self.LoaderRunner = LoaderRunner;
	// self.LoaderLoadingError = LoaderLoadingError;
} 