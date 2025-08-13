const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Web Worker Demo 服务器已启动!`);
  console.log(`📱 请在浏览器中访问: http://localhost:${PORT}`);
  console.log(`🔄 按 Ctrl+C 停止服务器`);
}); 