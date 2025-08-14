(() => { // webpackBootstrap
    var __webpack_modules__ = ({
        5: (function (module, __unused_webpack_exports, __webpack_require__) {
            "use strict";
    /* provided dependency */ var process = __webpack_require__(224);
            // 'path' module extracted from Node.js v8.11.1 (only the posix part)
            // transplited with Babel

            // Copyright Joyent, Inc. and other Node contributors.
            //
            // Permission is hereby granted, free of charge, to any person obtaining a
            // copy of this software and associated documentation files (the
            // "Software"), to deal in the Software without restriction, including
            // without limitation the rights to use, copy, modify, merge, publish,
            // distribute, sublicense, and/or sell copies of the Software, and to permit
            // persons to whom the Software is furnished to do so, subject to the
            // following conditions:
            //
            // The above copyright notice and this permission notice shall be included
            // in all copies or substantial portions of the Software.
            //
            // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
            // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
            // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
            // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
            // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
            // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
            // USE OR OTHER DEALINGS IN THE SOFTWARE.



            function assertPath(path) {
                if (typeof path !== 'string') {
                    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
                }
            }

            // Resolves . and .. elements in a path with directory names
            function normalizeStringPosix(path, allowAboveRoot) {
                var res = '';
                var lastSegmentLength = 0;
                var lastSlash = -1;
                var dots = 0;
                var code;
                for (var i = 0; i <= path.length; ++i) {
                    if (i < path.length)
                        code = path.charCodeAt(i);
                    else if (code === 47 /*/*/)
                        break;
                    else
                        code = 47 /*/*/;
                    if (code === 47 /*/*/) {
                        if (lastSlash === i - 1 || dots === 1) {
                            // NOOP
                        } else if (lastSlash !== i - 1 && dots === 2) {
                            if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
                                if (res.length > 2) {
                                    var lastSlashIndex = res.lastIndexOf('/');
                                    if (lastSlashIndex !== res.length - 1) {
                                        if (lastSlashIndex === -1) {
                                            res = '';
                                            lastSegmentLength = 0;
                                        } else {
                                            res = res.slice(0, lastSlashIndex);
                                            lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
                                        }
                                        lastSlash = i;
                                        dots = 0;
                                        continue;
                                    }
                                } else if (res.length === 2 || res.length === 1) {
                                    res = '';
                                    lastSegmentLength = 0;
                                    lastSlash = i;
                                    dots = 0;
                                    continue;
                                }
                            }
                            if (allowAboveRoot) {
                                if (res.length > 0)
                                    res += '/..';
                                else
                                    res = '..';
                                lastSegmentLength = 2;
                            }
                        } else {
                            if (res.length > 0)
                                res += '/' + path.slice(lastSlash + 1, i);
                            else
                                res = path.slice(lastSlash + 1, i);
                            lastSegmentLength = i - lastSlash - 1;
                        }
                        lastSlash = i;
                        dots = 0;
                    } else if (code === 46 /*.*/ && dots !== -1) {
                        ++dots;
                    } else {
                        dots = -1;
                    }
                }
                return res;
            }

            function _format(sep, pathObject) {
                var dir = pathObject.dir || pathObject.root;
                var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
                if (!dir) {
                    return base;
                }
                if (dir === pathObject.root) {
                    return dir + base;
                }
                return dir + sep + base;
            }

            var posix = {
                // path.resolve([from ...], to)
                resolve: function resolve() {
                    var resolvedPath = '';
                    var resolvedAbsolute = false;
                    var cwd;

                    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                        var path;
                        if (i >= 0)
                            path = arguments[i];
                        else {
                            if (cwd === undefined)
                                cwd = process.cwd();
                            path = cwd;
                        }

                        assertPath(path);

                        // Skip empty entries
                        if (path.length === 0) {
                            continue;
                        }

                        resolvedPath = path + '/' + resolvedPath;
                        resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
                    }

                    // At this point the path should be resolved to a full absolute path, but
                    // handle relative paths to be safe (might happen when process.cwd() fails)

                    // Normalize the path
                    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

                    if (resolvedAbsolute) {
                        if (resolvedPath.length > 0)
                            return '/' + resolvedPath;
                        else
                            return '/';
                    } else if (resolvedPath.length > 0) {
                        return resolvedPath;
                    } else {
                        return '.';
                    }
                },

                normalize: function normalize(path) {
                    assertPath(path);

                    if (path.length === 0) return '.';

                    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
                    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

                    // Normalize the path
                    path = normalizeStringPosix(path, !isAbsolute);

                    if (path.length === 0 && !isAbsolute) path = '.';
                    if (path.length > 0 && trailingSeparator) path += '/';

                    if (isAbsolute) return '/' + path;
                    return path;
                },

                isAbsolute: function isAbsolute(path) {
                    assertPath(path);
                    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
                },

                join: function join() {
                    if (arguments.length === 0)
                        return '.';
                    var joined;
                    for (var i = 0; i < arguments.length; ++i) {
                        var arg = arguments[i];
                        assertPath(arg);
                        if (arg.length > 0) {
                            if (joined === undefined)
                                joined = arg;
                            else
                                joined += '/' + arg;
                        }
                    }
                    if (joined === undefined)
                        return '.';
                    return posix.normalize(joined);
                },

                relative: function relative(from, to) {
                    assertPath(from);
                    assertPath(to);

                    if (from === to) return '';

                    from = posix.resolve(from);
                    to = posix.resolve(to);

                    if (from === to) return '';

                    // Trim any leading backslashes
                    var fromStart = 1;
                    for (; fromStart < from.length; ++fromStart) {
                        if (from.charCodeAt(fromStart) !== 47 /*/*/)
                            break;
                    }
                    var fromEnd = from.length;
                    var fromLen = fromEnd - fromStart;

                    // Trim any leading backslashes
                    var toStart = 1;
                    for (; toStart < to.length; ++toStart) {
                        if (to.charCodeAt(toStart) !== 47 /*/*/)
                            break;
                    }
                    var toEnd = to.length;
                    var toLen = toEnd - toStart;

                    // Compare paths to find the longest common path from root
                    var length = fromLen < toLen ? fromLen : toLen;
                    var lastCommonSep = -1;
                    var i = 0;
                    for (; i <= length; ++i) {
                        if (i === length) {
                            if (toLen > length) {
                                if (to.charCodeAt(toStart + i) === 47 /*/*/) {
                                    // We get here if `from` is the exact base path for `to`.
                                    // For example: from='/foo/bar'; to='/foo/bar/baz'
                                    return to.slice(toStart + i + 1);
                                } else if (i === 0) {
                                    // We get here if `from` is the root
                                    // For example: from='/'; to='/foo'
                                    return to.slice(toStart + i);
                                }
                            } else if (fromLen > length) {
                                if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
                                    // We get here if `to` is the exact base path for `from`.
                                    // For example: from='/foo/bar/baz'; to='/foo/bar'
                                    lastCommonSep = i;
                                } else if (i === 0) {
                                    // We get here if `to` is the root.
                                    // For example: from='/foo'; to='/'
                                    lastCommonSep = 0;
                                }
                            }
                            break;
                        }
                        var fromCode = from.charCodeAt(fromStart + i);
                        var toCode = to.charCodeAt(toStart + i);
                        if (fromCode !== toCode)
                            break;
                        else if (fromCode === 47 /*/*/)
                            lastCommonSep = i;
                    }

                    var out = '';
                    // Generate the relative path based on the path difference between `to`
                    // and `from`
                    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
                        if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
                            if (out.length === 0)
                                out += '..';
                            else
                                out += '/..';
                        }
                    }

                    // Lastly, append the rest of the destination (`to`) path that comes after
                    // the common path parts
                    if (out.length > 0)
                        return out + to.slice(toStart + lastCommonSep);
                    else {
                        toStart += lastCommonSep;
                        if (to.charCodeAt(toStart) === 47 /*/*/)
                            ++toStart;
                        return to.slice(toStart);
                    }
                },

                _makeLong: function _makeLong(path) {
                    return path;
                },

                dirname: function dirname(path) {
                    assertPath(path);
                    if (path.length === 0) return '.';
                    var code = path.charCodeAt(0);
                    var hasRoot = code === 47 /*/*/;
                    var end = -1;
                    var matchedSlash = true;
                    for (var i = path.length - 1; i >= 1; --i) {
                        code = path.charCodeAt(i);
                        if (code === 47 /*/*/) {
                            if (!matchedSlash) {
                                end = i;
                                break;
                            }
                        } else {
                            // We saw the first non-path separator
                            matchedSlash = false;
                        }
                    }

                    if (end === -1) return hasRoot ? '/' : '.';
                    if (hasRoot && end === 1) return '//';
                    return path.slice(0, end);
                },

                basename: function basename(path, ext) {
                    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
                    assertPath(path);

                    var start = 0;
                    var end = -1;
                    var matchedSlash = true;
                    var i;

                    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
                        if (ext.length === path.length && ext === path) return '';
                        var extIdx = ext.length - 1;
                        var firstNonSlashEnd = -1;
                        for (i = path.length - 1; i >= 0; --i) {
                            var code = path.charCodeAt(i);
                            if (code === 47 /*/*/) {
                                // If we reached a path separator that was not part of a set of path
                                // separators at the end of the string, stop now
                                if (!matchedSlash) {
                                    start = i + 1;
                                    break;
                                }
                            } else {
                                if (firstNonSlashEnd === -1) {
                                    // We saw the first non-path separator, remember this index in case
                                    // we need it if the extension ends up not matching
                                    matchedSlash = false;
                                    firstNonSlashEnd = i + 1;
                                }
                                if (extIdx >= 0) {
                                    // Try to match the explicit extension
                                    if (code === ext.charCodeAt(extIdx)) {
                                        if (--extIdx === -1) {
                                            // We matched the extension, so mark this as the end of our path
                                            // component
                                            end = i;
                                        }
                                    } else {
                                        // Extension does not match, so our result is the entire path
                                        // component
                                        extIdx = -1;
                                        end = firstNonSlashEnd;
                                    }
                                }
                            }
                        }

                        if (start === end) end = firstNonSlashEnd; else if (end === -1) end = path.length;
                        return path.slice(start, end);
                    } else {
                        for (i = path.length - 1; i >= 0; --i) {
                            if (path.charCodeAt(i) === 47 /*/*/) {
                                // If we reached a path separator that was not part of a set of path
                                // separators at the end of the string, stop now
                                if (!matchedSlash) {
                                    start = i + 1;
                                    break;
                                }
                            } else if (end === -1) {
                                // We saw the first non-path separator, mark this as the end of our
                                // path component
                                matchedSlash = false;
                                end = i + 1;
                            }
                        }

                        if (end === -1) return '';
                        return path.slice(start, end);
                    }
                },

                extname: function extname(path) {
                    assertPath(path);
                    var startDot = -1;
                    var startPart = 0;
                    var end = -1;
                    var matchedSlash = true;
                    // Track the state of characters (if any) we see before our first dot and
                    // after any path separator we find
                    var preDotState = 0;
                    for (var i = path.length - 1; i >= 0; --i) {
                        var code = path.charCodeAt(i);
                        if (code === 47 /*/*/) {
                            // If we reached a path separator that was not part of a set of path
                            // separators at the end of the string, stop now
                            if (!matchedSlash) {
                                startPart = i + 1;
                                break;
                            }
                            continue;
                        }
                        if (end === -1) {
                            // We saw the first non-path separator, mark this as the end of our
                            // extension
                            matchedSlash = false;
                            end = i + 1;
                        }
                        if (code === 46 /*.*/) {
                            // If this is our first dot, mark it as the start of our extension
                            if (startDot === -1)
                                startDot = i;
                            else if (preDotState !== 1)
                                preDotState = 1;
                        } else if (startDot !== -1) {
                            // We saw a non-dot and non-path separator before our dot, so we should
                            // have a good chance at having a non-empty extension
                            preDotState = -1;
                        }
                    }

                    if (startDot === -1 || end === -1 ||
                        // We saw a non-dot character immediately before the dot
                        preDotState === 0 ||
                        // The (right-most) trimmed path component is exactly '..'
                        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
                        return '';
                    }
                    return path.slice(startDot, end);
                },

                format: function format(pathObject) {
                    if (pathObject === null || typeof pathObject !== 'object') {
                        throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
                    }
                    return _format('/', pathObject);
                },

                parse: function parse(path) {
                    assertPath(path);

                    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
                    if (path.length === 0) return ret;
                    var code = path.charCodeAt(0);
                    var isAbsolute = code === 47 /*/*/;
                    var start;
                    if (isAbsolute) {
                        ret.root = '/';
                        start = 1;
                    } else {
                        start = 0;
                    }
                    var startDot = -1;
                    var startPart = 0;
                    var end = -1;
                    var matchedSlash = true;
                    var i = path.length - 1;

                    // Track the state of characters (if any) we see before our first dot and
                    // after any path separator we find
                    var preDotState = 0;

                    // Get non-dir info
                    for (; i >= start; --i) {
                        code = path.charCodeAt(i);
                        if (code === 47 /*/*/) {
                            // If we reached a path separator that was not part of a set of path
                            // separators at the end of the string, stop now
                            if (!matchedSlash) {
                                startPart = i + 1;
                                break;
                            }
                            continue;
                        }
                        if (end === -1) {
                            // We saw the first non-path separator, mark this as the end of our
                            // extension
                            matchedSlash = false;
                            end = i + 1;
                        }
                        if (code === 46 /*.*/) {
                            // If this is our first dot, mark it as the start of our extension
                            if (startDot === -1) startDot = i; else if (preDotState !== 1) preDotState = 1;
                        } else if (startDot !== -1) {
                            // We saw a non-dot and non-path separator before our dot, so we should
                            // have a good chance at having a non-empty extension
                            preDotState = -1;
                        }
                    }

                    if (startDot === -1 || end === -1 ||
                        // We saw a non-dot character immediately before the dot
                        preDotState === 0 ||
                        // The (right-most) trimmed path component is exactly '..'
                        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
                        if (end !== -1) {
                            if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end); else ret.base = ret.name = path.slice(startPart, end);
                        }
                    } else {
                        if (startPart === 0 && isAbsolute) {
                            ret.name = path.slice(1, startDot);
                            ret.base = path.slice(1, end);
                        } else {
                            ret.name = path.slice(startPart, startDot);
                            ret.base = path.slice(startPart, end);
                        }
                        ret.ext = path.slice(startDot, end);
                    }

                    if (startPart > 0) ret.dir = path.slice(0, startPart - 1); else if (isAbsolute) ret.dir = '/';

                    return ret;
                },

                sep: '/',
                delimiter: ':',
                win32: null,
                posix: null
            };

            posix.posix = posix;

            module.exports = posix;


        }),
        224: (function (module) {
            // shim for using process in browser
            var process = module.exports = {};

            // cached from whatever global is present so that test runners that stub it
            // don't break things.  But we need to wrap it in a try catch in case it is
            // wrapped in strict mode code which doesn't define any globals.  It's inside a
            // function because try/catches deoptimize in certain engines.

            var cachedSetTimeout;
            var cachedClearTimeout;

            function defaultSetTimout() {
                throw new Error('setTimeout has not been defined');
            }
            function defaultClearTimeout() {
                throw new Error('clearTimeout has not been defined');
            }
            (function () {
                try {
                    if (typeof setTimeout === 'function') {
                        cachedSetTimeout = setTimeout;
                    } else {
                        cachedSetTimeout = defaultSetTimout;
                    }
                } catch (e) {
                    cachedSetTimeout = defaultSetTimout;
                }
                try {
                    if (typeof clearTimeout === 'function') {
                        cachedClearTimeout = clearTimeout;
                    } else {
                        cachedClearTimeout = defaultClearTimeout;
                    }
                } catch (e) {
                    cachedClearTimeout = defaultClearTimeout;
                }
            }())
            function runTimeout(fun) {
                if (cachedSetTimeout === setTimeout) {
                    //normal enviroments in sane situations
                    return setTimeout(fun, 0);
                }
                // if setTimeout wasn't available but was latter defined
                if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
                    cachedSetTimeout = setTimeout;
                    return setTimeout(fun, 0);
                }
                try {
                    // when when somebody has screwed with setTimeout but no I.E. maddness
                    return cachedSetTimeout(fun, 0);
                } catch (e) {
                    try {
                        // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                        return cachedSetTimeout.call(null, fun, 0);
                    } catch (e) {
                        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                        return cachedSetTimeout.call(this, fun, 0);
                    }
                }


            }
            function runClearTimeout(marker) {
                if (cachedClearTimeout === clearTimeout) {
                    //normal enviroments in sane situations
                    return clearTimeout(marker);
                }
                // if clearTimeout wasn't available but was latter defined
                if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
                    cachedClearTimeout = clearTimeout;
                    return clearTimeout(marker);
                }
                try {
                    // when when somebody has screwed with setTimeout but no I.E. maddness
                    return cachedClearTimeout(marker);
                } catch (e) {
                    try {
                        // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                        return cachedClearTimeout.call(null, marker);
                    } catch (e) {
                        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                        // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                        return cachedClearTimeout.call(this, marker);
                    }
                }



            }
            var queue = [];
            var draining = false;
            var currentQueue;
            var queueIndex = -1;

            function cleanUpNextTick() {
                if (!draining || !currentQueue) {
                    return;
                }
                draining = false;
                if (currentQueue.length) {
                    queue = currentQueue.concat(queue);
                } else {
                    queueIndex = -1;
                }
                if (queue.length) {
                    drainQueue();
                }
            }

            function drainQueue() {
                if (draining) {
                    return;
                }
                var timeout = runTimeout(cleanUpNextTick);
                draining = true;

                var len = queue.length;
                while (len) {
                    currentQueue = queue;
                    queue = [];
                    while (++queueIndex < len) {
                        if (currentQueue) {
                            currentQueue[queueIndex].run();
                        }
                    }
                    queueIndex = -1;
                    len = queue.length;
                }
                currentQueue = null;
                draining = false;
                runClearTimeout(timeout);
            }

            process.nextTick = function (fun) {
                var args = new Array(arguments.length - 1);
                if (arguments.length > 1) {
                    for (var i = 1; i < arguments.length; i++) {
                        args[i - 1] = arguments[i];
                    }
                }
                queue.push(new Item(fun, args));
                if (queue.length === 1 && !draining) {
                    runTimeout(drainQueue);
                }
            };

            // v8 likes predictible objects
            function Item(fun, array) {
                this.fun = fun;
                this.array = array;
            }
            Item.prototype.run = function () {
                this.fun.apply(null, this.array);
            };
            process.title = 'browser';
            process.browser = true;
            process.env = {};
            process.argv = [];
            process.version = ''; // empty string to avoid regexp issues
            process.versions = {};

            function noop() { }

            process.on = noop;
            process.addListener = noop;
            process.once = noop;
            process.off = noop;
            process.removeListener = noop;
            process.removeAllListeners = noop;
            process.emit = noop;
            process.prependListener = noop;
            process.prependOnceListener = noop;

            process.listeners = function (name) { return [] }

            process.binding = function (name) {
                throw new Error('process.binding is not supported');
            };

            process.cwd = function () { return '/' };
            process.chdir = function (dir) {
                throw new Error('process.chdir is not supported');
            };
            process.umask = function () { return 0; };


        }),
        268: (function (module) {
            function webpackEmptyContext(req) {
                var e = new Error("Cannot find module '" + req + "'");
                e.code = 'MODULE_NOT_FOUND';
                throw e;
            }
            webpackEmptyContext.keys = () => ([]);
            webpackEmptyContext.resolve = webpackEmptyContext;
            webpackEmptyContext.id = 268;
            module.exports = webpackEmptyContext;


        }),

    });
    /************************************************************************/
    // The module cache
    var __webpack_module_cache__ = {};

    // The require function
    function __webpack_require__(moduleId) {

        // Check if module is in cache
        var cachedModule = __webpack_module_cache__[moduleId];
        if (cachedModule !== undefined) {
            return cachedModule.exports;
        }
        // Create a new module (and put it into the cache)
        var module = (__webpack_module_cache__[moduleId] = {
            exports: {}
        });
        // Execute the module function
        __webpack_modules__[moduleId](module, module.exports, __webpack_require__);

        // Return the exports of the module
        return module.exports;

    }

    /************************************************************************/
    // webpack/runtime/has_own_property
    (() => {
        __webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
    })();
    /************************************************************************/
    // This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
    (() => {
        "use strict";

        // UNUSED EXPORTS: default

        // EXTERNAL MODULE: ./node_modules/.pnpm/path-browserify@1.0.1/node_modules/path-browserify/index.js
        var path_browserify = __webpack_require__(5);
        ;// CONCATENATED MODULE: ./src/options.json
        var options_namespaceObject = {}
            ;// CONCATENATED MODULE: ./src/utils.js

        const trailingSlash = /[/\\]$/;
        // This somewhat changed in Less 3.x. Now the file name comes without the
        // automatically added extension whereas the extension is passed in as `options.ext`.
        // So, if the file name matches this regexp, we simply ignore the proposed extension.
        const IS_SPECIAL_MODULE_IMPORT = /^~[^/]+$/;
        // `[drive_letter]:\` + `\\[server]\[share_name]\`
        const IS_NATIVE_WIN32_PATH = /^[a-z]:[/\\]|^\\\\/i;
        // Examples:
        // - ~package
        // - ~package/
        // - ~@org
        // - ~@org/
        // - ~@org/package
        // - ~@org/package/
        const IS_MODULE_IMPORT = /^~([^/]+|[^/]+\/|@[^/]+[/][^/]+|@[^/]+\/?|@[^/]+[/][^/]+\/)$/;
        const MODULE_REQUEST_REGEX = /^[^?]*~/;
    /**
     * Creates a Less plugin that uses webpack's resolving engine that is provided by the loaderContext.
     *
     * @param {LoaderContext} loaderContext
     * @param {object} implementation
     * @returns {LessPlugin}
     */ function createWebpackLessPlugin(loaderContext, implementation) {
            const lessOptions = loaderContext.getOptions();
            const resolve = loaderContext.getResolve({
                dependencyType: "less",
                conditionNames: [
                    "less",
                    "style",
                    "..."
                ],
                mainFields: [
                    "less",
                    "style",
                    "main",
                    "..."
                ],
                mainFiles: [
                    "index",
                    "..."
                ],
                extensions: [
                    ".less",
                    ".css"
                ],
                preferRelative: true
            });
            class WebpackFileManager extends implementation.FileManager {
                supports(filename) {
                    if (filename[0] === "/" || IS_NATIVE_WIN32_PATH.test(filename)) {
                        return true;
                    }
                    if (this.isPathAbsolute(filename)) {
                        return false;
                    }
                    return true;
                }
                // Sync resolving is used at least by the `data-uri` function.
                // This file manager doesn't know how to do it, so let's delegate it
                // to the default file manager of Less.
                // We could probably use loaderContext.resolveSync, but it's deprecated,
                // see https://webpack.js.org/api/loaders/#this-resolvesync
                supportsSync() {
                    return false;
                }
                async resolveFilename(filename, currentDirectory) {
                    // Less is giving us trailing slashes, but the context should have no trailing slash
                    const context = currentDirectory.replace(trailingSlash, "");
                    let request = filename;
                    // A `~` makes the url an module
                    if (MODULE_REQUEST_REGEX.test(filename)) {
                        request = request.replace(MODULE_REQUEST_REGEX, "");
                    }
                    if (IS_MODULE_IMPORT.test(filename)) {
                        request = request[request.length - 1] === "/" ? request : `${request}/`;
                    }
                    return this.resolveRequests(context, [
                        ...new Set([
                            request,
                            filename
                        ])
                    ]);
                }
                async resolveRequests(context, possibleRequests) {
                    if (possibleRequests.length === 0) {
                        throw new Error("No possible requests to resolve");
                    }
                    let result;
                    try {
                        result = await resolve(context, possibleRequests[0]);
                    } catch (error) {
                        const [, ...tailPossibleRequests] = possibleRequests;
                        if (tailPossibleRequests.length === 0) {
                            throw error;
                        }
                        result = await this.resolveRequests(context, tailPossibleRequests);
                    }
                    return result;
                }
                async loadFile(filename) {
                    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                        args[_key - 1] = arguments[_key];
                    }
                    let result;
                    try {
                        if (IS_SPECIAL_MODULE_IMPORT.test(filename) || lessOptions.webpackImporter === "only") {
                            const error = new Error("Next");
                            error.type = "Next";
                            throw error;
                        }
                        result = await super.loadFile(filename, ...args);
                    } catch (error) {
                        if (error.type !== "File" && error.type !== "Next") {
                            throw error;
                        }
                        try {
                            result = await this.resolveFilename(filename, ...args);
                        } catch (err) {
                            error.message = `Less resolver error:\n${error.message}\n\n` + `Webpack resolver error details:\n${err.details}\n\n` + `Webpack resolver error missing:\n${err.missing}\n\n`;
                            throw error;
                        }
                        loaderContext.addDependency(result);
                        return super.loadFile(result, ...args);
                    }
                    const absoluteFilename = path.isAbsolute(result.filename) ? result.filename : path.resolve(".", result.filename);
                    loaderContext.addDependency(path.normalize(absoluteFilename));
                    return result;
                }
            }
            return {
                install(lessInstance, pluginManager) {
                    pluginManager.addFileManager(new WebpackFileManager());
                },
                minVersion: [
                    3,
                    0,
                    0
                ]
            };
        }
    /**
     * Get the `less` options from the loader context and normalizes its values
     *
     * @param {object} loaderContext
     * @param {object} loaderOptions
     * @param {object} implementation
     * @returns {Object}
     */ function utils_getLessOptions(loaderContext, loaderOptions, implementation) {
            const options = typeof loaderOptions.lessOptions === "function" ? loaderOptions.lessOptions(loaderContext) || {} : loaderOptions.lessOptions || {};
            const lessOptions = {
                plugins: [],
                relativeUrls: true,
                // We need to set the filename because otherwise our WebpackFileManager will receive an undefined path for the entry
                filename: loaderContext.resourcePath,
                ...options
            };
            const plugins = [
                ...lessOptions.plugins
            ];
            const shouldUseWebpackImporter = typeof loaderOptions.webpackImporter === "boolean" || loaderOptions.webpackImporter === "only" ? loaderOptions.webpackImporter : true;
            if (shouldUseWebpackImporter) {
                plugins.unshift(createWebpackLessPlugin(loaderContext, implementation));
            }
            plugins.unshift({
                install(lessProcessor, pluginManager) {
                    pluginManager.webpackLoaderContext = loaderContext;
                    lessOptions.pluginManager = pluginManager;
                }
            });
            lessOptions.plugins = plugins;
            return lessOptions;
        }
        function utils_isUnsupportedUrl(url) {
            // Is Windows path
            if (IS_NATIVE_WIN32_PATH.test(url)) {
                return false;
            }
            // Scheme: https://tools.ietf.org/html/rfc3986#section-3.1
            // Absolute URL: https://tools.ietf.org/html/rfc3986#section-4.3
            return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url);
        }
        function utils_normalizeSourceMap(map) {
            const newMap = map;
            // map.file is an optional property that provides the output filename.
            // Since we don't know the final filename in the webpack build chain yet, it makes no sense to have it.
            delete newMap.file;
            newMap.sourceRoot = "";
            // `less` returns POSIX paths, that's why we need to transform them back to native paths.
            newMap.sources = newMap.sources.map((source) => path.normalize(source));
            return newMap;
        }
        function utils_getLessImplementation(loaderContext, implementation) {
            let resolvedImplementation = implementation;
            if (!implementation || typeof implementation === "string") {
                const lessImplPkg = implementation || "less";
                resolvedImplementation = __webpack_require__(268)(lessImplPkg);
            }
            return resolvedImplementation;
        }
        function getFileExcerptIfPossible(error) {
            if (typeof error.extract === "undefined") {
                return [];
            }
            const excerpt = error.extract.slice(0, 2);
            const column = Math.max(error.column - 1, 0);
            if (typeof excerpt[0] === "undefined") {
                excerpt.shift();
            }
            excerpt.push(`${" ".repeat(column)}^`);
            return excerpt;
        }
        function utils_errorFactory(error) {
            const message = [
                "\n",
                ...getFileExcerptIfPossible(error),
                error.message.charAt(0).toUpperCase() + error.message.slice(1),
                error.filename ? `      Error in ${path.normalize(error.filename)} (line ${error.line}, column ${error.column})` : ""
            ].join("\n");
            const obj = new Error(message, {
                cause: error
            });
            obj.stack = null;
            return obj;
        }


        ;// CONCATENATED MODULE: ./src/index.js



        async function lessLoader(source) {
            const options = this.getOptions(schema);
            const callback = this.async();
            let implementation;
            try {
                implementation = getLessImplementation(this, options.implementation);
            } catch (error) {
                callback(error);
                return;
            }
            if (!implementation) {
                callback(new Error(`The Less implementation "${options.implementation}" not found`));
                return;
            }
            const lessOptions = getLessOptions(this, options, implementation);
            const useSourceMap = typeof options.sourceMap === "boolean" ? options.sourceMap : this.sourceMap;
            if (useSourceMap) {
                lessOptions.sourceMap = {
                    outputSourceFiles: true
                };
            }
            let data = source;
            if (typeof options.additionalData !== "undefined") {
                data = typeof options.additionalData === "function" ? `${await options.additionalData(data, this)}` : `${options.additionalData}\n${data}`;
            }
            const logger = this.getLogger("less-loader");
            const loaderContext = this;
            const loggerListener = {
                error(message) {
                    // TODO enable by default in the next major release
                    if (options.lessLogAsWarnOrErr) {
                        loaderContext.emitError(new Error(message));
                    } else {
                        logger.error(message);
                    }
                },
                warn(message) {
                    // TODO enable by default in the next major release
                    if (options.lessLogAsWarnOrErr) {
                        loaderContext.emitWarning(new Error(message));
                    } else {
                        logger.warn(message);
                    }
                },
                info(message) {
                    logger.log(message);
                },
                debug(message) {
                    logger.debug(message);
                }
            };
            implementation.logger.addListener(loggerListener);
            let result;
            try {
                result = await implementation.render(data, lessOptions);
            } catch (error) {
                if (error.filename) {
                    // `less` returns forward slashes on windows when `webpack` resolver return an absolute windows path in `WebpackFileManager`
                    // Ref: https://github.com/webpack-contrib/less-loader/issues/357
                    this.addDependency(path.normalize(error.filename));
                }
                callback(errorFactory(error));
                return;
            } finally {
                // Fix memory leaks in `less`
                implementation.logger.removeListener(loggerListener);
                delete lessOptions.pluginManager.webpackLoaderContext;
                delete lessOptions.pluginManager;
            }
            const { css, imports } = result;
            for (const item of imports) {
                if (isUnsupportedUrl(item)) {
                    continue;
                }
                // `less` return forward slashes on windows when `webpack` resolver return an absolute windows path in `WebpackFileManager`
                // Ref: https://github.com/webpack-contrib/less-loader/issues/357
                const normalizedItem = path.normalize(item);
                // Custom `importer` can return only `contents` so item will be relative
                if (path.isAbsolute(normalizedItem)) {
                    this.addDependency(normalizedItem);
                }
            }
            let map = typeof result.map === "string" ? JSON.parse(result.map) : result.map;
            if (map && useSourceMap) {
                map = normalizeSourceMap(map, this.rootContext);
            }
            callback(null, css, map);
        }

        self.lessLoader = lessLoader;
    /* ESM default export */ const src = ((/* unused pure expression or super */ null && (lessLoader)));

    })();

})()
    ;