// Web Worker 实例
let worker = null;
let isWorkerRunning = false;

// 预加载的 loader 函数
let simpleLoaderFunction = null;

// DOM 元素
const statusElement = document.getElementById('status');
const outputElement = document.getElementById('output');
const progressElement = document.getElementById('progress');
const performanceOutputElement = document.getElementById('performanceOutput');

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

// 预加载 simple-loader
async function preloadSimpleLoader() {
    try {
        addOutput('🔄 开始预加载 Simple Loader...');
        
        // 动态加载 simple-loader
        const response = await fetch('simple-loader.js');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const loaderCode = await response.text();
        addOutput(`📄 加载到 ${loaderCode.length} 字符的代码`);
        
        // 创建一个函数来执行 loader 代码
        // 注意：这里我们需要创建一个安全的执行环境
        const loaderModule = new Function('module', 'exports', loaderCode + '\nreturn module.exports;');
        const module = { exports: {} };
        simpleLoaderFunction = loaderModule(module, module.exports);
        
        addOutput('✅ Simple Loader 预加载成功');
        addOutput(`🔧 Loader 类型: ${typeof simpleLoaderFunction}`);
        return true;
    } catch (error) {
        addOutput(`❌ Simple Loader 预加载失败: ${error.message}`);
        addOutput(`📋 错误详情: ${error.stack || '无堆栈信息'}`);
        return false;
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
            const { id, result, error } = event.data;
            
            if (error) {
                addOutput(`❌ 处理错误: ${error.message}`);
                updateStatus('处理失败', 'error');
                isWorkerRunning = false;
                updateProgress(0);
            } else {
                addOutput(`✅ 文件处理完成!`);
                addOutput(`📄 处理结果长度: ${result.source ? result.source.length : 0} 字符`);
                if (result.map) {
                    addOutput(`🗺️ 包含 source map`);
                }
                updateStatus('处理完成', 'ready');
                isWorkerRunning = false;
                updateProgress(100);
                
                // 显示处理结果
                displayResult(result);
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

// 处理文件
function processFile() {
    if (isWorkerRunning) {
        addOutput('⚠️ Worker 正在处理中，请稍候...');
        return;
    }

    if (!worker) {
        if (!initWorker()) {
            return;
        }
    }

    // 模拟文件内容（这里可以改为真实的文件上传）
    const fileContent = `// 示例 TypeScript 文件
interface User {
    id: number;
    name: string;
    email: string;
}

class UserService {
    async getUser(id: number): Promise<User> {
        return {
            id,
            name: 'John Doe',
            email: 'john@example.com'
        };
    }
}

export default UserService;`;

    const loaders = [
        {
            loader: 'simple-loader',
            options: {}
        }
    ];

    isWorkerRunning = true;
    updateStatus('处理中...', 'working');
    updateProgress(25);
    addOutput('📤 发送文件到 Worker 处理...');
    addOutput(`📄 文件内容长度: ${fileContent.length} 字符`);
    addOutput(`🔧 使用 loaders: ${loaders.map(l => l.loader).join(', ')}`);

    // 发送处理请求到 Worker
    worker.postMessage({
        messageType: 'transform',
        id: 'file-' + Date.now(),
        payload: [
            fileContent,
            'example.ts',
            '?sourceMap=true',
            loaders,
            true, // sourceMap
            process.cwd || '/'
        ]
    });

    updateProgress(50);
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

// 测试 Simple Loader
async function testSimpleLoader() {
    if (isWorkerRunning) {
        addOutput('⚠️ Worker 正在处理中，请稍候...');
        return;
    }

    if (!worker) {
        if (!initWorker()) {
            return;
        }
    }

    const testContent = `// 测试文件
console.log("Hello from Simple Loader Test");
const message: string = "这是一个 TypeScript 测试";
console.log("消息:", message);

// 测试 CSS 内容
const cssContent = \`
.button {
    background: var(--primary-color);
    color: white;
    padding: 10px 20px;
}
\`;

console.log("CSS 内容长度:", cssContent.length);`;

    isWorkerRunning = true;
    updateStatus('测试 Simple Loader...', 'working');
    updateProgress(25);
    addOutput('🧪 开始测试 Simple Loader...');
    addOutput(`📄 测试内容长度: ${testContent.length} 字符`);

    // 检查是否已预加载 simple-loader
    if (!simpleLoaderFunction) {
        addOutput('❌ Simple Loader 未预加载，请稍候...');
        addOutput('🔄 尝试重新预加载...');
        updateStatus('等待 Loader 加载', 'working');
        
        // 尝试重新预加载
        const success = await preloadSimpleLoader();
        if (!success) {
            addOutput('❌ 重新预加载失败，无法继续测试');
            updateStatus('加载失败', 'error');
            return;
        }
    }
    
    addOutput(`🔧 使用预加载的 Loader: ${typeof simpleLoaderFunction}`);
    addOutput(`📤 准备发送消息到 Worker...`);

    worker.postMessage({
        messageType: 'transform',
        id: 'simple-test-' + Date.now(),
        payload: [
            testContent,
            'simple-test.ts',
            '',
            [{ 
                loader: 'simple-loader', 
                options: {},
                function: simpleLoaderFunction.toString() // 传递函数字符串
            }],
            false,
            process.cwd || '/'
        ]
    });

    updateProgress(50);
}

// 测试不同的 loader 组合
function testLoaders() {
    if (isWorkerRunning) {
        addOutput('⚠️ Worker 正在处理中，请稍候...');
        return;
    }

    if (!worker) {
        if (!initWorker()) {
            return;
        }
    }

    const testCases = [
        {
            name: 'TypeScript + Babel',
            content: 'const message: string = "Hello World";',
            loaders: [
                { loader: 'ts-loader', options: {} },
                { loader: 'babel-loader', options: { presets: ['@babel/preset-env'] } }
            ]
        },
        {
            name: 'CSS + PostCSS',
            content: '.button { background: var(--primary-color); }',
            loaders: [
                { loader: 'css-loader', options: {} },
                { loader: 'postcss-loader', options: {} }
            ]
        },
        {
            name: 'Simple Loader Test',
            content: 'console.log("Hello World");\nconst message: string = "Test";\nconsole.log(message);',
            loaders: [
                { loader: 'simple-loader', options: {} }
            ]
        }
    ];

    let currentTest = 0;
    
    function runNextTest() {
        if (currentTest >= testCases.length) {
            addOutput('✅ 所有测试用例完成!');
            updateStatus('测试完成', 'ready');
            isWorkerRunning = false;
            updateProgress(100);
            return;
        }

        const testCase = testCases[currentTest];
        addOutput(`🧪 运行测试: ${testCase.name}`);
        updateProgress((currentTest / testCases.length) * 100);

        isWorkerRunning = true;
        updateStatus('测试中...', 'working');

        worker.postMessage({
            messageType: 'transform',
            id: 'test-' + currentTest,
            payload: [
                testCase.content,
                `test-${currentTest}.${testCase.name.includes('CSS') ? 'css' : 'ts'}`,
                '',
                testCase.loaders,
                false,
                process.cwd || '/'
            ]
        });
    }

    // 修改 onmessage 处理器来支持测试
    const originalOnMessage = worker.onmessage;
    worker.onmessage = function(event) {
        const { id, result, error } = event.data;
        
        if (error) {
            addOutput(`❌ 测试 ${currentTest + 1} 失败: ${error.message}`);
        } else {
            addOutput(`✅ 测试 ${currentTest + 1} 通过`);
        }
        
        currentTest++;
        runNextTest();
    };

    // 开始第一个测试
    runNextTest();
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    addOutput('🎉 Webpack Loader Runner Worker Demo 已加载完成!');
    addOutput('💡 点击"处理文件"按钮测试 loader 处理功能');
    addOutput('🧪 点击"测试 Loaders"按钮运行多个测试用例');
    addOutput('📊 观察处理进度和结果输出');
    
    // 预加载 simple-loader
    preloadSimpleLoader();
    // 初始化 Worker
    initWorker();
});

// 页面卸载时清理 Worker
window.addEventListener('beforeunload', function() {
    if (worker) {
        worker.terminate();
    }
}); 