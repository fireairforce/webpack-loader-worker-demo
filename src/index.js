const { runLoaders } = require('./loaderRunner');

// Buffer polyfill for WebWorker
if (typeof Buffer === 'undefined') {
  // Simple Buffer polyfill for WebWorker environment
  global.Buffer = class Buffer extends Uint8Array {
    constructor(input, encodingOrOffset, length) {
      if (typeof input === 'string') {
        if (encodingOrOffset === 'base64') {
          // Decode base64 string
          const binaryString = atob(input);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          super(bytes);
        } else {
          // UTF-8 string
          const encoder = new TextEncoder();
          super(encoder.encode(input));
        }
      } else if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
        super(input, encodingOrOffset, length);
      } else if (Array.isArray(input)) {
        super(input);
      } else {
        super(input || 0);
      }
    }

    static from(input, encodingOrOffset, length) {
      return new Buffer(input, encodingOrOffset, length);
    }

    toString(encoding = 'utf8') {
      if (encoding === 'utf8' || encoding === 'utf-8') {
        const decoder = new TextDecoder();
        return decoder.decode(this);
      } else if (encoding === 'base64') {
        // Encode to base64
        let binary = '';
        for (let i = 0; i < this.length; i++) {
          binary += String.fromCharCode(this[i]);
        }
        return btoa(binary);
      }
      return super.toString();
    }
  };
}

// Main message handler for WebWorker
self.onmessage = async function(event) {
  try {
    const { messageType, id, payload } = event.data;
    
    if (messageType === 'transform') {
      const result = await transform(...payload);
      self.postMessage({ id, result });
    } else {
      throw new Error(`Unknown message type: ${messageType}`);
    }
  } catch (error) {
    self.postMessage({ 
      id: event.data.id, 
      error: {
        name: error.name || 'Error',
        message: error.message || 'Unknown error',
        stack: error.stack || ''
      }
    });
  }
};

// Transform function that processes webpack loaders
async function transform(content, name, query, loaders, sourceMap, cwd) {
  return new Promise((resolve, reject) => {
    const resource = name + (query || '');
    
    // Handle binary content
    let processedContent;
    if (typeof content === 'object' && content.binary) {
      processedContent = Buffer.from(content.binary, 'base64');
    } else {
      processedContent = content;
    }

    // Create loader context
    const loaderContext = {
      version: 2,
      resource,
      resourcePath: name,
      resourceQuery: query || '',
      async: () => {
        let isAsync = false;
        const callback = (err, content, map, meta) => {
          if (isAsync) {
            if (err) {
              reject(err);
            } else {
              resolve({
                source: content || '',
                map: map ? (typeof map === 'string' ? map : JSON.stringify(map)) : null,
                assets: null,
                warnings: null,
                errors: null
              });
            }
          }
        };
        isAsync = true;
        return callback;
      },
      callback: null,
      cacheable: () => {},
      addDependency: () => {},
      addContextDependency: () => {},
      clearDependencies: () => {},
      emitWarning: () => {},
      emitError: () => {},
      emitFile: () => {},
      fs: null,
      utils: null,
      query: query || '',
      data: {},
      getOptions: () => ({}),
      resolve: () => {},
      getResolve: () => () => {},
      environment: { arrowFunction: true, bigIntLiteral: true, const: true, destructuring: true, dynamicImport: true, forOf: true, module: true },
      target: 'web',
      webpack: true,
      sourceMap: sourceMap,
      mode: 'development',
      hot: false,
      minimize: false,
      _module: null,
      _compilation: null,
      rootContext: cwd || process.cwd()
    };

    // 使用 runLoaders 执行所有 loader 处理
    runLoaders({
      resource,
      loaders: loaders.map(loader => ({
        loader: loader.loader,
        options: loader.options || {}
      })),
      context: loaderContext,
      processResource: (loaderContext, resource, callback) => {
        callback(null, processedContent, null);
      }
    }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      const source = result && result.result && result.result[0] 
        ? (typeof result.result[0] === 'object' && result.result[0].binary
           ? result.result[0].binary
           : result.result[0] || '')
        : '';
      
      const map = result && result.result && result.result[1]
        ? (typeof result.result[1] === 'string'
           ? JSON.parse(result.result[1])
           : result.result[1])
        : null;

      resolve({
        source,
        map: map ? JSON.stringify(map) : null,
        assets: null,
        warnings: null,
        errors: null
      });
    });
  });
} 