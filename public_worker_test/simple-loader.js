// 简单的 webpack loader
// 这个 loader 会为每个文件添加一个注释头，并转换一些简单的语法

module.exports = function(source, map, meta) {
  const callback = this.async();
  
  // 获取文件名
  const resourcePath = this.resourcePath;
  const fileName = resourcePath.split('/').pop();
  
  // 添加文件头注释
  let processedSource = `// 由 simple-loader 处理: ${fileName}\n`;
  processedSource += `// 处理时间: ${new Date().toISOString()}\n`;
  processedSource += `// 原始长度: ${source.length} 字符\n\n`;
  
  // 简单的文本处理：将 console.log 转换为 console.info
  processedSource += source.replace(/console\.log/g, 'console.info');
  
  // 如果是 TypeScript 文件，添加一些类型注释
  if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
    processedSource += '\n\n// 类型增强完成';
  }
  
  // 如果是 CSS 文件，添加一些样式注释
  if (fileName.endsWith('.css')) {
    processedSource += '\n\n/* CSS 处理完成 */';
  }
  
  // 返回处理后的内容
  callback(null, processedSource, map, meta);
}; 