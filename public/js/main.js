// Loader 预加载器实例
let loaderPreloader = null;

// Web Worker 实例
let worker = null;
let isWorkerRunning = false;

// DOM 元素
const statusElement = document.getElementById('status');
const outputElement = document.getElementById('output');
const progressElement = document.getElementById('progress');

// 更新状态显示
function updateStatus(message, className = 'ready') {
    statusElement.textContent = `状态: ${message}`;
    statusElement.className = `status ${className}`;
}

// 添加输出信息
function addOutput(message) {
    const timestamp = new Date().toLocaleTimeString();
    outputElement.textContent += `[${timestamp}] ${message}\n`;
    outputElement.scrollTop = outputElement.scrollTop + 1000;
}

// 清空输出
function clearOutput() {
    outputElement.textContent = '输出已清空...\n';
}

// 更新进度条
function updateProgress(percent) {
    progressElement.style.width = `${percent}%`;
}

// 初始化 Loader 预加载器
function initLoaderPreloader() {
    if (!loaderPreloader) {
        loaderPreloader = new LoaderPreloader();
        addOutput('🔧 Loader 预加载器初始化成功');
    }
    return loaderPreloader;
}

// 预加载指定的 loader
async function preloadLoader(loaderName) {
    if (!loaderPreloader) {
        initLoaderPreloader();
    }
    
    try {
        addOutput(`🔧 开始预加载 loader: ${loaderName}`);
        const loader = await loaderPreloader.preloadLoader(loaderName);
        
        if (loader) {
            addOutput(`✅ 成功预加载 loader: ${loaderName}`);
            return loader;
        } else {
            throw new Error(`Failed to preload ${loaderName}`);
        }
    } catch (error) {
        addOutput(`❌ 预加载 loader '${loaderName}' 失败: ${error.message}`);
        throw error;
    }
}

// 初始化 Web Worker
function initWorker() {
    if (worker) {
        worker.terminate();
    }
    
    try {
        worker = new Worker('js/worker.js');
        addOutput('🚀 Web Worker 初始化成功');
        
        // 监听 Worker 消息
        worker.onmessage = function(event) {
            const { id, result, error, type } = event.data;
            
            if (type === 'ready') {
                addOutput('✅ Worker 已就绪，可以使用 loader-runner');
                return;
            } else if (type === 'debug') {
                // 处理调试消息
                addOutput(event.data.message);
                return;
            }
            
            if (error) {
                addOutput(`❌ 处理错误: ${error.message}`);
                updateStatus('处理失败', 'error');
                isWorkerRunning = false;
                updateProgress(0);
            } else if (result && result.source) {
                addOutput(`✅ 文件处理完成!`);
                addOutput(`📄 处理结果长度: ${result.source.length} 字符`);
                if (result.map) {
                    addOutput(`🗺️ 包含 source map`);
                }
                updateStatus('处理完成', 'ready');
                isWorkerRunning = false;
                updateProgress(100);
                
                // 显示处理结果
                displayResult(result);
            } else {
                addOutput(`⚠️ 收到未知消息类型: ${JSON.stringify(event.data)}`);
            }
        };

        // 监听 Worker 错误
        worker.onerror = function(error) {
            addOutput(`❌ Worker 错误: ${error.message}`);
            updateStatus('Worker 错误', 'error');
            isWorkerRunning = false;
            updateProgress(0);
        };
        
        return true;
    } catch (error) {
        addOutput(`❌ 创建 Worker 失败: ${error.message}`);
        updateStatus('创建失败', 'error');
        return false;
    }
}

// 显示处理结果
function displayResult(result) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-display';
    resultDiv.innerHTML = `
        <h3>处理结果</h3>
        <div class="result-content">
            <h4>转换后的内容:</h4>
            <pre><code>${escapeHtml(result.source || '')}</code></pre>
            ${result.map ? `<h4>Source Map:</h4><pre><code>${escapeHtml(result.map)}</code></pre>` : ''}
        </div>
    `;
    
    // 移除之前的结果
    const oldResult = document.querySelector('.result-display');
    if (oldResult) {
        oldResult.remove();
    }
    
    // 添加到页面
    document.body.appendChild(resultDiv);
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 测试 CSS Loader
async function testCSSLoader() {
    if (isWorkerRunning) {
        addOutput('⚠️ Worker 正在处理中，请稍候...');
        return;
    }

    if (!worker) {
        if (!initWorker()) {
            return;
        }
    }

    const cssContent = `.button {
    background: var(--primary-color);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
}

.button:hover {
    background: var(--primary-color-dark);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    button: pointer;
    transition: all 0.3s ease;
}

.button:hover {
    background: var(--primary-color-dark);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    text-align: center;
    border-radius: 10px;
    margin-bottom: 20px;
}`;

    isWorkerRunning = true;
    updateStatus('预加载 css-loader...', 'working');
    updateProgress(25);
    addOutput('🧪 开始测试 CSS Loader...');
    addOutput(`📄 CSS 内容长度: ${cssContent.length} 字符`);
    addOutput('🔧 先预加载 css-loader，然后传递给 Worker');

    try {
        // 先预加载 css-loader
        updateProgress(50);
        const cssLoader = await preloadLoader('css-loader');
        
        // 将预加载的 loader 传递给 Worker
        updateProgress(75);
        worker.postMessage({
            messageType: 'preloadModule',
            id: 'preload-css-loader',
            payload: {
                name: 'css-loader',
                module: cssLoader.toString() // 将函数转换为字符串
            }
        });
        
        // 等待 Worker 确认预加载完成
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('预加载超时'));
            }, 5000);
            
            const originalOnMessage = worker.onmessage;
            worker.onmessage = function(event) {
                if (event.data.type === 'preloadComplete' && event.data.name === 'css-loader') {
                    clearTimeout(timeout);
                    worker.onmessage = originalOnMessage;
                    resolve();
                } else if (event.data.type === 'preloadError') {
                    clearTimeout(timeout);
                    worker.onmessage = originalOnMessage;
                    reject(new Error(event.data.error));
                } else if (originalOnMessage) {
                    originalOnMessage(event);
                }
            };
        });
        
        // 开始转换
        updateProgress(90);
        addOutput('✅ css-loader 预加载完成，开始转换...');
        
        worker.postMessage({
            messageType: 'transform',
            id: 'css-test-' + Date.now(),
            payload: [
                cssContent,
                'styles.css',
                '',
                [{ 
                    loader: 'css-loader', 
                    options: {
                        modules: false,
                        sourceMap: false
                    }
                }],
                false,
                '/'
            ]
        });
        
        updateProgress(100);
        
    } catch (error) {
        addOutput(`❌ 预加载失败: ${error.message}`);
        updateStatus('预加载失败', 'error');
        isWorkerRunning = false;
        updateProgress(0);
    }
}

// 停止 Worker
function stopWorker() {
    if (worker && isWorkerRunning) {
        worker.terminate();
        worker = null;
        isWorkerRunning = false;
        updateStatus('已停止', 'ready');
        addOutput('🛑 Worker 已停止');
        updateProgress(0);
    } else {
        addOutput('⚠️ 没有运行中的 Worker');
    }
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    addOutput('🎉 CSS Loader 测试 Demo 已加载完成!');
    addOutput('🧪 点击"测试 CSS Loader"按钮开始测试');
    addOutput('📊 观察处理进度和结果输出');
    
    // 初始化预加载器和 Worker
    initLoaderPreloader();
    initWorker();
});

// 页面卸载时清理 Worker
window.addEventListener('beforeunload', function() {
    if (worker) {
        worker.terminate();
    }
}); 