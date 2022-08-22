/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/axios/index.js":
/*!*************************************!*\
  !*** ./node_modules/axios/index.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! ./lib/axios */ "./node_modules/axios/lib/axios.js");

/***/ }),

/***/ "./node_modules/axios/lib/adapters/xhr.js":
/*!************************************************!*\
  !*** ./node_modules/axios/lib/adapters/xhr.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
var settle = __webpack_require__(/*! ./../core/settle */ "./node_modules/axios/lib/core/settle.js");
var cookies = __webpack_require__(/*! ./../helpers/cookies */ "./node_modules/axios/lib/helpers/cookies.js");
var buildURL = __webpack_require__(/*! ./../helpers/buildURL */ "./node_modules/axios/lib/helpers/buildURL.js");
var buildFullPath = __webpack_require__(/*! ../core/buildFullPath */ "./node_modules/axios/lib/core/buildFullPath.js");
var parseHeaders = __webpack_require__(/*! ./../helpers/parseHeaders */ "./node_modules/axios/lib/helpers/parseHeaders.js");
var isURLSameOrigin = __webpack_require__(/*! ./../helpers/isURLSameOrigin */ "./node_modules/axios/lib/helpers/isURLSameOrigin.js");
var transitionalDefaults = __webpack_require__(/*! ../defaults/transitional */ "./node_modules/axios/lib/defaults/transitional.js");
var AxiosError = __webpack_require__(/*! ../core/AxiosError */ "./node_modules/axios/lib/core/AxiosError.js");
var CanceledError = __webpack_require__(/*! ../cancel/CanceledError */ "./node_modules/axios/lib/cancel/CanceledError.js");
var parseProtocol = __webpack_require__(/*! ../helpers/parseProtocol */ "./node_modules/axios/lib/helpers/parseProtocol.js");

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;
    var responseType = config.responseType;
    var onCanceled;
    function done() {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }

      if (config.signal) {
        config.signal.removeEventListener('abort', onCanceled);
      }
    }

    if (utils.isFormData(requestData) && utils.isStandardBrowserEnv()) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);

    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
        request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);

      // Clean up request
      request = null;
    }

    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(new AxiosError('Request aborted', AxiosError.ECONNABORTED, config, request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
      var transitional = config.transitional || transitionalDefaults;
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(new AxiosError(
        timeoutErrorMessage,
        transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
        config,
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = config.responseType;
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken || config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = function(cancel) {
        if (!request) {
          return;
        }
        reject(!cancel || (cancel && cancel.type) ? new CanceledError() : cancel);
        request.abort();
        request = null;
      };

      config.cancelToken && config.cancelToken.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }

    if (!requestData) {
      requestData = null;
    }

    var protocol = parseProtocol(fullPath);

    if (protocol && [ 'http', 'https', 'file' ].indexOf(protocol) === -1) {
      reject(new AxiosError('Unsupported protocol ' + protocol + ':', AxiosError.ERR_BAD_REQUEST, config));
      return;
    }


    // Send the request
    request.send(requestData);
  });
};


/***/ }),

/***/ "./node_modules/axios/lib/axios.js":
/*!*****************************************!*\
  !*** ./node_modules/axios/lib/axios.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./utils */ "./node_modules/axios/lib/utils.js");
var bind = __webpack_require__(/*! ./helpers/bind */ "./node_modules/axios/lib/helpers/bind.js");
var Axios = __webpack_require__(/*! ./core/Axios */ "./node_modules/axios/lib/core/Axios.js");
var mergeConfig = __webpack_require__(/*! ./core/mergeConfig */ "./node_modules/axios/lib/core/mergeConfig.js");
var defaults = __webpack_require__(/*! ./defaults */ "./node_modules/axios/lib/defaults/index.js");

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Expose Cancel & CancelToken
axios.CanceledError = __webpack_require__(/*! ./cancel/CanceledError */ "./node_modules/axios/lib/cancel/CanceledError.js");
axios.CancelToken = __webpack_require__(/*! ./cancel/CancelToken */ "./node_modules/axios/lib/cancel/CancelToken.js");
axios.isCancel = __webpack_require__(/*! ./cancel/isCancel */ "./node_modules/axios/lib/cancel/isCancel.js");
axios.VERSION = (__webpack_require__(/*! ./env/data */ "./node_modules/axios/lib/env/data.js").version);
axios.toFormData = __webpack_require__(/*! ./helpers/toFormData */ "./node_modules/axios/lib/helpers/toFormData.js");

// Expose AxiosError class
axios.AxiosError = __webpack_require__(/*! ../lib/core/AxiosError */ "./node_modules/axios/lib/core/AxiosError.js");

// alias for CanceledError for backward compatibility
axios.Cancel = axios.CanceledError;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = __webpack_require__(/*! ./helpers/spread */ "./node_modules/axios/lib/helpers/spread.js");

// Expose isAxiosError
axios.isAxiosError = __webpack_require__(/*! ./helpers/isAxiosError */ "./node_modules/axios/lib/helpers/isAxiosError.js");

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports["default"] = axios;


/***/ }),

/***/ "./node_modules/axios/lib/cancel/CancelToken.js":
/*!******************************************************!*\
  !*** ./node_modules/axios/lib/cancel/CancelToken.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var CanceledError = __webpack_require__(/*! ./CanceledError */ "./node_modules/axios/lib/cancel/CanceledError.js");

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;

  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;

  // eslint-disable-next-line func-names
  this.promise.then(function(cancel) {
    if (!token._listeners) return;

    var i;
    var l = token._listeners.length;

    for (i = 0; i < l; i++) {
      token._listeners[i](cancel);
    }
    token._listeners = null;
  });

  // eslint-disable-next-line func-names
  this.promise.then = function(onfulfilled) {
    var _resolve;
    // eslint-disable-next-line func-names
    var promise = new Promise(function(resolve) {
      token.subscribe(resolve);
      _resolve = resolve;
    }).then(onfulfilled);

    promise.cancel = function reject() {
      token.unsubscribe(_resolve);
    };

    return promise;
  };

  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new CanceledError(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `CanceledError` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Subscribe to the cancel signal
 */

CancelToken.prototype.subscribe = function subscribe(listener) {
  if (this.reason) {
    listener(this.reason);
    return;
  }

  if (this._listeners) {
    this._listeners.push(listener);
  } else {
    this._listeners = [listener];
  }
};

/**
 * Unsubscribe from the cancel signal
 */

CancelToken.prototype.unsubscribe = function unsubscribe(listener) {
  if (!this._listeners) {
    return;
  }
  var index = this._listeners.indexOf(listener);
  if (index !== -1) {
    this._listeners.splice(index, 1);
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;


/***/ }),

/***/ "./node_modules/axios/lib/cancel/CanceledError.js":
/*!********************************************************!*\
  !*** ./node_modules/axios/lib/cancel/CanceledError.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var AxiosError = __webpack_require__(/*! ../core/AxiosError */ "./node_modules/axios/lib/core/AxiosError.js");
var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");

/**
 * A `CanceledError` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function CanceledError(message) {
  // eslint-disable-next-line no-eq-null,eqeqeq
  AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED);
  this.name = 'CanceledError';
}

utils.inherits(CanceledError, AxiosError, {
  __CANCEL__: true
});

module.exports = CanceledError;


/***/ }),

/***/ "./node_modules/axios/lib/cancel/isCancel.js":
/*!***************************************************!*\
  !*** ./node_modules/axios/lib/cancel/isCancel.js ***!
  \***************************************************/
/***/ ((module) => {

"use strict";


module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};


/***/ }),

/***/ "./node_modules/axios/lib/core/Axios.js":
/*!**********************************************!*\
  !*** ./node_modules/axios/lib/core/Axios.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
var buildURL = __webpack_require__(/*! ../helpers/buildURL */ "./node_modules/axios/lib/helpers/buildURL.js");
var InterceptorManager = __webpack_require__(/*! ./InterceptorManager */ "./node_modules/axios/lib/core/InterceptorManager.js");
var dispatchRequest = __webpack_require__(/*! ./dispatchRequest */ "./node_modules/axios/lib/core/dispatchRequest.js");
var mergeConfig = __webpack_require__(/*! ./mergeConfig */ "./node_modules/axios/lib/core/mergeConfig.js");
var buildFullPath = __webpack_require__(/*! ./buildFullPath */ "./node_modules/axios/lib/core/buildFullPath.js");
var validator = __webpack_require__(/*! ../helpers/validator */ "./node_modules/axios/lib/helpers/validator.js");

var validators = validator.validators;
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(configOrUrl, config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof configOrUrl === 'string') {
    config = config || {};
    config.url = configOrUrl;
  } else {
    config = configOrUrl || {};
  }

  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  var transitional = config.transitional;

  if (transitional !== undefined) {
    validator.assertOptions(transitional, {
      silentJSONParsing: validators.transitional(validators.boolean),
      forcedJSONParsing: validators.transitional(validators.boolean),
      clarifyTimeoutError: validators.transitional(validators.boolean)
    }, false);
  }

  // filter out skipped interceptors
  var requestInterceptorChain = [];
  var synchronousRequestInterceptors = true;
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
      return;
    }

    synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  var responseInterceptorChain = [];
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });

  var promise;

  if (!synchronousRequestInterceptors) {
    var chain = [dispatchRequest, undefined];

    Array.prototype.unshift.apply(chain, requestInterceptorChain);
    chain = chain.concat(responseInterceptorChain);

    promise = Promise.resolve(config);
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  }


  var newConfig = config;
  while (requestInterceptorChain.length) {
    var onFulfilled = requestInterceptorChain.shift();
    var onRejected = requestInterceptorChain.shift();
    try {
      newConfig = onFulfilled(newConfig);
    } catch (error) {
      onRejected(error);
      break;
    }
  }

  try {
    promise = dispatchRequest(newConfig);
  } catch (error) {
    return Promise.reject(error);
  }

  while (responseInterceptorChain.length) {
    promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  var fullPath = buildFullPath(config.baseURL, config.url);
  return buildURL(fullPath, config.params, config.paramsSerializer);
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/

  function generateHTTPMethod(isForm) {
    return function httpMethod(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method: method,
        headers: isForm ? {
          'Content-Type': 'multipart/form-data'
        } : {},
        url: url,
        data: data
      }));
    };
  }

  Axios.prototype[method] = generateHTTPMethod();

  Axios.prototype[method + 'Form'] = generateHTTPMethod(true);
});

module.exports = Axios;


/***/ }),

/***/ "./node_modules/axios/lib/core/AxiosError.js":
/*!***************************************************!*\
  !*** ./node_modules/axios/lib/core/AxiosError.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [config] The config.
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
function AxiosError(message, code, config, request, response) {
  Error.call(this);
  this.message = message;
  this.name = 'AxiosError';
  code && (this.code = code);
  config && (this.config = config);
  request && (this.request = request);
  response && (this.response = response);
}

utils.inherits(AxiosError, Error, {
  toJSON: function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  }
});

var prototype = AxiosError.prototype;
var descriptors = {};

[
  'ERR_BAD_OPTION_VALUE',
  'ERR_BAD_OPTION',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ERR_FR_TOO_MANY_REDIRECTS',
  'ERR_DEPRECATED',
  'ERR_BAD_RESPONSE',
  'ERR_BAD_REQUEST',
  'ERR_CANCELED'
// eslint-disable-next-line func-names
].forEach(function(code) {
  descriptors[code] = {value: code};
});

Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype, 'isAxiosError', {value: true});

// eslint-disable-next-line func-names
AxiosError.from = function(error, code, config, request, response, customProps) {
  var axiosError = Object.create(prototype);

  utils.toFlatObject(error, axiosError, function filter(obj) {
    return obj !== Error.prototype;
  });

  AxiosError.call(axiosError, error.message, code, config, request, response);

  axiosError.name = error.name;

  customProps && Object.assign(axiosError, customProps);

  return axiosError;
};

module.exports = AxiosError;


/***/ }),

/***/ "./node_modules/axios/lib/core/InterceptorManager.js":
/*!***********************************************************!*\
  !*** ./node_modules/axios/lib/core/InterceptorManager.js ***!
  \***********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected,
    synchronous: options ? options.synchronous : false,
    runWhen: options ? options.runWhen : null
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;


/***/ }),

/***/ "./node_modules/axios/lib/core/buildFullPath.js":
/*!******************************************************!*\
  !*** ./node_modules/axios/lib/core/buildFullPath.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var isAbsoluteURL = __webpack_require__(/*! ../helpers/isAbsoluteURL */ "./node_modules/axios/lib/helpers/isAbsoluteURL.js");
var combineURLs = __webpack_require__(/*! ../helpers/combineURLs */ "./node_modules/axios/lib/helpers/combineURLs.js");

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};


/***/ }),

/***/ "./node_modules/axios/lib/core/dispatchRequest.js":
/*!********************************************************!*\
  !*** ./node_modules/axios/lib/core/dispatchRequest.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
var transformData = __webpack_require__(/*! ./transformData */ "./node_modules/axios/lib/core/transformData.js");
var isCancel = __webpack_require__(/*! ../cancel/isCancel */ "./node_modules/axios/lib/cancel/isCancel.js");
var defaults = __webpack_require__(/*! ../defaults */ "./node_modules/axios/lib/defaults/index.js");
var CanceledError = __webpack_require__(/*! ../cancel/CanceledError */ "./node_modules/axios/lib/cancel/CanceledError.js");

/**
 * Throws a `CanceledError` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new CanceledError();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData.call(
    config,
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(
      config,
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};


/***/ }),

/***/ "./node_modules/axios/lib/core/mergeConfig.js":
/*!****************************************************!*\
  !*** ./node_modules/axios/lib/core/mergeConfig.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      return utils.merge(target, source);
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  // eslint-disable-next-line consistent-return
  function mergeDeepProperties(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function mergeDirectKeys(prop) {
    if (prop in config2) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  var mergeMap = {
    'url': valueFromConfig2,
    'method': valueFromConfig2,
    'data': valueFromConfig2,
    'baseURL': defaultToConfig2,
    'transformRequest': defaultToConfig2,
    'transformResponse': defaultToConfig2,
    'paramsSerializer': defaultToConfig2,
    'timeout': defaultToConfig2,
    'timeoutMessage': defaultToConfig2,
    'withCredentials': defaultToConfig2,
    'adapter': defaultToConfig2,
    'responseType': defaultToConfig2,
    'xsrfCookieName': defaultToConfig2,
    'xsrfHeaderName': defaultToConfig2,
    'onUploadProgress': defaultToConfig2,
    'onDownloadProgress': defaultToConfig2,
    'decompress': defaultToConfig2,
    'maxContentLength': defaultToConfig2,
    'maxBodyLength': defaultToConfig2,
    'beforeRedirect': defaultToConfig2,
    'transport': defaultToConfig2,
    'httpAgent': defaultToConfig2,
    'httpsAgent': defaultToConfig2,
    'cancelToken': defaultToConfig2,
    'socketPath': defaultToConfig2,
    'responseEncoding': defaultToConfig2,
    'validateStatus': mergeDirectKeys
  };

  utils.forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop) {
    var merge = mergeMap[prop] || mergeDeepProperties;
    var configValue = merge(prop);
    (utils.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
  });

  return config;
};


/***/ }),

/***/ "./node_modules/axios/lib/core/settle.js":
/*!***********************************************!*\
  !*** ./node_modules/axios/lib/core/settle.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var AxiosError = __webpack_require__(/*! ./AxiosError */ "./node_modules/axios/lib/core/AxiosError.js");

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError(
      'Request failed with status code ' + response.status,
      [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
      response.config,
      response.request,
      response
    ));
  }
};


/***/ }),

/***/ "./node_modules/axios/lib/core/transformData.js":
/*!******************************************************!*\
  !*** ./node_modules/axios/lib/core/transformData.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");
var defaults = __webpack_require__(/*! ../defaults */ "./node_modules/axios/lib/defaults/index.js");

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  var context = this || defaults;
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn.call(context, data, headers);
  });

  return data;
};


/***/ }),

/***/ "./node_modules/axios/lib/defaults/index.js":
/*!**************************************************!*\
  !*** ./node_modules/axios/lib/defaults/index.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");
var normalizeHeaderName = __webpack_require__(/*! ../helpers/normalizeHeaderName */ "./node_modules/axios/lib/helpers/normalizeHeaderName.js");
var AxiosError = __webpack_require__(/*! ../core/AxiosError */ "./node_modules/axios/lib/core/AxiosError.js");
var transitionalDefaults = __webpack_require__(/*! ./transitional */ "./node_modules/axios/lib/defaults/transitional.js");
var toFormData = __webpack_require__(/*! ../helpers/toFormData */ "./node_modules/axios/lib/helpers/toFormData.js");

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = __webpack_require__(/*! ../adapters/xhr */ "./node_modules/axios/lib/adapters/xhr.js");
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = __webpack_require__(/*! ../adapters/http */ "./node_modules/axios/lib/adapters/xhr.js");
  }
  return adapter;
}

function stringifySafely(rawValue, parser, encoder) {
  if (utils.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils.trim(rawValue);
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
    }
  }

  return (encoder || JSON.stringify)(rawValue);
}

var defaults = {

  transitional: transitionalDefaults,

  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');

    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }

    var isObjectPayload = utils.isObject(data);
    var contentType = headers && headers['Content-Type'];

    var isFileList;

    if ((isFileList = utils.isFileList(data)) || (isObjectPayload && contentType === 'multipart/form-data')) {
      var _FormData = this.env && this.env.FormData;
      return toFormData(isFileList ? {'files[]': data} : data, _FormData && new _FormData());
    } else if (isObjectPayload || contentType === 'application/json') {
      setContentTypeIfUnset(headers, 'application/json');
      return stringifySafely(data);
    }

    return data;
  }],

  transformResponse: [function transformResponse(data) {
    var transitional = this.transitional || defaults.transitional;
    var silentJSONParsing = transitional && transitional.silentJSONParsing;
    var forcedJSONParsing = transitional && transitional.forcedJSONParsing;
    var strictJSONParsing = !silentJSONParsing && this.responseType === 'json';

    if (strictJSONParsing || (forcedJSONParsing && utils.isString(data) && data.length)) {
      try {
        return JSON.parse(data);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === 'SyntaxError') {
            throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
          }
          throw e;
        }
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  env: {
    FormData: __webpack_require__(/*! ./env/FormData */ "./node_modules/axios/lib/helpers/null.js")
  },

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },

  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*'
    }
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;


/***/ }),

/***/ "./node_modules/axios/lib/defaults/transitional.js":
/*!*********************************************************!*\
  !*** ./node_modules/axios/lib/defaults/transitional.js ***!
  \*********************************************************/
/***/ ((module) => {

"use strict";


module.exports = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false
};


/***/ }),

/***/ "./node_modules/axios/lib/env/data.js":
/*!********************************************!*\
  !*** ./node_modules/axios/lib/env/data.js ***!
  \********************************************/
/***/ ((module) => {

module.exports = {
  "version": "0.27.2"
};

/***/ }),

/***/ "./node_modules/axios/lib/helpers/bind.js":
/*!************************************************!*\
  !*** ./node_modules/axios/lib/helpers/bind.js ***!
  \************************************************/
/***/ ((module) => {

"use strict";


module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/buildURL.js":
/*!****************************************************!*\
  !*** ./node_modules/axios/lib/helpers/buildURL.js ***!
  \****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/combineURLs.js":
/*!*******************************************************!*\
  !*** ./node_modules/axios/lib/helpers/combineURLs.js ***!
  \*******************************************************/
/***/ ((module) => {

"use strict";


/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/cookies.js":
/*!***************************************************!*\
  !*** ./node_modules/axios/lib/helpers/cookies.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);


/***/ }),

/***/ "./node_modules/axios/lib/helpers/isAbsoluteURL.js":
/*!*********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/isAbsoluteURL.js ***!
  \*********************************************************/
/***/ ((module) => {

"use strict";


/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/isAxiosError.js":
/*!********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/isAxiosError.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
module.exports = function isAxiosError(payload) {
  return utils.isObject(payload) && (payload.isAxiosError === true);
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/isURLSameOrigin.js":
/*!***********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/isURLSameOrigin.js ***!
  \***********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      var urlParsingNode = document.createElement('a');
      var originURL;

      /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
      function resolveURL(url) {
        var href = url;

        if (msie) {
        // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
      return function isURLSameOrigin(requestURL) {
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);


/***/ }),

/***/ "./node_modules/axios/lib/helpers/normalizeHeaderName.js":
/*!***************************************************************!*\
  !*** ./node_modules/axios/lib/helpers/normalizeHeaderName.js ***!
  \***************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/null.js":
/*!************************************************!*\
  !*** ./node_modules/axios/lib/helpers/null.js ***!
  \************************************************/
/***/ ((module) => {

// eslint-disable-next-line strict
module.exports = null;


/***/ }),

/***/ "./node_modules/axios/lib/helpers/parseHeaders.js":
/*!********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/parseHeaders.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ./../utils */ "./node_modules/axios/lib/utils.js");

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/parseProtocol.js":
/*!*********************************************************!*\
  !*** ./node_modules/axios/lib/helpers/parseProtocol.js ***!
  \*********************************************************/
/***/ ((module) => {

"use strict";


module.exports = function parseProtocol(url) {
  var match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || '';
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/spread.js":
/*!**************************************************!*\
  !*** ./node_modules/axios/lib/helpers/spread.js ***!
  \**************************************************/
/***/ ((module) => {

"use strict";


/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};


/***/ }),

/***/ "./node_modules/axios/lib/helpers/toFormData.js":
/*!******************************************************!*\
  !*** ./node_modules/axios/lib/helpers/toFormData.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var utils = __webpack_require__(/*! ../utils */ "./node_modules/axios/lib/utils.js");

/**
 * Convert a data object to FormData
 * @param {Object} obj
 * @param {?Object} [formData]
 * @returns {Object}
 **/

function toFormData(obj, formData) {
  // eslint-disable-next-line no-param-reassign
  formData = formData || new FormData();

  var stack = [];

  function convertValue(value) {
    if (value === null) return '';

    if (utils.isDate(value)) {
      return value.toISOString();
    }

    if (utils.isArrayBuffer(value) || utils.isTypedArray(value)) {
      return typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
    }

    return value;
  }

  function build(data, parentKey) {
    if (utils.isPlainObject(data) || utils.isArray(data)) {
      if (stack.indexOf(data) !== -1) {
        throw Error('Circular reference detected in ' + parentKey);
      }

      stack.push(data);

      utils.forEach(data, function each(value, key) {
        if (utils.isUndefined(value)) return;
        var fullKey = parentKey ? parentKey + '.' + key : key;
        var arr;

        if (value && !parentKey && typeof value === 'object') {
          if (utils.endsWith(key, '{}')) {
            // eslint-disable-next-line no-param-reassign
            value = JSON.stringify(value);
          } else if (utils.endsWith(key, '[]') && (arr = utils.toArray(value))) {
            // eslint-disable-next-line func-names
            arr.forEach(function(el) {
              !utils.isUndefined(el) && formData.append(fullKey, convertValue(el));
            });
            return;
          }
        }

        build(value, fullKey);
      });

      stack.pop();
    } else {
      formData.append(parentKey, convertValue(data));
    }
  }

  build(obj);

  return formData;
}

module.exports = toFormData;


/***/ }),

/***/ "./node_modules/axios/lib/helpers/validator.js":
/*!*****************************************************!*\
  !*** ./node_modules/axios/lib/helpers/validator.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var VERSION = (__webpack_require__(/*! ../env/data */ "./node_modules/axios/lib/env/data.js").version);
var AxiosError = __webpack_require__(/*! ../core/AxiosError */ "./node_modules/axios/lib/core/AxiosError.js");

var validators = {};

// eslint-disable-next-line func-names
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach(function(type, i) {
  validators[type] = function validator(thing) {
    return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
  };
});

var deprecatedWarnings = {};

/**
 * Transitional option validator
 * @param {function|boolean?} validator - set to false if the transitional option has been removed
 * @param {string?} version - deprecated version / removed since version
 * @param {string?} message - some message with additional info
 * @returns {function}
 */
validators.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
  }

  // eslint-disable-next-line func-names
  return function(value, opt, opts) {
    if (validator === false) {
      throw new AxiosError(
        formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
        AxiosError.ERR_DEPRECATED
      );
    }

    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      // eslint-disable-next-line no-console
      console.warn(
        formatMessage(
          opt,
          ' has been deprecated since v' + version + ' and will be removed in the near future'
        )
      );
    }

    return validator ? validator(value, opt, opts) : true;
  };
};

/**
 * Assert object's properties type
 * @param {object} options
 * @param {object} schema
 * @param {boolean?} allowUnknown
 */

function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== 'object') {
    throw new AxiosError('options must be an object', AxiosError.ERR_BAD_OPTION_VALUE);
  }
  var keys = Object.keys(options);
  var i = keys.length;
  while (i-- > 0) {
    var opt = keys[i];
    var validator = schema[opt];
    if (validator) {
      var value = options[opt];
      var result = value === undefined || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError('option ' + opt + ' must be ' + result, AxiosError.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError('Unknown option ' + opt, AxiosError.ERR_BAD_OPTION);
    }
  }
}

module.exports = {
  assertOptions: assertOptions,
  validators: validators
};


/***/ }),

/***/ "./node_modules/axios/lib/utils.js":
/*!*****************************************!*\
  !*** ./node_modules/axios/lib/utils.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bind = __webpack_require__(/*! ./helpers/bind */ "./node_modules/axios/lib/helpers/bind.js");

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

// eslint-disable-next-line func-names
var kindOf = (function(cache) {
  // eslint-disable-next-line func-names
  return function(thing) {
    var str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
  };
})(Object.create(null));

function kindOfTest(type) {
  type = type.toLowerCase();
  return function isKindOf(thing) {
    return kindOf(thing) === type;
  };
}

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return Array.isArray(val);
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
var isArrayBuffer = kindOfTest('ArrayBuffer');


/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a plain Object
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a plain Object, otherwise false
 */
function isPlainObject(val) {
  if (kindOf(val) !== 'object') {
    return false;
  }

  var prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Determine if a value is a Date
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
var isDate = kindOfTest('Date');

/**
 * Determine if a value is a File
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
var isFile = kindOfTest('File');

/**
 * Determine if a value is a Blob
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
var isBlob = kindOfTest('Blob');

/**
 * Determine if a value is a FileList
 *
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
var isFileList = kindOfTest('FileList');

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} thing The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(thing) {
  var pattern = '[object FormData]';
  return thing && (
    (typeof FormData === 'function' && thing instanceof FormData) ||
    toString.call(thing) === pattern ||
    (isFunction(thing.toString) && thing.toString() === pattern)
  );
}

/**
 * Determine if a value is a URLSearchParams object
 * @function
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
var isURLSearchParams = kindOfTest('URLSearchParams');

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                           navigator.product === 'NativeScript' ||
                                           navigator.product === 'NS')) {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 * @return {string} content value without BOM
 */
function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

/**
 * Inherit the prototype methods from one constructor into another
 * @param {function} constructor
 * @param {function} superConstructor
 * @param {object} [props]
 * @param {object} [descriptors]
 */

function inherits(constructor, superConstructor, props, descriptors) {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors);
  constructor.prototype.constructor = constructor;
  props && Object.assign(constructor.prototype, props);
}

/**
 * Resolve object with deep prototype chain to a flat object
 * @param {Object} sourceObj source object
 * @param {Object} [destObj]
 * @param {Function} [filter]
 * @returns {Object}
 */

function toFlatObject(sourceObj, destObj, filter) {
  var props;
  var i;
  var prop;
  var merged = {};

  destObj = destObj || {};

  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if (!merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = Object.getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

  return destObj;
}

/*
 * determines whether a string ends with the characters of a specified string
 * @param {String} str
 * @param {String} searchString
 * @param {Number} [position= 0]
 * @returns {boolean}
 */
function endsWith(str, searchString, position) {
  str = String(str);
  if (position === undefined || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  var lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
}


/**
 * Returns new array from array like object
 * @param {*} [thing]
 * @returns {Array}
 */
function toArray(thing) {
  if (!thing) return null;
  var i = thing.length;
  if (isUndefined(i)) return null;
  var arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
}

// eslint-disable-next-line func-names
var isTypedArray = (function(TypedArray) {
  // eslint-disable-next-line func-names
  return function(thing) {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== 'undefined' && Object.getPrototypeOf(Uint8Array));

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isPlainObject: isPlainObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim,
  stripBOM: stripBOM,
  inherits: inherits,
  toFlatObject: toFlatObject,
  kindOf: kindOf,
  kindOfTest: kindOfTest,
  endsWith: endsWith,
  toArray: toArray,
  isTypedArray: isTypedArray,
  isFileList: isFileList
};


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/AppView.scss":
/*!******************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/AppView.scss ***!
  \******************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/getUrl.js */ "./node_modules/css-loader/dist/runtime/getUrl.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _assets_fonts_SuisseIntl_Regular_woff__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../assets/fonts/SuisseIntl-Regular.woff */ "./src/assets/fonts/SuisseIntl-Regular.woff");
/* harmony import */ var _assets_fonts_SuisseIntl_Regular_ttf__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../assets/fonts/SuisseIntl-Regular.ttf */ "./src/assets/fonts/SuisseIntl-Regular.ttf");
/* harmony import */ var _assets_fonts_SuisseIntl_Regular_svg__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../assets/fonts/SuisseIntl-Regular.svg */ "./src/assets/fonts/SuisseIntl-Regular.svg");
/* harmony import */ var _assets_fonts_SuisseIntl_Book_woff__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../assets/fonts/SuisseIntl-Book.woff */ "./src/assets/fonts/SuisseIntl-Book.woff");
/* harmony import */ var _assets_fonts_SuisseIntl_Book_ttf__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../assets/fonts/SuisseIntl-Book.ttf */ "./src/assets/fonts/SuisseIntl-Book.ttf");
/* harmony import */ var _assets_fonts_SuisseIntl_Book_svg__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../assets/fonts/SuisseIntl-Book.svg */ "./src/assets/fonts/SuisseIntl-Book.svg");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_eot__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../assets/fonts/SuisseIntl-Bold.eot */ "./src/assets/fonts/SuisseIntl-Bold.eot");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_woff__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../assets/fonts/SuisseIntl-Bold.woff */ "./src/assets/fonts/SuisseIntl-Bold.woff");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_ttf__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../assets/fonts/SuisseIntl-Bold.ttf */ "./src/assets/fonts/SuisseIntl-Bold.ttf");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_svg__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../assets/fonts/SuisseIntl-Bold.svg */ "./src/assets/fonts/SuisseIntl-Bold.svg");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_eot__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../../assets/fonts/SuisseWorks-Regular.eot */ "./src/assets/fonts/SuisseWorks-Regular.eot");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_woff__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../../assets/fonts/SuisseWorks-Regular.woff */ "./src/assets/fonts/SuisseWorks-Regular.woff");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_ttf__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../assets/fonts/SuisseWorks-Regular.ttf */ "./src/assets/fonts/SuisseWorks-Regular.ttf");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_svg__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../../assets/fonts/SuisseWorks-Regular.svg */ "./src/assets/fonts/SuisseWorks-Regular.svg");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_eot__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../../assets/fonts/SuisseWorks-Book.eot */ "./src/assets/fonts/SuisseWorks-Book.eot");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_woff__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ../../assets/fonts/SuisseWorks-Book.woff */ "./src/assets/fonts/SuisseWorks-Book.woff");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_ttf__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ../../assets/fonts/SuisseWorks-Book.ttf */ "./src/assets/fonts/SuisseWorks-Book.ttf");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_svg__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ../../assets/fonts/SuisseWorks-Book.svg */ "./src/assets/fonts/SuisseWorks-Book.svg");
// Imports





















var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Regular_woff__WEBPACK_IMPORTED_MODULE_3__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_1___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Regular_ttf__WEBPACK_IMPORTED_MODULE_4__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_2___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Regular_svg__WEBPACK_IMPORTED_MODULE_5__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_3___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Book_woff__WEBPACK_IMPORTED_MODULE_6__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_4___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Book_ttf__WEBPACK_IMPORTED_MODULE_7__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_5___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Book_svg__WEBPACK_IMPORTED_MODULE_8__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_6___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_eot__WEBPACK_IMPORTED_MODULE_9__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_7___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_woff__WEBPACK_IMPORTED_MODULE_10__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_8___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_ttf__WEBPACK_IMPORTED_MODULE_11__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_9___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_svg__WEBPACK_IMPORTED_MODULE_12__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_10___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_eot__WEBPACK_IMPORTED_MODULE_13__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_11___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_woff__WEBPACK_IMPORTED_MODULE_14__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_12___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_ttf__WEBPACK_IMPORTED_MODULE_15__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_13___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_svg__WEBPACK_IMPORTED_MODULE_16__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_14___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_eot__WEBPACK_IMPORTED_MODULE_17__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_15___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_woff__WEBPACK_IMPORTED_MODULE_18__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_16___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_ttf__WEBPACK_IMPORTED_MODULE_19__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_17___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_svg__WEBPACK_IMPORTED_MODULE_20__["default"]);
// Module
___CSS_LOADER_EXPORT___.push([module.id, "@charset \"UTF-8\";\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_1___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_2___ + ") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_3___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_3___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_4___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_5___ + ") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_6___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_7___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_8___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_9___ + ") format(\"svg\");\n  font-weight: bold;\n  font-style: 700;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_10___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_11___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_12___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_13___ + ") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_14___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_15___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_16___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_17___ + ") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n.button {\n  -webkit-transition: all 0.3s ease;\n  -o-transition: all 0.3s ease;\n  transition: all 0.3s ease;\n}\n\nbody {\n  margin: 0;\n}\n\n.wrapper {\n  width: 100%;\n  box-sizing: border-box;\n}\n\n.header-wrapper {\n  border-bottom: 1px solid #535353;\n}\n\n.footer-wrapper {\n  border-top: 1px solid #535353;\n}\n\n.white {\n  background-color: #ffffff;\n}\n\n.main-container {\n  width: 1240px;\n  margin: auto;\n}\n\nhtml {\n  font-size: 16px;\n}\n\n.shadow-overlay {\n  width: 100%;\n  height: 100%;\n  background: #181e30;\n  opacity: 0.6;\n  z-index: 90;\n  top: 0;\n  position: fixed;\n}\n\n.hidden {\n  display: none;\n}\n\n.button {\n  color: #ffffff;\n  background: #000000;\n  padding: 0.5rem 0.8rem;\n  border: 0;\n  font-size: 0.9rem;\n  border-radius: 2rem;\n  cursor: pointer;\n}\n\n.button_light {\n  background: #ffffff;\n  outline: 1px solid #000000;\n  color: #000000;\n}\n\n.button:hover {\n  background: #E3FB8F;\n  outline: 1px solid #000000;\n  color: #000000;\n}", "",{"version":3,"sources":["webpack://./../../../../../%D0%A0%D0%B0%D0%B1%D0%BE%D1%87%D0%B8%D0%B9%20%D1%81%D1%82%D0%BE%D0%BB/git/trash/rslangg/rslang/src/components/view/AppView.scss","webpack://./src/components/view/base-styles.scss","webpack://./src/components/view/AppView.scss"],"names":[],"mappings":"AAAA,gBAAgB;ACmDf;EACC,yBAAA;EACA,4CAAA;EACA,0LAAA;EACA,mBAAA;EACA,eAAA;ADjDF;ACoDC;EACC,yBAAA;EACA,4CAAA;EACA,0LAAA;EACA,mBAAA;EACA,eAAA;ADlDF;ACqDC;EACA,yBAAA;EACA,4CAAA;EACA,0LAAA;EACA,iBAAA;EACA,eAAA;ADnDD;ACsDC;EACA,0BAAA;EACA,6CAAA;EACA,6LAAA;EACA,mBAAA;EACA,eAAA;ADpDD;ACuDA;EACC,0BAAA;EACA,6CAAA;EACA,6LAAA;EACA,mBAAA;EACA,eAAA;ADrDD;AEjCA;EACE,iCAAA;EACA,4BAAA;EACA,yBAAA;AFmCF;;AEhCA;EACE,SAAA;AFmCF;;AEhCA;EACE,WAAA;EACA,sBAAA;AFmCF;;AEhCA;EACE,gCAAA;AFmCF;;AEhCA;EACE,6BAAA;AFmCF;;AE5BA;EACE,yBDGc;AD4BhB;;AE5BA;EACE,aAAA;EACA,YAAA;AF+BF;;AE5BA;EACE,eAAA;AF+BF;;AE5BA;EACE,WAAA;EACA,YAAA;EACA,mBAAA;EACA,YAAA;EACA,WAAA;EACA,MAAA;EACA,eAAA;AF+BF;;AE5BA;EACE,aAAA;AF+BF;;AE5BA;EACE,cDxBc;ECyBd,mBDvBc;ECwBd,sBAAA;EACA,SAAA;EACA,iBAAA;EACA,mBAAA;EACA,eAAA;AF+BF;;AE5BA;EACE,mBDlCc;ECmCd,0BAAA;EACA,cDlCc;ADiEhB;;AE3BA;EACE,mBD7BY;EC8BZ,0BAAA;EACA,cDzCc;ADuEhB","sourcesContent":["@charset \"UTF-8\";\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(\"../../assets/fonts/SuisseIntl-Regular.woff\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseIntl-Regular.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseIntl-Regular.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseIntl-Regular.svg\") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(\"../../assets/fonts/SuisseIntl-Book.woff\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseIntl-Book.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseIntl-Book.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseIntl-Book.svg\") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(\"../../assets/fonts/SuisseIntl-Bold.eot\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseIntl-Bold.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseIntl-Bold.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseIntl-Bold.svg\") format(\"svg\");\n  font-weight: bold;\n  font-style: 700;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(\"../../assets/fonts/SuisseWorks-Regular.eot\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseWorks-Regular.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseWorks-Regular.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseWorks-Regular.svg\") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(\"../../assets/fonts/SuisseWorks-Book.eot\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseWorks-Book.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseWorks-Book.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseWorks-Book.svg\") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n.button {\n  -webkit-transition: all 0.3s ease;\n  -o-transition: all 0.3s ease;\n  transition: all 0.3s ease;\n}\n\nbody {\n  margin: 0;\n}\n\n.wrapper {\n  width: 100%;\n  box-sizing: border-box;\n}\n\n.header-wrapper {\n  border-bottom: 1px solid #535353;\n}\n\n.footer-wrapper {\n  border-top: 1px solid #535353;\n}\n\n.white {\n  background-color: #ffffff;\n}\n\n.main-container {\n  width: 1240px;\n  margin: auto;\n}\n\nhtml {\n  font-size: 16px;\n}\n\n.shadow-overlay {\n  width: 100%;\n  height: 100%;\n  background: #181e30;\n  opacity: 0.6;\n  z-index: 90;\n  top: 0;\n  position: fixed;\n}\n\n.hidden {\n  display: none;\n}\n\n.button {\n  color: #ffffff;\n  background: #000000;\n  padding: 0.5rem 0.8rem;\n  border: 0;\n  font-size: 0.9rem;\n  border-radius: 2rem;\n  cursor: pointer;\n}\n\n.button_light {\n  background: #ffffff;\n  outline: 1px solid #000000;\n  color: #000000;\n}\n\n.button:hover {\n  background: #E3FB8F;\n  outline: 1px solid #000000;\n  color: #000000;\n}","$fa-font-path: '../../assets/fonts/' !default;\n\n// шрифты\n$rusFont: 'SuisseIntl, Tahoma, sans-serif';\n$enFont: 'SuisseWorks, Georgia, Serif';\n\n// шрифты, основные размеры\n$textHeader: 3rem;\n$textSubtitle: 2rem;\n$textBasic: 1.5rem;\n$textDescription: 1.25rem;\n\n// цвета для иконок на карточка Сложное, Изученное\n$iconColorComplex: #FF0000;\n$iconColorStudied: #65D72F;\n\n// цвета активных кнопок в Словаре\n$btnColorUnit1: #E92D38;\n$btnColorUnit2: #F36F1E;\n$btnColorUnit3: #FDCA1F;\n$btnColorUnit4: #7AB63E;\n$btnColorUnit5: #35B4D0;\n$btnColorUnit6: #0855E4;\n\n// цвета активных фона карточек в Словаре\n$bgColorUnit1: #FFEAEB;\n$bgColorUnit2: #FFF0E7;\n$bgColorUnit3: #FFF8E1;\n$bgColorUnit4: #EEFDDE;\n$bgColorUnit5: #B9F2FF;\n$bgColorUnit6: #B2CAF9;\n\n// цвета фонов и текста на сайте\n$bgTColorWhite: #ffffff;\n$bgTColorGrey: #E9E9E9;\n$bgTColorBlack: #000000;\n\n// текст не активных элементов(разделы меню и тп)\n$TextNotActive: #898989;\n\n// цветные элементы используемые на сайте\n$elemColorGreen: #D7E977;\n$elemColorCian: #89FCFB;\n\n// кнопка по ховеру\n$colorBtnHov: #E3FB8F; \n\n// форма регистрации, входа\n$bgColorInput: #F1F1F1;\n\n\n @font-face {\n \tfont-family: 'SuisseIntl';\n \tsrc: url('#{$fa-font-path}SuisseIntl-Regular.woff');\n \tsrc: local('☺'), url('#{$fa-font-path}SuisseIntl-Regular.woff') format('woff'), url('#{$fa-font-path}SuisseIntl-Regular.ttf') format('truetype'), url('#{$fa-font-path}SuisseIntl-Regular.svg') format('svg');\n \tfont-weight: normal;\n \tfont-style: 400;\n }\n\n @font-face {\n \tfont-family: 'SuisseIntl';\n \tsrc: url('#{$fa-font-path}SuisseIntl-Book.woff');\n \tsrc: local('☺'), url('#{$fa-font-path}SuisseIntl-Book.woff') format('woff'), url('#{$fa-font-path}SuisseIntl-Book.ttf') format('truetype'), url('#{$fa-font-path}SuisseIntl-Book.svg') format('svg');\n \tfont-weight: medium;\n \tfont-style: 500;\n }\n\n @font-face {\n\tfont-family: 'SuisseIntl';\n\tsrc: url('#{$fa-font-path}SuisseIntl-Bold.eot');\n\tsrc: local('☺'), url('#{$fa-font-path}SuisseIntl-Bold.woff') format('woff'), url('#{$fa-font-path}SuisseIntl-Bold.ttf') format('truetype'), url('#{$fa-font-path}SuisseIntl-Bold.svg') format('svg');\n\tfont-weight: bold;\n\tfont-style: 700;\n}\n\n @font-face {\n\tfont-family: 'SuisseWorks';\n\tsrc: url('#{$fa-font-path}SuisseWorks-Regular.eot');\n\tsrc: local('☺'), url('#{$fa-font-path}SuisseWorks-Regular.woff') format('woff'), url('#{$fa-font-path}SuisseWorks-Regular.ttf') format('truetype'), url('#{$fa-font-path}SuisseWorks-Regular.svg') format('svg');\n\tfont-weight: normal;\n\tfont-style: 400;\n}\n\n@font-face {\n\tfont-family: 'SuisseWorks';\n\tsrc: url('#{$fa-font-path}SuisseWorks-Book.eot');\n\tsrc: local('☺'), url('#{$fa-font-path}SuisseWorks-Book.woff') format('woff'), url('#{$fa-font-path}SuisseWorks-Book.ttf') format('truetype'), url('#{$fa-font-path}SuisseWorks-Book.svg') format('svg');\n\tfont-weight: medium;\n\tfont-style: 500;\n}\n","@import 'base-styles.scss';\n\n.button  {\n  -webkit-transition: all 0.3s ease;\n  -o-transition: all 0.3s ease;\n  transition: all 0.3s ease;\n}\n\nbody {\n  margin: 0;\n}\n\n.wrapper {\n  width: 100%;\n  box-sizing: border-box;\n}\n\n.header-wrapper{\n  border-bottom: 1px solid #535353;\n}\n\n.footer-wrapper {\n  border-top: 1px solid #535353;\n}\n\n// .gray {\n//   background-color: $grayBg;\n// }\n\n.white {\n  background-color: $bgTColorWhite;\n}\n\n.main-container{\n  width: 1240px;\n  margin: auto;\n}\n\nhtml {\n  font-size: 16px;\n}\n\n.shadow-overlay {\n  width: 100%;\n  height: 100%;\n  background: #181e30;\n  opacity: 0.6;\n  z-index: 90;\n  top: 0;\n  position: fixed;\n}\n\n.hidden {\n  display: none;\n}\n\n.button {\n  color: $bgTColorWhite;\n  background: $bgTColorBlack;\n  padding: 0.5rem 0.8rem;\n  border: 0;\n  font-size: 0.9rem;\n  border-radius: 2rem;\n  cursor: pointer;\n}\n\n.button_light {\n  background: $bgTColorWhite;\n  outline: 1px solid $bgTColorBlack;\n  color: $bgTColorBlack;\n}\n\n\n.button:hover {\n  background: $colorBtnHov;\n  outline: 1px solid $bgTColorBlack;\n  color: $bgTColorBlack;\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/audio/AudioChallenge.scss":
/*!*******************************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/audio/AudioChallenge.scss ***!
  \*******************************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "", "",{"version":3,"sources":[],"names":[],"mappings":"","sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/dictionary/Dictionary.scss":
/*!********************************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/dictionary/Dictionary.scss ***!
  \********************************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "", "",{"version":3,"sources":[],"names":[],"mappings":"","sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/footer/Footer.scss":
/*!************************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/footer/Footer.scss ***!
  \************************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/getUrl.js */ "./node_modules/css-loader/dist/runtime/getUrl.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _assets_fonts_SuisseIntl_Regular_woff__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Regular.woff */ "./src/assets/fonts/SuisseIntl-Regular.woff");
/* harmony import */ var _assets_fonts_SuisseIntl_Regular_ttf__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Regular.ttf */ "./src/assets/fonts/SuisseIntl-Regular.ttf");
/* harmony import */ var _assets_fonts_SuisseIntl_Regular_svg__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Regular.svg */ "./src/assets/fonts/SuisseIntl-Regular.svg");
/* harmony import */ var _assets_fonts_SuisseIntl_Book_woff__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Book.woff */ "./src/assets/fonts/SuisseIntl-Book.woff");
/* harmony import */ var _assets_fonts_SuisseIntl_Book_ttf__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Book.ttf */ "./src/assets/fonts/SuisseIntl-Book.ttf");
/* harmony import */ var _assets_fonts_SuisseIntl_Book_svg__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Book.svg */ "./src/assets/fonts/SuisseIntl-Book.svg");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_eot__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Bold.eot */ "./src/assets/fonts/SuisseIntl-Bold.eot");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_woff__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Bold.woff */ "./src/assets/fonts/SuisseIntl-Bold.woff");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_ttf__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Bold.ttf */ "./src/assets/fonts/SuisseIntl-Bold.ttf");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_svg__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Bold.svg */ "./src/assets/fonts/SuisseIntl-Bold.svg");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_eot__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Regular.eot */ "./src/assets/fonts/SuisseWorks-Regular.eot");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_woff__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Regular.woff */ "./src/assets/fonts/SuisseWorks-Regular.woff");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_ttf__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Regular.ttf */ "./src/assets/fonts/SuisseWorks-Regular.ttf");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_svg__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Regular.svg */ "./src/assets/fonts/SuisseWorks-Regular.svg");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_eot__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Book.eot */ "./src/assets/fonts/SuisseWorks-Book.eot");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_woff__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Book.woff */ "./src/assets/fonts/SuisseWorks-Book.woff");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_ttf__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Book.ttf */ "./src/assets/fonts/SuisseWorks-Book.ttf");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_svg__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Book.svg */ "./src/assets/fonts/SuisseWorks-Book.svg");
// Imports





















var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Regular_woff__WEBPACK_IMPORTED_MODULE_3__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_1___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Regular_ttf__WEBPACK_IMPORTED_MODULE_4__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_2___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Regular_svg__WEBPACK_IMPORTED_MODULE_5__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_3___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Book_woff__WEBPACK_IMPORTED_MODULE_6__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_4___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Book_ttf__WEBPACK_IMPORTED_MODULE_7__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_5___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Book_svg__WEBPACK_IMPORTED_MODULE_8__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_6___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_eot__WEBPACK_IMPORTED_MODULE_9__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_7___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_woff__WEBPACK_IMPORTED_MODULE_10__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_8___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_ttf__WEBPACK_IMPORTED_MODULE_11__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_9___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_svg__WEBPACK_IMPORTED_MODULE_12__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_10___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_eot__WEBPACK_IMPORTED_MODULE_13__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_11___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_woff__WEBPACK_IMPORTED_MODULE_14__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_12___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_ttf__WEBPACK_IMPORTED_MODULE_15__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_13___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_svg__WEBPACK_IMPORTED_MODULE_16__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_14___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_eot__WEBPACK_IMPORTED_MODULE_17__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_15___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_woff__WEBPACK_IMPORTED_MODULE_18__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_16___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_ttf__WEBPACK_IMPORTED_MODULE_19__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_17___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_svg__WEBPACK_IMPORTED_MODULE_20__["default"]);
// Module
___CSS_LOADER_EXPORT___.push([module.id, "@charset \"UTF-8\";\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_1___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_2___ + ") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_3___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_3___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_4___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_5___ + ") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_6___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_7___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_8___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_9___ + ") format(\"svg\");\n  font-weight: bold;\n  font-style: 700;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_10___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_11___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_12___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_13___ + ") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_14___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_15___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_16___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_17___ + ") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n.footer-container {\n  width: 1240px;\n  margin: auto;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n.footer-container .copyright {\n  font-size: 1rem;\n  color: #000000;\n  text-align: center;\n}\n.footer-container .copyright a {\n  color: #000000;\n  text-decoration: none;\n}\n.footer-container .copyright a:hover {\n  text-decoration: underline;\n}\n.footer-container .copyright:before {\n  content: \"©\";\n}\n.footer-container .github-link {\n  display: flex;\n  gap: 16px;\n}\n.footer-container .github-link a {\n  text-decoration: none;\n  color: #000000;\n}\n\n.rsschool {\n  width: 83px;\n  height: 30px;\n  margin-left: 20px;\n}\n.rsschool:hover .rsschool-paint, .rsschool:focus .rsschool-paint {\n  fill: #E3FB8F;\n}", "",{"version":3,"sources":["webpack://./../../../../../%D0%A0%D0%B0%D0%B1%D0%BE%D1%87%D0%B8%D0%B9%20%D1%81%D1%82%D0%BE%D0%BB/git/trash/rslangg/rslang/src/components/view/footer/Footer.scss","webpack://./src/components/view/base-styles.scss","webpack://./src/components/view/footer/Footer.scss"],"names":[],"mappings":"AAAA,gBAAgB;ACmDf;EACC,yBAAA;EACA,4CAAA;EACA,0LAAA;EACA,mBAAA;EACA,eAAA;ADjDF;ACoDC;EACC,yBAAA;EACA,4CAAA;EACA,0LAAA;EACA,mBAAA;EACA,eAAA;ADlDF;ACqDC;EACA,yBAAA;EACA,4CAAA;EACA,0LAAA;EACA,iBAAA;EACA,eAAA;ADnDD;ACsDC;EACA,0BAAA;EACA,6CAAA;EACA,6LAAA;EACA,mBAAA;EACA,eAAA;ADpDD;ACuDA;EACC,0BAAA;EACA,6CAAA;EACA,6LAAA;EACA,mBAAA;EACA,eAAA;ADrDD;AEjCA;EACE,aAAA;EACA,YAAA;EACA,aAAA;EACA,mBAAA;EACA,8BAAA;AFmCF;AEjCE;EACE,eAAA;EACA,cDwBY;ECvBZ,kBAAA;AFmCJ;AEjCI;EACE,cDoBU;ECnBV,qBAAA;AFmCN;AEhCI;EACE,0BAAA;AFkCN;AE/BI;EACE,YAAA;AFiCN;AE7BE;EACE,aAAA;EACA,SAAA;AF+BJ;AE9BI;EACE,qBAAA;EACA,cDEU;AD8BhB;;AE3BA;EACE,WAAA;EACA,YAAA;EACA,iBAAA;AF8BF;AE5BE;EAEE,aAAA;AF6BJ","sourcesContent":["@charset \"UTF-8\";\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(\"../../assets/fonts/SuisseIntl-Regular.woff\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseIntl-Regular.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseIntl-Regular.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseIntl-Regular.svg\") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(\"../../assets/fonts/SuisseIntl-Book.woff\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseIntl-Book.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseIntl-Book.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseIntl-Book.svg\") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(\"../../assets/fonts/SuisseIntl-Bold.eot\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseIntl-Bold.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseIntl-Bold.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseIntl-Bold.svg\") format(\"svg\");\n  font-weight: bold;\n  font-style: 700;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(\"../../assets/fonts/SuisseWorks-Regular.eot\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseWorks-Regular.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseWorks-Regular.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseWorks-Regular.svg\") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(\"../../assets/fonts/SuisseWorks-Book.eot\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseWorks-Book.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseWorks-Book.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseWorks-Book.svg\") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n.footer-container {\n  width: 1240px;\n  margin: auto;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n.footer-container .copyright {\n  font-size: 1rem;\n  color: #000000;\n  text-align: center;\n}\n.footer-container .copyright a {\n  color: #000000;\n  text-decoration: none;\n}\n.footer-container .copyright a:hover {\n  text-decoration: underline;\n}\n.footer-container .copyright:before {\n  content: \"©\";\n}\n.footer-container .github-link {\n  display: flex;\n  gap: 16px;\n}\n.footer-container .github-link a {\n  text-decoration: none;\n  color: #000000;\n}\n\n.rsschool {\n  width: 83px;\n  height: 30px;\n  margin-left: 20px;\n}\n.rsschool:hover .rsschool-paint, .rsschool:focus .rsschool-paint {\n  fill: #E3FB8F;\n}","$fa-font-path: '../../assets/fonts/' !default;\n\n// шрифты\n$rusFont: 'SuisseIntl, Tahoma, sans-serif';\n$enFont: 'SuisseWorks, Georgia, Serif';\n\n// шрифты, основные размеры\n$textHeader: 3rem;\n$textSubtitle: 2rem;\n$textBasic: 1.5rem;\n$textDescription: 1.25rem;\n\n// цвета для иконок на карточка Сложное, Изученное\n$iconColorComplex: #FF0000;\n$iconColorStudied: #65D72F;\n\n// цвета активных кнопок в Словаре\n$btnColorUnit1: #E92D38;\n$btnColorUnit2: #F36F1E;\n$btnColorUnit3: #FDCA1F;\n$btnColorUnit4: #7AB63E;\n$btnColorUnit5: #35B4D0;\n$btnColorUnit6: #0855E4;\n\n// цвета активных фона карточек в Словаре\n$bgColorUnit1: #FFEAEB;\n$bgColorUnit2: #FFF0E7;\n$bgColorUnit3: #FFF8E1;\n$bgColorUnit4: #EEFDDE;\n$bgColorUnit5: #B9F2FF;\n$bgColorUnit6: #B2CAF9;\n\n// цвета фонов и текста на сайте\n$bgTColorWhite: #ffffff;\n$bgTColorGrey: #E9E9E9;\n$bgTColorBlack: #000000;\n\n// текст не активных элементов(разделы меню и тп)\n$TextNotActive: #898989;\n\n// цветные элементы используемые на сайте\n$elemColorGreen: #D7E977;\n$elemColorCian: #89FCFB;\n\n// кнопка по ховеру\n$colorBtnHov: #E3FB8F; \n\n// форма регистрации, входа\n$bgColorInput: #F1F1F1;\n\n\n @font-face {\n \tfont-family: 'SuisseIntl';\n \tsrc: url('#{$fa-font-path}SuisseIntl-Regular.woff');\n \tsrc: local('☺'), url('#{$fa-font-path}SuisseIntl-Regular.woff') format('woff'), url('#{$fa-font-path}SuisseIntl-Regular.ttf') format('truetype'), url('#{$fa-font-path}SuisseIntl-Regular.svg') format('svg');\n \tfont-weight: normal;\n \tfont-style: 400;\n }\n\n @font-face {\n \tfont-family: 'SuisseIntl';\n \tsrc: url('#{$fa-font-path}SuisseIntl-Book.woff');\n \tsrc: local('☺'), url('#{$fa-font-path}SuisseIntl-Book.woff') format('woff'), url('#{$fa-font-path}SuisseIntl-Book.ttf') format('truetype'), url('#{$fa-font-path}SuisseIntl-Book.svg') format('svg');\n \tfont-weight: medium;\n \tfont-style: 500;\n }\n\n @font-face {\n\tfont-family: 'SuisseIntl';\n\tsrc: url('#{$fa-font-path}SuisseIntl-Bold.eot');\n\tsrc: local('☺'), url('#{$fa-font-path}SuisseIntl-Bold.woff') format('woff'), url('#{$fa-font-path}SuisseIntl-Bold.ttf') format('truetype'), url('#{$fa-font-path}SuisseIntl-Bold.svg') format('svg');\n\tfont-weight: bold;\n\tfont-style: 700;\n}\n\n @font-face {\n\tfont-family: 'SuisseWorks';\n\tsrc: url('#{$fa-font-path}SuisseWorks-Regular.eot');\n\tsrc: local('☺'), url('#{$fa-font-path}SuisseWorks-Regular.woff') format('woff'), url('#{$fa-font-path}SuisseWorks-Regular.ttf') format('truetype'), url('#{$fa-font-path}SuisseWorks-Regular.svg') format('svg');\n\tfont-weight: normal;\n\tfont-style: 400;\n}\n\n@font-face {\n\tfont-family: 'SuisseWorks';\n\tsrc: url('#{$fa-font-path}SuisseWorks-Book.eot');\n\tsrc: local('☺'), url('#{$fa-font-path}SuisseWorks-Book.woff') format('woff'), url('#{$fa-font-path}SuisseWorks-Book.ttf') format('truetype'), url('#{$fa-font-path}SuisseWorks-Book.svg') format('svg');\n\tfont-weight: medium;\n\tfont-style: 500;\n}\n","@import '../base-styles.scss';\n\n.footer-container {\n  width: 1240px;\n  margin: auto;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n\n  .copyright {\n    font-size: 1rem;\n    color: $bgTColorBlack;\n    text-align: center;\n\n    a {\n      color: $bgTColorBlack;\n      text-decoration: none;\n    }\n\n    a:hover {\n      text-decoration: underline;\n    }\n\n    &:before {\n      content: '©';\n    }\n  }\n\n  .github-link {\n    display: flex;\n    gap: 16px;\n    a {\n      text-decoration: none;\n      color: $bgTColorBlack;\n    }\n  }\n}\n\n.rsschool {\n  width: 83px;\n  height: 30px;\n  margin-left: 20px;\n\n  &:hover .rsschool-paint,\n  &:focus .rsschool-paint{\n    fill: $colorBtnHov;\n  }\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/header/Auth.scss":
/*!**********************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/header/Auth.scss ***!
  \**********************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/getUrl.js */ "./node_modules/css-loader/dist/runtime/getUrl.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _assets_fonts_SuisseIntl_Regular_woff__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Regular.woff */ "./src/assets/fonts/SuisseIntl-Regular.woff");
/* harmony import */ var _assets_fonts_SuisseIntl_Regular_ttf__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Regular.ttf */ "./src/assets/fonts/SuisseIntl-Regular.ttf");
/* harmony import */ var _assets_fonts_SuisseIntl_Regular_svg__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Regular.svg */ "./src/assets/fonts/SuisseIntl-Regular.svg");
/* harmony import */ var _assets_fonts_SuisseIntl_Book_woff__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Book.woff */ "./src/assets/fonts/SuisseIntl-Book.woff");
/* harmony import */ var _assets_fonts_SuisseIntl_Book_ttf__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Book.ttf */ "./src/assets/fonts/SuisseIntl-Book.ttf");
/* harmony import */ var _assets_fonts_SuisseIntl_Book_svg__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Book.svg */ "./src/assets/fonts/SuisseIntl-Book.svg");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_eot__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Bold.eot */ "./src/assets/fonts/SuisseIntl-Bold.eot");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_woff__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Bold.woff */ "./src/assets/fonts/SuisseIntl-Bold.woff");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_ttf__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Bold.ttf */ "./src/assets/fonts/SuisseIntl-Bold.ttf");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_svg__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Bold.svg */ "./src/assets/fonts/SuisseIntl-Bold.svg");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_eot__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Regular.eot */ "./src/assets/fonts/SuisseWorks-Regular.eot");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_woff__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Regular.woff */ "./src/assets/fonts/SuisseWorks-Regular.woff");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_ttf__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Regular.ttf */ "./src/assets/fonts/SuisseWorks-Regular.ttf");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_svg__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Regular.svg */ "./src/assets/fonts/SuisseWorks-Regular.svg");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_eot__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Book.eot */ "./src/assets/fonts/SuisseWorks-Book.eot");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_woff__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Book.woff */ "./src/assets/fonts/SuisseWorks-Book.woff");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_ttf__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Book.ttf */ "./src/assets/fonts/SuisseWorks-Book.ttf");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_svg__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Book.svg */ "./src/assets/fonts/SuisseWorks-Book.svg");
// Imports





















var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Regular_woff__WEBPACK_IMPORTED_MODULE_3__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_1___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Regular_ttf__WEBPACK_IMPORTED_MODULE_4__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_2___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Regular_svg__WEBPACK_IMPORTED_MODULE_5__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_3___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Book_woff__WEBPACK_IMPORTED_MODULE_6__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_4___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Book_ttf__WEBPACK_IMPORTED_MODULE_7__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_5___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Book_svg__WEBPACK_IMPORTED_MODULE_8__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_6___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_eot__WEBPACK_IMPORTED_MODULE_9__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_7___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_woff__WEBPACK_IMPORTED_MODULE_10__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_8___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_ttf__WEBPACK_IMPORTED_MODULE_11__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_9___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_svg__WEBPACK_IMPORTED_MODULE_12__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_10___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_eot__WEBPACK_IMPORTED_MODULE_13__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_11___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_woff__WEBPACK_IMPORTED_MODULE_14__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_12___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_ttf__WEBPACK_IMPORTED_MODULE_15__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_13___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_svg__WEBPACK_IMPORTED_MODULE_16__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_14___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_eot__WEBPACK_IMPORTED_MODULE_17__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_15___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_woff__WEBPACK_IMPORTED_MODULE_18__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_16___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_ttf__WEBPACK_IMPORTED_MODULE_19__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_17___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_svg__WEBPACK_IMPORTED_MODULE_20__["default"]);
// Module
___CSS_LOADER_EXPORT___.push([module.id, "@charset \"UTF-8\";\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_1___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_2___ + ") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_3___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_3___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_4___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_5___ + ") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_6___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_7___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_8___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_9___ + ") format(\"svg\");\n  font-weight: bold;\n  font-style: 700;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_10___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_11___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_12___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_13___ + ") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_14___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_15___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_16___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_17___ + ") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n.popup-container {\n  position: absolute;\n  z-index: 100;\n  width: 500px;\n  height: 500px;\n  right: calc(50% - 250px);\n  top: calc(50% - 250px);\n  background: #ffffff;\n  border-radius: 1rem;\n}\n\n.popup {\n  padding: 3rem 3rem;\n  font-family: \"SuisseIntl, Tahoma, sans-serif\";\n  width: 420px;\n  display: flex;\n  flex-direction: column;\n  flex-wrap: wrap;\n  row-gap: 1rem;\n  align-items: stretch;\n  text-align: center;\n}\n\n.popup__cross-button {\n  display: block;\n  position: absolute;\n  width: 2rem;\n  height: 2rem;\n  right: 1rem;\n  top: 1rem;\n  cursor: pointer;\n  background: #ffffff;\n  border: 1px solid #000000;\n  border-radius: 1rem;\n}\n.popup__cross-button:hover {\n  background: #E3FB8F;\n}\n\n.popup__heading {\n  font-size: 2rem;\n  margin: 0;\n}\n\n.popup__buttons {\n  align-self: flex-start;\n  display: flex;\n  gap: 2rem;\n}\n\n#registration {\n  align-self: center;\n}\n\n.popup__input {\n  border: 0;\n  background: #F1F1F1;\n  padding: 0.6rem;\n  border-radius: 0.4rem;\n}", "",{"version":3,"sources":["webpack://./../../../../../%D0%A0%D0%B0%D0%B1%D0%BE%D1%87%D0%B8%D0%B9%20%D1%81%D1%82%D0%BE%D0%BB/git/trash/rslangg/rslang/src/components/view/header/Auth.scss","webpack://./src/components/view/base-styles.scss","webpack://./src/components/view/header/Auth.scss"],"names":[],"mappings":"AAAA,gBAAgB;ACmDf;EACC,yBAAA;EACA,4CAAA;EACA,0LAAA;EACA,mBAAA;EACA,eAAA;ADjDF;ACoDC;EACC,yBAAA;EACA,4CAAA;EACA,0LAAA;EACA,mBAAA;EACA,eAAA;ADlDF;ACqDC;EACA,yBAAA;EACA,4CAAA;EACA,0LAAA;EACA,iBAAA;EACA,eAAA;ADnDD;ACsDC;EACA,0BAAA;EACA,6CAAA;EACA,6LAAA;EACA,mBAAA;EACA,eAAA;ADpDD;ACuDA;EACC,0BAAA;EACA,6CAAA;EACA,6LAAA;EACA,mBAAA;EACA,eAAA;ADrDD;AEjCA;EACE,kBAAA;EACA,YAAA;EACA,YAAA;EACA,aAAA;EACA,wBAAA;EACA,sBAAA;EACA,mBDwBc;ECvBd,mBAAA;AFmCF;;AEhCA;EACE,kBAAA;EACA,6CDZQ;ECaR,YAAA;EACA,aAAA;EACA,sBAAA;EACA,eAAA;EACA,aAAA;EACA,oBAAA;EACA,kBAAA;AFmCF;;AEhCA;EACE,cAAA;EACA,kBAAA;EACA,WAAA;EACA,YAAA;EACA,WAAA;EACA,SAAA;EACA,eAAA;EACA,mBAAA;EACA,yBAAA;EACA,mBAAA;AFmCF;AEjCE;EACE,mBDOU;AD4Bd;;AE/BA;EACE,eDnCa;ECoCb,SAAA;AFkCF;;AE/BA;EACE,sBAAA;EACA,aAAA;EACA,SAAA;AFkCF;;AE/BA;EACE,kBAAA;AFkCF;;AE/BA;EACE,SAAA;EACA,mBDXa;ECYb,eAAA;EACA,qBAAA;AFkCF","sourcesContent":["@charset \"UTF-8\";\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(\"../../assets/fonts/SuisseIntl-Regular.woff\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseIntl-Regular.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseIntl-Regular.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseIntl-Regular.svg\") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(\"../../assets/fonts/SuisseIntl-Book.woff\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseIntl-Book.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseIntl-Book.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseIntl-Book.svg\") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(\"../../assets/fonts/SuisseIntl-Bold.eot\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseIntl-Bold.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseIntl-Bold.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseIntl-Bold.svg\") format(\"svg\");\n  font-weight: bold;\n  font-style: 700;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(\"../../assets/fonts/SuisseWorks-Regular.eot\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseWorks-Regular.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseWorks-Regular.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseWorks-Regular.svg\") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(\"../../assets/fonts/SuisseWorks-Book.eot\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseWorks-Book.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseWorks-Book.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseWorks-Book.svg\") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n.popup-container {\n  position: absolute;\n  z-index: 100;\n  width: 500px;\n  height: 500px;\n  right: calc(50% - 250px);\n  top: calc(50% - 250px);\n  background: #ffffff;\n  border-radius: 1rem;\n}\n\n.popup {\n  padding: 3rem 3rem;\n  font-family: \"SuisseIntl, Tahoma, sans-serif\";\n  width: 420px;\n  display: flex;\n  flex-direction: column;\n  flex-wrap: wrap;\n  row-gap: 1rem;\n  align-items: stretch;\n  text-align: center;\n}\n\n.popup__cross-button {\n  display: block;\n  position: absolute;\n  width: 2rem;\n  height: 2rem;\n  right: 1rem;\n  top: 1rem;\n  cursor: pointer;\n  background: #ffffff;\n  border: 1px solid #000000;\n  border-radius: 1rem;\n}\n.popup__cross-button:hover {\n  background: #E3FB8F;\n}\n\n.popup__heading {\n  font-size: 2rem;\n  margin: 0;\n}\n\n.popup__buttons {\n  align-self: flex-start;\n  display: flex;\n  gap: 2rem;\n}\n\n#registration {\n  align-self: center;\n}\n\n.popup__input {\n  border: 0;\n  background: #F1F1F1;\n  padding: 0.6rem;\n  border-radius: 0.4rem;\n}","$fa-font-path: '../../assets/fonts/' !default;\n\n// шрифты\n$rusFont: 'SuisseIntl, Tahoma, sans-serif';\n$enFont: 'SuisseWorks, Georgia, Serif';\n\n// шрифты, основные размеры\n$textHeader: 3rem;\n$textSubtitle: 2rem;\n$textBasic: 1.5rem;\n$textDescription: 1.25rem;\n\n// цвета для иконок на карточка Сложное, Изученное\n$iconColorComplex: #FF0000;\n$iconColorStudied: #65D72F;\n\n// цвета активных кнопок в Словаре\n$btnColorUnit1: #E92D38;\n$btnColorUnit2: #F36F1E;\n$btnColorUnit3: #FDCA1F;\n$btnColorUnit4: #7AB63E;\n$btnColorUnit5: #35B4D0;\n$btnColorUnit6: #0855E4;\n\n// цвета активных фона карточек в Словаре\n$bgColorUnit1: #FFEAEB;\n$bgColorUnit2: #FFF0E7;\n$bgColorUnit3: #FFF8E1;\n$bgColorUnit4: #EEFDDE;\n$bgColorUnit5: #B9F2FF;\n$bgColorUnit6: #B2CAF9;\n\n// цвета фонов и текста на сайте\n$bgTColorWhite: #ffffff;\n$bgTColorGrey: #E9E9E9;\n$bgTColorBlack: #000000;\n\n// текст не активных элементов(разделы меню и тп)\n$TextNotActive: #898989;\n\n// цветные элементы используемые на сайте\n$elemColorGreen: #D7E977;\n$elemColorCian: #89FCFB;\n\n// кнопка по ховеру\n$colorBtnHov: #E3FB8F; \n\n// форма регистрации, входа\n$bgColorInput: #F1F1F1;\n\n\n @font-face {\n \tfont-family: 'SuisseIntl';\n \tsrc: url('#{$fa-font-path}SuisseIntl-Regular.woff');\n \tsrc: local('☺'), url('#{$fa-font-path}SuisseIntl-Regular.woff') format('woff'), url('#{$fa-font-path}SuisseIntl-Regular.ttf') format('truetype'), url('#{$fa-font-path}SuisseIntl-Regular.svg') format('svg');\n \tfont-weight: normal;\n \tfont-style: 400;\n }\n\n @font-face {\n \tfont-family: 'SuisseIntl';\n \tsrc: url('#{$fa-font-path}SuisseIntl-Book.woff');\n \tsrc: local('☺'), url('#{$fa-font-path}SuisseIntl-Book.woff') format('woff'), url('#{$fa-font-path}SuisseIntl-Book.ttf') format('truetype'), url('#{$fa-font-path}SuisseIntl-Book.svg') format('svg');\n \tfont-weight: medium;\n \tfont-style: 500;\n }\n\n @font-face {\n\tfont-family: 'SuisseIntl';\n\tsrc: url('#{$fa-font-path}SuisseIntl-Bold.eot');\n\tsrc: local('☺'), url('#{$fa-font-path}SuisseIntl-Bold.woff') format('woff'), url('#{$fa-font-path}SuisseIntl-Bold.ttf') format('truetype'), url('#{$fa-font-path}SuisseIntl-Bold.svg') format('svg');\n\tfont-weight: bold;\n\tfont-style: 700;\n}\n\n @font-face {\n\tfont-family: 'SuisseWorks';\n\tsrc: url('#{$fa-font-path}SuisseWorks-Regular.eot');\n\tsrc: local('☺'), url('#{$fa-font-path}SuisseWorks-Regular.woff') format('woff'), url('#{$fa-font-path}SuisseWorks-Regular.ttf') format('truetype'), url('#{$fa-font-path}SuisseWorks-Regular.svg') format('svg');\n\tfont-weight: normal;\n\tfont-style: 400;\n}\n\n@font-face {\n\tfont-family: 'SuisseWorks';\n\tsrc: url('#{$fa-font-path}SuisseWorks-Book.eot');\n\tsrc: local('☺'), url('#{$fa-font-path}SuisseWorks-Book.woff') format('woff'), url('#{$fa-font-path}SuisseWorks-Book.ttf') format('truetype'), url('#{$fa-font-path}SuisseWorks-Book.svg') format('svg');\n\tfont-weight: medium;\n\tfont-style: 500;\n}\n","@import '../../view/base-styles.scss';\n\n.popup-container {\n  position: absolute;\n  z-index: 100;\n  width: 500px;\n  height: 500px;\n  right: calc(50% - 250px);\n  top: calc(50% - 250px);\n  background: $bgTColorWhite;\n  border-radius: 1rem;\n}\n\n.popup {\n  padding: 3rem 3rem;\n  font-family: $rusFont;\n  width: 420px;\n  display: flex;\n  flex-direction: column;\n  flex-wrap: wrap;\n  row-gap: 1rem;\n  align-items: stretch;\n  text-align: center;\n}\n\n.popup__cross-button {\n  display: block;\n  position: absolute;\n  width: 2rem;\n  height: 2rem;\n  right: 1rem;\n  top: 1rem;\n  cursor: pointer;\n  background: $bgTColorWhite;\n  border: 1px solid $bgTColorBlack;\n  border-radius: 1rem;\n\n  &:hover {\n    background: $colorBtnHov;\n  }\n}\n\n.popup__heading {\n  font-size: $textSubtitle;\n  margin: 0;\n}\n\n.popup__buttons {\n  align-self: flex-start;\n  display: flex;\n  gap: 2rem;\n}\n\n#registration {\n  align-self: center;\n}\n\n.popup__input {\n  border: 0;\n  background: $bgColorInput;\n  padding: 0.6rem;\n  border-radius: 0.4rem;\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/header/Header.scss":
/*!************************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/header/Header.scss ***!
  \************************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/getUrl.js */ "./node_modules/css-loader/dist/runtime/getUrl.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _assets_fonts_SuisseIntl_Regular_woff__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Regular.woff */ "./src/assets/fonts/SuisseIntl-Regular.woff");
/* harmony import */ var _assets_fonts_SuisseIntl_Regular_ttf__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Regular.ttf */ "./src/assets/fonts/SuisseIntl-Regular.ttf");
/* harmony import */ var _assets_fonts_SuisseIntl_Regular_svg__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Regular.svg */ "./src/assets/fonts/SuisseIntl-Regular.svg");
/* harmony import */ var _assets_fonts_SuisseIntl_Book_woff__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Book.woff */ "./src/assets/fonts/SuisseIntl-Book.woff");
/* harmony import */ var _assets_fonts_SuisseIntl_Book_ttf__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Book.ttf */ "./src/assets/fonts/SuisseIntl-Book.ttf");
/* harmony import */ var _assets_fonts_SuisseIntl_Book_svg__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Book.svg */ "./src/assets/fonts/SuisseIntl-Book.svg");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_eot__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Bold.eot */ "./src/assets/fonts/SuisseIntl-Bold.eot");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_woff__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Bold.woff */ "./src/assets/fonts/SuisseIntl-Bold.woff");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_ttf__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Bold.ttf */ "./src/assets/fonts/SuisseIntl-Bold.ttf");
/* harmony import */ var _assets_fonts_SuisseIntl_Bold_svg__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../../../assets/fonts/SuisseIntl-Bold.svg */ "./src/assets/fonts/SuisseIntl-Bold.svg");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_eot__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Regular.eot */ "./src/assets/fonts/SuisseWorks-Regular.eot");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_woff__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Regular.woff */ "./src/assets/fonts/SuisseWorks-Regular.woff");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_ttf__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Regular.ttf */ "./src/assets/fonts/SuisseWorks-Regular.ttf");
/* harmony import */ var _assets_fonts_SuisseWorks_Regular_svg__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Regular.svg */ "./src/assets/fonts/SuisseWorks-Regular.svg");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_eot__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Book.eot */ "./src/assets/fonts/SuisseWorks-Book.eot");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_woff__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Book.woff */ "./src/assets/fonts/SuisseWorks-Book.woff");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_ttf__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Book.ttf */ "./src/assets/fonts/SuisseWorks-Book.ttf");
/* harmony import */ var _assets_fonts_SuisseWorks_Book_svg__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ../../../assets/fonts/SuisseWorks-Book.svg */ "./src/assets/fonts/SuisseWorks-Book.svg");
// Imports





















var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Regular_woff__WEBPACK_IMPORTED_MODULE_3__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_1___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Regular_ttf__WEBPACK_IMPORTED_MODULE_4__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_2___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Regular_svg__WEBPACK_IMPORTED_MODULE_5__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_3___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Book_woff__WEBPACK_IMPORTED_MODULE_6__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_4___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Book_ttf__WEBPACK_IMPORTED_MODULE_7__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_5___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Book_svg__WEBPACK_IMPORTED_MODULE_8__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_6___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_eot__WEBPACK_IMPORTED_MODULE_9__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_7___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_woff__WEBPACK_IMPORTED_MODULE_10__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_8___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_ttf__WEBPACK_IMPORTED_MODULE_11__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_9___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseIntl_Bold_svg__WEBPACK_IMPORTED_MODULE_12__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_10___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_eot__WEBPACK_IMPORTED_MODULE_13__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_11___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_woff__WEBPACK_IMPORTED_MODULE_14__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_12___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_ttf__WEBPACK_IMPORTED_MODULE_15__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_13___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Regular_svg__WEBPACK_IMPORTED_MODULE_16__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_14___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_eot__WEBPACK_IMPORTED_MODULE_17__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_15___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_woff__WEBPACK_IMPORTED_MODULE_18__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_16___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_ttf__WEBPACK_IMPORTED_MODULE_19__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_17___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(_assets_fonts_SuisseWorks_Book_svg__WEBPACK_IMPORTED_MODULE_20__["default"]);
// Module
___CSS_LOADER_EXPORT___.push([module.id, "@charset \"UTF-8\";\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_1___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_2___ + ") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_3___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_3___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_4___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_5___ + ") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_6___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_7___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_8___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_9___ + ") format(\"svg\");\n  font-weight: bold;\n  font-style: 700;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_10___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_11___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_12___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_13___ + ") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_14___ + ");\n  src: local(\"☺\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_15___ + ") format(\"woff\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_16___ + ") format(\"truetype\"), url(" + ___CSS_LOADER_URL_REPLACEMENT_17___ + ") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n.header-container {\n  width: 1240px;\n  margin: auto;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\nh1 {\n  font-family: \"SuisseIntl, Tahoma, sans-serif\";\n  font-size: 20px;\n  margin: 0;\n}\n\n.logo__link {\n  text-decoration: none;\n  color: #000000;\n  display: flex;\n  gap: 0.3rem;\n  align-items: center;\n}\n.logo__link:hover {\n  color: #7AB63E;\n}\n\n.logged-in {\n  display: flex;\n  gap: 0.8rem;\n  align-items: center;\n}\n\n.user-name {\n  font-family: \"SuisseIntl, Tahoma, sans-serif\";\n  font-size: 1.2rem;\n  color: #000000;\n  cursor: pointer;\n}\n.user-name:hover {\n  color: #E3FB8F;\n  text-decoration: underline;\n}\n\n.circle {\n  height: 0.8rem;\n  width: 0.8rem;\n  border-radius: 0.4rem;\n  display: inline-block;\n  background-color: #000000;\n}\n\n.main-nav__item {\n  font-family: \"SuisseIntl, Tahoma, sans-serif\";\n  display: inline-block;\n  padding: 1.2rem;\n  text-decoration: none;\n  color: #000000;\n  opacity: 1;\n  cursor: pointer;\n}\n.main-nav__item:hover {\n  text-decoration: underline;\n}\n\n.main-nav__item_disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.main-nav__item_disabled:hover {\n  text-decoration: none;\n}\n\n.main-nav__item_active {\n  font-weight: bold;\n}\n\n.main-nav {\n  display: flex;\n  gap: 15px;\n}", "",{"version":3,"sources":["webpack://./../../../../../%D0%A0%D0%B0%D0%B1%D0%BE%D1%87%D0%B8%D0%B9%20%D1%81%D1%82%D0%BE%D0%BB/git/trash/rslangg/rslang/src/components/view/header/Header.scss","webpack://./src/components/view/base-styles.scss","webpack://./src/components/view/header/Header.scss"],"names":[],"mappings":"AAAA,gBAAgB;ACmDf;EACC,yBAAA;EACA,4CAAA;EACA,0LAAA;EACA,mBAAA;EACA,eAAA;ADjDF;ACoDC;EACC,yBAAA;EACA,4CAAA;EACA,0LAAA;EACA,mBAAA;EACA,eAAA;ADlDF;ACqDC;EACA,yBAAA;EACA,4CAAA;EACA,0LAAA;EACA,iBAAA;EACA,eAAA;ADnDD;ACsDC;EACA,0BAAA;EACA,6CAAA;EACA,6LAAA;EACA,mBAAA;EACA,eAAA;ADpDD;ACuDA;EACC,0BAAA;EACA,6CAAA;EACA,6LAAA;EACA,mBAAA;EACA,eAAA;ADrDD;AEjCA;EACE,aAAA;EACA,YAAA;EACA,aAAA;EACA,8BAAA;EACA,mBAAA;AFmCF;;AEhCA;EACE,6CDRQ;ECSR,eAAA;EACA,SAAA;AFmCF;;AEhCA;EACE,qBAAA;EACA,cDiBc;EChBd,aAAA;EACA,WAAA;EACA,mBAAA;AFmCF;AEjCE;EACE,cDJY;ADuChB;;AE/BA;EACE,aAAA;EACA,WAAA;EACA,mBAAA;AFkCF;;AE/BA;EACE,6CDhCQ;ECiCR,iBAAA;EACA,cDFc;ECGd,eAAA;AFkCF;AEhCE;EACE,cDIU;ECHV,0BAAA;AFkCJ;;AE9BA;EACE,cAAA;EACA,aAAA;EACA,qBAAA;EACA,qBAAA;EACA,yBDhBc;ADiDhB;;AE7BA;EACE,6CDrDQ;ECsDR,qBAAA;EACA,eAAA;EACA,qBAAA;EACA,cDzBc;EC0Bd,UAAA;EACA,eAAA;AFgCF;AE9BE;EACE,0BAAA;AFgCJ;;AE5BA;EACE,YAAA;EACA,mBAAA;AF+BF;AE7BE;EACE,qBAAA;AF+BJ;;AE3BA;EACE,iBAAA;AF8BF;;AE3BA;EACE,aAAA;EACA,SAAA;AF8BF","sourcesContent":["@charset \"UTF-8\";\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(\"../../assets/fonts/SuisseIntl-Regular.woff\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseIntl-Regular.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseIntl-Regular.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseIntl-Regular.svg\") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(\"../../assets/fonts/SuisseIntl-Book.woff\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseIntl-Book.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseIntl-Book.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseIntl-Book.svg\") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n@font-face {\n  font-family: \"SuisseIntl\";\n  src: url(\"../../assets/fonts/SuisseIntl-Bold.eot\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseIntl-Bold.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseIntl-Bold.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseIntl-Bold.svg\") format(\"svg\");\n  font-weight: bold;\n  font-style: 700;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(\"../../assets/fonts/SuisseWorks-Regular.eot\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseWorks-Regular.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseWorks-Regular.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseWorks-Regular.svg\") format(\"svg\");\n  font-weight: normal;\n  font-style: 400;\n}\n@font-face {\n  font-family: \"SuisseWorks\";\n  src: url(\"../../assets/fonts/SuisseWorks-Book.eot\");\n  src: local(\"☺\"), url(\"../../assets/fonts/SuisseWorks-Book.woff\") format(\"woff\"), url(\"../../assets/fonts/SuisseWorks-Book.ttf\") format(\"truetype\"), url(\"../../assets/fonts/SuisseWorks-Book.svg\") format(\"svg\");\n  font-weight: medium;\n  font-style: 500;\n}\n.header-container {\n  width: 1240px;\n  margin: auto;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\nh1 {\n  font-family: \"SuisseIntl, Tahoma, sans-serif\";\n  font-size: 20px;\n  margin: 0;\n}\n\n.logo__link {\n  text-decoration: none;\n  color: #000000;\n  display: flex;\n  gap: 0.3rem;\n  align-items: center;\n}\n.logo__link:hover {\n  color: #7AB63E;\n}\n\n.logged-in {\n  display: flex;\n  gap: 0.8rem;\n  align-items: center;\n}\n\n.user-name {\n  font-family: \"SuisseIntl, Tahoma, sans-serif\";\n  font-size: 1.2rem;\n  color: #000000;\n  cursor: pointer;\n}\n.user-name:hover {\n  color: #E3FB8F;\n  text-decoration: underline;\n}\n\n.circle {\n  height: 0.8rem;\n  width: 0.8rem;\n  border-radius: 0.4rem;\n  display: inline-block;\n  background-color: #000000;\n}\n\n.main-nav__item {\n  font-family: \"SuisseIntl, Tahoma, sans-serif\";\n  display: inline-block;\n  padding: 1.2rem;\n  text-decoration: none;\n  color: #000000;\n  opacity: 1;\n  cursor: pointer;\n}\n.main-nav__item:hover {\n  text-decoration: underline;\n}\n\n.main-nav__item_disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.main-nav__item_disabled:hover {\n  text-decoration: none;\n}\n\n.main-nav__item_active {\n  font-weight: bold;\n}\n\n.main-nav {\n  display: flex;\n  gap: 15px;\n}","$fa-font-path: '../../assets/fonts/' !default;\n\n// шрифты\n$rusFont: 'SuisseIntl, Tahoma, sans-serif';\n$enFont: 'SuisseWorks, Georgia, Serif';\n\n// шрифты, основные размеры\n$textHeader: 3rem;\n$textSubtitle: 2rem;\n$textBasic: 1.5rem;\n$textDescription: 1.25rem;\n\n// цвета для иконок на карточка Сложное, Изученное\n$iconColorComplex: #FF0000;\n$iconColorStudied: #65D72F;\n\n// цвета активных кнопок в Словаре\n$btnColorUnit1: #E92D38;\n$btnColorUnit2: #F36F1E;\n$btnColorUnit3: #FDCA1F;\n$btnColorUnit4: #7AB63E;\n$btnColorUnit5: #35B4D0;\n$btnColorUnit6: #0855E4;\n\n// цвета активных фона карточек в Словаре\n$bgColorUnit1: #FFEAEB;\n$bgColorUnit2: #FFF0E7;\n$bgColorUnit3: #FFF8E1;\n$bgColorUnit4: #EEFDDE;\n$bgColorUnit5: #B9F2FF;\n$bgColorUnit6: #B2CAF9;\n\n// цвета фонов и текста на сайте\n$bgTColorWhite: #ffffff;\n$bgTColorGrey: #E9E9E9;\n$bgTColorBlack: #000000;\n\n// текст не активных элементов(разделы меню и тп)\n$TextNotActive: #898989;\n\n// цветные элементы используемые на сайте\n$elemColorGreen: #D7E977;\n$elemColorCian: #89FCFB;\n\n// кнопка по ховеру\n$colorBtnHov: #E3FB8F; \n\n// форма регистрации, входа\n$bgColorInput: #F1F1F1;\n\n\n @font-face {\n \tfont-family: 'SuisseIntl';\n \tsrc: url('#{$fa-font-path}SuisseIntl-Regular.woff');\n \tsrc: local('☺'), url('#{$fa-font-path}SuisseIntl-Regular.woff') format('woff'), url('#{$fa-font-path}SuisseIntl-Regular.ttf') format('truetype'), url('#{$fa-font-path}SuisseIntl-Regular.svg') format('svg');\n \tfont-weight: normal;\n \tfont-style: 400;\n }\n\n @font-face {\n \tfont-family: 'SuisseIntl';\n \tsrc: url('#{$fa-font-path}SuisseIntl-Book.woff');\n \tsrc: local('☺'), url('#{$fa-font-path}SuisseIntl-Book.woff') format('woff'), url('#{$fa-font-path}SuisseIntl-Book.ttf') format('truetype'), url('#{$fa-font-path}SuisseIntl-Book.svg') format('svg');\n \tfont-weight: medium;\n \tfont-style: 500;\n }\n\n @font-face {\n\tfont-family: 'SuisseIntl';\n\tsrc: url('#{$fa-font-path}SuisseIntl-Bold.eot');\n\tsrc: local('☺'), url('#{$fa-font-path}SuisseIntl-Bold.woff') format('woff'), url('#{$fa-font-path}SuisseIntl-Bold.ttf') format('truetype'), url('#{$fa-font-path}SuisseIntl-Bold.svg') format('svg');\n\tfont-weight: bold;\n\tfont-style: 700;\n}\n\n @font-face {\n\tfont-family: 'SuisseWorks';\n\tsrc: url('#{$fa-font-path}SuisseWorks-Regular.eot');\n\tsrc: local('☺'), url('#{$fa-font-path}SuisseWorks-Regular.woff') format('woff'), url('#{$fa-font-path}SuisseWorks-Regular.ttf') format('truetype'), url('#{$fa-font-path}SuisseWorks-Regular.svg') format('svg');\n\tfont-weight: normal;\n\tfont-style: 400;\n}\n\n@font-face {\n\tfont-family: 'SuisseWorks';\n\tsrc: url('#{$fa-font-path}SuisseWorks-Book.eot');\n\tsrc: local('☺'), url('#{$fa-font-path}SuisseWorks-Book.woff') format('woff'), url('#{$fa-font-path}SuisseWorks-Book.ttf') format('truetype'), url('#{$fa-font-path}SuisseWorks-Book.svg') format('svg');\n\tfont-weight: medium;\n\tfont-style: 500;\n}\n","@import '../../view/base-styles.scss';\n\n.header-container {\n  width: 1240px;\n  margin: auto;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\nh1 {\n  font-family: $rusFont;\n  font-size: 20px;\n  margin: 0;\n}\n\n.logo__link {\n  text-decoration: none;\n  color: $bgTColorBlack;\n  display: flex;\n  gap: 0.3rem;\n  align-items: center;\n\n  &:hover {\n    color: $btnColorUnit4;\n  }\n}\n\n.logged-in {\n  display: flex;\n  gap: 0.8rem;\n  align-items: center;\n}\n\n.user-name {\n  font-family: $rusFont;\n  font-size: 1.2rem;\n  color: $bgTColorBlack;\n  cursor: pointer;\n\n  &:hover {\n    color: $colorBtnHov;\n    text-decoration: underline;\n  }\n}\n\n.circle {\n  height:0.8rem;\n  width:0.8rem;\n  border-radius: 0.4rem;\n  display: inline-block;\n  background-color: $bgTColorBlack;\n}\n\n\n.main-nav__item {\n  font-family: $rusFont;\n  display: inline-block;\n  padding: 1.2rem;\n  text-decoration: none;\n  color: $bgTColorBlack;\n  opacity: 1;\n  cursor: pointer;\n\n  &:hover {\n    text-decoration: underline;\n  }\n}\n\n.main-nav__item_disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n\n  &:hover {\n    text-decoration: none;\n  }\n}\n\n.main-nav__item_active {\n  font-weight: bold;\n}\n\n.main-nav {\n  display: flex;\n  gap: 15px;\n}\n\n@media screen and (max-width: 1279px) {\n  \n\n}\n\n@media screen and (max-width: 767px) {\n  \n\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/main/Main.scss":
/*!********************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/main/Main.scss ***!
  \********************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "", "",{"version":3,"sources":[],"names":[],"mappings":"","sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/notFound/NotFound.scss":
/*!****************************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/notFound/NotFound.scss ***!
  \****************************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "", "",{"version":3,"sources":[],"names":[],"mappings":"","sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/sprint/Sprint.scss":
/*!************************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/sprint/Sprint.scss ***!
  \************************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "", "",{"version":3,"sources":[],"names":[],"mappings":"","sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/stats/Stats.scss":
/*!**********************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/stats/Stats.scss ***!
  \**********************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "", "",{"version":3,"sources":[],"names":[],"mappings":"","sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/textbook/Textbook.scss":
/*!****************************************************************************************************************************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/textbook/Textbook.scss ***!
  \****************************************************************************************************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/cssWithMappingToString.js */ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_cssWithMappingToString_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".cards-container {\n  width: 100%;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px;\n}\n\n.textbook-card {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 200px;\n  height: 60px;\n  background: rgb(233, 138, 138);\n  border: 1px solid red;\n}\n\n.paging {\n  margin: 10px 0;\n}", "",{"version":3,"sources":["webpack://./src/components/view/textbook/Textbook.scss","webpack://./../../../../../%D0%A0%D0%B0%D0%B1%D0%BE%D1%87%D0%B8%D0%B9%20%D1%81%D1%82%D0%BE%D0%BB/git/trash/rslangg/rslang/src/components/view/textbook/Textbook.scss"],"names":[],"mappings":"AAAA;EACE,WAAA;EACA,aAAA;EACA,eAAA;EACA,SAAA;ACCF;;ADEA;EACE,aAAA;EACA,mBAAA;EACA,uBAAA;EACA,YAAA;EACA,YAAA;EACA,8BAAA;EACA,qBAAA;ACCF;;ADEA;EACE,cAAA;ACCF","sourcesContent":[".cards-container {\n  width: 100%;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px;\n}\n\n.textbook-card {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 200px;\n  height: 60px;\n  background: rgb(233, 138, 138);\n  border: 1px solid red;\n}\n\n.paging {\n  margin: 10px 0;\n}",".cards-container {\n  width: 100%;\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px;\n}\n\n.textbook-card {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 200px;\n  height: 60px;\n  background: rgb(233, 138, 138);\n  border: 1px solid red;\n}\n\n.paging {\n  margin: 10px 0;\n}"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/***/ ((module) => {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
// eslint-disable-next-line func-names
module.exports = function (cssWithMappingToString) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = cssWithMappingToString(item);

      if (item[2]) {
        return "@media ".concat(item[2], " {").concat(content, "}");
      }

      return content;
    }).join("");
  }; // import a list of modules into the list
  // eslint-disable-next-line func-names


  list.i = function (modules, mediaQuery, dedupe) {
    if (typeof modules === "string") {
      // eslint-disable-next-line no-param-reassign
      modules = [[null, modules, ""]];
    }

    var alreadyImportedModules = {};

    if (dedupe) {
      for (var i = 0; i < this.length; i++) {
        // eslint-disable-next-line prefer-destructuring
        var id = this[i][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (var _i = 0; _i < modules.length; _i++) {
      var item = [].concat(modules[_i]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (mediaQuery) {
        if (!item[2]) {
          item[2] = mediaQuery;
        } else {
          item[2] = "".concat(mediaQuery, " and ").concat(item[2]);
        }
      }

      list.push(item);
    }
  };

  return list;
};

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/cssWithMappingToString.js":
/*!************************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/cssWithMappingToString.js ***!
  \************************************************************************/
/***/ ((module) => {

"use strict";


function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr && (typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]); if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

module.exports = function cssWithMappingToString(item) {
  var _item = _slicedToArray(item, 4),
      content = _item[1],
      cssMapping = _item[3];

  if (!cssMapping) {
    return content;
  }

  if (typeof btoa === "function") {
    // eslint-disable-next-line no-undef
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    var sourceURLs = cssMapping.sources.map(function (source) {
      return "/*# sourceURL=".concat(cssMapping.sourceRoot || "").concat(source, " */");
    });
    return [content].concat(sourceURLs).concat([sourceMapping]).join("\n");
  }

  return [content].join("\n");
};

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/getUrl.js":
/*!********************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/getUrl.js ***!
  \********************************************************/
/***/ ((module) => {

"use strict";


module.exports = function (url, options) {
  if (!options) {
    // eslint-disable-next-line no-param-reassign
    options = {};
  } // eslint-disable-next-line no-underscore-dangle, no-param-reassign


  url = url && url.__esModule ? url.default : url;

  if (typeof url !== "string") {
    return url;
  } // If url is already wrapped in quotes, remove them


  if (/^['"].*['"]$/.test(url)) {
    // eslint-disable-next-line no-param-reassign
    url = url.slice(1, -1);
  }

  if (options.hash) {
    // eslint-disable-next-line no-param-reassign
    url += options.hash;
  } // Should url be wrapped?
  // See https://drafts.csswg.org/css-values-3/#urls


  if (/["'() \t\n]/.test(url) || options.needQuotes) {
    return "\"".concat(url.replace(/"/g, '\\"').replace(/\n/g, "\\n"), "\"");
  }

  return url;
};

/***/ }),

/***/ "./src/assets/fonts/SuisseIntl-Bold.eot":
/*!**********************************************!*\
  !*** ./src/assets/fonts/SuisseIntl-Bold.eot ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseIntl-Bold.eot");

/***/ }),

/***/ "./src/assets/fonts/SuisseIntl-Bold.svg":
/*!**********************************************!*\
  !*** ./src/assets/fonts/SuisseIntl-Bold.svg ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseIntl-Bold.svg");

/***/ }),

/***/ "./src/assets/fonts/SuisseIntl-Bold.ttf":
/*!**********************************************!*\
  !*** ./src/assets/fonts/SuisseIntl-Bold.ttf ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseIntl-Bold.ttf");

/***/ }),

/***/ "./src/assets/fonts/SuisseIntl-Bold.woff":
/*!***********************************************!*\
  !*** ./src/assets/fonts/SuisseIntl-Bold.woff ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseIntl-Bold.woff");

/***/ }),

/***/ "./src/assets/fonts/SuisseIntl-Book.svg":
/*!**********************************************!*\
  !*** ./src/assets/fonts/SuisseIntl-Book.svg ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseIntl-Book.svg");

/***/ }),

/***/ "./src/assets/fonts/SuisseIntl-Book.ttf":
/*!**********************************************!*\
  !*** ./src/assets/fonts/SuisseIntl-Book.ttf ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseIntl-Book.ttf");

/***/ }),

/***/ "./src/assets/fonts/SuisseIntl-Book.woff":
/*!***********************************************!*\
  !*** ./src/assets/fonts/SuisseIntl-Book.woff ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseIntl-Book.woff");

/***/ }),

/***/ "./src/assets/fonts/SuisseIntl-Regular.svg":
/*!*************************************************!*\
  !*** ./src/assets/fonts/SuisseIntl-Regular.svg ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseIntl-Regular.svg");

/***/ }),

/***/ "./src/assets/fonts/SuisseIntl-Regular.ttf":
/*!*************************************************!*\
  !*** ./src/assets/fonts/SuisseIntl-Regular.ttf ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseIntl-Regular.ttf");

/***/ }),

/***/ "./src/assets/fonts/SuisseIntl-Regular.woff":
/*!**************************************************!*\
  !*** ./src/assets/fonts/SuisseIntl-Regular.woff ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseIntl-Regular.woff");

/***/ }),

/***/ "./src/assets/fonts/SuisseWorks-Book.eot":
/*!***********************************************!*\
  !*** ./src/assets/fonts/SuisseWorks-Book.eot ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseWorks-Book.eot");

/***/ }),

/***/ "./src/assets/fonts/SuisseWorks-Book.svg":
/*!***********************************************!*\
  !*** ./src/assets/fonts/SuisseWorks-Book.svg ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseWorks-Book.svg");

/***/ }),

/***/ "./src/assets/fonts/SuisseWorks-Book.ttf":
/*!***********************************************!*\
  !*** ./src/assets/fonts/SuisseWorks-Book.ttf ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseWorks-Book.ttf");

/***/ }),

/***/ "./src/assets/fonts/SuisseWorks-Book.woff":
/*!************************************************!*\
  !*** ./src/assets/fonts/SuisseWorks-Book.woff ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseWorks-Book.woff");

/***/ }),

/***/ "./src/assets/fonts/SuisseWorks-Regular.eot":
/*!**************************************************!*\
  !*** ./src/assets/fonts/SuisseWorks-Regular.eot ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseWorks-Regular.eot");

/***/ }),

/***/ "./src/assets/fonts/SuisseWorks-Regular.svg":
/*!**************************************************!*\
  !*** ./src/assets/fonts/SuisseWorks-Regular.svg ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseWorks-Regular.svg");

/***/ }),

/***/ "./src/assets/fonts/SuisseWorks-Regular.ttf":
/*!**************************************************!*\
  !*** ./src/assets/fonts/SuisseWorks-Regular.ttf ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseWorks-Regular.ttf");

/***/ }),

/***/ "./src/assets/fonts/SuisseWorks-Regular.woff":
/*!***************************************************!*\
  !*** ./src/assets/fonts/SuisseWorks-Regular.woff ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__webpack_require__.p + "src/assets/fonts/SuisseWorks-Regular.woff");

/***/ }),

/***/ "./src/components/view/AppView.scss":
/*!******************************************!*\
  !*** ./src/components/view/AppView.scss ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_AppView_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../node_modules/css-loader/dist/cjs.js!../../../node_modules/resolve-url-loader/index.js!../../../node_modules/sass-loader/dist/cjs.js!./AppView.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/AppView.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_AppView_scss__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_AppView_scss__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./src/components/view/audio/AudioChallenge.scss":
/*!*******************************************************!*\
  !*** ./src/components/view/audio/AudioChallenge.scss ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_AudioChallenge_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/css-loader/dist/cjs.js!../../../../node_modules/resolve-url-loader/index.js!../../../../node_modules/sass-loader/dist/cjs.js!./AudioChallenge.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/audio/AudioChallenge.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_AudioChallenge_scss__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_AudioChallenge_scss__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./src/components/view/dictionary/Dictionary.scss":
/*!********************************************************!*\
  !*** ./src/components/view/dictionary/Dictionary.scss ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Dictionary_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/css-loader/dist/cjs.js!../../../../node_modules/resolve-url-loader/index.js!../../../../node_modules/sass-loader/dist/cjs.js!./Dictionary.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/dictionary/Dictionary.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Dictionary_scss__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Dictionary_scss__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./src/components/view/footer/Footer.scss":
/*!************************************************!*\
  !*** ./src/components/view/footer/Footer.scss ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Footer_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/css-loader/dist/cjs.js!../../../../node_modules/resolve-url-loader/index.js!../../../../node_modules/sass-loader/dist/cjs.js!./Footer.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/footer/Footer.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Footer_scss__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Footer_scss__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./src/components/view/header/Auth.scss":
/*!**********************************************!*\
  !*** ./src/components/view/header/Auth.scss ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Auth_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/css-loader/dist/cjs.js!../../../../node_modules/resolve-url-loader/index.js!../../../../node_modules/sass-loader/dist/cjs.js!./Auth.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/header/Auth.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Auth_scss__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Auth_scss__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./src/components/view/header/Header.scss":
/*!************************************************!*\
  !*** ./src/components/view/header/Header.scss ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Header_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/css-loader/dist/cjs.js!../../../../node_modules/resolve-url-loader/index.js!../../../../node_modules/sass-loader/dist/cjs.js!./Header.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/header/Header.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Header_scss__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Header_scss__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./src/components/view/main/Main.scss":
/*!********************************************!*\
  !*** ./src/components/view/main/Main.scss ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Main_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/css-loader/dist/cjs.js!../../../../node_modules/resolve-url-loader/index.js!../../../../node_modules/sass-loader/dist/cjs.js!./Main.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/main/Main.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Main_scss__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Main_scss__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./src/components/view/notFound/NotFound.scss":
/*!****************************************************!*\
  !*** ./src/components/view/notFound/NotFound.scss ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_NotFound_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/css-loader/dist/cjs.js!../../../../node_modules/resolve-url-loader/index.js!../../../../node_modules/sass-loader/dist/cjs.js!./NotFound.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/notFound/NotFound.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_NotFound_scss__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_NotFound_scss__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./src/components/view/sprint/Sprint.scss":
/*!************************************************!*\
  !*** ./src/components/view/sprint/Sprint.scss ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Sprint_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/css-loader/dist/cjs.js!../../../../node_modules/resolve-url-loader/index.js!../../../../node_modules/sass-loader/dist/cjs.js!./Sprint.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/sprint/Sprint.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Sprint_scss__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Sprint_scss__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./src/components/view/stats/Stats.scss":
/*!**********************************************!*\
  !*** ./src/components/view/stats/Stats.scss ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Stats_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/css-loader/dist/cjs.js!../../../../node_modules/resolve-url-loader/index.js!../../../../node_modules/sass-loader/dist/cjs.js!./Stats.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/stats/Stats.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Stats_scss__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Stats_scss__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./src/components/view/textbook/Textbook.scss":
/*!****************************************************!*\
  !*** ./src/components/view/textbook/Textbook.scss ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Textbook_scss__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !!../../../../node_modules/css-loader/dist/cjs.js!../../../../node_modules/resolve-url-loader/index.js!../../../../node_modules/sass-loader/dist/cjs.js!./Textbook.scss */ "./node_modules/css-loader/dist/cjs.js!./node_modules/resolve-url-loader/index.js!./node_modules/sass-loader/dist/cjs.js!./src/components/view/textbook/Textbook.scss");

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Textbook_scss__WEBPACK_IMPORTED_MODULE_1__["default"], options);



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_node_modules_resolve_url_loader_index_js_node_modules_sass_loader_dist_cjs_js_Textbook_scss__WEBPACK_IMPORTED_MODULE_1__["default"].locals || {});

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var isOldIE = function isOldIE() {
  var memo;
  return function memorize() {
    if (typeof memo === 'undefined') {
      // Test for IE <= 9 as proposed by Browserhacks
      // @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
      // Tests for existence of standard globals is to allow style-loader
      // to operate correctly into non-standard environments
      // @see https://github.com/webpack-contrib/style-loader/issues/177
      memo = Boolean(window && document && document.all && !window.atob);
    }

    return memo;
  };
}();

var getTarget = function getTarget() {
  var memo = {};
  return function memorize(target) {
    if (typeof memo[target] === 'undefined') {
      var styleTarget = document.querySelector(target); // Special case to return head of iframe instead of iframe itself

      if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
        try {
          // This will throw an exception if access to iframe is blocked
          // due to cross-origin restrictions
          styleTarget = styleTarget.contentDocument.head;
        } catch (e) {
          // istanbul ignore next
          styleTarget = null;
        }
      }

      memo[target] = styleTarget;
    }

    return memo[target];
  };
}();

var stylesInDom = [];

function getIndexByIdentifier(identifier) {
  var result = -1;

  for (var i = 0; i < stylesInDom.length; i++) {
    if (stylesInDom[i].identifier === identifier) {
      result = i;
      break;
    }
  }

  return result;
}

function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var index = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3]
    };

    if (index !== -1) {
      stylesInDom[index].references++;
      stylesInDom[index].updater(obj);
    } else {
      stylesInDom.push({
        identifier: identifier,
        updater: addStyle(obj, options),
        references: 1
      });
    }

    identifiers.push(identifier);
  }

  return identifiers;
}

function insertStyleElement(options) {
  var style = document.createElement('style');
  var attributes = options.attributes || {};

  if (typeof attributes.nonce === 'undefined') {
    var nonce =  true ? __webpack_require__.nc : 0;

    if (nonce) {
      attributes.nonce = nonce;
    }
  }

  Object.keys(attributes).forEach(function (key) {
    style.setAttribute(key, attributes[key]);
  });

  if (typeof options.insert === 'function') {
    options.insert(style);
  } else {
    var target = getTarget(options.insert || 'head');

    if (!target) {
      throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
    }

    target.appendChild(style);
  }

  return style;
}

function removeStyleElement(style) {
  // istanbul ignore if
  if (style.parentNode === null) {
    return false;
  }

  style.parentNode.removeChild(style);
}
/* istanbul ignore next  */


var replaceText = function replaceText() {
  var textStore = [];
  return function replace(index, replacement) {
    textStore[index] = replacement;
    return textStore.filter(Boolean).join('\n');
  };
}();

function applyToSingletonTag(style, index, remove, obj) {
  var css = remove ? '' : obj.media ? "@media ".concat(obj.media, " {").concat(obj.css, "}") : obj.css; // For old IE

  /* istanbul ignore if  */

  if (style.styleSheet) {
    style.styleSheet.cssText = replaceText(index, css);
  } else {
    var cssNode = document.createTextNode(css);
    var childNodes = style.childNodes;

    if (childNodes[index]) {
      style.removeChild(childNodes[index]);
    }

    if (childNodes.length) {
      style.insertBefore(cssNode, childNodes[index]);
    } else {
      style.appendChild(cssNode);
    }
  }
}

function applyToTag(style, options, obj) {
  var css = obj.css;
  var media = obj.media;
  var sourceMap = obj.sourceMap;

  if (media) {
    style.setAttribute('media', media);
  } else {
    style.removeAttribute('media');
  }

  if (sourceMap && typeof btoa !== 'undefined') {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  } // For old IE

  /* istanbul ignore if  */


  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    while (style.firstChild) {
      style.removeChild(style.firstChild);
    }

    style.appendChild(document.createTextNode(css));
  }
}

var singleton = null;
var singletonCounter = 0;

function addStyle(obj, options) {
  var style;
  var update;
  var remove;

  if (options.singleton) {
    var styleIndex = singletonCounter++;
    style = singleton || (singleton = insertStyleElement(options));
    update = applyToSingletonTag.bind(null, style, styleIndex, false);
    remove = applyToSingletonTag.bind(null, style, styleIndex, true);
  } else {
    style = insertStyleElement(options);
    update = applyToTag.bind(null, style, options);

    remove = function remove() {
      removeStyleElement(style);
    };
  }

  update(obj);
  return function updateStyle(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap) {
        return;
      }

      update(obj = newObj);
    } else {
      remove();
    }
  };
}

module.exports = function (list, options) {
  options = options || {}; // Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
  // tags it will allow on a page

  if (!options.singleton && typeof options.singleton !== 'boolean') {
    options.singleton = isOldIE();
  }

  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];

    if (Object.prototype.toString.call(newList) !== '[object Array]') {
      return;
    }

    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDom[index].references--;
    }

    var newLastIdentifiers = modulesToDom(newList, options);

    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];

      var _index = getIndexByIdentifier(_identifier);

      if (stylesInDom[_index].references === 0) {
        stylesInDom[_index].updater();

        stylesInDom.splice(_index, 1);
      }
    }

    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "./src/components/controller/helpers/auth-helper.ts":
/*!**********************************************************!*\
  !*** ./src/components/controller/helpers/auth-helper.ts ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.handleRegistration = exports.handleLogout = exports.handleAuth = exports.updateStateOnAuth = exports.checkAuthState = void 0;
const auth_1 = __webpack_require__(/*! ../../model/api/auth */ "./src/components/model/api/auth.ts");
const checkAuthState = (state) => __awaiter(void 0, void 0, void 0, function* () {
    if (!state.token) {
        return state;
    }
    const newState = Object.assign({}, state);
    if (Date.now() > state.expire) {
        const response = yield (0, auth_1.getToken)(newState.userId, state.refreshToken);
        if (response.status === 200) {
            newState.expire = Date.now() + 7200000;
            newState.refreshToken = response.data.refreshToken;
            newState.token = response.data.token;
        }
    }
    else {
        newState.loggedIn = true;
    }
    return newState;
});
exports.checkAuthState = checkAuthState;
const updateStateOnAuth = (state, data) => {
    const newState = Object.assign({}, state);
    newState.loggedIn = true;
    newState.token = data.token;
    newState.refreshToken = data.refreshToken;
    newState.userId = data.userId;
    newState.userName = data.name;
    const dateExpire = Date.now() + 7200000;
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('expire', `${dateExpire}`);
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('userName', data.name);
    return newState;
};
exports.updateStateOnAuth = updateStateOnAuth;
const handleAuth = (state) => __awaiter(void 0, void 0, void 0, function* () {
    let newState = Object.assign({}, state);
    const email = document.querySelector('[name="email"]');
    const password = document.querySelector('[name="password"]');
    const authData = {
        email: email.value,
        password: password.value,
    };
    try {
        const response = yield (0, auth_1.authUser)(authData);
        if (response.status === 200) {
            const responseData = response.data;
            newState = Object.assign({}, (0, exports.updateStateOnAuth)(newState, responseData));
        }
    }
    catch (e) {
        if (e.includes('403')) {
            alert('Логин или пароль не верны! Попробуйте снова!');
        }
    }
    return newState;
});
exports.handleAuth = handleAuth;
const handleLogout = (state) => {
    const newState = Object.assign({}, state);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expire');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    newState.loggedIn = false;
    newState.token = '';
    newState.refreshToken = '';
    newState.userId = '';
    newState.userName = '';
    return newState;
};
exports.handleLogout = handleLogout;
const handleRegistration = (state) => __awaiter(void 0, void 0, void 0, function* () {
    let newState = Object.assign({}, state);
    const email = document.querySelector('[name="email"]');
    const name = document.querySelector('[name="name"]');
    const password = document.querySelector('[name="password"]');
    const passwordConfirmation = document.querySelector('[name="password-confirm"]');
    const data = {
        email: email.value,
        name: name.value,
        password: password.value,
    };
    if (password.value !== passwordConfirmation.value) {
        alert('Пароли должны совпадать!');
        return newState;
    }
    try {
        const registration = yield (0, auth_1.regNewUser)(data);
    }
    catch (e) {
        alert('Аккаунт с таким имейлом уже существует!');
    }
    try {
        const authData = {
            email: email.value,
            password: password.value,
        };
        const response = yield (0, auth_1.authUser)(authData);
        if (response.status === 200) {
            const responseData = response.data;
            newState = Object.assign({}, (0, exports.updateStateOnAuth)(newState, responseData));
        }
    }
    catch (e) {
        if (e.includes('403')) {
            alert('Логин или пароль не верны! Попробуйте снова!');
        }
    }
    return newState;
});
exports.handleRegistration = handleRegistration;


/***/ }),

/***/ "./src/components/controller/router.ts":
/*!*********************************************!*\
  !*** ./src/components/controller/router.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.route = exports.handleRoute = void 0;
const NotFound_1 = __importDefault(__webpack_require__(/*! ../view/notFound/NotFound */ "./src/components/view/notFound/NotFound.ts"));
const Main_1 = __importDefault(__webpack_require__(/*! ../view/main/Main */ "./src/components/view/main/Main.ts"));
const Textbook_1 = __importDefault(__webpack_require__(/*! ../view/textbook/Textbook */ "./src/components/view/textbook/Textbook.ts"));
const Dictionary_1 = __importDefault(__webpack_require__(/*! ../view/dictionary/Dictionary */ "./src/components/view/dictionary/Dictionary.ts"));
const Sprint_1 = __importDefault(__webpack_require__(/*! ../view/sprint/Sprint */ "./src/components/view/sprint/Sprint.ts"));
const AudioChallenge_1 = __importDefault(__webpack_require__(/*! ../view/audio/AudioChallenge */ "./src/components/view/audio/AudioChallenge.ts"));
const Stats_1 = __importDefault(__webpack_require__(/*! ../view/stats/Stats */ "./src/components/view/stats/Stats.ts"));
const auth_helper_1 = __webpack_require__(/*! ./helpers/auth-helper */ "./src/components/controller/helpers/auth-helper.ts");
const routes = {
    notFound: 'notFound',
    '/': 'main',
    textbook: 'textbook',
    dictionary: 'dictionary',
    sprint: 'sprint',
    audio: 'audio',
    stats: 'stats',
};
// TODO add auth logic
// Add user data if exist token in localstorage and it is valid
const rewriteUrl = () => {
    const { hash } = window.location;
    if (!hash) {
        window.location.hash = `#${window.location.pathname}`;
        window.location.pathname = '';
    }
};
const setProgress = (queryStr, textbook) => {
    let { unit } = textbook;
    let { page } = textbook;
    if (queryStr[1] && queryStr[1].includes('unit')) {
        unit = +queryStr[1].replace(/([a-zA-Z])+/, '') || 1;
        if (queryStr[2]) {
            page = +queryStr[2] || 1;
        }
    }
    return { unit, page };
};
const handleRoute = (state) => __awaiter(void 0, void 0, void 0, function* () {
    let newState = Object.assign({}, yield (0, auth_helper_1.checkAuthState)(state));
    rewriteUrl();
    const queryStr = window.location.hash
        .replace('/#', '')
        .split('/')
        .filter((item) => item !== '#' && item !== '');
    const path = queryStr.length ? queryStr[0] : '/';
    const pageName = routes[path] || routes.notFound;
    let page;
    switch (pageName) {
        case 'main':
            page = new Main_1.default(newState);
            newState = yield page.render();
            break;
        case 'textbook':
            newState.textbook = setProgress(queryStr, newState.textbook);
            page = new Textbook_1.default(newState);
            newState = yield page.render();
            break;
        case 'dictionary':
            page = new Dictionary_1.default(newState);
            newState = yield page.render();
            break;
        case 'sprint':
            page = new Sprint_1.default(newState);
            newState = yield page.render();
            break;
        case 'audio':
            page = new AudioChallenge_1.default(newState);
            newState = yield page.render();
            break;
        case 'stats':
            if (!newState.loggedIn) {
                window.location.pathname = '/';
                (0, exports.handleRoute)(newState);
            }
            page = new Stats_1.default(newState);
            newState = yield page.render();
            break;
        case 'notFound':
            page = new NotFound_1.default(newState);
            newState = yield page.render();
            break;
        default:
            page = new Main_1.default(newState);
            newState = yield page.render();
            break;
    }
    return newState;
});
exports.handleRoute = handleRoute;
const route = (e, state) => {
    const target = e.target;
    window.history.pushState({}, '', target.href);
    (0, exports.handleRoute)(state);
};
exports.route = route;


/***/ }),

/***/ "./src/components/controller/state.ts":
/*!********************************************!*\
  !*** ./src/components/controller/state.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const getInitialState = () => {
    const textbook = localStorage.getItem('textbook');
    const textbookProgress = textbook ? JSON.parse(textbook) : '';
    return {
        loggedIn: false,
        page: 'main',
        refreshToken: localStorage.getItem('refreshToken') || '',
        expire: Number(localStorage.getItem('expire')) || 0,
        token: localStorage.getItem('token') || '',
        userId: localStorage.getItem('userId') || '',
        userName: localStorage.getItem('userName') || '',
        textbook: textbookProgress !== null && textbookProgress !== void 0 ? textbookProgress : {
            unit: 1,
            page: 1,
        },
    };
};
exports["default"] = getInitialState;


/***/ }),

/***/ "./src/components/model/api/auth.ts":
/*!******************************************!*\
  !*** ./src/components/model/api/auth.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getToken = exports.authUser = exports.regNewUser = void 0;
const axios_1 = __importDefault(__webpack_require__(/*! axios */ "./node_modules/axios/index.js"));
const constants_1 = __importDefault(__webpack_require__(/*! ../constants */ "./src/components/model/constants.ts"));
const regNewUser = (data) => __awaiter(void 0, void 0, void 0, function* () { return axios_1.default.post(`${constants_1.default}/users`, data); });
exports.regNewUser = regNewUser;
const authUser = (data) => __awaiter(void 0, void 0, void 0, function* () { return axios_1.default.post(`${constants_1.default}/signin`, data); });
exports.authUser = authUser;
const getToken = (userId, token) => __awaiter(void 0, void 0, void 0, function* () {
    return axios_1.default.get(`${constants_1.default}/users/${userId}/tokens`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
});
exports.getToken = getToken;


/***/ }),

/***/ "./src/components/model/constants.ts":
/*!*******************************************!*\
  !*** ./src/components/model/constants.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const apiBaseUrl = 'https://rslang-learn-words.herokuapp.com';
exports["default"] = apiBaseUrl;


/***/ }),

/***/ "./src/components/model/menu-items.ts":
/*!********************************************!*\
  !*** ./src/components/model/menu-items.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const menuItems = [
    { name: 'Учебник', href: 'textbook', auth: false },
    { name: 'Словарь', href: 'dictionary', auth: false },
    { name: 'Спринт', href: 'sprint', auth: false },
    { name: 'Аудиовызов', href: 'audio', auth: false },
    { name: 'Статистика', href: 'stats', auth: true },
];
exports["default"] = menuItems;


/***/ }),

/***/ "./src/components/model/mock-words-data.ts":
/*!*************************************************!*\
  !*** ./src/components/model/mock-words-data.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const words = [
    { id: 1, name: 'word1' },
    { id: 2, name: 'word2' },
    { id: 3, name: 'word3' },
    { id: 4, name: 'word4' },
    { id: 5, name: 'word5' },
    { id: 6, name: 'word6' },
    { id: 7, name: 'word7' },
    { id: 8, name: 'word8' },
    { id: 9, name: 'word9' },
    { id: 10, name: 'word10' },
    { id: 11, name: 'word11' },
    { id: 12, name: 'word12' },
    { id: 13, name: 'word13' },
    { id: 14, name: 'word14' },
    { id: 15, name: 'word15' },
    { id: 16, name: 'word16' },
    { id: 17, name: 'word17' },
    { id: 18, name: 'word18' },
    { id: 19, name: 'word19' },
    { id: 20, name: 'word20' },
];
exports["default"] = words;


/***/ }),

/***/ "./src/components/view/AppView.ts":
/*!****************************************!*\
  !*** ./src/components/view/AppView.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const router_1 = __webpack_require__(/*! ../controller/router */ "./src/components/controller/router.ts");
const Footer_1 = __importDefault(__webpack_require__(/*! ./footer/Footer */ "./src/components/view/footer/Footer.ts"));
const state_1 = __importDefault(__webpack_require__(/*! ../controller/state */ "./src/components/controller/state.ts"));
__webpack_require__(/*! ./AppView.scss */ "./src/components/view/AppView.scss");
const Header_1 = __importDefault(__webpack_require__(/*! ./header/Header */ "./src/components/view/header/Header.ts"));
const AppView = () => __awaiter(void 0, void 0, void 0, function* () {
    let state = (0, state_1.default)();
    state = yield (0, router_1.handleRoute)(state);
    const header = new Header_1.default(state);
    state = yield header.render();
    (0, Footer_1.default)();
    document.addEventListener('hashchange', () => {
        (0, router_1.handleRoute)(state);
    });
});
exports["default"] = AppView;


/***/ }),

/***/ "./src/components/view/audio/AudioChallenge.ts":
/*!*****************************************************!*\
  !*** ./src/components/view/audio/AudioChallenge.ts ***!
  \*****************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const AudioTemplate_1 = __importDefault(__webpack_require__(/*! ./AudioTemplate */ "./src/components/view/audio/AudioTemplate.ts"));
__webpack_require__(/*! ./AudioChallenge.scss */ "./src/components/view/audio/AudioChallenge.scss");
class AudioChallenge {
    constructor(state) {
        this.state = state;
    }
    render() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.page = 'audio';
            const notFoundNode = AudioTemplate_1.default.content.cloneNode(true);
            const container = document.querySelector('#main-container');
            container.innerHTML = '';
            container.append(notFoundNode);
            return this.state;
        });
    }
}
exports["default"] = AudioChallenge;


/***/ }),

/***/ "./src/components/view/audio/AudioTemplate.ts":
/*!****************************************************!*\
  !*** ./src/components/view/audio/AudioTemplate.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const audioTemplate = document.createElement('template');
audioTemplate.innerHTML = `
  <div class="main-page">
    <h2>Audio Page</h2>
    <h3>Some Main Content</h3>
  </div>`;
exports["default"] = audioTemplate;


/***/ }),

/***/ "./src/components/view/dictionary/Dictionary.ts":
/*!******************************************************!*\
  !*** ./src/components/view/dictionary/Dictionary.ts ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const DictionaryTemplate_1 = __importDefault(__webpack_require__(/*! ./DictionaryTemplate */ "./src/components/view/dictionary/DictionaryTemplate.ts"));
__webpack_require__(/*! ./Dictionary.scss */ "./src/components/view/dictionary/Dictionary.scss");
class Dictionary {
    constructor(state) {
        this.state = state;
    }
    render() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.page = 'dictionary';
            const notFoundNode = DictionaryTemplate_1.default.content.cloneNode(true);
            const container = document.querySelector('#main-container');
            container.innerHTML = '';
            container.append(notFoundNode);
            return this.state;
        });
    }
}
exports["default"] = Dictionary;


/***/ }),

/***/ "./src/components/view/dictionary/DictionaryTemplate.ts":
/*!**************************************************************!*\
  !*** ./src/components/view/dictionary/DictionaryTemplate.ts ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const dictionaryTemplate = document.createElement('template');
dictionaryTemplate.innerHTML = `
  <div class="main-page">
    <h2>Disctionary Page</h2>
    <h3>Some Main Content</h3>
  </div>`;
exports["default"] = dictionaryTemplate;


/***/ }),

/***/ "./src/components/view/footer/Footer.ts":
/*!**********************************************!*\
  !*** ./src/components/view/footer/Footer.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const FooterTemplate_1 = __importDefault(__webpack_require__(/*! ./FooterTemplate */ "./src/components/view/footer/FooterTemplate.ts"));
__webpack_require__(/*! ./Footer.scss */ "./src/components/view/footer/Footer.scss");
const renderFooter = () => {
    const footerNode = FooterTemplate_1.default.content.cloneNode(true);
    const container = document.querySelector('#footer-container');
    container.innerHTML = '';
    container.append(footerNode);
};
exports["default"] = renderFooter;


/***/ }),

/***/ "./src/components/view/footer/FooterTemplate.ts":
/*!******************************************************!*\
  !*** ./src/components/view/footer/FooterTemplate.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const footerTemplate = document.createElement('template');
footerTemplate.innerHTML = `
  <p class="copyright">
      2022 
  </p>
  <div class="github-link">
    <a href="https://github.com/halina-k" class="github" title="Halina Kulakova" target="_blank">HK</a>
    <a href="https://github.com/googray" class="github" title="Roman Shatrov" target="_blank">RS</a> 
    <a href="https://github.com/vermilion2020" title="Militsa Tuseeva" class="github" target="_blank">TM</a>
  </div>
  <a href="https://rs.school/js/" target="_blank" class="link-rs">
    <svg class="rsschool" width="126" height="47" viewBox="0 0 126 47" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_3_103)">
    <path d="M65.0514 15.5675L71.046 15.1783C71.1827 16.1627 71.4334 16.8953 71.8437 17.4218C72.5047 18.246 73.4164 18.6581 74.6245 18.6581C75.5134 18.6581 76.22 18.452 76.6986 18.0171C77.1545 17.6737 77.428 17.1242 77.428 16.5519C77.428 16.0025 77.1773 15.4759 76.7442 15.1325C76.2884 14.7204 75.2171 14.3084 73.5304 13.9421C70.7724 13.3239 68.7894 12.4998 67.627 11.4467C66.4645 10.4623 65.8035 9.02 65.8491 7.48614C65.8491 6.43305 66.1682 5.37996 66.7608 4.51001C67.4446 3.5256 68.3792 2.74723 69.496 2.31225C70.704 1.78571 72.3907 1.51099 74.5105 1.51099C77.1089 1.51099 79.0919 1.99175 80.4595 2.97616C81.8271 3.93768 82.6476 5.49442 82.8983 7.6235L76.9721 7.9669C76.8126 7.05117 76.4935 6.38726 75.9692 5.95229C75.445 5.51732 74.7612 5.31128 73.8723 5.31128C73.1429 5.31128 72.5959 5.47153 72.2312 5.76915C71.8893 6.04387 71.6614 6.45595 71.6842 6.91381C71.6842 7.25721 71.8665 7.57772 72.14 7.78376C72.4363 8.05848 73.1429 8.3103 74.2598 8.53924C77.0177 9.13446 78.9779 9.72969 80.186 10.3478C81.394 10.9659 82.2601 11.7214 82.7844 12.6142C83.3314 13.53 83.6049 14.5831 83.5821 15.6591C83.5821 16.9411 83.2174 18.2231 82.4881 19.2991C81.7359 20.4209 80.6874 21.2908 79.4566 21.8174C78.1574 22.3897 76.5163 22.6873 74.5561 22.6873C71.0915 22.6873 68.6983 22.0234 67.3535 20.6727C66.0087 19.322 65.2109 17.6279 65.0514 15.5675ZM1.43596 22.3439V1.87728H11.9436C13.881 1.87728 15.3853 2.03753 16.411 2.38093C17.4139 2.70144 18.3028 3.36535 18.8954 4.25819C19.5564 5.2426 19.8755 6.38726 19.8527 7.57772C19.9211 9.59233 18.8954 11.5154 17.1404 12.5227C16.4566 12.9119 15.7044 13.1866 14.9295 13.3239C15.4993 13.4842 16.0691 13.7589 16.5705 14.0794C16.958 14.3999 17.2771 14.7662 17.5734 15.1554C17.9153 15.5446 18.2116 15.9796 18.4624 16.4374L21.5166 22.3668H14.3596L10.9863 16.0711C10.5532 15.2699 10.1885 14.7433 9.8466 14.4915C9.39074 14.171 8.84371 14.0107 8.29667 14.0107H7.74964V22.321H1.43596V22.3439ZM7.74964 10.1647H10.4164C10.9863 10.1189 11.5333 10.0273 12.0803 9.88994C12.4906 9.82126 12.8553 9.59233 13.106 9.24893C13.7214 8.42477 13.6302 7.25721 12.8781 6.54752C12.4678 6.20412 11.67 6.02097 10.5304 6.02097H7.74964V10.1647ZM0 39.8802L5.99457 39.491C6.13133 40.4754 6.38205 41.208 6.79233 41.7346C7.43054 42.5587 8.36505 42.9937 9.57308 42.9937C10.462 42.9937 11.1686 42.7877 11.6473 42.3527C12.1031 41.9864 12.3766 41.4598 12.3766 40.8875C12.3766 40.3381 12.1259 39.8115 11.6928 39.4681C11.237 39.056 10.1657 38.644 8.45622 38.2777C5.69826 37.6595 3.71527 36.8354 2.55282 35.7823C1.39038 34.7979 0.729378 33.3556 0.774964 31.8217C0.774964 30.7687 1.09407 29.7156 1.68669 28.8456C2.37048 27.8612 3.30499 27.0828 4.42185 26.6479C5.62988 26.1213 7.31657 25.8466 9.43632 25.8466C12.0347 25.8466 14.0177 26.3274 15.3853 27.3118C16.7529 28.2962 17.5506 29.83 17.8014 31.9591L11.8752 32.3025C11.7156 31.3868 11.3965 30.7229 10.8723 30.2879C10.3708 29.8529 9.66425 29.6469 8.77533 29.6698C8.04595 29.6698 7.49891 29.83 7.13423 30.1505C6.76954 30.4253 6.5644 30.8373 6.58719 31.2952C6.58719 31.6386 6.76954 31.9591 7.04305 32.1651C7.33936 32.4399 8.04595 32.6917 9.16281 32.9206C11.9208 33.5159 13.881 34.1111 15.089 34.7292C16.297 35.3473 17.1632 36.1028 17.6874 36.9956C18.2344 37.9114 18.508 38.9645 18.508 40.0176C18.508 41.2996 18.1205 42.5587 17.4139 43.6347C16.6617 44.7565 15.6132 45.6264 14.3824 46.153C13.0832 46.7253 11.4421 47.0229 9.48191 47.0229C6.01737 47.0229 3.6241 46.359 2.27931 45.0083C0.934515 43.6347 0.182344 41.9406 0 39.8802H0Z" fill="black"/>
    <path d="M30.3145 38.2776L35.8304 39.9488C35.5341 41.3453 34.9187 42.6732 34.0754 43.8407C33.3004 44.8709 32.2747 45.6722 31.1123 46.1987C29.927 46.7253 28.4227 47 26.5993 47C24.3883 47 22.5649 46.6795 21.1745 46.0385C19.7613 45.3975 18.5533 44.2528 17.5276 42.6274C16.5019 41.0019 16.0005 38.9186 16.0005 36.3775C16.0005 32.9893 16.8894 30.3794 18.6901 28.5709C20.4907 26.7623 23.0207 25.8466 26.3029 25.8466C28.8786 25.8466 30.8844 26.3731 32.3659 27.4033C33.8247 28.4564 34.9187 30.0589 35.6481 32.2109L30.0866 33.4471C29.9498 32.9664 29.7447 32.4856 29.4712 32.0735C29.1293 31.5928 28.6962 31.2265 28.172 30.9518C27.6477 30.677 27.0551 30.5626 26.4625 30.5626C25.0265 30.5626 23.9325 31.1349 23.1803 32.3025C22.6105 33.1495 22.3142 34.5002 22.3142 36.3317C22.3142 38.5981 22.6561 40.1549 23.3399 41.0019C24.0236 41.849 24.981 42.2611 26.2346 42.2611C27.4426 42.2611 28.3543 41.9177 28.9697 41.2538C29.5851 40.5441 30.041 39.5597 30.3145 38.2776ZM43.1926 26.19H49.4835V33.3556H56.367V26.19H62.7035V46.6566H56.367V38.3692H49.4835V46.6566H43.1926V26.19Z" fill="black"/>
    <path d="M61.8374 36.4233C61.8374 33.0809 62.7719 30.4711 64.6182 28.6167C66.4644 26.7624 69.0628 25.8237 72.3678 25.8237C75.764 25.8237 78.3624 26.7395 80.2086 28.5709C82.0548 30.4024 82.9666 32.9664 82.9666 36.2631C82.9666 38.6669 82.5563 40.6128 81.7585 42.1467C80.9836 43.6576 79.7755 44.8939 78.294 45.718C76.7669 46.5651 74.875 47.0001 72.6185 47.0001C70.3164 47.0001 68.4246 46.6338 66.9203 45.9012C65.3703 45.1228 64.0939 43.9095 63.2506 42.4214C62.3161 40.8189 61.8374 38.8271 61.8374 36.4233ZM68.1283 36.4462C68.1283 38.5066 68.5158 39.9947 69.2679 40.9104C70.0201 41.8033 71.0686 42.2611 72.3906 42.2611C73.7354 42.2611 74.7839 41.8262 75.536 40.9333C76.2882 40.0405 76.6529 38.4608 76.6529 36.1715C76.6529 34.2485 76.2654 32.8291 75.4904 31.9591C74.7155 31.0663 73.667 30.6313 72.345 30.6313C71.1826 30.5855 70.0657 31.0892 69.2907 31.982C68.5158 32.8749 68.1283 34.3629 68.1283 36.4462ZM89.417 36.4233C89.417 33.0809 90.3515 30.4711 92.1978 28.6167C94.044 26.7624 96.6424 25.8237 99.9474 25.8237C103.344 25.8237 105.965 26.7395 107.788 28.5709C109.612 30.4024 110.546 32.9664 110.546 36.2631C110.546 38.6669 110.136 40.6128 109.338 42.1467C108.563 43.6576 107.355 44.8939 105.874 45.718C104.346 46.5651 102.455 47.0001 100.198 47.0001C97.896 47.0001 96.0042 46.6338 94.4999 45.9012C92.9499 45.1228 91.6735 43.9095 90.8302 42.4214C89.8957 40.8189 89.417 38.8271 89.417 36.4233ZM95.7079 36.4462C95.7079 38.5066 96.0954 39.9947 96.8475 40.9104C97.5997 41.8033 98.6482 42.2611 99.9702 42.2611C101.315 42.2611 102.363 41.8262 103.116 40.9333C103.868 40.0405 104.232 38.4608 104.232 36.1715C104.232 34.2485 103.845 32.8291 103.07 31.9591C102.295 31.0663 101.247 30.6313 99.9246 30.6313C98.7621 30.5855 97.6225 31.0892 96.8703 31.982C96.0954 32.8749 95.7079 34.3629 95.7079 36.4462Z" fill="black"/>
    <path d="M109.885 26.1899H116.176V41.62H126V46.6566H109.862V26.1899H109.885Z" fill="black"/>
    <path d="M102.951 25.0089C109.285 20.215 111.238 12.0887 107.314 6.85814C103.389 1.62762 95.0735 1.27364 88.7399 6.0675C82.4064 10.8614 80.4533 18.9877 84.3776 24.2182C88.302 29.4488 96.6177 29.8027 102.951 25.0089Z" fill="white"/>
    <path class="rsschool-paint" d="M68.2251 12.944L100.954 -11.8286L123.602 18.3569L90.8727 43.1295L68.2251 12.944Z" fill="white"/>
    <path d="M102.951 25.0088C109.285 20.2149 111.238 12.0885 107.314 6.85801C103.389 1.6275 95.0735 1.27352 88.7399 6.06738C82.4064 10.8612 80.4533 18.9876 84.3776 24.2181C88.302 29.4486 96.6177 29.8026 102.951 25.0088Z" fill="white"/>
    <path d="M77.3389 14.9596L100.257 -2.38634L114.482 16.5736L91.5636 33.9195L77.3389 14.9596Z" fill="white"/>
    <path d="M102.951 25.0088C109.285 20.2149 111.238 12.0885 107.314 6.85801C103.389 1.6275 95.0735 1.27352 88.7399 6.06738C82.4064 10.8612 80.4533 18.9876 84.3776 24.2181C88.302 29.4486 96.6177 29.8026 102.951 25.0088Z" fill="white" stroke="black" stroke-width="4" stroke-miterlimit="10"/>
    <path d="M77.3389 14.9596L100.257 -2.38634L114.482 16.5736L91.5636 33.9195L77.3389 14.9596Z" stroke="black" stroke-width="4" stroke-miterlimit="10"/>
    <path d="M102.951 25.0088C109.285 20.2149 111.238 12.0885 107.314 6.85801C103.389 1.6275 95.0735 1.27352 88.7399 6.06738C82.4064 10.8612 80.4533 18.9876 84.3776 24.2181C88.302 29.4486 96.6177 29.8026 102.951 25.0088Z" stroke="black" stroke-width="4" stroke-miterlimit="10"/>
    <path d="M77.3389 14.9596L100.257 -2.38634L114.482 16.5736L91.5636 33.9195L77.3389 14.9596Z" fill="white"/>
    <path d="M102.951 25.0088C109.285 20.2149 111.238 12.0885 107.314 6.85801C103.389 1.6275 95.0735 1.27352 88.7399 6.06738C82.4064 10.8612 80.4533 18.9876 84.3776 24.2181C88.302 29.4486 96.6177 29.8026 102.951 25.0088Z" fill="white" stroke="black" stroke-width="4" stroke-miterlimit="10"/>
    <path d="M77.3389 14.9596L100.257 -2.38634L114.482 16.5736L91.5636 33.9195L77.3389 14.9596Z" stroke="black" stroke-width="4" stroke-miterlimit="10"/>
    <path d="M68.2251 12.944L100.954 -11.8286L123.602 18.3569L90.8727 43.1295L68.2251 12.944Z" stroke="black" stroke-width="4" stroke-miterlimit="10"/>
    <path class="rsschool-paint" d="M102.951 25.0088C109.285 20.2149 111.238 12.0885 107.314 6.85801C103.389 1.6275 95.0735 1.27352 88.7399 6.06738C82.4064 10.8612 80.4533 18.9876 84.3776 24.2181C88.302 29.4486 96.6177 29.8026 102.951 25.0088Z" stroke="black" stroke-width="4" stroke-miterlimit="10"/>
    <path d="M89.4398 14.0336L91.7192 12.431L94.5227 16.4374C95.0014 17.0784 95.366 17.7652 95.6396 18.5206C95.7991 19.093 95.7535 19.7111 95.5256 20.2605C95.2293 20.9473 94.7506 21.5197 94.1124 21.9318C93.3603 22.4583 92.722 22.7559 92.175 22.8475C91.6508 22.9391 91.1037 22.8475 90.6023 22.6186C90.0553 22.3438 89.5766 21.9546 89.2119 21.451L91.1721 19.6195C91.3317 19.8714 91.5368 20.1003 91.7647 20.2834C91.9243 20.3979 92.1066 20.4666 92.3118 20.4666C92.4713 20.4666 92.6309 20.3979 92.7448 20.3063C92.9728 20.169 93.1323 19.8942 93.1095 19.6195C93.0411 19.2303 92.8816 18.8412 92.6309 18.5435L89.4398 14.0336ZM96.2778 16.5747L98.3519 14.9264C98.5799 15.2011 98.8762 15.4072 99.1953 15.5216C99.6511 15.659 100.13 15.5674 100.517 15.2698C100.791 15.0866 101.019 14.8348 101.11 14.5143C101.247 14.1022 101.019 13.6444 100.608 13.507C100.54 13.4841 100.472 13.4612 100.403 13.4612C100.13 13.4383 99.6511 13.5528 98.9446 13.8504C97.7821 14.3312 96.8704 14.5143 96.1866 14.4456C95.5256 14.377 94.9102 14.0336 94.5455 13.4612C94.272 13.072 94.1352 12.6142 94.1124 12.1563C94.1124 11.6298 94.2492 11.1032 94.5455 10.6682C94.9786 10.0501 95.5028 9.52357 96.141 9.11149C97.0983 8.44758 97.9417 8.12708 98.671 8.12708C99.4004 8.12708 100.084 8.47047 100.722 9.18017L98.671 10.8056C98.2608 10.279 97.4858 10.1646 96.9616 10.5767L96.8932 10.6453C96.6652 10.7827 96.5057 10.9887 96.4145 11.2406C96.3461 11.4237 96.3917 11.6298 96.5057 11.79C96.5969 11.9045 96.7336 11.996 96.8932 11.996C97.0755 12.0189 97.3946 11.9274 97.8505 11.7213C98.9901 11.2406 99.8563 10.9658 100.449 10.8743C100.95 10.7827 101.475 10.8285 101.953 11.0345C102.386 11.2177 102.751 11.5382 103.002 11.9274C103.321 12.3852 103.503 12.9347 103.526 13.507C103.549 14.1022 103.389 14.6746 103.07 15.1782C102.66 15.7963 102.136 16.3229 101.52 16.735C100.267 17.6049 99.2409 17.9712 98.4203 17.8338C97.5314 17.6965 96.802 17.2386 96.2778 16.5747Z" fill="black"/>
    </g>
    <defs>
    <clipPath id="clip0_3_103">
    <rect width="126" height="47" fill="white"/>
    </clipPath>
    </defs>
    </svg>
  </a>`;
exports["default"] = footerTemplate;


/***/ }),

/***/ "./src/components/view/header/AuthTemplate.ts":
/*!****************************************************!*\
  !*** ./src/components/view/header/AuthTemplate.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.authTemplate = exports.registrationTemplate = void 0;
exports.registrationTemplate = document.createElement('template');
exports.registrationTemplate.innerHTML = `
  <form id="auth-form" class="popup">
    <h2 class="popup__heading">RS Lang</h2>
    <button class="popup__cross-button">X</button>
    <p>Приложение для изучения английского языка с помощью игр.</p>
    <span class="popup__subheading">Регистрация</span>
    <input class="popup__input" required type="email" name="email" placeHolder="Электронная почта">
    <input class="popup__input" required minlength="3" type="text" name="name" placeHolder="Имя">
    <input class="popup__input" required minlength="8" type="password" name="password" placeHolder="Пароль">
    <input class="popup__input" required minlength="8" type="password" name="password-confirm" placeHolder="Повторно пароль">
    <button type="submit" id="registration" class="popup__submit button">Зарегистрироваться</button>
    <span class="popup__copyright">© Все права защищены — 2022 г. RS Lang</span>
  </form>`;
exports.authTemplate = document.createElement('template');
exports.authTemplate.innerHTML = `
  <form id="auth-form" class="popup">
    <h2 class="popup__heading">RS Lang</h2>
    <button class="popup__cross-button">X</button>
    <p>Приложение для изучения английского языка с помощью игр.</p>
    <span class="popup__subheading">Вход</span>
    <input class="popup__input" required name="email" type="email" placeHolder="Электронная почта">
    <input class="popup__input" required minlength="8" name="password" type="password" placeHolder="Пароль">
    <div class="popup__buttons">
      <button id="auth-button" class="button button">Вход</button>
      <button type="submit" id="reg-button" class="button button_light">Регистрация</button>
    </div>
    <span class="popup__copyright">© Все права защищены — 2022 г. RS Lang</span>
    </form>`;


/***/ }),

/***/ "./src/components/view/header/Header.ts":
/*!**********************************************!*\
  !*** ./src/components/view/header/Header.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const HeaderTemplate_1 = __importDefault(__webpack_require__(/*! ./HeaderTemplate */ "./src/components/view/header/HeaderTemplate.ts"));
__webpack_require__(/*! ./Header.scss */ "./src/components/view/header/Header.scss");
__webpack_require__(/*! ./Auth.scss */ "./src/components/view/header/Auth.scss");
const router_1 = __webpack_require__(/*! ../../controller/router */ "./src/components/controller/router.ts");
const menu_items_1 = __importDefault(__webpack_require__(/*! ../../model/menu-items */ "./src/components/model/menu-items.ts"));
const AuthTemplate_1 = __webpack_require__(/*! ./AuthTemplate */ "./src/components/view/header/AuthTemplate.ts");
const auth_helper_1 = __webpack_require__(/*! ../../controller/helpers/auth-helper */ "./src/components/controller/helpers/auth-helper.ts");
class Header {
    constructor(state) {
        this.popupContainer = document.querySelector('#popup');
        this.overlay = document.querySelector('#overlay');
        this.form = this.popupContainer.querySelector('#auth-form');
        this.state = state;
    }
    clearPopup() {
        this.popupContainer.classList.add('hidden');
        this.overlay.classList.add('hidden');
        this.form.reset();
    }
    showPopup() {
        this.popupContainer.classList.remove('hidden');
        this.overlay.classList.remove('hidden');
    }
    renderRegForm() {
        var _a;
        this.popupContainer.innerHTML = '';
        const regNode = AuthTemplate_1.registrationTemplate.content.cloneNode(true);
        this.popupContainer.appendChild(regNode);
        (_a = this.popupContainer.querySelector('.popup__cross-button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', (e) => {
            e.preventDefault();
            this.clearPopup();
        });
    }
    renderAuthForm() {
        var _a;
        this.popupContainer.innerHTML = '';
        this.popupContainer.classList.remove('hidden');
        this.overlay.classList.remove('hidden');
        const authNode = AuthTemplate_1.authTemplate.content.cloneNode(true);
        this.popupContainer.appendChild(authNode);
        (_a = this.popupContainer.querySelector('.popup__cross-button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', (e) => {
            e.preventDefault();
            this.clearPopup();
        });
        this.popupContainer.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const target = e.target;
            if (target.id === 'reg-button') {
                this.renderRegForm();
            }
            else if (target.id === 'registration') {
                this.state = yield (0, auth_helper_1.handleRegistration)(this.state);
                if (this.state.loggedIn) {
                    this.render();
                }
            }
            else if (target.id === 'auth-button') {
                this.state = yield (0, auth_helper_1.handleAuth)(this.state);
                if (this.state.loggedIn) {
                    this.render();
                }
            }
            if (this.state.loggedIn) {
                this.clearPopup();
                this.render();
            }
        }));
    }
    handleItemClick(e) {
        var _a;
        const target = e.target;
        if (target.tagName === 'A') {
            e.preventDefault();
            const newLocation = target.href;
            const menuItem = menu_items_1.default.find((item) => newLocation.includes(item.href));
            if (!this.state.loggedIn && (menuItem === null || menuItem === void 0 ? void 0 : menuItem.auth)) {
                return;
            }
            (_a = document.querySelector('.main-nav__item_active')) === null || _a === void 0 ? void 0 : _a.classList.remove('main-nav__item_active');
            target.classList.add('main-nav__item_active');
            (0, router_1.route)(e, this.state);
        }
    }
    render() {
        return __awaiter(this, void 0, void 0, function* () {
            const headerContainer = document.querySelector('#header-container');
            headerContainer.innerHTML = '';
            const headerNode = (0, HeaderTemplate_1.default)(this.state.page, this.state.loggedIn, this.state.userName).content.cloneNode(true);
            headerContainer.appendChild(headerNode);
            const nav = headerContainer.querySelector('nav');
            const loginButton = headerContainer.querySelector('#log-in');
            const logoutButton = headerContainer.querySelector('#log-out');
            nav.addEventListener('click', (e) => {
                this.handleItemClick(e);
            });
            if (loginButton) {
                loginButton.addEventListener('click', () => {
                    this.renderAuthForm();
                });
            }
            if (logoutButton) {
                logoutButton.addEventListener('click', () => {
                    this.state = (0, auth_helper_1.handleLogout)(this.state);
                    if (!this.state.loggedIn) {
                        this.render();
                    }
                });
            }
            return this.state;
        });
    }
}
exports["default"] = Header;


/***/ }),

/***/ "./src/components/view/header/HeaderTemplate.ts":
/*!******************************************************!*\
  !*** ./src/components/view/header/HeaderTemplate.ts ***!
  \******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const menu_items_1 = __importDefault(__webpack_require__(/*! ../../model/menu-items */ "./src/components/model/menu-items.ts"));
const drawMenuItem = (item, active, loggedIn) => `
    <a href="/#/${item.href}" title="${!loggedIn && item.auth
    ? 'Log in to see this page'
    : item.name}"
    class="main-nav__item${active === item.href ? ' main-nav__item_active' : ''} ${!loggedIn && item.auth ? ' main-nav__item_disabled' : ''}" id="${item.href}-menu-item">${item.name}
    </a>`;
const headerTemplate = (active, loggedIn, userName) => {
    const header = document.createElement('template');
    const menuBody = menu_items_1.default.map((item) => drawMenuItem(item, active, loggedIn)).join('');
    const loggedOutBlock = `
    <div class="logged-out">
      <button class="button" id="log-in">Войти</button>
    </div>`;
    const loggedInBlock = `
    <div class="logged-in">
      <div class="user-name">${userName}</div>
      <button class="button" id="log-out">Выход</button>
    </div>`;
    header.innerHTML = `
  <div class="logo"><a href="/" class="logo__link"></span><h1>RS Lang</h1></a></div>
  <nav class="main-nav" id="main-nav">
    ${menuBody}
  </nav>
  ${!loggedIn ? loggedOutBlock : loggedInBlock}
  `;
    return header;
};
exports["default"] = headerTemplate;


/***/ }),

/***/ "./src/components/view/main/Main.ts":
/*!******************************************!*\
  !*** ./src/components/view/main/Main.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const MainTemplate_1 = __importDefault(__webpack_require__(/*! ./MainTemplate */ "./src/components/view/main/MainTemplate.ts"));
__webpack_require__(/*! ./Main.scss */ "./src/components/view/main/Main.scss");
class Main {
    constructor(state) {
        this.state = state;
    }
    render() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.page = 'main';
            const notFoundNode = MainTemplate_1.default.content.cloneNode(true);
            const container = document.querySelector('#main-container');
            container.innerHTML = '';
            container.append(notFoundNode);
            return this.state;
        });
    }
}
exports["default"] = Main;


/***/ }),

/***/ "./src/components/view/main/MainTemplate.ts":
/*!**************************************************!*\
  !*** ./src/components/view/main/MainTemplate.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const mainTemplate = document.createElement('template');
mainTemplate.innerHTML = `
  <div class="main-page">
    <h2>Main Page</h2>
    <h3>Some Main Content</h3>
  </div>`;
exports["default"] = mainTemplate;


/***/ }),

/***/ "./src/components/view/notFound/NotFound.ts":
/*!**************************************************!*\
  !*** ./src/components/view/notFound/NotFound.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const NotFoundTemplate_1 = __importDefault(__webpack_require__(/*! ./NotFoundTemplate */ "./src/components/view/notFound/NotFoundTemplate.ts"));
__webpack_require__(/*! ./NotFound.scss */ "./src/components/view/notFound/NotFound.scss");
class NotFound {
    constructor(state) {
        this.state = state;
    }
    render() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.page = 'notFound';
            const notFoundNode = NotFoundTemplate_1.default.content.cloneNode(true);
            const container = document.querySelector('#main-container');
            container.innerHTML = '';
            container.append(notFoundNode);
            return this.state;
        });
    }
}
exports["default"] = NotFound;


/***/ }),

/***/ "./src/components/view/notFound/NotFoundTemplate.ts":
/*!**********************************************************!*\
  !*** ./src/components/view/notFound/NotFoundTemplate.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const notFoundTemplate = document.createElement('template');
notFoundTemplate.innerHTML = `
  <div class="not-found-container">
    <h2>Nothing is found</h2>
    <h3>Use navigation to open apllication pages</h3>
    <div class="not-found-container__img"></div>
  </div>`;
exports["default"] = notFoundTemplate;


/***/ }),

/***/ "./src/components/view/sprint/Sprint.ts":
/*!**********************************************!*\
  !*** ./src/components/view/sprint/Sprint.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const SprintTemplate_1 = __importDefault(__webpack_require__(/*! ./SprintTemplate */ "./src/components/view/sprint/SprintTemplate.ts"));
__webpack_require__(/*! ./Sprint.scss */ "./src/components/view/sprint/Sprint.scss");
class Sprint {
    constructor(state) {
        this.state = state;
    }
    render() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.page = 'sprint';
            const notFoundNode = SprintTemplate_1.default.content.cloneNode(true);
            const container = document.querySelector('#main-container');
            container.innerHTML = '';
            container.append(notFoundNode);
            return this.state;
        });
    }
}
exports["default"] = Sprint;


/***/ }),

/***/ "./src/components/view/sprint/SprintTemplate.ts":
/*!******************************************************!*\
  !*** ./src/components/view/sprint/SprintTemplate.ts ***!
  \******************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const sprintTemplate = document.createElement('template');
sprintTemplate.innerHTML = `
  <div class="main-page">
    <h2>Sprint Page</h2>
    <h3>Some Main Content</h3>
  </div>`;
exports["default"] = sprintTemplate;


/***/ }),

/***/ "./src/components/view/stats/Stats.ts":
/*!********************************************!*\
  !*** ./src/components/view/stats/Stats.ts ***!
  \********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const StatsTemplate_1 = __importDefault(__webpack_require__(/*! ./StatsTemplate */ "./src/components/view/stats/StatsTemplate.ts"));
__webpack_require__(/*! ./Stats.scss */ "./src/components/view/stats/Stats.scss");
class Stats {
    constructor(state) {
        this.state = state;
    }
    render() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.page = 'stats';
            const statsNode = StatsTemplate_1.default.content.cloneNode(true);
            const container = document.querySelector('#main-container');
            container.innerHTML = '';
            container.append(statsNode);
            return this.state;
        });
    }
}
exports["default"] = Stats;


/***/ }),

/***/ "./src/components/view/stats/StatsTemplate.ts":
/*!****************************************************!*\
  !*** ./src/components/view/stats/StatsTemplate.ts ***!
  \****************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const statsTemplate = document.createElement('template');
statsTemplate.innerHTML = `
  <div class="main-page">
    <h2>Statistics Page</h2>
    <h3>Some Main Content</h3>
  </div>`;
exports["default"] = statsTemplate;


/***/ }),

/***/ "./src/components/view/textbook/Textbook.ts":
/*!**************************************************!*\
  !*** ./src/components/view/textbook/Textbook.ts ***!
  \**************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const TextbookTemplate_1 = __webpack_require__(/*! ./TextbookTemplate */ "./src/components/view/textbook/TextbookTemplate.ts");
__webpack_require__(/*! ./Textbook.scss */ "./src/components/view/textbook/Textbook.scss");
const mock_words_data_1 = __importDefault(__webpack_require__(/*! ../../model/mock-words-data */ "./src/components/model/mock-words-data.ts"));
class Textbook {
    constructor(state) {
        this.state = state;
    }
    render() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.page = 'textbook';
            const textbookNode = (0, TextbookTemplate_1.textbookTemplate)(mock_words_data_1.default, this.state.textbook.page).content.cloneNode(true);
            const container = document.querySelector('#main-container');
            const pagingNode = this.paging();
            container.innerHTML = '';
            container.append(textbookNode);
            container.append(pagingNode);
            return this.state;
        });
    }
    changeCurrentPage(unit, page) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO add units paging here also and save together
            window.location.hash = `/${this.state.page}/unit${unit}/${page}`;
            const textbookProgress = { unit: this.state.textbook.unit, page: this.state.textbook.page };
            const textbook = JSON.stringify(textbookProgress);
            localStorage.setItem('textbook', textbook);
            yield this.render();
        });
    }
    paging() {
        // TODO contPages should be received from BE and calculated
        const contPages = 5;
        const pagingNode = (0, TextbookTemplate_1.pagingTemplate)(contPages, this.state.textbook.page).content.cloneNode(true);
        const paging = pagingNode.querySelector('.paging');
        paging.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
            const target = e.target;
            if (target.dataset.number) {
                yield this.changeCurrentPage(1, +target.dataset.number);
            }
            else if (target.classList.contains('paging__prev')) {
                yield this.changeCurrentPage(1, this.state.textbook.page - 1);
            }
            else if (target.classList.contains('paging__next')) {
                yield this.changeCurrentPage(1, this.state.textbook.page + 1);
            }
        }));
        return pagingNode;
    }
}
exports["default"] = Textbook;


/***/ }),

/***/ "./src/components/view/textbook/TextbookTemplate.ts":
/*!**********************************************************!*\
  !*** ./src/components/view/textbook/TextbookTemplate.ts ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.pagingTemplate = exports.textbookTemplate = exports.drawCard = void 0;
const drawCard = (wordData) => `
    <div class="textbook-card">
      <h5>${wordData.id}: ${wordData.name}</h5>
    </div>`;
exports.drawCard = drawCard;
const textbookTemplate = (words, currentPage) => {
    const textbook = document.createElement('template');
    const cards = words.map((word) => (0, exports.drawCard)(word)).join('');
    textbook.innerHTML = `
    <div class="main-page">
      <h2>Textbook Page ${currentPage}</h2>
      <div class="cards-container">
        ${cards}
      </div>
    </div>`;
    return textbook;
};
exports.textbookTemplate = textbookTemplate;
const pagingTemplate = (countPages, currentPage) => {
    const paging = document.createElement('template');
    // You need add some logic to calculate how much buttons should be here
    // just generating page numbers here
    const buttons = Array.from(Array(countPages).keys())
        .map((num) => num + 1)
        .map((page) => `
        <button data-number="${page}" class="button ${page === currentPage && 'current-page'}">
          ${page}
        </button>`)
        .join('');
    paging.innerHTML = `
    <div class="paging">
      <button class="paging__prev button">Prev</button>
      ${buttons}
      <button class="paging__next button">Next</button>
    </div>`;
    return paging;
};
exports.pagingTemplate = pagingTemplate;


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const AppView_1 = __importDefault(__webpack_require__(/*! ./components/view/AppView */ "./src/components/view/AppView.ts"));
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, AppView_1.default)();
}))();


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7V0FDQTtXQUNBO1dBQ0E7V0FDQSxHQUFHO1dBQ0g7V0FDQTtXQUNBLENBQUM7Ozs7O1dDUEQ7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7OztXQ05BO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBOzs7OztXQ2ZBOzs7OztVRUFBO1VBQ0E7VUFDQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2F4aW9zL2luZGV4LmpzIiwid2VicGFjazovL1JTTGFuZy8uL25vZGVfbW9kdWxlcy9heGlvcy9saWIvYWRhcHRlcnMveGhyLmpzIiwid2VicGFjazovL1JTTGFuZy8uL25vZGVfbW9kdWxlcy9heGlvcy9saWIvYXhpb3MuanMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9jYW5jZWwvQ2FuY2VsVG9rZW4uanMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9jYW5jZWwvQ2FuY2VsZWRFcnJvci5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9ub2RlX21vZHVsZXMvYXhpb3MvbGliL2NhbmNlbC9pc0NhbmNlbC5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9ub2RlX21vZHVsZXMvYXhpb3MvbGliL2NvcmUvQXhpb3MuanMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9jb3JlL0F4aW9zRXJyb3IuanMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9jb3JlL0ludGVyY2VwdG9yTWFuYWdlci5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9ub2RlX21vZHVsZXMvYXhpb3MvbGliL2NvcmUvYnVpbGRGdWxsUGF0aC5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9ub2RlX21vZHVsZXMvYXhpb3MvbGliL2NvcmUvZGlzcGF0Y2hSZXF1ZXN0LmpzIiwid2VicGFjazovL1JTTGFuZy8uL25vZGVfbW9kdWxlcy9heGlvcy9saWIvY29yZS9tZXJnZUNvbmZpZy5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9ub2RlX21vZHVsZXMvYXhpb3MvbGliL2NvcmUvc2V0dGxlLmpzIiwid2VicGFjazovL1JTTGFuZy8uL25vZGVfbW9kdWxlcy9heGlvcy9saWIvY29yZS90cmFuc2Zvcm1EYXRhLmpzIiwid2VicGFjazovL1JTTGFuZy8uL25vZGVfbW9kdWxlcy9heGlvcy9saWIvZGVmYXVsdHMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9kZWZhdWx0cy90cmFuc2l0aW9uYWwuanMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9lbnYvZGF0YS5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9ub2RlX21vZHVsZXMvYXhpb3MvbGliL2hlbHBlcnMvYmluZC5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9ub2RlX21vZHVsZXMvYXhpb3MvbGliL2hlbHBlcnMvYnVpbGRVUkwuanMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9oZWxwZXJzL2NvbWJpbmVVUkxzLmpzIiwid2VicGFjazovL1JTTGFuZy8uL25vZGVfbW9kdWxlcy9heGlvcy9saWIvaGVscGVycy9jb29raWVzLmpzIiwid2VicGFjazovL1JTTGFuZy8uL25vZGVfbW9kdWxlcy9heGlvcy9saWIvaGVscGVycy9pc0Fic29sdXRlVVJMLmpzIiwid2VicGFjazovL1JTTGFuZy8uL25vZGVfbW9kdWxlcy9heGlvcy9saWIvaGVscGVycy9pc0F4aW9zRXJyb3IuanMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9oZWxwZXJzL2lzVVJMU2FtZU9yaWdpbi5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9ub2RlX21vZHVsZXMvYXhpb3MvbGliL2hlbHBlcnMvbm9ybWFsaXplSGVhZGVyTmFtZS5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9ub2RlX21vZHVsZXMvYXhpb3MvbGliL2hlbHBlcnMvbnVsbC5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9ub2RlX21vZHVsZXMvYXhpb3MvbGliL2hlbHBlcnMvcGFyc2VIZWFkZXJzLmpzIiwid2VicGFjazovL1JTTGFuZy8uL25vZGVfbW9kdWxlcy9heGlvcy9saWIvaGVscGVycy9wYXJzZVByb3RvY29sLmpzIiwid2VicGFjazovL1JTTGFuZy8uL25vZGVfbW9kdWxlcy9heGlvcy9saWIvaGVscGVycy9zcHJlYWQuanMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9oZWxwZXJzL3RvRm9ybURhdGEuanMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2F4aW9zL2xpYi9oZWxwZXJzL3ZhbGlkYXRvci5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9ub2RlX21vZHVsZXMvYXhpb3MvbGliL3V0aWxzLmpzIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvQXBwVmlldy5zY3NzIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvYXVkaW8vQXVkaW9DaGFsbGVuZ2Uuc2NzcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L2RpY3Rpb25hcnkvRGljdGlvbmFyeS5zY3NzIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvZm9vdGVyL0Zvb3Rlci5zY3NzIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvaGVhZGVyL0F1dGguc2NzcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L2hlYWRlci9IZWFkZXIuc2NzcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L21haW4vTWFpbi5zY3NzIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvbm90Rm91bmQvTm90Rm91bmQuc2NzcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L3NwcmludC9TcHJpbnQuc2NzcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L3N0YXRzL1N0YXRzLnNjc3MiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvdmlldy90ZXh0Ym9vay9UZXh0Ym9vay5zY3NzIiwid2VicGFjazovL1JTTGFuZy8uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2Nzc1dpdGhNYXBwaW5nVG9TdHJpbmcuanMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2dldFVybC5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9sZC5lb3QiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQuc3ZnIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLnR0ZiIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9sZC53b2ZmIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLnN2ZyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9vay50dGYiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvb2sud29mZiIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci5zdmciLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLVJlZ3VsYXIudHRmIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLndvZmYiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1Cb29rLmVvdCIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2suc3ZnIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay50dGYiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1Cb29rLndvZmYiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLmVvdCIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIuc3ZnIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci50dGYiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLndvZmYiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvdmlldy9BcHBWaWV3LnNjc3M/MDE3MiIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L2F1ZGlvL0F1ZGlvQ2hhbGxlbmdlLnNjc3M/YmM3MSIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L2RpY3Rpb25hcnkvRGljdGlvbmFyeS5zY3NzP2NiNjciLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvdmlldy9mb290ZXIvRm9vdGVyLnNjc3M/ZWNlMyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L2hlYWRlci9BdXRoLnNjc3M/MTM3YiIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L2hlYWRlci9IZWFkZXIuc2Nzcz9jMjRjIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvbWFpbi9NYWluLnNjc3M/ZjViYiIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L25vdEZvdW5kL05vdEZvdW5kLnNjc3M/NDU5YSIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L3NwcmludC9TcHJpbnQuc2Nzcz9mMTRkIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvc3RhdHMvU3RhdHMuc2Nzcz9lODUwIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvdGV4dGJvb2svVGV4dGJvb2suc2Nzcz9jYjgxIiwid2VicGFjazovL1JTTGFuZy8uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qcyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy9jb250cm9sbGVyL2hlbHBlcnMvYXV0aC1oZWxwZXIudHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvY29udHJvbGxlci9yb3V0ZXIudHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvY29udHJvbGxlci9zdGF0ZS50cyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy9tb2RlbC9hcGkvYXV0aC50cyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy9tb2RlbC9jb25zdGFudHMudHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvbW9kZWwvbWVudS1pdGVtcy50cyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy9tb2RlbC9tb2NrLXdvcmRzLWRhdGEudHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvdmlldy9BcHBWaWV3LnRzIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvYXVkaW8vQXVkaW9DaGFsbGVuZ2UudHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvdmlldy9hdWRpby9BdWRpb1RlbXBsYXRlLnRzIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvZGljdGlvbmFyeS9EaWN0aW9uYXJ5LnRzIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvZGljdGlvbmFyeS9EaWN0aW9uYXJ5VGVtcGxhdGUudHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvdmlldy9mb290ZXIvRm9vdGVyLnRzIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvZm9vdGVyL0Zvb3RlclRlbXBsYXRlLnRzIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvaGVhZGVyL0F1dGhUZW1wbGF0ZS50cyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L2hlYWRlci9IZWFkZXIudHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvdmlldy9oZWFkZXIvSGVhZGVyVGVtcGxhdGUudHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvdmlldy9tYWluL01haW4udHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvdmlldy9tYWluL01haW5UZW1wbGF0ZS50cyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L25vdEZvdW5kL05vdEZvdW5kLnRzIiwid2VicGFjazovL1JTTGFuZy8uL3NyYy9jb21wb25lbnRzL3ZpZXcvbm90Rm91bmQvTm90Rm91bmRUZW1wbGF0ZS50cyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L3NwcmludC9TcHJpbnQudHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvdmlldy9zcHJpbnQvU3ByaW50VGVtcGxhdGUudHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvdmlldy9zdGF0cy9TdGF0cy50cyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L3N0YXRzL1N0YXRzVGVtcGxhdGUudHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2NvbXBvbmVudHMvdmlldy90ZXh0Ym9vay9UZXh0Ym9vay50cyIsIndlYnBhY2s6Ly9SU0xhbmcvLi9zcmMvY29tcG9uZW50cy92aWV3L3RleHRib29rL1RleHRib29rVGVtcGxhdGUudHMiLCJ3ZWJwYWNrOi8vUlNMYW5nLy4vc3JjL2luZGV4LnRzIiwid2VicGFjazovL1JTTGFuZy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9SU0xhbmcvd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vUlNMYW5nL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9SU0xhbmcvd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9SU0xhbmcvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9SU0xhbmcvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9SU0xhbmcvd2VicGFjay9ydW50aW1lL3B1YmxpY1BhdGgiLCJ3ZWJwYWNrOi8vUlNMYW5nL3dlYnBhY2svcnVudGltZS9ub25jZSIsIndlYnBhY2s6Ly9SU0xhbmcvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly9SU0xhbmcvd2VicGFjay9zdGFydHVwIiwid2VicGFjazovL1JTTGFuZy93ZWJwYWNrL2FmdGVyLXN0YXJ0dXAiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9heGlvcycpOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi8uLi91dGlscycpO1xudmFyIHNldHRsZSA9IHJlcXVpcmUoJy4vLi4vY29yZS9zZXR0bGUnKTtcbnZhciBjb29raWVzID0gcmVxdWlyZSgnLi8uLi9oZWxwZXJzL2Nvb2tpZXMnKTtcbnZhciBidWlsZFVSTCA9IHJlcXVpcmUoJy4vLi4vaGVscGVycy9idWlsZFVSTCcpO1xudmFyIGJ1aWxkRnVsbFBhdGggPSByZXF1aXJlKCcuLi9jb3JlL2J1aWxkRnVsbFBhdGgnKTtcbnZhciBwYXJzZUhlYWRlcnMgPSByZXF1aXJlKCcuLy4uL2hlbHBlcnMvcGFyc2VIZWFkZXJzJyk7XG52YXIgaXNVUkxTYW1lT3JpZ2luID0gcmVxdWlyZSgnLi8uLi9oZWxwZXJzL2lzVVJMU2FtZU9yaWdpbicpO1xudmFyIHRyYW5zaXRpb25hbERlZmF1bHRzID0gcmVxdWlyZSgnLi4vZGVmYXVsdHMvdHJhbnNpdGlvbmFsJyk7XG52YXIgQXhpb3NFcnJvciA9IHJlcXVpcmUoJy4uL2NvcmUvQXhpb3NFcnJvcicpO1xudmFyIENhbmNlbGVkRXJyb3IgPSByZXF1aXJlKCcuLi9jYW5jZWwvQ2FuY2VsZWRFcnJvcicpO1xudmFyIHBhcnNlUHJvdG9jb2wgPSByZXF1aXJlKCcuLi9oZWxwZXJzL3BhcnNlUHJvdG9jb2wnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB4aHJBZGFwdGVyKGNvbmZpZykge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gZGlzcGF0Y2hYaHJSZXF1ZXN0KHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciByZXF1ZXN0RGF0YSA9IGNvbmZpZy5kYXRhO1xuICAgIHZhciByZXF1ZXN0SGVhZGVycyA9IGNvbmZpZy5oZWFkZXJzO1xuICAgIHZhciByZXNwb25zZVR5cGUgPSBjb25maWcucmVzcG9uc2VUeXBlO1xuICAgIHZhciBvbkNhbmNlbGVkO1xuICAgIGZ1bmN0aW9uIGRvbmUoKSB7XG4gICAgICBpZiAoY29uZmlnLmNhbmNlbFRva2VuKSB7XG4gICAgICAgIGNvbmZpZy5jYW5jZWxUb2tlbi51bnN1YnNjcmliZShvbkNhbmNlbGVkKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5zaWduYWwpIHtcbiAgICAgICAgY29uZmlnLnNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKCdhYm9ydCcsIG9uQ2FuY2VsZWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh1dGlscy5pc0Zvcm1EYXRhKHJlcXVlc3REYXRhKSAmJiB1dGlscy5pc1N0YW5kYXJkQnJvd3NlckVudigpKSB7XG4gICAgICBkZWxldGUgcmVxdWVzdEhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddOyAvLyBMZXQgdGhlIGJyb3dzZXIgc2V0IGl0XG4gICAgfVxuXG4gICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIC8vIEhUVFAgYmFzaWMgYXV0aGVudGljYXRpb25cbiAgICBpZiAoY29uZmlnLmF1dGgpIHtcbiAgICAgIHZhciB1c2VybmFtZSA9IGNvbmZpZy5hdXRoLnVzZXJuYW1lIHx8ICcnO1xuICAgICAgdmFyIHBhc3N3b3JkID0gY29uZmlnLmF1dGgucGFzc3dvcmQgPyB1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoY29uZmlnLmF1dGgucGFzc3dvcmQpKSA6ICcnO1xuICAgICAgcmVxdWVzdEhlYWRlcnMuQXV0aG9yaXphdGlvbiA9ICdCYXNpYyAnICsgYnRvYSh1c2VybmFtZSArICc6JyArIHBhc3N3b3JkKTtcbiAgICB9XG5cbiAgICB2YXIgZnVsbFBhdGggPSBidWlsZEZ1bGxQYXRoKGNvbmZpZy5iYXNlVVJMLCBjb25maWcudXJsKTtcblxuICAgIHJlcXVlc3Qub3Blbihjb25maWcubWV0aG9kLnRvVXBwZXJDYXNlKCksIGJ1aWxkVVJMKGZ1bGxQYXRoLCBjb25maWcucGFyYW1zLCBjb25maWcucGFyYW1zU2VyaWFsaXplciksIHRydWUpO1xuXG4gICAgLy8gU2V0IHRoZSByZXF1ZXN0IHRpbWVvdXQgaW4gTVNcbiAgICByZXF1ZXN0LnRpbWVvdXQgPSBjb25maWcudGltZW91dDtcblxuICAgIGZ1bmN0aW9uIG9ubG9hZGVuZCgpIHtcbiAgICAgIGlmICghcmVxdWVzdCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICAvLyBQcmVwYXJlIHRoZSByZXNwb25zZVxuICAgICAgdmFyIHJlc3BvbnNlSGVhZGVycyA9ICdnZXRBbGxSZXNwb25zZUhlYWRlcnMnIGluIHJlcXVlc3QgPyBwYXJzZUhlYWRlcnMocmVxdWVzdC5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSkgOiBudWxsO1xuICAgICAgdmFyIHJlc3BvbnNlRGF0YSA9ICFyZXNwb25zZVR5cGUgfHwgcmVzcG9uc2VUeXBlID09PSAndGV4dCcgfHwgIHJlc3BvbnNlVHlwZSA9PT0gJ2pzb24nID9cbiAgICAgICAgcmVxdWVzdC5yZXNwb25zZVRleHQgOiByZXF1ZXN0LnJlc3BvbnNlO1xuICAgICAgdmFyIHJlc3BvbnNlID0ge1xuICAgICAgICBkYXRhOiByZXNwb25zZURhdGEsXG4gICAgICAgIHN0YXR1czogcmVxdWVzdC5zdGF0dXMsXG4gICAgICAgIHN0YXR1c1RleHQ6IHJlcXVlc3Quc3RhdHVzVGV4dCxcbiAgICAgICAgaGVhZGVyczogcmVzcG9uc2VIZWFkZXJzLFxuICAgICAgICBjb25maWc6IGNvbmZpZyxcbiAgICAgICAgcmVxdWVzdDogcmVxdWVzdFxuICAgICAgfTtcblxuICAgICAgc2V0dGxlKGZ1bmN0aW9uIF9yZXNvbHZlKHZhbHVlKSB7XG4gICAgICAgIHJlc29sdmUodmFsdWUpO1xuICAgICAgICBkb25lKCk7XG4gICAgICB9LCBmdW5jdGlvbiBfcmVqZWN0KGVycikge1xuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgZG9uZSgpO1xuICAgICAgfSwgcmVzcG9uc2UpO1xuXG4gICAgICAvLyBDbGVhbiB1cCByZXF1ZXN0XG4gICAgICByZXF1ZXN0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoJ29ubG9hZGVuZCcgaW4gcmVxdWVzdCkge1xuICAgICAgLy8gVXNlIG9ubG9hZGVuZCBpZiBhdmFpbGFibGVcbiAgICAgIHJlcXVlc3Qub25sb2FkZW5kID0gb25sb2FkZW5kO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBMaXN0ZW4gZm9yIHJlYWR5IHN0YXRlIHRvIGVtdWxhdGUgb25sb2FkZW5kXG4gICAgICByZXF1ZXN0Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uIGhhbmRsZUxvYWQoKSB7XG4gICAgICAgIGlmICghcmVxdWVzdCB8fCByZXF1ZXN0LnJlYWR5U3RhdGUgIT09IDQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgcmVxdWVzdCBlcnJvcmVkIG91dCBhbmQgd2UgZGlkbid0IGdldCBhIHJlc3BvbnNlLCB0aGlzIHdpbGwgYmVcbiAgICAgICAgLy8gaGFuZGxlZCBieSBvbmVycm9yIGluc3RlYWRcbiAgICAgICAgLy8gV2l0aCBvbmUgZXhjZXB0aW9uOiByZXF1ZXN0IHRoYXQgdXNpbmcgZmlsZTogcHJvdG9jb2wsIG1vc3QgYnJvd3NlcnNcbiAgICAgICAgLy8gd2lsbCByZXR1cm4gc3RhdHVzIGFzIDAgZXZlbiB0aG91Z2ggaXQncyBhIHN1Y2Nlc3NmdWwgcmVxdWVzdFxuICAgICAgICBpZiAocmVxdWVzdC5zdGF0dXMgPT09IDAgJiYgIShyZXF1ZXN0LnJlc3BvbnNlVVJMICYmIHJlcXVlc3QucmVzcG9uc2VVUkwuaW5kZXhPZignZmlsZTonKSA9PT0gMCkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVhZHlzdGF0ZSBoYW5kbGVyIGlzIGNhbGxpbmcgYmVmb3JlIG9uZXJyb3Igb3Igb250aW1lb3V0IGhhbmRsZXJzLFxuICAgICAgICAvLyBzbyB3ZSBzaG91bGQgY2FsbCBvbmxvYWRlbmQgb24gdGhlIG5leHQgJ3RpY2snXG4gICAgICAgIHNldFRpbWVvdXQob25sb2FkZW5kKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIGJyb3dzZXIgcmVxdWVzdCBjYW5jZWxsYXRpb24gKGFzIG9wcG9zZWQgdG8gYSBtYW51YWwgY2FuY2VsbGF0aW9uKVxuICAgIHJlcXVlc3Qub25hYm9ydCA9IGZ1bmN0aW9uIGhhbmRsZUFib3J0KCkge1xuICAgICAgaWYgKCFyZXF1ZXN0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVqZWN0KG5ldyBBeGlvc0Vycm9yKCdSZXF1ZXN0IGFib3J0ZWQnLCBBeGlvc0Vycm9yLkVDT05OQUJPUlRFRCwgY29uZmlnLCByZXF1ZXN0KSk7XG5cbiAgICAgIC8vIENsZWFuIHVwIHJlcXVlc3RcbiAgICAgIHJlcXVlc3QgPSBudWxsO1xuICAgIH07XG5cbiAgICAvLyBIYW5kbGUgbG93IGxldmVsIG5ldHdvcmsgZXJyb3JzXG4gICAgcmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24gaGFuZGxlRXJyb3IoKSB7XG4gICAgICAvLyBSZWFsIGVycm9ycyBhcmUgaGlkZGVuIGZyb20gdXMgYnkgdGhlIGJyb3dzZXJcbiAgICAgIC8vIG9uZXJyb3Igc2hvdWxkIG9ubHkgZmlyZSBpZiBpdCdzIGEgbmV0d29yayBlcnJvclxuICAgICAgcmVqZWN0KG5ldyBBeGlvc0Vycm9yKCdOZXR3b3JrIEVycm9yJywgQXhpb3NFcnJvci5FUlJfTkVUV09SSywgY29uZmlnLCByZXF1ZXN0LCByZXF1ZXN0KSk7XG5cbiAgICAgIC8vIENsZWFuIHVwIHJlcXVlc3RcbiAgICAgIHJlcXVlc3QgPSBudWxsO1xuICAgIH07XG5cbiAgICAvLyBIYW5kbGUgdGltZW91dFxuICAgIHJlcXVlc3Qub250aW1lb3V0ID0gZnVuY3Rpb24gaGFuZGxlVGltZW91dCgpIHtcbiAgICAgIHZhciB0aW1lb3V0RXJyb3JNZXNzYWdlID0gY29uZmlnLnRpbWVvdXQgPyAndGltZW91dCBvZiAnICsgY29uZmlnLnRpbWVvdXQgKyAnbXMgZXhjZWVkZWQnIDogJ3RpbWVvdXQgZXhjZWVkZWQnO1xuICAgICAgdmFyIHRyYW5zaXRpb25hbCA9IGNvbmZpZy50cmFuc2l0aW9uYWwgfHwgdHJhbnNpdGlvbmFsRGVmYXVsdHM7XG4gICAgICBpZiAoY29uZmlnLnRpbWVvdXRFcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgdGltZW91dEVycm9yTWVzc2FnZSA9IGNvbmZpZy50aW1lb3V0RXJyb3JNZXNzYWdlO1xuICAgICAgfVxuICAgICAgcmVqZWN0KG5ldyBBeGlvc0Vycm9yKFxuICAgICAgICB0aW1lb3V0RXJyb3JNZXNzYWdlLFxuICAgICAgICB0cmFuc2l0aW9uYWwuY2xhcmlmeVRpbWVvdXRFcnJvciA/IEF4aW9zRXJyb3IuRVRJTUVET1VUIDogQXhpb3NFcnJvci5FQ09OTkFCT1JURUQsXG4gICAgICAgIGNvbmZpZyxcbiAgICAgICAgcmVxdWVzdCkpO1xuXG4gICAgICAvLyBDbGVhbiB1cCByZXF1ZXN0XG4gICAgICByZXF1ZXN0ID0gbnVsbDtcbiAgICB9O1xuXG4gICAgLy8gQWRkIHhzcmYgaGVhZGVyXG4gICAgLy8gVGhpcyBpcyBvbmx5IGRvbmUgaWYgcnVubmluZyBpbiBhIHN0YW5kYXJkIGJyb3dzZXIgZW52aXJvbm1lbnQuXG4gICAgLy8gU3BlY2lmaWNhbGx5IG5vdCBpZiB3ZSdyZSBpbiBhIHdlYiB3b3JrZXIsIG9yIHJlYWN0LW5hdGl2ZS5cbiAgICBpZiAodXRpbHMuaXNTdGFuZGFyZEJyb3dzZXJFbnYoKSkge1xuICAgICAgLy8gQWRkIHhzcmYgaGVhZGVyXG4gICAgICB2YXIgeHNyZlZhbHVlID0gKGNvbmZpZy53aXRoQ3JlZGVudGlhbHMgfHwgaXNVUkxTYW1lT3JpZ2luKGZ1bGxQYXRoKSkgJiYgY29uZmlnLnhzcmZDb29raWVOYW1lID9cbiAgICAgICAgY29va2llcy5yZWFkKGNvbmZpZy54c3JmQ29va2llTmFtZSkgOlxuICAgICAgICB1bmRlZmluZWQ7XG5cbiAgICAgIGlmICh4c3JmVmFsdWUpIHtcbiAgICAgICAgcmVxdWVzdEhlYWRlcnNbY29uZmlnLnhzcmZIZWFkZXJOYW1lXSA9IHhzcmZWYWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBBZGQgaGVhZGVycyB0byB0aGUgcmVxdWVzdFxuICAgIGlmICgnc2V0UmVxdWVzdEhlYWRlcicgaW4gcmVxdWVzdCkge1xuICAgICAgdXRpbHMuZm9yRWFjaChyZXF1ZXN0SGVhZGVycywgZnVuY3Rpb24gc2V0UmVxdWVzdEhlYWRlcih2YWwsIGtleSkge1xuICAgICAgICBpZiAodHlwZW9mIHJlcXVlc3REYXRhID09PSAndW5kZWZpbmVkJyAmJiBrZXkudG9Mb3dlckNhc2UoKSA9PT0gJ2NvbnRlbnQtdHlwZScpIHtcbiAgICAgICAgICAvLyBSZW1vdmUgQ29udGVudC1UeXBlIGlmIGRhdGEgaXMgdW5kZWZpbmVkXG4gICAgICAgICAgZGVsZXRlIHJlcXVlc3RIZWFkZXJzW2tleV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gT3RoZXJ3aXNlIGFkZCBoZWFkZXIgdG8gdGhlIHJlcXVlc3RcbiAgICAgICAgICByZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIoa2V5LCB2YWwpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBBZGQgd2l0aENyZWRlbnRpYWxzIHRvIHJlcXVlc3QgaWYgbmVlZGVkXG4gICAgaWYgKCF1dGlscy5pc1VuZGVmaW5lZChjb25maWcud2l0aENyZWRlbnRpYWxzKSkge1xuICAgICAgcmVxdWVzdC53aXRoQ3JlZGVudGlhbHMgPSAhIWNvbmZpZy53aXRoQ3JlZGVudGlhbHM7XG4gICAgfVxuXG4gICAgLy8gQWRkIHJlc3BvbnNlVHlwZSB0byByZXF1ZXN0IGlmIG5lZWRlZFxuICAgIGlmIChyZXNwb25zZVR5cGUgJiYgcmVzcG9uc2VUeXBlICE9PSAnanNvbicpIHtcbiAgICAgIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gY29uZmlnLnJlc3BvbnNlVHlwZTtcbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgcHJvZ3Jlc3MgaWYgbmVlZGVkXG4gICAgaWYgKHR5cGVvZiBjb25maWcub25Eb3dubG9hZFByb2dyZXNzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoJ3Byb2dyZXNzJywgY29uZmlnLm9uRG93bmxvYWRQcm9ncmVzcyk7XG4gICAgfVxuXG4gICAgLy8gTm90IGFsbCBicm93c2VycyBzdXBwb3J0IHVwbG9hZCBldmVudHNcbiAgICBpZiAodHlwZW9mIGNvbmZpZy5vblVwbG9hZFByb2dyZXNzID09PSAnZnVuY3Rpb24nICYmIHJlcXVlc3QudXBsb2FkKSB7XG4gICAgICByZXF1ZXN0LnVwbG9hZC5hZGRFdmVudExpc3RlbmVyKCdwcm9ncmVzcycsIGNvbmZpZy5vblVwbG9hZFByb2dyZXNzKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLmNhbmNlbFRva2VuIHx8IGNvbmZpZy5zaWduYWwpIHtcbiAgICAgIC8vIEhhbmRsZSBjYW5jZWxsYXRpb25cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBmdW5jLW5hbWVzXG4gICAgICBvbkNhbmNlbGVkID0gZnVuY3Rpb24oY2FuY2VsKSB7XG4gICAgICAgIGlmICghcmVxdWVzdCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZWplY3QoIWNhbmNlbCB8fCAoY2FuY2VsICYmIGNhbmNlbC50eXBlKSA/IG5ldyBDYW5jZWxlZEVycm9yKCkgOiBjYW5jZWwpO1xuICAgICAgICByZXF1ZXN0LmFib3J0KCk7XG4gICAgICAgIHJlcXVlc3QgPSBudWxsO1xuICAgICAgfTtcblxuICAgICAgY29uZmlnLmNhbmNlbFRva2VuICYmIGNvbmZpZy5jYW5jZWxUb2tlbi5zdWJzY3JpYmUob25DYW5jZWxlZCk7XG4gICAgICBpZiAoY29uZmlnLnNpZ25hbCkge1xuICAgICAgICBjb25maWcuc2lnbmFsLmFib3J0ZWQgPyBvbkNhbmNlbGVkKCkgOiBjb25maWcuc2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgb25DYW5jZWxlZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFyZXF1ZXN0RGF0YSkge1xuICAgICAgcmVxdWVzdERhdGEgPSBudWxsO1xuICAgIH1cblxuICAgIHZhciBwcm90b2NvbCA9IHBhcnNlUHJvdG9jb2woZnVsbFBhdGgpO1xuXG4gICAgaWYgKHByb3RvY29sICYmIFsgJ2h0dHAnLCAnaHR0cHMnLCAnZmlsZScgXS5pbmRleE9mKHByb3RvY29sKSA9PT0gLTEpIHtcbiAgICAgIHJlamVjdChuZXcgQXhpb3NFcnJvcignVW5zdXBwb3J0ZWQgcHJvdG9jb2wgJyArIHByb3RvY29sICsgJzonLCBBeGlvc0Vycm9yLkVSUl9CQURfUkVRVUVTVCwgY29uZmlnKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG5cbiAgICAvLyBTZW5kIHRoZSByZXF1ZXN0XG4gICAgcmVxdWVzdC5zZW5kKHJlcXVlc3REYXRhKTtcbiAgfSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgYmluZCA9IHJlcXVpcmUoJy4vaGVscGVycy9iaW5kJyk7XG52YXIgQXhpb3MgPSByZXF1aXJlKCcuL2NvcmUvQXhpb3MnKTtcbnZhciBtZXJnZUNvbmZpZyA9IHJlcXVpcmUoJy4vY29yZS9tZXJnZUNvbmZpZycpO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnLi9kZWZhdWx0cycpO1xuXG4vKipcbiAqIENyZWF0ZSBhbiBpbnN0YW5jZSBvZiBBeGlvc1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZWZhdWx0Q29uZmlnIFRoZSBkZWZhdWx0IGNvbmZpZyBmb3IgdGhlIGluc3RhbmNlXG4gKiBAcmV0dXJuIHtBeGlvc30gQSBuZXcgaW5zdGFuY2Ugb2YgQXhpb3NcbiAqL1xuZnVuY3Rpb24gY3JlYXRlSW5zdGFuY2UoZGVmYXVsdENvbmZpZykge1xuICB2YXIgY29udGV4dCA9IG5ldyBBeGlvcyhkZWZhdWx0Q29uZmlnKTtcbiAgdmFyIGluc3RhbmNlID0gYmluZChBeGlvcy5wcm90b3R5cGUucmVxdWVzdCwgY29udGV4dCk7XG5cbiAgLy8gQ29weSBheGlvcy5wcm90b3R5cGUgdG8gaW5zdGFuY2VcbiAgdXRpbHMuZXh0ZW5kKGluc3RhbmNlLCBBeGlvcy5wcm90b3R5cGUsIGNvbnRleHQpO1xuXG4gIC8vIENvcHkgY29udGV4dCB0byBpbnN0YW5jZVxuICB1dGlscy5leHRlbmQoaW5zdGFuY2UsIGNvbnRleHQpO1xuXG4gIC8vIEZhY3RvcnkgZm9yIGNyZWF0aW5nIG5ldyBpbnN0YW5jZXNcbiAgaW5zdGFuY2UuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlKGluc3RhbmNlQ29uZmlnKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUluc3RhbmNlKG1lcmdlQ29uZmlnKGRlZmF1bHRDb25maWcsIGluc3RhbmNlQ29uZmlnKSk7XG4gIH07XG5cbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG4vLyBDcmVhdGUgdGhlIGRlZmF1bHQgaW5zdGFuY2UgdG8gYmUgZXhwb3J0ZWRcbnZhciBheGlvcyA9IGNyZWF0ZUluc3RhbmNlKGRlZmF1bHRzKTtcblxuLy8gRXhwb3NlIEF4aW9zIGNsYXNzIHRvIGFsbG93IGNsYXNzIGluaGVyaXRhbmNlXG5heGlvcy5BeGlvcyA9IEF4aW9zO1xuXG4vLyBFeHBvc2UgQ2FuY2VsICYgQ2FuY2VsVG9rZW5cbmF4aW9zLkNhbmNlbGVkRXJyb3IgPSByZXF1aXJlKCcuL2NhbmNlbC9DYW5jZWxlZEVycm9yJyk7XG5heGlvcy5DYW5jZWxUb2tlbiA9IHJlcXVpcmUoJy4vY2FuY2VsL0NhbmNlbFRva2VuJyk7XG5heGlvcy5pc0NhbmNlbCA9IHJlcXVpcmUoJy4vY2FuY2VsL2lzQ2FuY2VsJyk7XG5heGlvcy5WRVJTSU9OID0gcmVxdWlyZSgnLi9lbnYvZGF0YScpLnZlcnNpb247XG5heGlvcy50b0Zvcm1EYXRhID0gcmVxdWlyZSgnLi9oZWxwZXJzL3RvRm9ybURhdGEnKTtcblxuLy8gRXhwb3NlIEF4aW9zRXJyb3IgY2xhc3NcbmF4aW9zLkF4aW9zRXJyb3IgPSByZXF1aXJlKCcuLi9saWIvY29yZS9BeGlvc0Vycm9yJyk7XG5cbi8vIGFsaWFzIGZvciBDYW5jZWxlZEVycm9yIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG5heGlvcy5DYW5jZWwgPSBheGlvcy5DYW5jZWxlZEVycm9yO1xuXG4vLyBFeHBvc2UgYWxsL3NwcmVhZFxuYXhpb3MuYWxsID0gZnVuY3Rpb24gYWxsKHByb21pc2VzKSB7XG4gIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcyk7XG59O1xuYXhpb3Muc3ByZWFkID0gcmVxdWlyZSgnLi9oZWxwZXJzL3NwcmVhZCcpO1xuXG4vLyBFeHBvc2UgaXNBeGlvc0Vycm9yXG5heGlvcy5pc0F4aW9zRXJyb3IgPSByZXF1aXJlKCcuL2hlbHBlcnMvaXNBeGlvc0Vycm9yJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gYXhpb3M7XG5cbi8vIEFsbG93IHVzZSBvZiBkZWZhdWx0IGltcG9ydCBzeW50YXggaW4gVHlwZVNjcmlwdFxubW9kdWxlLmV4cG9ydHMuZGVmYXVsdCA9IGF4aW9zO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ2FuY2VsZWRFcnJvciA9IHJlcXVpcmUoJy4vQ2FuY2VsZWRFcnJvcicpO1xuXG4vKipcbiAqIEEgYENhbmNlbFRva2VuYCBpcyBhbiBvYmplY3QgdGhhdCBjYW4gYmUgdXNlZCB0byByZXF1ZXN0IGNhbmNlbGxhdGlvbiBvZiBhbiBvcGVyYXRpb24uXG4gKlxuICogQGNsYXNzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBleGVjdXRvciBUaGUgZXhlY3V0b3IgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIENhbmNlbFRva2VuKGV4ZWN1dG9yKSB7XG4gIGlmICh0eXBlb2YgZXhlY3V0b3IgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdleGVjdXRvciBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XG4gIH1cblxuICB2YXIgcmVzb2x2ZVByb21pc2U7XG5cbiAgdGhpcy5wcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gcHJvbWlzZUV4ZWN1dG9yKHJlc29sdmUpIHtcbiAgICByZXNvbHZlUHJvbWlzZSA9IHJlc29sdmU7XG4gIH0pO1xuXG4gIHZhciB0b2tlbiA9IHRoaXM7XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcbiAgdGhpcy5wcm9taXNlLnRoZW4oZnVuY3Rpb24oY2FuY2VsKSB7XG4gICAgaWYgKCF0b2tlbi5fbGlzdGVuZXJzKSByZXR1cm47XG5cbiAgICB2YXIgaTtcbiAgICB2YXIgbCA9IHRva2VuLl9saXN0ZW5lcnMubGVuZ3RoO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgdG9rZW4uX2xpc3RlbmVyc1tpXShjYW5jZWwpO1xuICAgIH1cbiAgICB0b2tlbi5fbGlzdGVuZXJzID0gbnVsbDtcbiAgfSk7XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcbiAgdGhpcy5wcm9taXNlLnRoZW4gPSBmdW5jdGlvbihvbmZ1bGZpbGxlZCkge1xuICAgIHZhciBfcmVzb2x2ZTtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZnVuYy1uYW1lc1xuICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgdG9rZW4uc3Vic2NyaWJlKHJlc29sdmUpO1xuICAgICAgX3Jlc29sdmUgPSByZXNvbHZlO1xuICAgIH0pLnRoZW4ob25mdWxmaWxsZWQpO1xuXG4gICAgcHJvbWlzZS5jYW5jZWwgPSBmdW5jdGlvbiByZWplY3QoKSB7XG4gICAgICB0b2tlbi51bnN1YnNjcmliZShfcmVzb2x2ZSk7XG4gICAgfTtcblxuICAgIHJldHVybiBwcm9taXNlO1xuICB9O1xuXG4gIGV4ZWN1dG9yKGZ1bmN0aW9uIGNhbmNlbChtZXNzYWdlKSB7XG4gICAgaWYgKHRva2VuLnJlYXNvbikge1xuICAgICAgLy8gQ2FuY2VsbGF0aW9uIGhhcyBhbHJlYWR5IGJlZW4gcmVxdWVzdGVkXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdG9rZW4ucmVhc29uID0gbmV3IENhbmNlbGVkRXJyb3IobWVzc2FnZSk7XG4gICAgcmVzb2x2ZVByb21pc2UodG9rZW4ucmVhc29uKTtcbiAgfSk7XG59XG5cbi8qKlxuICogVGhyb3dzIGEgYENhbmNlbGVkRXJyb3JgIGlmIGNhbmNlbGxhdGlvbiBoYXMgYmVlbiByZXF1ZXN0ZWQuXG4gKi9cbkNhbmNlbFRva2VuLnByb3RvdHlwZS50aHJvd0lmUmVxdWVzdGVkID0gZnVuY3Rpb24gdGhyb3dJZlJlcXVlc3RlZCgpIHtcbiAgaWYgKHRoaXMucmVhc29uKSB7XG4gICAgdGhyb3cgdGhpcy5yZWFzb247XG4gIH1cbn07XG5cbi8qKlxuICogU3Vic2NyaWJlIHRvIHRoZSBjYW5jZWwgc2lnbmFsXG4gKi9cblxuQ2FuY2VsVG9rZW4ucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIHN1YnNjcmliZShsaXN0ZW5lcikge1xuICBpZiAodGhpcy5yZWFzb24pIHtcbiAgICBsaXN0ZW5lcih0aGlzLnJlYXNvbik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHRoaXMuX2xpc3RlbmVycykge1xuICAgIHRoaXMuX2xpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9saXN0ZW5lcnMgPSBbbGlzdGVuZXJdO1xuICB9XG59O1xuXG4vKipcbiAqIFVuc3Vic2NyaWJlIGZyb20gdGhlIGNhbmNlbCBzaWduYWxcbiAqL1xuXG5DYW5jZWxUb2tlbi5wcm90b3R5cGUudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiB1bnN1YnNjcmliZShsaXN0ZW5lcikge1xuICBpZiAoIXRoaXMuX2xpc3RlbmVycykge1xuICAgIHJldHVybjtcbiAgfVxuICB2YXIgaW5kZXggPSB0aGlzLl9saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICB0aGlzLl9saXN0ZW5lcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXR1cm5zIGFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIGEgbmV3IGBDYW5jZWxUb2tlbmAgYW5kIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsXG4gKiBjYW5jZWxzIHRoZSBgQ2FuY2VsVG9rZW5gLlxuICovXG5DYW5jZWxUb2tlbi5zb3VyY2UgPSBmdW5jdGlvbiBzb3VyY2UoKSB7XG4gIHZhciBjYW5jZWw7XG4gIHZhciB0b2tlbiA9IG5ldyBDYW5jZWxUb2tlbihmdW5jdGlvbiBleGVjdXRvcihjKSB7XG4gICAgY2FuY2VsID0gYztcbiAgfSk7XG4gIHJldHVybiB7XG4gICAgdG9rZW46IHRva2VuLFxuICAgIGNhbmNlbDogY2FuY2VsXG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhbmNlbFRva2VuO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQXhpb3NFcnJvciA9IHJlcXVpcmUoJy4uL2NvcmUvQXhpb3NFcnJvcicpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBBIGBDYW5jZWxlZEVycm9yYCBpcyBhbiBvYmplY3QgdGhhdCBpcyB0aHJvd24gd2hlbiBhbiBvcGVyYXRpb24gaXMgY2FuY2VsZWQuXG4gKlxuICogQGNsYXNzXG4gKiBAcGFyYW0ge3N0cmluZz19IG1lc3NhZ2UgVGhlIG1lc3NhZ2UuXG4gKi9cbmZ1bmN0aW9uIENhbmNlbGVkRXJyb3IobWVzc2FnZSkge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZXEtbnVsbCxlcWVxZXFcbiAgQXhpb3NFcnJvci5jYWxsKHRoaXMsIG1lc3NhZ2UgPT0gbnVsbCA/ICdjYW5jZWxlZCcgOiBtZXNzYWdlLCBBeGlvc0Vycm9yLkVSUl9DQU5DRUxFRCk7XG4gIHRoaXMubmFtZSA9ICdDYW5jZWxlZEVycm9yJztcbn1cblxudXRpbHMuaW5oZXJpdHMoQ2FuY2VsZWRFcnJvciwgQXhpb3NFcnJvciwge1xuICBfX0NBTkNFTF9fOiB0cnVlXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYW5jZWxlZEVycm9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQ2FuY2VsKHZhbHVlKSB7XG4gIHJldHVybiAhISh2YWx1ZSAmJiB2YWx1ZS5fX0NBTkNFTF9fKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vLi4vdXRpbHMnKTtcbnZhciBidWlsZFVSTCA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvYnVpbGRVUkwnKTtcbnZhciBJbnRlcmNlcHRvck1hbmFnZXIgPSByZXF1aXJlKCcuL0ludGVyY2VwdG9yTWFuYWdlcicpO1xudmFyIGRpc3BhdGNoUmVxdWVzdCA9IHJlcXVpcmUoJy4vZGlzcGF0Y2hSZXF1ZXN0Jyk7XG52YXIgbWVyZ2VDb25maWcgPSByZXF1aXJlKCcuL21lcmdlQ29uZmlnJyk7XG52YXIgYnVpbGRGdWxsUGF0aCA9IHJlcXVpcmUoJy4vYnVpbGRGdWxsUGF0aCcpO1xudmFyIHZhbGlkYXRvciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvdmFsaWRhdG9yJyk7XG5cbnZhciB2YWxpZGF0b3JzID0gdmFsaWRhdG9yLnZhbGlkYXRvcnM7XG4vKipcbiAqIENyZWF0ZSBhIG5ldyBpbnN0YW5jZSBvZiBBeGlvc1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnN0YW5jZUNvbmZpZyBUaGUgZGVmYXVsdCBjb25maWcgZm9yIHRoZSBpbnN0YW5jZVxuICovXG5mdW5jdGlvbiBBeGlvcyhpbnN0YW5jZUNvbmZpZykge1xuICB0aGlzLmRlZmF1bHRzID0gaW5zdGFuY2VDb25maWc7XG4gIHRoaXMuaW50ZXJjZXB0b3JzID0ge1xuICAgIHJlcXVlc3Q6IG5ldyBJbnRlcmNlcHRvck1hbmFnZXIoKSxcbiAgICByZXNwb25zZTogbmV3IEludGVyY2VwdG9yTWFuYWdlcigpXG4gIH07XG59XG5cbi8qKlxuICogRGlzcGF0Y2ggYSByZXF1ZXN0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyBUaGUgY29uZmlnIHNwZWNpZmljIGZvciB0aGlzIHJlcXVlc3QgKG1lcmdlZCB3aXRoIHRoaXMuZGVmYXVsdHMpXG4gKi9cbkF4aW9zLnByb3RvdHlwZS5yZXF1ZXN0ID0gZnVuY3Rpb24gcmVxdWVzdChjb25maWdPclVybCwgY29uZmlnKSB7XG4gIC8qZXNsaW50IG5vLXBhcmFtLXJlYXNzaWduOjAqL1xuICAvLyBBbGxvdyBmb3IgYXhpb3MoJ2V4YW1wbGUvdXJsJ1ssIGNvbmZpZ10pIGEgbGEgZmV0Y2ggQVBJXG4gIGlmICh0eXBlb2YgY29uZmlnT3JVcmwgPT09ICdzdHJpbmcnKSB7XG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIGNvbmZpZy51cmwgPSBjb25maWdPclVybDtcbiAgfSBlbHNlIHtcbiAgICBjb25maWcgPSBjb25maWdPclVybCB8fCB7fTtcbiAgfVxuXG4gIGNvbmZpZyA9IG1lcmdlQ29uZmlnKHRoaXMuZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgLy8gU2V0IGNvbmZpZy5tZXRob2RcbiAgaWYgKGNvbmZpZy5tZXRob2QpIHtcbiAgICBjb25maWcubWV0aG9kID0gY29uZmlnLm1ldGhvZC50b0xvd2VyQ2FzZSgpO1xuICB9IGVsc2UgaWYgKHRoaXMuZGVmYXVsdHMubWV0aG9kKSB7XG4gICAgY29uZmlnLm1ldGhvZCA9IHRoaXMuZGVmYXVsdHMubWV0aG9kLnRvTG93ZXJDYXNlKCk7XG4gIH0gZWxzZSB7XG4gICAgY29uZmlnLm1ldGhvZCA9ICdnZXQnO1xuICB9XG5cbiAgdmFyIHRyYW5zaXRpb25hbCA9IGNvbmZpZy50cmFuc2l0aW9uYWw7XG5cbiAgaWYgKHRyYW5zaXRpb25hbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdmFsaWRhdG9yLmFzc2VydE9wdGlvbnModHJhbnNpdGlvbmFsLCB7XG4gICAgICBzaWxlbnRKU09OUGFyc2luZzogdmFsaWRhdG9ycy50cmFuc2l0aW9uYWwodmFsaWRhdG9ycy5ib29sZWFuKSxcbiAgICAgIGZvcmNlZEpTT05QYXJzaW5nOiB2YWxpZGF0b3JzLnRyYW5zaXRpb25hbCh2YWxpZGF0b3JzLmJvb2xlYW4pLFxuICAgICAgY2xhcmlmeVRpbWVvdXRFcnJvcjogdmFsaWRhdG9ycy50cmFuc2l0aW9uYWwodmFsaWRhdG9ycy5ib29sZWFuKVxuICAgIH0sIGZhbHNlKTtcbiAgfVxuXG4gIC8vIGZpbHRlciBvdXQgc2tpcHBlZCBpbnRlcmNlcHRvcnNcbiAgdmFyIHJlcXVlc3RJbnRlcmNlcHRvckNoYWluID0gW107XG4gIHZhciBzeW5jaHJvbm91c1JlcXVlc3RJbnRlcmNlcHRvcnMgPSB0cnVlO1xuICB0aGlzLmludGVyY2VwdG9ycy5yZXF1ZXN0LmZvckVhY2goZnVuY3Rpb24gdW5zaGlmdFJlcXVlc3RJbnRlcmNlcHRvcnMoaW50ZXJjZXB0b3IpIHtcbiAgICBpZiAodHlwZW9mIGludGVyY2VwdG9yLnJ1bldoZW4gPT09ICdmdW5jdGlvbicgJiYgaW50ZXJjZXB0b3IucnVuV2hlbihjb25maWcpID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN5bmNocm9ub3VzUmVxdWVzdEludGVyY2VwdG9ycyA9IHN5bmNocm9ub3VzUmVxdWVzdEludGVyY2VwdG9ycyAmJiBpbnRlcmNlcHRvci5zeW5jaHJvbm91cztcblxuICAgIHJlcXVlc3RJbnRlcmNlcHRvckNoYWluLnVuc2hpZnQoaW50ZXJjZXB0b3IuZnVsZmlsbGVkLCBpbnRlcmNlcHRvci5yZWplY3RlZCk7XG4gIH0pO1xuXG4gIHZhciByZXNwb25zZUludGVyY2VwdG9yQ2hhaW4gPSBbXTtcbiAgdGhpcy5pbnRlcmNlcHRvcnMucmVzcG9uc2UuZm9yRWFjaChmdW5jdGlvbiBwdXNoUmVzcG9uc2VJbnRlcmNlcHRvcnMoaW50ZXJjZXB0b3IpIHtcbiAgICByZXNwb25zZUludGVyY2VwdG9yQ2hhaW4ucHVzaChpbnRlcmNlcHRvci5mdWxmaWxsZWQsIGludGVyY2VwdG9yLnJlamVjdGVkKTtcbiAgfSk7XG5cbiAgdmFyIHByb21pc2U7XG5cbiAgaWYgKCFzeW5jaHJvbm91c1JlcXVlc3RJbnRlcmNlcHRvcnMpIHtcbiAgICB2YXIgY2hhaW4gPSBbZGlzcGF0Y2hSZXF1ZXN0LCB1bmRlZmluZWRdO1xuXG4gICAgQXJyYXkucHJvdG90eXBlLnVuc2hpZnQuYXBwbHkoY2hhaW4sIHJlcXVlc3RJbnRlcmNlcHRvckNoYWluKTtcbiAgICBjaGFpbiA9IGNoYWluLmNvbmNhdChyZXNwb25zZUludGVyY2VwdG9yQ2hhaW4pO1xuXG4gICAgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZShjb25maWcpO1xuICAgIHdoaWxlIChjaGFpbi5sZW5ndGgpIHtcbiAgICAgIHByb21pc2UgPSBwcm9taXNlLnRoZW4oY2hhaW4uc2hpZnQoKSwgY2hhaW4uc2hpZnQoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuXG4gIHZhciBuZXdDb25maWcgPSBjb25maWc7XG4gIHdoaWxlIChyZXF1ZXN0SW50ZXJjZXB0b3JDaGFpbi5sZW5ndGgpIHtcbiAgICB2YXIgb25GdWxmaWxsZWQgPSByZXF1ZXN0SW50ZXJjZXB0b3JDaGFpbi5zaGlmdCgpO1xuICAgIHZhciBvblJlamVjdGVkID0gcmVxdWVzdEludGVyY2VwdG9yQ2hhaW4uc2hpZnQoKTtcbiAgICB0cnkge1xuICAgICAgbmV3Q29uZmlnID0gb25GdWxmaWxsZWQobmV3Q29uZmlnKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgb25SZWplY3RlZChlcnJvcik7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICB0cnkge1xuICAgIHByb21pc2UgPSBkaXNwYXRjaFJlcXVlc3QobmV3Q29uZmlnKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICB9XG5cbiAgd2hpbGUgKHJlc3BvbnNlSW50ZXJjZXB0b3JDaGFpbi5sZW5ndGgpIHtcbiAgICBwcm9taXNlID0gcHJvbWlzZS50aGVuKHJlc3BvbnNlSW50ZXJjZXB0b3JDaGFpbi5zaGlmdCgpLCByZXNwb25zZUludGVyY2VwdG9yQ2hhaW4uc2hpZnQoKSk7XG4gIH1cblxuICByZXR1cm4gcHJvbWlzZTtcbn07XG5cbkF4aW9zLnByb3RvdHlwZS5nZXRVcmkgPSBmdW5jdGlvbiBnZXRVcmkoY29uZmlnKSB7XG4gIGNvbmZpZyA9IG1lcmdlQ29uZmlnKHRoaXMuZGVmYXVsdHMsIGNvbmZpZyk7XG4gIHZhciBmdWxsUGF0aCA9IGJ1aWxkRnVsbFBhdGgoY29uZmlnLmJhc2VVUkwsIGNvbmZpZy51cmwpO1xuICByZXR1cm4gYnVpbGRVUkwoZnVsbFBhdGgsIGNvbmZpZy5wYXJhbXMsIGNvbmZpZy5wYXJhbXNTZXJpYWxpemVyKTtcbn07XG5cbi8vIFByb3ZpZGUgYWxpYXNlcyBmb3Igc3VwcG9ydGVkIHJlcXVlc3QgbWV0aG9kc1xudXRpbHMuZm9yRWFjaChbJ2RlbGV0ZScsICdnZXQnLCAnaGVhZCcsICdvcHRpb25zJ10sIGZ1bmN0aW9uIGZvckVhY2hNZXRob2ROb0RhdGEobWV0aG9kKSB7XG4gIC8qZXNsaW50IGZ1bmMtbmFtZXM6MCovXG4gIEF4aW9zLnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24odXJsLCBjb25maWcpIHtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0KG1lcmdlQ29uZmlnKGNvbmZpZyB8fCB7fSwge1xuICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICB1cmw6IHVybCxcbiAgICAgIGRhdGE6IChjb25maWcgfHwge30pLmRhdGFcbiAgICB9KSk7XG4gIH07XG59KTtcblxudXRpbHMuZm9yRWFjaChbJ3Bvc3QnLCAncHV0JywgJ3BhdGNoJ10sIGZ1bmN0aW9uIGZvckVhY2hNZXRob2RXaXRoRGF0YShtZXRob2QpIHtcbiAgLyplc2xpbnQgZnVuYy1uYW1lczowKi9cblxuICBmdW5jdGlvbiBnZW5lcmF0ZUhUVFBNZXRob2QoaXNGb3JtKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGh0dHBNZXRob2QodXJsLCBkYXRhLCBjb25maWcpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlcXVlc3QobWVyZ2VDb25maWcoY29uZmlnIHx8IHt9LCB7XG4gICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICBoZWFkZXJzOiBpc0Zvcm0gPyB7XG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdtdWx0aXBhcnQvZm9ybS1kYXRhJ1xuICAgICAgICB9IDoge30sXG4gICAgICAgIHVybDogdXJsLFxuICAgICAgICBkYXRhOiBkYXRhXG4gICAgICB9KSk7XG4gICAgfTtcbiAgfVxuXG4gIEF4aW9zLnByb3RvdHlwZVttZXRob2RdID0gZ2VuZXJhdGVIVFRQTWV0aG9kKCk7XG5cbiAgQXhpb3MucHJvdG90eXBlW21ldGhvZCArICdGb3JtJ10gPSBnZW5lcmF0ZUhUVFBNZXRob2QodHJ1ZSk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBeGlvcztcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBDcmVhdGUgYW4gRXJyb3Igd2l0aCB0aGUgc3BlY2lmaWVkIG1lc3NhZ2UsIGNvbmZpZywgZXJyb3IgY29kZSwgcmVxdWVzdCBhbmQgcmVzcG9uc2UuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgVGhlIGVycm9yIG1lc3NhZ2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvZGVdIFRoZSBlcnJvciBjb2RlIChmb3IgZXhhbXBsZSwgJ0VDT05OQUJPUlRFRCcpLlxuICogQHBhcmFtIHtPYmplY3R9IFtjb25maWddIFRoZSBjb25maWcuXG4gKiBAcGFyYW0ge09iamVjdH0gW3JlcXVlc3RdIFRoZSByZXF1ZXN0LlxuICogQHBhcmFtIHtPYmplY3R9IFtyZXNwb25zZV0gVGhlIHJlc3BvbnNlLlxuICogQHJldHVybnMge0Vycm9yfSBUaGUgY3JlYXRlZCBlcnJvci5cbiAqL1xuZnVuY3Rpb24gQXhpb3NFcnJvcihtZXNzYWdlLCBjb2RlLCBjb25maWcsIHJlcXVlc3QsIHJlc3BvbnNlKSB7XG4gIEVycm9yLmNhbGwodGhpcyk7XG4gIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gIHRoaXMubmFtZSA9ICdBeGlvc0Vycm9yJztcbiAgY29kZSAmJiAodGhpcy5jb2RlID0gY29kZSk7XG4gIGNvbmZpZyAmJiAodGhpcy5jb25maWcgPSBjb25maWcpO1xuICByZXF1ZXN0ICYmICh0aGlzLnJlcXVlc3QgPSByZXF1ZXN0KTtcbiAgcmVzcG9uc2UgJiYgKHRoaXMucmVzcG9uc2UgPSByZXNwb25zZSk7XG59XG5cbnV0aWxzLmluaGVyaXRzKEF4aW9zRXJyb3IsIEVycm9yLCB7XG4gIHRvSlNPTjogZnVuY3Rpb24gdG9KU09OKCkge1xuICAgIHJldHVybiB7XG4gICAgICAvLyBTdGFuZGFyZFxuICAgICAgbWVzc2FnZTogdGhpcy5tZXNzYWdlLFxuICAgICAgbmFtZTogdGhpcy5uYW1lLFxuICAgICAgLy8gTWljcm9zb2Z0XG4gICAgICBkZXNjcmlwdGlvbjogdGhpcy5kZXNjcmlwdGlvbixcbiAgICAgIG51bWJlcjogdGhpcy5udW1iZXIsXG4gICAgICAvLyBNb3ppbGxhXG4gICAgICBmaWxlTmFtZTogdGhpcy5maWxlTmFtZSxcbiAgICAgIGxpbmVOdW1iZXI6IHRoaXMubGluZU51bWJlcixcbiAgICAgIGNvbHVtbk51bWJlcjogdGhpcy5jb2x1bW5OdW1iZXIsXG4gICAgICBzdGFjazogdGhpcy5zdGFjayxcbiAgICAgIC8vIEF4aW9zXG4gICAgICBjb25maWc6IHRoaXMuY29uZmlnLFxuICAgICAgY29kZTogdGhpcy5jb2RlLFxuICAgICAgc3RhdHVzOiB0aGlzLnJlc3BvbnNlICYmIHRoaXMucmVzcG9uc2Uuc3RhdHVzID8gdGhpcy5yZXNwb25zZS5zdGF0dXMgOiBudWxsXG4gICAgfTtcbiAgfVxufSk7XG5cbnZhciBwcm90b3R5cGUgPSBBeGlvc0Vycm9yLnByb3RvdHlwZTtcbnZhciBkZXNjcmlwdG9ycyA9IHt9O1xuXG5bXG4gICdFUlJfQkFEX09QVElPTl9WQUxVRScsXG4gICdFUlJfQkFEX09QVElPTicsXG4gICdFQ09OTkFCT1JURUQnLFxuICAnRVRJTUVET1VUJyxcbiAgJ0VSUl9ORVRXT1JLJyxcbiAgJ0VSUl9GUl9UT09fTUFOWV9SRURJUkVDVFMnLFxuICAnRVJSX0RFUFJFQ0FURUQnLFxuICAnRVJSX0JBRF9SRVNQT05TRScsXG4gICdFUlJfQkFEX1JFUVVFU1QnLFxuICAnRVJSX0NBTkNFTEVEJ1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcbl0uZm9yRWFjaChmdW5jdGlvbihjb2RlKSB7XG4gIGRlc2NyaXB0b3JzW2NvZGVdID0ge3ZhbHVlOiBjb2RlfTtcbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhBeGlvc0Vycm9yLCBkZXNjcmlwdG9ycyk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkocHJvdG90eXBlLCAnaXNBeGlvc0Vycm9yJywge3ZhbHVlOiB0cnVlfSk7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBmdW5jLW5hbWVzXG5BeGlvc0Vycm9yLmZyb20gPSBmdW5jdGlvbihlcnJvciwgY29kZSwgY29uZmlnLCByZXF1ZXN0LCByZXNwb25zZSwgY3VzdG9tUHJvcHMpIHtcbiAgdmFyIGF4aW9zRXJyb3IgPSBPYmplY3QuY3JlYXRlKHByb3RvdHlwZSk7XG5cbiAgdXRpbHMudG9GbGF0T2JqZWN0KGVycm9yLCBheGlvc0Vycm9yLCBmdW5jdGlvbiBmaWx0ZXIob2JqKSB7XG4gICAgcmV0dXJuIG9iaiAhPT0gRXJyb3IucHJvdG90eXBlO1xuICB9KTtcblxuICBBeGlvc0Vycm9yLmNhbGwoYXhpb3NFcnJvciwgZXJyb3IubWVzc2FnZSwgY29kZSwgY29uZmlnLCByZXF1ZXN0LCByZXNwb25zZSk7XG5cbiAgYXhpb3NFcnJvci5uYW1lID0gZXJyb3IubmFtZTtcblxuICBjdXN0b21Qcm9wcyAmJiBPYmplY3QuYXNzaWduKGF4aW9zRXJyb3IsIGN1c3RvbVByb3BzKTtcblxuICByZXR1cm4gYXhpb3NFcnJvcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXhpb3NFcnJvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi8uLi91dGlscycpO1xuXG5mdW5jdGlvbiBJbnRlcmNlcHRvck1hbmFnZXIoKSB7XG4gIHRoaXMuaGFuZGxlcnMgPSBbXTtcbn1cblxuLyoqXG4gKiBBZGQgYSBuZXcgaW50ZXJjZXB0b3IgdG8gdGhlIHN0YWNrXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVsZmlsbGVkIFRoZSBmdW5jdGlvbiB0byBoYW5kbGUgYHRoZW5gIGZvciBhIGBQcm9taXNlYFxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVqZWN0ZWQgVGhlIGZ1bmN0aW9uIHRvIGhhbmRsZSBgcmVqZWN0YCBmb3IgYSBgUHJvbWlzZWBcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IEFuIElEIHVzZWQgdG8gcmVtb3ZlIGludGVyY2VwdG9yIGxhdGVyXG4gKi9cbkludGVyY2VwdG9yTWFuYWdlci5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24gdXNlKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIG9wdGlvbnMpIHtcbiAgdGhpcy5oYW5kbGVycy5wdXNoKHtcbiAgICBmdWxmaWxsZWQ6IGZ1bGZpbGxlZCxcbiAgICByZWplY3RlZDogcmVqZWN0ZWQsXG4gICAgc3luY2hyb25vdXM6IG9wdGlvbnMgPyBvcHRpb25zLnN5bmNocm9ub3VzIDogZmFsc2UsXG4gICAgcnVuV2hlbjogb3B0aW9ucyA/IG9wdGlvbnMucnVuV2hlbiA6IG51bGxcbiAgfSk7XG4gIHJldHVybiB0aGlzLmhhbmRsZXJzLmxlbmd0aCAtIDE7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbiBpbnRlcmNlcHRvciBmcm9tIHRoZSBzdGFja1xuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBpZCBUaGUgSUQgdGhhdCB3YXMgcmV0dXJuZWQgYnkgYHVzZWBcbiAqL1xuSW50ZXJjZXB0b3JNYW5hZ2VyLnByb3RvdHlwZS5lamVjdCA9IGZ1bmN0aW9uIGVqZWN0KGlkKSB7XG4gIGlmICh0aGlzLmhhbmRsZXJzW2lkXSkge1xuICAgIHRoaXMuaGFuZGxlcnNbaWRdID0gbnVsbDtcbiAgfVxufTtcblxuLyoqXG4gKiBJdGVyYXRlIG92ZXIgYWxsIHRoZSByZWdpc3RlcmVkIGludGVyY2VwdG9yc1xuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHBhcnRpY3VsYXJseSB1c2VmdWwgZm9yIHNraXBwaW5nIG92ZXIgYW55XG4gKiBpbnRlcmNlcHRvcnMgdGhhdCBtYXkgaGF2ZSBiZWNvbWUgYG51bGxgIGNhbGxpbmcgYGVqZWN0YC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCBpbnRlcmNlcHRvclxuICovXG5JbnRlcmNlcHRvck1hbmFnZXIucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiBmb3JFYWNoKGZuKSB7XG4gIHV0aWxzLmZvckVhY2godGhpcy5oYW5kbGVycywgZnVuY3Rpb24gZm9yRWFjaEhhbmRsZXIoaCkge1xuICAgIGlmIChoICE9PSBudWxsKSB7XG4gICAgICBmbihoKTtcbiAgICB9XG4gIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcmNlcHRvck1hbmFnZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpc0Fic29sdXRlVVJMID0gcmVxdWlyZSgnLi4vaGVscGVycy9pc0Fic29sdXRlVVJMJyk7XG52YXIgY29tYmluZVVSTHMgPSByZXF1aXJlKCcuLi9oZWxwZXJzL2NvbWJpbmVVUkxzJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBVUkwgYnkgY29tYmluaW5nIHRoZSBiYXNlVVJMIHdpdGggdGhlIHJlcXVlc3RlZFVSTCxcbiAqIG9ubHkgd2hlbiB0aGUgcmVxdWVzdGVkVVJMIGlzIG5vdCBhbHJlYWR5IGFuIGFic29sdXRlIFVSTC5cbiAqIElmIHRoZSByZXF1ZXN0VVJMIGlzIGFic29sdXRlLCB0aGlzIGZ1bmN0aW9uIHJldHVybnMgdGhlIHJlcXVlc3RlZFVSTCB1bnRvdWNoZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGJhc2VVUkwgVGhlIGJhc2UgVVJMXG4gKiBAcGFyYW0ge3N0cmluZ30gcmVxdWVzdGVkVVJMIEFic29sdXRlIG9yIHJlbGF0aXZlIFVSTCB0byBjb21iaW5lXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgY29tYmluZWQgZnVsbCBwYXRoXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYnVpbGRGdWxsUGF0aChiYXNlVVJMLCByZXF1ZXN0ZWRVUkwpIHtcbiAgaWYgKGJhc2VVUkwgJiYgIWlzQWJzb2x1dGVVUkwocmVxdWVzdGVkVVJMKSkge1xuICAgIHJldHVybiBjb21iaW5lVVJMcyhiYXNlVVJMLCByZXF1ZXN0ZWRVUkwpO1xuICB9XG4gIHJldHVybiByZXF1ZXN0ZWRVUkw7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLy4uL3V0aWxzJyk7XG52YXIgdHJhbnNmb3JtRGF0YSA9IHJlcXVpcmUoJy4vdHJhbnNmb3JtRGF0YScpO1xudmFyIGlzQ2FuY2VsID0gcmVxdWlyZSgnLi4vY2FuY2VsL2lzQ2FuY2VsJyk7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCcuLi9kZWZhdWx0cycpO1xudmFyIENhbmNlbGVkRXJyb3IgPSByZXF1aXJlKCcuLi9jYW5jZWwvQ2FuY2VsZWRFcnJvcicpO1xuXG4vKipcbiAqIFRocm93cyBhIGBDYW5jZWxlZEVycm9yYCBpZiBjYW5jZWxsYXRpb24gaGFzIGJlZW4gcmVxdWVzdGVkLlxuICovXG5mdW5jdGlvbiB0aHJvd0lmQ2FuY2VsbGF0aW9uUmVxdWVzdGVkKGNvbmZpZykge1xuICBpZiAoY29uZmlnLmNhbmNlbFRva2VuKSB7XG4gICAgY29uZmlnLmNhbmNlbFRva2VuLnRocm93SWZSZXF1ZXN0ZWQoKTtcbiAgfVxuXG4gIGlmIChjb25maWcuc2lnbmFsICYmIGNvbmZpZy5zaWduYWwuYWJvcnRlZCkge1xuICAgIHRocm93IG5ldyBDYW5jZWxlZEVycm9yKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNwYXRjaCBhIHJlcXVlc3QgdG8gdGhlIHNlcnZlciB1c2luZyB0aGUgY29uZmlndXJlZCBhZGFwdGVyLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgVGhlIGNvbmZpZyB0aGF0IGlzIHRvIGJlIHVzZWQgZm9yIHRoZSByZXF1ZXN0XG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gVGhlIFByb21pc2UgdG8gYmUgZnVsZmlsbGVkXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGlzcGF0Y2hSZXF1ZXN0KGNvbmZpZykge1xuICB0aHJvd0lmQ2FuY2VsbGF0aW9uUmVxdWVzdGVkKGNvbmZpZyk7XG5cbiAgLy8gRW5zdXJlIGhlYWRlcnMgZXhpc3RcbiAgY29uZmlnLmhlYWRlcnMgPSBjb25maWcuaGVhZGVycyB8fCB7fTtcblxuICAvLyBUcmFuc2Zvcm0gcmVxdWVzdCBkYXRhXG4gIGNvbmZpZy5kYXRhID0gdHJhbnNmb3JtRGF0YS5jYWxsKFxuICAgIGNvbmZpZyxcbiAgICBjb25maWcuZGF0YSxcbiAgICBjb25maWcuaGVhZGVycyxcbiAgICBjb25maWcudHJhbnNmb3JtUmVxdWVzdFxuICApO1xuXG4gIC8vIEZsYXR0ZW4gaGVhZGVyc1xuICBjb25maWcuaGVhZGVycyA9IHV0aWxzLm1lcmdlKFxuICAgIGNvbmZpZy5oZWFkZXJzLmNvbW1vbiB8fCB7fSxcbiAgICBjb25maWcuaGVhZGVyc1tjb25maWcubWV0aG9kXSB8fCB7fSxcbiAgICBjb25maWcuaGVhZGVyc1xuICApO1xuXG4gIHV0aWxzLmZvckVhY2goXG4gICAgWydkZWxldGUnLCAnZ2V0JywgJ2hlYWQnLCAncG9zdCcsICdwdXQnLCAncGF0Y2gnLCAnY29tbW9uJ10sXG4gICAgZnVuY3Rpb24gY2xlYW5IZWFkZXJDb25maWcobWV0aG9kKSB7XG4gICAgICBkZWxldGUgY29uZmlnLmhlYWRlcnNbbWV0aG9kXTtcbiAgICB9XG4gICk7XG5cbiAgdmFyIGFkYXB0ZXIgPSBjb25maWcuYWRhcHRlciB8fCBkZWZhdWx0cy5hZGFwdGVyO1xuXG4gIHJldHVybiBhZGFwdGVyKGNvbmZpZykudGhlbihmdW5jdGlvbiBvbkFkYXB0ZXJSZXNvbHV0aW9uKHJlc3BvbnNlKSB7XG4gICAgdGhyb3dJZkNhbmNlbGxhdGlvblJlcXVlc3RlZChjb25maWcpO1xuXG4gICAgLy8gVHJhbnNmb3JtIHJlc3BvbnNlIGRhdGFcbiAgICByZXNwb25zZS5kYXRhID0gdHJhbnNmb3JtRGF0YS5jYWxsKFxuICAgICAgY29uZmlnLFxuICAgICAgcmVzcG9uc2UuZGF0YSxcbiAgICAgIHJlc3BvbnNlLmhlYWRlcnMsXG4gICAgICBjb25maWcudHJhbnNmb3JtUmVzcG9uc2VcbiAgICApO1xuXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9LCBmdW5jdGlvbiBvbkFkYXB0ZXJSZWplY3Rpb24ocmVhc29uKSB7XG4gICAgaWYgKCFpc0NhbmNlbChyZWFzb24pKSB7XG4gICAgICB0aHJvd0lmQ2FuY2VsbGF0aW9uUmVxdWVzdGVkKGNvbmZpZyk7XG5cbiAgICAgIC8vIFRyYW5zZm9ybSByZXNwb25zZSBkYXRhXG4gICAgICBpZiAocmVhc29uICYmIHJlYXNvbi5yZXNwb25zZSkge1xuICAgICAgICByZWFzb24ucmVzcG9uc2UuZGF0YSA9IHRyYW5zZm9ybURhdGEuY2FsbChcbiAgICAgICAgICBjb25maWcsXG4gICAgICAgICAgcmVhc29uLnJlc3BvbnNlLmRhdGEsXG4gICAgICAgICAgcmVhc29uLnJlc3BvbnNlLmhlYWRlcnMsXG4gICAgICAgICAgY29uZmlnLnRyYW5zZm9ybVJlc3BvbnNlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KHJlYXNvbik7XG4gIH0pO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBDb25maWctc3BlY2lmaWMgbWVyZ2UtZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhIG5ldyBjb25maWctb2JqZWN0XG4gKiBieSBtZXJnaW5nIHR3byBjb25maWd1cmF0aW9uIG9iamVjdHMgdG9nZXRoZXIuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZzFcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb25maWcyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBOZXcgb2JqZWN0IHJlc3VsdGluZyBmcm9tIG1lcmdpbmcgY29uZmlnMiB0byBjb25maWcxXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWVyZ2VDb25maWcoY29uZmlnMSwgY29uZmlnMikge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgY29uZmlnMiA9IGNvbmZpZzIgfHwge307XG4gIHZhciBjb25maWcgPSB7fTtcblxuICBmdW5jdGlvbiBnZXRNZXJnZWRWYWx1ZSh0YXJnZXQsIHNvdXJjZSkge1xuICAgIGlmICh1dGlscy5pc1BsYWluT2JqZWN0KHRhcmdldCkgJiYgdXRpbHMuaXNQbGFpbk9iamVjdChzb3VyY2UpKSB7XG4gICAgICByZXR1cm4gdXRpbHMubWVyZ2UodGFyZ2V0LCBzb3VyY2UpO1xuICAgIH0gZWxzZSBpZiAodXRpbHMuaXNQbGFpbk9iamVjdChzb3VyY2UpKSB7XG4gICAgICByZXR1cm4gdXRpbHMubWVyZ2Uoe30sIHNvdXJjZSk7XG4gICAgfSBlbHNlIGlmICh1dGlscy5pc0FycmF5KHNvdXJjZSkpIHtcbiAgICAgIHJldHVybiBzb3VyY2Uuc2xpY2UoKTtcbiAgICB9XG4gICAgcmV0dXJuIHNvdXJjZTtcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb25zaXN0ZW50LXJldHVyblxuICBmdW5jdGlvbiBtZXJnZURlZXBQcm9wZXJ0aWVzKHByb3ApIHtcbiAgICBpZiAoIXV0aWxzLmlzVW5kZWZpbmVkKGNvbmZpZzJbcHJvcF0pKSB7XG4gICAgICByZXR1cm4gZ2V0TWVyZ2VkVmFsdWUoY29uZmlnMVtwcm9wXSwgY29uZmlnMltwcm9wXSk7XG4gICAgfSBlbHNlIGlmICghdXRpbHMuaXNVbmRlZmluZWQoY29uZmlnMVtwcm9wXSkpIHtcbiAgICAgIHJldHVybiBnZXRNZXJnZWRWYWx1ZSh1bmRlZmluZWQsIGNvbmZpZzFbcHJvcF0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb25zaXN0ZW50LXJldHVyblxuICBmdW5jdGlvbiB2YWx1ZUZyb21Db25maWcyKHByb3ApIHtcbiAgICBpZiAoIXV0aWxzLmlzVW5kZWZpbmVkKGNvbmZpZzJbcHJvcF0pKSB7XG4gICAgICByZXR1cm4gZ2V0TWVyZ2VkVmFsdWUodW5kZWZpbmVkLCBjb25maWcyW3Byb3BdKTtcbiAgICB9XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29uc2lzdGVudC1yZXR1cm5cbiAgZnVuY3Rpb24gZGVmYXVsdFRvQ29uZmlnMihwcm9wKSB7XG4gICAgaWYgKCF1dGlscy5pc1VuZGVmaW5lZChjb25maWcyW3Byb3BdKSkge1xuICAgICAgcmV0dXJuIGdldE1lcmdlZFZhbHVlKHVuZGVmaW5lZCwgY29uZmlnMltwcm9wXSk7XG4gICAgfSBlbHNlIGlmICghdXRpbHMuaXNVbmRlZmluZWQoY29uZmlnMVtwcm9wXSkpIHtcbiAgICAgIHJldHVybiBnZXRNZXJnZWRWYWx1ZSh1bmRlZmluZWQsIGNvbmZpZzFbcHJvcF0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb25zaXN0ZW50LXJldHVyblxuICBmdW5jdGlvbiBtZXJnZURpcmVjdEtleXMocHJvcCkge1xuICAgIGlmIChwcm9wIGluIGNvbmZpZzIpIHtcbiAgICAgIHJldHVybiBnZXRNZXJnZWRWYWx1ZShjb25maWcxW3Byb3BdLCBjb25maWcyW3Byb3BdKTtcbiAgICB9IGVsc2UgaWYgKHByb3AgaW4gY29uZmlnMSkge1xuICAgICAgcmV0dXJuIGdldE1lcmdlZFZhbHVlKHVuZGVmaW5lZCwgY29uZmlnMVtwcm9wXSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIG1lcmdlTWFwID0ge1xuICAgICd1cmwnOiB2YWx1ZUZyb21Db25maWcyLFxuICAgICdtZXRob2QnOiB2YWx1ZUZyb21Db25maWcyLFxuICAgICdkYXRhJzogdmFsdWVGcm9tQ29uZmlnMixcbiAgICAnYmFzZVVSTCc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ3RyYW5zZm9ybVJlcXVlc3QnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICd0cmFuc2Zvcm1SZXNwb25zZSc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ3BhcmFtc1NlcmlhbGl6ZXInOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICd0aW1lb3V0JzogZGVmYXVsdFRvQ29uZmlnMixcbiAgICAndGltZW91dE1lc3NhZ2UnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICd3aXRoQ3JlZGVudGlhbHMnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICdhZGFwdGVyJzogZGVmYXVsdFRvQ29uZmlnMixcbiAgICAncmVzcG9uc2VUeXBlJzogZGVmYXVsdFRvQ29uZmlnMixcbiAgICAneHNyZkNvb2tpZU5hbWUnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICd4c3JmSGVhZGVyTmFtZSc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ29uVXBsb2FkUHJvZ3Jlc3MnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICdvbkRvd25sb2FkUHJvZ3Jlc3MnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICdkZWNvbXByZXNzJzogZGVmYXVsdFRvQ29uZmlnMixcbiAgICAnbWF4Q29udGVudExlbmd0aCc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ21heEJvZHlMZW5ndGgnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICdiZWZvcmVSZWRpcmVjdCc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ3RyYW5zcG9ydCc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ2h0dHBBZ2VudCc6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ2h0dHBzQWdlbnQnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICdjYW5jZWxUb2tlbic6IGRlZmF1bHRUb0NvbmZpZzIsXG4gICAgJ3NvY2tldFBhdGgnOiBkZWZhdWx0VG9Db25maWcyLFxuICAgICdyZXNwb25zZUVuY29kaW5nJzogZGVmYXVsdFRvQ29uZmlnMixcbiAgICAndmFsaWRhdGVTdGF0dXMnOiBtZXJnZURpcmVjdEtleXNcbiAgfTtcblxuICB1dGlscy5mb3JFYWNoKE9iamVjdC5rZXlzKGNvbmZpZzEpLmNvbmNhdChPYmplY3Qua2V5cyhjb25maWcyKSksIGZ1bmN0aW9uIGNvbXB1dGVDb25maWdWYWx1ZShwcm9wKSB7XG4gICAgdmFyIG1lcmdlID0gbWVyZ2VNYXBbcHJvcF0gfHwgbWVyZ2VEZWVwUHJvcGVydGllcztcbiAgICB2YXIgY29uZmlnVmFsdWUgPSBtZXJnZShwcm9wKTtcbiAgICAodXRpbHMuaXNVbmRlZmluZWQoY29uZmlnVmFsdWUpICYmIG1lcmdlICE9PSBtZXJnZURpcmVjdEtleXMpIHx8IChjb25maWdbcHJvcF0gPSBjb25maWdWYWx1ZSk7XG4gIH0pO1xuXG4gIHJldHVybiBjb25maWc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQXhpb3NFcnJvciA9IHJlcXVpcmUoJy4vQXhpb3NFcnJvcicpO1xuXG4vKipcbiAqIFJlc29sdmUgb3IgcmVqZWN0IGEgUHJvbWlzZSBiYXNlZCBvbiByZXNwb25zZSBzdGF0dXMuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gcmVzb2x2ZSBBIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdGhlIHByb21pc2UuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZWplY3QgQSBmdW5jdGlvbiB0aGF0IHJlamVjdHMgdGhlIHByb21pc2UuXG4gKiBAcGFyYW0ge29iamVjdH0gcmVzcG9uc2UgVGhlIHJlc3BvbnNlLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHJlc3BvbnNlKSB7XG4gIHZhciB2YWxpZGF0ZVN0YXR1cyA9IHJlc3BvbnNlLmNvbmZpZy52YWxpZGF0ZVN0YXR1cztcbiAgaWYgKCFyZXNwb25zZS5zdGF0dXMgfHwgIXZhbGlkYXRlU3RhdHVzIHx8IHZhbGlkYXRlU3RhdHVzKHJlc3BvbnNlLnN0YXR1cykpIHtcbiAgICByZXNvbHZlKHJlc3BvbnNlKTtcbiAgfSBlbHNlIHtcbiAgICByZWplY3QobmV3IEF4aW9zRXJyb3IoXG4gICAgICAnUmVxdWVzdCBmYWlsZWQgd2l0aCBzdGF0dXMgY29kZSAnICsgcmVzcG9uc2Uuc3RhdHVzLFxuICAgICAgW0F4aW9zRXJyb3IuRVJSX0JBRF9SRVFVRVNULCBBeGlvc0Vycm9yLkVSUl9CQURfUkVTUE9OU0VdW01hdGguZmxvb3IocmVzcG9uc2Uuc3RhdHVzIC8gMTAwKSAtIDRdLFxuICAgICAgcmVzcG9uc2UuY29uZmlnLFxuICAgICAgcmVzcG9uc2UucmVxdWVzdCxcbiAgICAgIHJlc3BvbnNlXG4gICAgKSk7XG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vLi4vdXRpbHMnKTtcbnZhciBkZWZhdWx0cyA9IHJlcXVpcmUoJy4uL2RlZmF1bHRzJyk7XG5cbi8qKlxuICogVHJhbnNmb3JtIHRoZSBkYXRhIGZvciBhIHJlcXVlc3Qgb3IgYSByZXNwb25zZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gZGF0YSBUaGUgZGF0YSB0byBiZSB0cmFuc2Zvcm1lZFxuICogQHBhcmFtIHtBcnJheX0gaGVhZGVycyBUaGUgaGVhZGVycyBmb3IgdGhlIHJlcXVlc3Qgb3IgcmVzcG9uc2VcbiAqIEBwYXJhbSB7QXJyYXl8RnVuY3Rpb259IGZucyBBIHNpbmdsZSBmdW5jdGlvbiBvciBBcnJheSBvZiBmdW5jdGlvbnNcbiAqIEByZXR1cm5zIHsqfSBUaGUgcmVzdWx0aW5nIHRyYW5zZm9ybWVkIGRhdGFcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0cmFuc2Zvcm1EYXRhKGRhdGEsIGhlYWRlcnMsIGZucykge1xuICB2YXIgY29udGV4dCA9IHRoaXMgfHwgZGVmYXVsdHM7XG4gIC8qZXNsaW50IG5vLXBhcmFtLXJlYXNzaWduOjAqL1xuICB1dGlscy5mb3JFYWNoKGZucywgZnVuY3Rpb24gdHJhbnNmb3JtKGZuKSB7XG4gICAgZGF0YSA9IGZuLmNhbGwoY29udGV4dCwgZGF0YSwgaGVhZGVycyk7XG4gIH0pO1xuXG4gIHJldHVybiBkYXRhO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcbnZhciBub3JtYWxpemVIZWFkZXJOYW1lID0gcmVxdWlyZSgnLi4vaGVscGVycy9ub3JtYWxpemVIZWFkZXJOYW1lJyk7XG52YXIgQXhpb3NFcnJvciA9IHJlcXVpcmUoJy4uL2NvcmUvQXhpb3NFcnJvcicpO1xudmFyIHRyYW5zaXRpb25hbERlZmF1bHRzID0gcmVxdWlyZSgnLi90cmFuc2l0aW9uYWwnKTtcbnZhciB0b0Zvcm1EYXRhID0gcmVxdWlyZSgnLi4vaGVscGVycy90b0Zvcm1EYXRhJyk7XG5cbnZhciBERUZBVUxUX0NPTlRFTlRfVFlQRSA9IHtcbiAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXG59O1xuXG5mdW5jdGlvbiBzZXRDb250ZW50VHlwZUlmVW5zZXQoaGVhZGVycywgdmFsdWUpIHtcbiAgaWYgKCF1dGlscy5pc1VuZGVmaW5lZChoZWFkZXJzKSAmJiB1dGlscy5pc1VuZGVmaW5lZChoZWFkZXJzWydDb250ZW50LVR5cGUnXSkpIHtcbiAgICBoZWFkZXJzWydDb250ZW50LVR5cGUnXSA9IHZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldERlZmF1bHRBZGFwdGVyKCkge1xuICB2YXIgYWRhcHRlcjtcbiAgaWYgKHR5cGVvZiBYTUxIdHRwUmVxdWVzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyBGb3IgYnJvd3NlcnMgdXNlIFhIUiBhZGFwdGVyXG4gICAgYWRhcHRlciA9IHJlcXVpcmUoJy4uL2FkYXB0ZXJzL3hocicpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJykge1xuICAgIC8vIEZvciBub2RlIHVzZSBIVFRQIGFkYXB0ZXJcbiAgICBhZGFwdGVyID0gcmVxdWlyZSgnLi4vYWRhcHRlcnMvaHR0cCcpO1xuICB9XG4gIHJldHVybiBhZGFwdGVyO1xufVxuXG5mdW5jdGlvbiBzdHJpbmdpZnlTYWZlbHkocmF3VmFsdWUsIHBhcnNlciwgZW5jb2Rlcikge1xuICBpZiAodXRpbHMuaXNTdHJpbmcocmF3VmFsdWUpKSB7XG4gICAgdHJ5IHtcbiAgICAgIChwYXJzZXIgfHwgSlNPTi5wYXJzZSkocmF3VmFsdWUpO1xuICAgICAgcmV0dXJuIHV0aWxzLnRyaW0ocmF3VmFsdWUpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlLm5hbWUgIT09ICdTeW50YXhFcnJvcicpIHtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gKGVuY29kZXIgfHwgSlNPTi5zdHJpbmdpZnkpKHJhd1ZhbHVlKTtcbn1cblxudmFyIGRlZmF1bHRzID0ge1xuXG4gIHRyYW5zaXRpb25hbDogdHJhbnNpdGlvbmFsRGVmYXVsdHMsXG5cbiAgYWRhcHRlcjogZ2V0RGVmYXVsdEFkYXB0ZXIoKSxcblxuICB0cmFuc2Zvcm1SZXF1ZXN0OiBbZnVuY3Rpb24gdHJhbnNmb3JtUmVxdWVzdChkYXRhLCBoZWFkZXJzKSB7XG4gICAgbm9ybWFsaXplSGVhZGVyTmFtZShoZWFkZXJzLCAnQWNjZXB0Jyk7XG4gICAgbm9ybWFsaXplSGVhZGVyTmFtZShoZWFkZXJzLCAnQ29udGVudC1UeXBlJyk7XG5cbiAgICBpZiAodXRpbHMuaXNGb3JtRGF0YShkYXRhKSB8fFxuICAgICAgdXRpbHMuaXNBcnJheUJ1ZmZlcihkYXRhKSB8fFxuICAgICAgdXRpbHMuaXNCdWZmZXIoZGF0YSkgfHxcbiAgICAgIHV0aWxzLmlzU3RyZWFtKGRhdGEpIHx8XG4gICAgICB1dGlscy5pc0ZpbGUoZGF0YSkgfHxcbiAgICAgIHV0aWxzLmlzQmxvYihkYXRhKVxuICAgICkge1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuICAgIGlmICh1dGlscy5pc0FycmF5QnVmZmVyVmlldyhkYXRhKSkge1xuICAgICAgcmV0dXJuIGRhdGEuYnVmZmVyO1xuICAgIH1cbiAgICBpZiAodXRpbHMuaXNVUkxTZWFyY2hQYXJhbXMoZGF0YSkpIHtcbiAgICAgIHNldENvbnRlbnRUeXBlSWZVbnNldChoZWFkZXJzLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkO2NoYXJzZXQ9dXRmLTgnKTtcbiAgICAgIHJldHVybiBkYXRhLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgdmFyIGlzT2JqZWN0UGF5bG9hZCA9IHV0aWxzLmlzT2JqZWN0KGRhdGEpO1xuICAgIHZhciBjb250ZW50VHlwZSA9IGhlYWRlcnMgJiYgaGVhZGVyc1snQ29udGVudC1UeXBlJ107XG5cbiAgICB2YXIgaXNGaWxlTGlzdDtcblxuICAgIGlmICgoaXNGaWxlTGlzdCA9IHV0aWxzLmlzRmlsZUxpc3QoZGF0YSkpIHx8IChpc09iamVjdFBheWxvYWQgJiYgY29udGVudFR5cGUgPT09ICdtdWx0aXBhcnQvZm9ybS1kYXRhJykpIHtcbiAgICAgIHZhciBfRm9ybURhdGEgPSB0aGlzLmVudiAmJiB0aGlzLmVudi5Gb3JtRGF0YTtcbiAgICAgIHJldHVybiB0b0Zvcm1EYXRhKGlzRmlsZUxpc3QgPyB7J2ZpbGVzW10nOiBkYXRhfSA6IGRhdGEsIF9Gb3JtRGF0YSAmJiBuZXcgX0Zvcm1EYXRhKCkpO1xuICAgIH0gZWxzZSBpZiAoaXNPYmplY3RQYXlsb2FkIHx8IGNvbnRlbnRUeXBlID09PSAnYXBwbGljYXRpb24vanNvbicpIHtcbiAgICAgIHNldENvbnRlbnRUeXBlSWZVbnNldChoZWFkZXJzLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgcmV0dXJuIHN0cmluZ2lmeVNhZmVseShkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfV0sXG5cbiAgdHJhbnNmb3JtUmVzcG9uc2U6IFtmdW5jdGlvbiB0cmFuc2Zvcm1SZXNwb25zZShkYXRhKSB7XG4gICAgdmFyIHRyYW5zaXRpb25hbCA9IHRoaXMudHJhbnNpdGlvbmFsIHx8IGRlZmF1bHRzLnRyYW5zaXRpb25hbDtcbiAgICB2YXIgc2lsZW50SlNPTlBhcnNpbmcgPSB0cmFuc2l0aW9uYWwgJiYgdHJhbnNpdGlvbmFsLnNpbGVudEpTT05QYXJzaW5nO1xuICAgIHZhciBmb3JjZWRKU09OUGFyc2luZyA9IHRyYW5zaXRpb25hbCAmJiB0cmFuc2l0aW9uYWwuZm9yY2VkSlNPTlBhcnNpbmc7XG4gICAgdmFyIHN0cmljdEpTT05QYXJzaW5nID0gIXNpbGVudEpTT05QYXJzaW5nICYmIHRoaXMucmVzcG9uc2VUeXBlID09PSAnanNvbic7XG5cbiAgICBpZiAoc3RyaWN0SlNPTlBhcnNpbmcgfHwgKGZvcmNlZEpTT05QYXJzaW5nICYmIHV0aWxzLmlzU3RyaW5nKGRhdGEpICYmIGRhdGEubGVuZ3RoKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmIChzdHJpY3RKU09OUGFyc2luZykge1xuICAgICAgICAgIGlmIChlLm5hbWUgPT09ICdTeW50YXhFcnJvcicpIHtcbiAgICAgICAgICAgIHRocm93IEF4aW9zRXJyb3IuZnJvbShlLCBBeGlvc0Vycm9yLkVSUl9CQURfUkVTUE9OU0UsIHRoaXMsIG51bGwsIHRoaXMucmVzcG9uc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH1dLFxuXG4gIC8qKlxuICAgKiBBIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzIHRvIGFib3J0IGEgcmVxdWVzdC4gSWYgc2V0IHRvIDAgKGRlZmF1bHQpIGFcbiAgICogdGltZW91dCBpcyBub3QgY3JlYXRlZC5cbiAgICovXG4gIHRpbWVvdXQ6IDAsXG5cbiAgeHNyZkNvb2tpZU5hbWU6ICdYU1JGLVRPS0VOJyxcbiAgeHNyZkhlYWRlck5hbWU6ICdYLVhTUkYtVE9LRU4nLFxuXG4gIG1heENvbnRlbnRMZW5ndGg6IC0xLFxuICBtYXhCb2R5TGVuZ3RoOiAtMSxcblxuICBlbnY6IHtcbiAgICBGb3JtRGF0YTogcmVxdWlyZSgnLi9lbnYvRm9ybURhdGEnKVxuICB9LFxuXG4gIHZhbGlkYXRlU3RhdHVzOiBmdW5jdGlvbiB2YWxpZGF0ZVN0YXR1cyhzdGF0dXMpIHtcbiAgICByZXR1cm4gc3RhdHVzID49IDIwMCAmJiBzdGF0dXMgPCAzMDA7XG4gIH0sXG5cbiAgaGVhZGVyczoge1xuICAgIGNvbW1vbjoge1xuICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uLCB0ZXh0L3BsYWluLCAqLyonXG4gICAgfVxuICB9XG59O1xuXG51dGlscy5mb3JFYWNoKFsnZGVsZXRlJywgJ2dldCcsICdoZWFkJ10sIGZ1bmN0aW9uIGZvckVhY2hNZXRob2ROb0RhdGEobWV0aG9kKSB7XG4gIGRlZmF1bHRzLmhlYWRlcnNbbWV0aG9kXSA9IHt9O1xufSk7XG5cbnV0aWxzLmZvckVhY2goWydwb3N0JywgJ3B1dCcsICdwYXRjaCddLCBmdW5jdGlvbiBmb3JFYWNoTWV0aG9kV2l0aERhdGEobWV0aG9kKSB7XG4gIGRlZmF1bHRzLmhlYWRlcnNbbWV0aG9kXSA9IHV0aWxzLm1lcmdlKERFRkFVTFRfQ09OVEVOVF9UWVBFKTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmF1bHRzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2lsZW50SlNPTlBhcnNpbmc6IHRydWUsXG4gIGZvcmNlZEpTT05QYXJzaW5nOiB0cnVlLFxuICBjbGFyaWZ5VGltZW91dEVycm9yOiBmYWxzZVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBcInZlcnNpb25cIjogXCIwLjI3LjJcIlxufTsiLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmluZChmbiwgdGhpc0FyZykge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcCgpIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV07XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzQXJnLCBhcmdzKTtcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vLi4vdXRpbHMnKTtcblxuZnVuY3Rpb24gZW5jb2RlKHZhbCkge1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHZhbCkuXG4gICAgcmVwbGFjZSgvJTNBL2dpLCAnOicpLlxuICAgIHJlcGxhY2UoLyUyNC9nLCAnJCcpLlxuICAgIHJlcGxhY2UoLyUyQy9naSwgJywnKS5cbiAgICByZXBsYWNlKC8lMjAvZywgJysnKS5cbiAgICByZXBsYWNlKC8lNUIvZ2ksICdbJykuXG4gICAgcmVwbGFjZSgvJTVEL2dpLCAnXScpO1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgVVJMIGJ5IGFwcGVuZGluZyBwYXJhbXMgdG8gdGhlIGVuZFxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgVGhlIGJhc2Ugb2YgdGhlIHVybCAoZS5nLiwgaHR0cDovL3d3dy5nb29nbGUuY29tKVxuICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbXNdIFRoZSBwYXJhbXMgdG8gYmUgYXBwZW5kZWRcbiAqIEByZXR1cm5zIHtzdHJpbmd9IFRoZSBmb3JtYXR0ZWQgdXJsXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYnVpbGRVUkwodXJsLCBwYXJhbXMsIHBhcmFtc1NlcmlhbGl6ZXIpIHtcbiAgLyplc2xpbnQgbm8tcGFyYW0tcmVhc3NpZ246MCovXG4gIGlmICghcGFyYW1zKSB7XG4gICAgcmV0dXJuIHVybDtcbiAgfVxuXG4gIHZhciBzZXJpYWxpemVkUGFyYW1zO1xuICBpZiAocGFyYW1zU2VyaWFsaXplcikge1xuICAgIHNlcmlhbGl6ZWRQYXJhbXMgPSBwYXJhbXNTZXJpYWxpemVyKHBhcmFtcyk7XG4gIH0gZWxzZSBpZiAodXRpbHMuaXNVUkxTZWFyY2hQYXJhbXMocGFyYW1zKSkge1xuICAgIHNlcmlhbGl6ZWRQYXJhbXMgPSBwYXJhbXMudG9TdHJpbmcoKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgcGFydHMgPSBbXTtcblxuICAgIHV0aWxzLmZvckVhY2gocGFyYW1zLCBmdW5jdGlvbiBzZXJpYWxpemUodmFsLCBrZXkpIHtcbiAgICAgIGlmICh2YWwgPT09IG51bGwgfHwgdHlwZW9mIHZhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodXRpbHMuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgIGtleSA9IGtleSArICdbXSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWwgPSBbdmFsXTtcbiAgICAgIH1cblxuICAgICAgdXRpbHMuZm9yRWFjaCh2YWwsIGZ1bmN0aW9uIHBhcnNlVmFsdWUodikge1xuICAgICAgICBpZiAodXRpbHMuaXNEYXRlKHYpKSB7XG4gICAgICAgICAgdiA9IHYudG9JU09TdHJpbmcoKTtcbiAgICAgICAgfSBlbHNlIGlmICh1dGlscy5pc09iamVjdCh2KSkge1xuICAgICAgICAgIHYgPSBKU09OLnN0cmluZ2lmeSh2KTtcbiAgICAgICAgfVxuICAgICAgICBwYXJ0cy5wdXNoKGVuY29kZShrZXkpICsgJz0nICsgZW5jb2RlKHYpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgc2VyaWFsaXplZFBhcmFtcyA9IHBhcnRzLmpvaW4oJyYnKTtcbiAgfVxuXG4gIGlmIChzZXJpYWxpemVkUGFyYW1zKSB7XG4gICAgdmFyIGhhc2htYXJrSW5kZXggPSB1cmwuaW5kZXhPZignIycpO1xuICAgIGlmIChoYXNobWFya0luZGV4ICE9PSAtMSkge1xuICAgICAgdXJsID0gdXJsLnNsaWNlKDAsIGhhc2htYXJrSW5kZXgpO1xuICAgIH1cblxuICAgIHVybCArPSAodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEgPyAnPycgOiAnJicpICsgc2VyaWFsaXplZFBhcmFtcztcbiAgfVxuXG4gIHJldHVybiB1cmw7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgVVJMIGJ5IGNvbWJpbmluZyB0aGUgc3BlY2lmaWVkIFVSTHNcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYmFzZVVSTCBUaGUgYmFzZSBVUkxcbiAqIEBwYXJhbSB7c3RyaW5nfSByZWxhdGl2ZVVSTCBUaGUgcmVsYXRpdmUgVVJMXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgY29tYmluZWQgVVJMXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY29tYmluZVVSTHMoYmFzZVVSTCwgcmVsYXRpdmVVUkwpIHtcbiAgcmV0dXJuIHJlbGF0aXZlVVJMXG4gICAgPyBiYXNlVVJMLnJlcGxhY2UoL1xcLyskLywgJycpICsgJy8nICsgcmVsYXRpdmVVUkwucmVwbGFjZSgvXlxcLysvLCAnJylcbiAgICA6IGJhc2VVUkw7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLy4uL3V0aWxzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKFxuICB1dGlscy5pc1N0YW5kYXJkQnJvd3NlckVudigpID9cblxuICAvLyBTdGFuZGFyZCBicm93c2VyIGVudnMgc3VwcG9ydCBkb2N1bWVudC5jb29raWVcbiAgICAoZnVuY3Rpb24gc3RhbmRhcmRCcm93c2VyRW52KCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uIHdyaXRlKG5hbWUsIHZhbHVlLCBleHBpcmVzLCBwYXRoLCBkb21haW4sIHNlY3VyZSkge1xuICAgICAgICAgIHZhciBjb29raWUgPSBbXTtcbiAgICAgICAgICBjb29raWUucHVzaChuYW1lICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKSk7XG5cbiAgICAgICAgICBpZiAodXRpbHMuaXNOdW1iZXIoZXhwaXJlcykpIHtcbiAgICAgICAgICAgIGNvb2tpZS5wdXNoKCdleHBpcmVzPScgKyBuZXcgRGF0ZShleHBpcmVzKS50b0dNVFN0cmluZygpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodXRpbHMuaXNTdHJpbmcocGF0aCkpIHtcbiAgICAgICAgICAgIGNvb2tpZS5wdXNoKCdwYXRoPScgKyBwYXRoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodXRpbHMuaXNTdHJpbmcoZG9tYWluKSkge1xuICAgICAgICAgICAgY29va2llLnB1c2goJ2RvbWFpbj0nICsgZG9tYWluKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoc2VjdXJlID09PSB0cnVlKSB7XG4gICAgICAgICAgICBjb29raWUucHVzaCgnc2VjdXJlJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZG9jdW1lbnQuY29va2llID0gY29va2llLmpvaW4oJzsgJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVhZDogZnVuY3Rpb24gcmVhZChuYW1lKSB7XG4gICAgICAgICAgdmFyIG1hdGNoID0gZG9jdW1lbnQuY29va2llLm1hdGNoKG5ldyBSZWdFeHAoJyhefDtcXFxccyopKCcgKyBuYW1lICsgJyk9KFteO10qKScpKTtcbiAgICAgICAgICByZXR1cm4gKG1hdGNoID8gZGVjb2RlVVJJQ29tcG9uZW50KG1hdGNoWzNdKSA6IG51bGwpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gcmVtb3ZlKG5hbWUpIHtcbiAgICAgICAgICB0aGlzLndyaXRlKG5hbWUsICcnLCBEYXRlLm5vdygpIC0gODY0MDAwMDApO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKCkgOlxuXG4gIC8vIE5vbiBzdGFuZGFyZCBicm93c2VyIGVudiAod2ViIHdvcmtlcnMsIHJlYWN0LW5hdGl2ZSkgbGFjayBuZWVkZWQgc3VwcG9ydC5cbiAgICAoZnVuY3Rpb24gbm9uU3RhbmRhcmRCcm93c2VyRW52KCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgd3JpdGU6IGZ1bmN0aW9uIHdyaXRlKCkge30sXG4gICAgICAgIHJlYWQ6IGZ1bmN0aW9uIHJlYWQoKSB7IHJldHVybiBudWxsOyB9LFxuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uIHJlbW92ZSgpIHt9XG4gICAgICB9O1xuICAgIH0pKClcbik7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBzcGVjaWZpZWQgVVJMIGlzIGFic29sdXRlXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHVybCBUaGUgVVJMIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBzcGVjaWZpZWQgVVJMIGlzIGFic29sdXRlLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0Fic29sdXRlVVJMKHVybCkge1xuICAvLyBBIFVSTCBpcyBjb25zaWRlcmVkIGFic29sdXRlIGlmIGl0IGJlZ2lucyB3aXRoIFwiPHNjaGVtZT46Ly9cIiBvciBcIi8vXCIgKHByb3RvY29sLXJlbGF0aXZlIFVSTCkuXG4gIC8vIFJGQyAzOTg2IGRlZmluZXMgc2NoZW1lIG5hbWUgYXMgYSBzZXF1ZW5jZSBvZiBjaGFyYWN0ZXJzIGJlZ2lubmluZyB3aXRoIGEgbGV0dGVyIGFuZCBmb2xsb3dlZFxuICAvLyBieSBhbnkgY29tYmluYXRpb24gb2YgbGV0dGVycywgZGlnaXRzLCBwbHVzLCBwZXJpb2QsIG9yIGh5cGhlbi5cbiAgcmV0dXJuIC9eKFthLXpdW2EtelxcZCtcXC0uXSo6KT9cXC9cXC8vaS50ZXN0KHVybCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLy4uL3V0aWxzJyk7XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBwYXlsb2FkIGlzIGFuIGVycm9yIHRocm93biBieSBBeGlvc1xuICpcbiAqIEBwYXJhbSB7Kn0gcGF5bG9hZCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIHBheWxvYWQgaXMgYW4gZXJyb3IgdGhyb3duIGJ5IEF4aW9zLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0F4aW9zRXJyb3IocGF5bG9hZCkge1xuICByZXR1cm4gdXRpbHMuaXNPYmplY3QocGF5bG9hZCkgJiYgKHBheWxvYWQuaXNBeGlvc0Vycm9yID09PSB0cnVlKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vLi4vdXRpbHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoXG4gIHV0aWxzLmlzU3RhbmRhcmRCcm93c2VyRW52KCkgP1xuXG4gIC8vIFN0YW5kYXJkIGJyb3dzZXIgZW52cyBoYXZlIGZ1bGwgc3VwcG9ydCBvZiB0aGUgQVBJcyBuZWVkZWQgdG8gdGVzdFxuICAvLyB3aGV0aGVyIHRoZSByZXF1ZXN0IFVSTCBpcyBvZiB0aGUgc2FtZSBvcmlnaW4gYXMgY3VycmVudCBsb2NhdGlvbi5cbiAgICAoZnVuY3Rpb24gc3RhbmRhcmRCcm93c2VyRW52KCkge1xuICAgICAgdmFyIG1zaWUgPSAvKG1zaWV8dHJpZGVudCkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuICAgICAgdmFyIHVybFBhcnNpbmdOb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgdmFyIG9yaWdpblVSTDtcblxuICAgICAgLyoqXG4gICAgKiBQYXJzZSBhIFVSTCB0byBkaXNjb3ZlciBpdCdzIGNvbXBvbmVudHNcbiAgICAqXG4gICAgKiBAcGFyYW0ge1N0cmluZ30gdXJsIFRoZSBVUkwgdG8gYmUgcGFyc2VkXG4gICAgKiBAcmV0dXJucyB7T2JqZWN0fVxuICAgICovXG4gICAgICBmdW5jdGlvbiByZXNvbHZlVVJMKHVybCkge1xuICAgICAgICB2YXIgaHJlZiA9IHVybDtcblxuICAgICAgICBpZiAobXNpZSkge1xuICAgICAgICAvLyBJRSBuZWVkcyBhdHRyaWJ1dGUgc2V0IHR3aWNlIHRvIG5vcm1hbGl6ZSBwcm9wZXJ0aWVzXG4gICAgICAgICAgdXJsUGFyc2luZ05vZGUuc2V0QXR0cmlidXRlKCdocmVmJywgaHJlZik7XG4gICAgICAgICAgaHJlZiA9IHVybFBhcnNpbmdOb2RlLmhyZWY7XG4gICAgICAgIH1cblxuICAgICAgICB1cmxQYXJzaW5nTm9kZS5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBocmVmKTtcblxuICAgICAgICAvLyB1cmxQYXJzaW5nTm9kZSBwcm92aWRlcyB0aGUgVXJsVXRpbHMgaW50ZXJmYWNlIC0gaHR0cDovL3VybC5zcGVjLndoYXR3Zy5vcmcvI3VybHV0aWxzXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaHJlZjogdXJsUGFyc2luZ05vZGUuaHJlZixcbiAgICAgICAgICBwcm90b2NvbDogdXJsUGFyc2luZ05vZGUucHJvdG9jb2wgPyB1cmxQYXJzaW5nTm9kZS5wcm90b2NvbC5yZXBsYWNlKC86JC8sICcnKSA6ICcnLFxuICAgICAgICAgIGhvc3Q6IHVybFBhcnNpbmdOb2RlLmhvc3QsXG4gICAgICAgICAgc2VhcmNoOiB1cmxQYXJzaW5nTm9kZS5zZWFyY2ggPyB1cmxQYXJzaW5nTm9kZS5zZWFyY2gucmVwbGFjZSgvXlxcPy8sICcnKSA6ICcnLFxuICAgICAgICAgIGhhc2g6IHVybFBhcnNpbmdOb2RlLmhhc2ggPyB1cmxQYXJzaW5nTm9kZS5oYXNoLnJlcGxhY2UoL14jLywgJycpIDogJycsXG4gICAgICAgICAgaG9zdG5hbWU6IHVybFBhcnNpbmdOb2RlLmhvc3RuYW1lLFxuICAgICAgICAgIHBvcnQ6IHVybFBhcnNpbmdOb2RlLnBvcnQsXG4gICAgICAgICAgcGF0aG5hbWU6ICh1cmxQYXJzaW5nTm9kZS5wYXRobmFtZS5jaGFyQXQoMCkgPT09ICcvJykgP1xuICAgICAgICAgICAgdXJsUGFyc2luZ05vZGUucGF0aG5hbWUgOlxuICAgICAgICAgICAgJy8nICsgdXJsUGFyc2luZ05vZGUucGF0aG5hbWVcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgb3JpZ2luVVJMID0gcmVzb2x2ZVVSTCh3aW5kb3cubG9jYXRpb24uaHJlZik7XG5cbiAgICAgIC8qKlxuICAgICogRGV0ZXJtaW5lIGlmIGEgVVJMIHNoYXJlcyB0aGUgc2FtZSBvcmlnaW4gYXMgdGhlIGN1cnJlbnQgbG9jYXRpb25cbiAgICAqXG4gICAgKiBAcGFyYW0ge1N0cmluZ30gcmVxdWVzdFVSTCBUaGUgVVJMIHRvIHRlc3RcbiAgICAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIFVSTCBzaGFyZXMgdGhlIHNhbWUgb3JpZ2luLCBvdGhlcndpc2UgZmFsc2VcbiAgICAqL1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIGlzVVJMU2FtZU9yaWdpbihyZXF1ZXN0VVJMKSB7XG4gICAgICAgIHZhciBwYXJzZWQgPSAodXRpbHMuaXNTdHJpbmcocmVxdWVzdFVSTCkpID8gcmVzb2x2ZVVSTChyZXF1ZXN0VVJMKSA6IHJlcXVlc3RVUkw7XG4gICAgICAgIHJldHVybiAocGFyc2VkLnByb3RvY29sID09PSBvcmlnaW5VUkwucHJvdG9jb2wgJiZcbiAgICAgICAgICAgIHBhcnNlZC5ob3N0ID09PSBvcmlnaW5VUkwuaG9zdCk7XG4gICAgICB9O1xuICAgIH0pKCkgOlxuXG4gIC8vIE5vbiBzdGFuZGFyZCBicm93c2VyIGVudnMgKHdlYiB3b3JrZXJzLCByZWFjdC1uYXRpdmUpIGxhY2sgbmVlZGVkIHN1cHBvcnQuXG4gICAgKGZ1bmN0aW9uIG5vblN0YW5kYXJkQnJvd3NlckVudigpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiBpc1VSTFNhbWVPcmlnaW4oKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcbiAgICB9KSgpXG4pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG5vcm1hbGl6ZUhlYWRlck5hbWUoaGVhZGVycywgbm9ybWFsaXplZE5hbWUpIHtcbiAgdXRpbHMuZm9yRWFjaChoZWFkZXJzLCBmdW5jdGlvbiBwcm9jZXNzSGVhZGVyKHZhbHVlLCBuYW1lKSB7XG4gICAgaWYgKG5hbWUgIT09IG5vcm1hbGl6ZWROYW1lICYmIG5hbWUudG9VcHBlckNhc2UoKSA9PT0gbm9ybWFsaXplZE5hbWUudG9VcHBlckNhc2UoKSkge1xuICAgICAgaGVhZGVyc1tub3JtYWxpemVkTmFtZV0gPSB2YWx1ZTtcbiAgICAgIGRlbGV0ZSBoZWFkZXJzW25hbWVdO1xuICAgIH1cbiAgfSk7XG59O1xuIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHN0cmljdFxubW9kdWxlLmV4cG9ydHMgPSBudWxsO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLy4uL3V0aWxzJyk7XG5cbi8vIEhlYWRlcnMgd2hvc2UgZHVwbGljYXRlcyBhcmUgaWdub3JlZCBieSBub2RlXG4vLyBjLmYuIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvaHR0cC5odG1sI2h0dHBfbWVzc2FnZV9oZWFkZXJzXG52YXIgaWdub3JlRHVwbGljYXRlT2YgPSBbXG4gICdhZ2UnLCAnYXV0aG9yaXphdGlvbicsICdjb250ZW50LWxlbmd0aCcsICdjb250ZW50LXR5cGUnLCAnZXRhZycsXG4gICdleHBpcmVzJywgJ2Zyb20nLCAnaG9zdCcsICdpZi1tb2RpZmllZC1zaW5jZScsICdpZi11bm1vZGlmaWVkLXNpbmNlJyxcbiAgJ2xhc3QtbW9kaWZpZWQnLCAnbG9jYXRpb24nLCAnbWF4LWZvcndhcmRzJywgJ3Byb3h5LWF1dGhvcml6YXRpb24nLFxuICAncmVmZXJlcicsICdyZXRyeS1hZnRlcicsICd1c2VyLWFnZW50J1xuXTtcblxuLyoqXG4gKiBQYXJzZSBoZWFkZXJzIGludG8gYW4gb2JqZWN0XG4gKlxuICogYGBgXG4gKiBEYXRlOiBXZWQsIDI3IEF1ZyAyMDE0IDA4OjU4OjQ5IEdNVFxuICogQ29udGVudC1UeXBlOiBhcHBsaWNhdGlvbi9qc29uXG4gKiBDb25uZWN0aW9uOiBrZWVwLWFsaXZlXG4gKiBUcmFuc2Zlci1FbmNvZGluZzogY2h1bmtlZFxuICogYGBgXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGhlYWRlcnMgSGVhZGVycyBuZWVkaW5nIHRvIGJlIHBhcnNlZFxuICogQHJldHVybnMge09iamVjdH0gSGVhZGVycyBwYXJzZWQgaW50byBhbiBvYmplY3RcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZUhlYWRlcnMoaGVhZGVycykge1xuICB2YXIgcGFyc2VkID0ge307XG4gIHZhciBrZXk7XG4gIHZhciB2YWw7XG4gIHZhciBpO1xuXG4gIGlmICghaGVhZGVycykgeyByZXR1cm4gcGFyc2VkOyB9XG5cbiAgdXRpbHMuZm9yRWFjaChoZWFkZXJzLnNwbGl0KCdcXG4nKSwgZnVuY3Rpb24gcGFyc2VyKGxpbmUpIHtcbiAgICBpID0gbGluZS5pbmRleE9mKCc6Jyk7XG4gICAga2V5ID0gdXRpbHMudHJpbShsaW5lLnN1YnN0cigwLCBpKSkudG9Mb3dlckNhc2UoKTtcbiAgICB2YWwgPSB1dGlscy50cmltKGxpbmUuc3Vic3RyKGkgKyAxKSk7XG5cbiAgICBpZiAoa2V5KSB7XG4gICAgICBpZiAocGFyc2VkW2tleV0gJiYgaWdub3JlRHVwbGljYXRlT2YuaW5kZXhPZihrZXkpID49IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGtleSA9PT0gJ3NldC1jb29raWUnKSB7XG4gICAgICAgIHBhcnNlZFtrZXldID0gKHBhcnNlZFtrZXldID8gcGFyc2VkW2tleV0gOiBbXSkuY29uY2F0KFt2YWxdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcnNlZFtrZXldID0gcGFyc2VkW2tleV0gPyBwYXJzZWRba2V5XSArICcsICcgKyB2YWwgOiB2YWw7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gcGFyc2VkO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZVByb3RvY29sKHVybCkge1xuICB2YXIgbWF0Y2ggPSAvXihbLStcXHddezEsMjV9KSg6P1xcL1xcL3w6KS8uZXhlYyh1cmwpO1xuICByZXR1cm4gbWF0Y2ggJiYgbWF0Y2hbMV0gfHwgJyc7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFN5bnRhY3RpYyBzdWdhciBmb3IgaW52b2tpbmcgYSBmdW5jdGlvbiBhbmQgZXhwYW5kaW5nIGFuIGFycmF5IGZvciBhcmd1bWVudHMuXG4gKlxuICogQ29tbW9uIHVzZSBjYXNlIHdvdWxkIGJlIHRvIHVzZSBgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5YC5cbiAqXG4gKiAgYGBganNcbiAqICBmdW5jdGlvbiBmKHgsIHksIHopIHt9XG4gKiAgdmFyIGFyZ3MgPSBbMSwgMiwgM107XG4gKiAgZi5hcHBseShudWxsLCBhcmdzKTtcbiAqICBgYGBcbiAqXG4gKiBXaXRoIGBzcHJlYWRgIHRoaXMgZXhhbXBsZSBjYW4gYmUgcmUtd3JpdHRlbi5cbiAqXG4gKiAgYGBganNcbiAqICBzcHJlYWQoZnVuY3Rpb24oeCwgeSwgeikge30pKFsxLCAyLCAzXSk7XG4gKiAgYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzcHJlYWQoY2FsbGJhY2spIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXAoYXJyKSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFycik7XG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuXG4vKipcbiAqIENvbnZlcnQgYSBkYXRhIG9iamVjdCB0byBGb3JtRGF0YVxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHs/T2JqZWN0fSBbZm9ybURhdGFdXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxuICoqL1xuXG5mdW5jdGlvbiB0b0Zvcm1EYXRhKG9iaiwgZm9ybURhdGEpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gIGZvcm1EYXRhID0gZm9ybURhdGEgfHwgbmV3IEZvcm1EYXRhKCk7XG5cbiAgdmFyIHN0YWNrID0gW107XG5cbiAgZnVuY3Rpb24gY29udmVydFZhbHVlKHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gJyc7XG5cbiAgICBpZiAodXRpbHMuaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIHZhbHVlLnRvSVNPU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgaWYgKHV0aWxzLmlzQXJyYXlCdWZmZXIodmFsdWUpIHx8IHV0aWxzLmlzVHlwZWRBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgQmxvYiA9PT0gJ2Z1bmN0aW9uJyA/IG5ldyBCbG9iKFt2YWx1ZV0pIDogQnVmZmVyLmZyb20odmFsdWUpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1aWxkKGRhdGEsIHBhcmVudEtleSkge1xuICAgIGlmICh1dGlscy5pc1BsYWluT2JqZWN0KGRhdGEpIHx8IHV0aWxzLmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgIGlmIChzdGFjay5pbmRleE9mKGRhdGEpICE9PSAtMSkge1xuICAgICAgICB0aHJvdyBFcnJvcignQ2lyY3VsYXIgcmVmZXJlbmNlIGRldGVjdGVkIGluICcgKyBwYXJlbnRLZXkpO1xuICAgICAgfVxuXG4gICAgICBzdGFjay5wdXNoKGRhdGEpO1xuXG4gICAgICB1dGlscy5mb3JFYWNoKGRhdGEsIGZ1bmN0aW9uIGVhY2godmFsdWUsIGtleSkge1xuICAgICAgICBpZiAodXRpbHMuaXNVbmRlZmluZWQodmFsdWUpKSByZXR1cm47XG4gICAgICAgIHZhciBmdWxsS2V5ID0gcGFyZW50S2V5ID8gcGFyZW50S2V5ICsgJy4nICsga2V5IDoga2V5O1xuICAgICAgICB2YXIgYXJyO1xuXG4gICAgICAgIGlmICh2YWx1ZSAmJiAhcGFyZW50S2V5ICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICBpZiAodXRpbHMuZW5kc1dpdGgoa2V5LCAne30nKSkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHV0aWxzLmVuZHNXaXRoKGtleSwgJ1tdJykgJiYgKGFyciA9IHV0aWxzLnRvQXJyYXkodmFsdWUpKSkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcbiAgICAgICAgICAgIGFyci5mb3JFYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICAgICF1dGlscy5pc1VuZGVmaW5lZChlbCkgJiYgZm9ybURhdGEuYXBwZW5kKGZ1bGxLZXksIGNvbnZlcnRWYWx1ZShlbCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYnVpbGQodmFsdWUsIGZ1bGxLZXkpO1xuICAgICAgfSk7XG5cbiAgICAgIHN0YWNrLnBvcCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3JtRGF0YS5hcHBlbmQocGFyZW50S2V5LCBjb252ZXJ0VmFsdWUoZGF0YSkpO1xuICAgIH1cbiAgfVxuXG4gIGJ1aWxkKG9iaik7XG5cbiAgcmV0dXJuIGZvcm1EYXRhO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvRm9ybURhdGE7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBWRVJTSU9OID0gcmVxdWlyZSgnLi4vZW52L2RhdGEnKS52ZXJzaW9uO1xudmFyIEF4aW9zRXJyb3IgPSByZXF1aXJlKCcuLi9jb3JlL0F4aW9zRXJyb3InKTtcblxudmFyIHZhbGlkYXRvcnMgPSB7fTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcblsnb2JqZWN0JywgJ2Jvb2xlYW4nLCAnbnVtYmVyJywgJ2Z1bmN0aW9uJywgJ3N0cmluZycsICdzeW1ib2wnXS5mb3JFYWNoKGZ1bmN0aW9uKHR5cGUsIGkpIHtcbiAgdmFsaWRhdG9yc1t0eXBlXSA9IGZ1bmN0aW9uIHZhbGlkYXRvcih0aGluZykge1xuICAgIHJldHVybiB0eXBlb2YgdGhpbmcgPT09IHR5cGUgfHwgJ2EnICsgKGkgPCAxID8gJ24gJyA6ICcgJykgKyB0eXBlO1xuICB9O1xufSk7XG5cbnZhciBkZXByZWNhdGVkV2FybmluZ3MgPSB7fTtcblxuLyoqXG4gKiBUcmFuc2l0aW9uYWwgb3B0aW9uIHZhbGlkYXRvclxuICogQHBhcmFtIHtmdW5jdGlvbnxib29sZWFuP30gdmFsaWRhdG9yIC0gc2V0IHRvIGZhbHNlIGlmIHRoZSB0cmFuc2l0aW9uYWwgb3B0aW9uIGhhcyBiZWVuIHJlbW92ZWRcbiAqIEBwYXJhbSB7c3RyaW5nP30gdmVyc2lvbiAtIGRlcHJlY2F0ZWQgdmVyc2lvbiAvIHJlbW92ZWQgc2luY2UgdmVyc2lvblxuICogQHBhcmFtIHtzdHJpbmc/fSBtZXNzYWdlIC0gc29tZSBtZXNzYWdlIHdpdGggYWRkaXRpb25hbCBpbmZvXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb259XG4gKi9cbnZhbGlkYXRvcnMudHJhbnNpdGlvbmFsID0gZnVuY3Rpb24gdHJhbnNpdGlvbmFsKHZhbGlkYXRvciwgdmVyc2lvbiwgbWVzc2FnZSkge1xuICBmdW5jdGlvbiBmb3JtYXRNZXNzYWdlKG9wdCwgZGVzYykge1xuICAgIHJldHVybiAnW0F4aW9zIHYnICsgVkVSU0lPTiArICddIFRyYW5zaXRpb25hbCBvcHRpb24gXFwnJyArIG9wdCArICdcXCcnICsgZGVzYyArIChtZXNzYWdlID8gJy4gJyArIG1lc3NhZ2UgOiAnJyk7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZnVuYy1uYW1lc1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWUsIG9wdCwgb3B0cykge1xuICAgIGlmICh2YWxpZGF0b3IgPT09IGZhbHNlKSB7XG4gICAgICB0aHJvdyBuZXcgQXhpb3NFcnJvcihcbiAgICAgICAgZm9ybWF0TWVzc2FnZShvcHQsICcgaGFzIGJlZW4gcmVtb3ZlZCcgKyAodmVyc2lvbiA/ICcgaW4gJyArIHZlcnNpb24gOiAnJykpLFxuICAgICAgICBBeGlvc0Vycm9yLkVSUl9ERVBSRUNBVEVEXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICh2ZXJzaW9uICYmICFkZXByZWNhdGVkV2FybmluZ3Nbb3B0XSkge1xuICAgICAgZGVwcmVjYXRlZFdhcm5pbmdzW29wdF0gPSB0cnVlO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgZm9ybWF0TWVzc2FnZShcbiAgICAgICAgICBvcHQsXG4gICAgICAgICAgJyBoYXMgYmVlbiBkZXByZWNhdGVkIHNpbmNlIHYnICsgdmVyc2lvbiArICcgYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiB0aGUgbmVhciBmdXR1cmUnXG4gICAgICAgIClcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbGlkYXRvciA/IHZhbGlkYXRvcih2YWx1ZSwgb3B0LCBvcHRzKSA6IHRydWU7XG4gIH07XG59O1xuXG4vKipcbiAqIEFzc2VydCBvYmplY3QncyBwcm9wZXJ0aWVzIHR5cGVcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXG4gKiBAcGFyYW0ge29iamVjdH0gc2NoZW1hXG4gKiBAcGFyYW0ge2Jvb2xlYW4/fSBhbGxvd1Vua25vd25cbiAqL1xuXG5mdW5jdGlvbiBhc3NlcnRPcHRpb25zKG9wdGlvbnMsIHNjaGVtYSwgYWxsb3dVbmtub3duKSB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucyAhPT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgQXhpb3NFcnJvcignb3B0aW9ucyBtdXN0IGJlIGFuIG9iamVjdCcsIEF4aW9zRXJyb3IuRVJSX0JBRF9PUFRJT05fVkFMVUUpO1xuICB9XG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMob3B0aW9ucyk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0gPiAwKSB7XG4gICAgdmFyIG9wdCA9IGtleXNbaV07XG4gICAgdmFyIHZhbGlkYXRvciA9IHNjaGVtYVtvcHRdO1xuICAgIGlmICh2YWxpZGF0b3IpIHtcbiAgICAgIHZhciB2YWx1ZSA9IG9wdGlvbnNbb3B0XTtcbiAgICAgIHZhciByZXN1bHQgPSB2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbGlkYXRvcih2YWx1ZSwgb3B0LCBvcHRpb25zKTtcbiAgICAgIGlmIChyZXN1bHQgIT09IHRydWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEF4aW9zRXJyb3IoJ29wdGlvbiAnICsgb3B0ICsgJyBtdXN0IGJlICcgKyByZXN1bHQsIEF4aW9zRXJyb3IuRVJSX0JBRF9PUFRJT05fVkFMVUUpO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChhbGxvd1Vua25vd24gIT09IHRydWUpIHtcbiAgICAgIHRocm93IG5ldyBBeGlvc0Vycm9yKCdVbmtub3duIG9wdGlvbiAnICsgb3B0LCBBeGlvc0Vycm9yLkVSUl9CQURfT1BUSU9OKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFzc2VydE9wdGlvbnM6IGFzc2VydE9wdGlvbnMsXG4gIHZhbGlkYXRvcnM6IHZhbGlkYXRvcnNcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiaW5kID0gcmVxdWlyZSgnLi9oZWxwZXJzL2JpbmQnKTtcblxuLy8gdXRpbHMgaXMgYSBsaWJyYXJ5IG9mIGdlbmVyaWMgaGVscGVyIGZ1bmN0aW9ucyBub24tc3BlY2lmaWMgdG8gYXhpb3NcblxudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcbnZhciBraW5kT2YgPSAoZnVuY3Rpb24oY2FjaGUpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcbiAgcmV0dXJuIGZ1bmN0aW9uKHRoaW5nKSB7XG4gICAgdmFyIHN0ciA9IHRvU3RyaW5nLmNhbGwodGhpbmcpO1xuICAgIHJldHVybiBjYWNoZVtzdHJdIHx8IChjYWNoZVtzdHJdID0gc3RyLnNsaWNlKDgsIC0xKS50b0xvd2VyQ2FzZSgpKTtcbiAgfTtcbn0pKE9iamVjdC5jcmVhdGUobnVsbCkpO1xuXG5mdW5jdGlvbiBraW5kT2ZUZXN0KHR5cGUpIHtcbiAgdHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIGZ1bmN0aW9uIGlzS2luZE9mKHRoaW5nKSB7XG4gICAgcmV0dXJuIGtpbmRPZih0aGluZykgPT09IHR5cGU7XG4gIH07XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYW4gQXJyYXlcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWx1ZSBpcyBhbiBBcnJheSwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXkodmFsKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbCk7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgdW5kZWZpbmVkXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIHZhbHVlIGlzIHVuZGVmaW5lZCwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKHZhbCkge1xuICByZXR1cm4gdHlwZW9mIHZhbCA9PT0gJ3VuZGVmaW5lZCc7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYSBCdWZmZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWx1ZSBpcyBhIEJ1ZmZlciwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQnVmZmVyKHZhbCkge1xuICByZXR1cm4gdmFsICE9PSBudWxsICYmICFpc1VuZGVmaW5lZCh2YWwpICYmIHZhbC5jb25zdHJ1Y3RvciAhPT0gbnVsbCAmJiAhaXNVbmRlZmluZWQodmFsLmNvbnN0cnVjdG9yKVxuICAgICYmIHR5cGVvZiB2YWwuY29uc3RydWN0b3IuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicgJiYgdmFsLmNvbnN0cnVjdG9yLmlzQnVmZmVyKHZhbCk7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYW4gQXJyYXlCdWZmZXJcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHZhbHVlIGlzIGFuIEFycmF5QnVmZmVyLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xudmFyIGlzQXJyYXlCdWZmZXIgPSBraW5kT2ZUZXN0KCdBcnJheUJ1ZmZlcicpO1xuXG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYSB2aWV3IG9uIGFuIEFycmF5QnVmZmVyXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdmFsdWUgaXMgYSB2aWV3IG9uIGFuIEFycmF5QnVmZmVyLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNBcnJheUJ1ZmZlclZpZXcodmFsKSB7XG4gIHZhciByZXN1bHQ7XG4gIGlmICgodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJykgJiYgKEFycmF5QnVmZmVyLmlzVmlldykpIHtcbiAgICByZXN1bHQgPSBBcnJheUJ1ZmZlci5pc1ZpZXcodmFsKTtcbiAgfSBlbHNlIHtcbiAgICByZXN1bHQgPSAodmFsKSAmJiAodmFsLmJ1ZmZlcikgJiYgKGlzQXJyYXlCdWZmZXIodmFsLmJ1ZmZlcikpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYSBTdHJpbmdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWx1ZSBpcyBhIFN0cmluZywgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3RyaW5nKHZhbCkge1xuICByZXR1cm4gdHlwZW9mIHZhbCA9PT0gJ3N0cmluZyc7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYSBOdW1iZXJcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWx1ZSBpcyBhIE51bWJlciwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzTnVtYmVyKHZhbCkge1xuICByZXR1cm4gdHlwZW9mIHZhbCA9PT0gJ251bWJlcic7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYW4gT2JqZWN0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdmFsdWUgaXMgYW4gT2JqZWN0LCBvdGhlcndpc2UgZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsKSB7XG4gIHJldHVybiB2YWwgIT09IG51bGwgJiYgdHlwZW9mIHZhbCA9PT0gJ29iamVjdCc7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYSBwbGFpbiBPYmplY3RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHZhbHVlIGlzIGEgcGxhaW4gT2JqZWN0LCBvdGhlcndpc2UgZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNQbGFpbk9iamVjdCh2YWwpIHtcbiAgaWYgKGtpbmRPZih2YWwpICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHZhciBwcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodmFsKTtcbiAgcmV0dXJuIHByb3RvdHlwZSA9PT0gbnVsbCB8fCBwcm90b3R5cGUgPT09IE9iamVjdC5wcm90b3R5cGU7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYSBEYXRlXG4gKlxuICogQGZ1bmN0aW9uXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWx1ZSBpcyBhIERhdGUsIG90aGVyd2lzZSBmYWxzZVxuICovXG52YXIgaXNEYXRlID0ga2luZE9mVGVzdCgnRGF0ZScpO1xuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgRmlsZVxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdmFsdWUgaXMgYSBGaWxlLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xudmFyIGlzRmlsZSA9IGtpbmRPZlRlc3QoJ0ZpbGUnKTtcblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgYSB2YWx1ZSBpcyBhIEJsb2JcbiAqXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHZhbHVlIGlzIGEgQmxvYiwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbnZhciBpc0Jsb2IgPSBraW5kT2ZUZXN0KCdCbG9iJyk7XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYSBGaWxlTGlzdFxuICpcbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtPYmplY3R9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdmFsdWUgaXMgYSBGaWxlLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xudmFyIGlzRmlsZUxpc3QgPSBraW5kT2ZUZXN0KCdGaWxlTGlzdCcpO1xuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgRnVuY3Rpb25cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsIFRoZSB2YWx1ZSB0byB0ZXN0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gVHJ1ZSBpZiB2YWx1ZSBpcyBhIEZ1bmN0aW9uLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWwpIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwodmFsKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgYSB2YWx1ZSBpcyBhIFN0cmVhbVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHZhbHVlIGlzIGEgU3RyZWFtLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNTdHJlYW0odmFsKSB7XG4gIHJldHVybiBpc09iamVjdCh2YWwpICYmIGlzRnVuY3Rpb24odmFsLnBpcGUpO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiBhIHZhbHVlIGlzIGEgRm9ybURhdGFcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdGhpbmcgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHZhbHVlIGlzIGFuIEZvcm1EYXRhLCBvdGhlcndpc2UgZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGb3JtRGF0YSh0aGluZykge1xuICB2YXIgcGF0dGVybiA9ICdbb2JqZWN0IEZvcm1EYXRhXSc7XG4gIHJldHVybiB0aGluZyAmJiAoXG4gICAgKHR5cGVvZiBGb3JtRGF0YSA9PT0gJ2Z1bmN0aW9uJyAmJiB0aGluZyBpbnN0YW5jZW9mIEZvcm1EYXRhKSB8fFxuICAgIHRvU3RyaW5nLmNhbGwodGhpbmcpID09PSBwYXR0ZXJuIHx8XG4gICAgKGlzRnVuY3Rpb24odGhpbmcudG9TdHJpbmcpICYmIHRoaW5nLnRvU3RyaW5nKCkgPT09IHBhdHRlcm4pXG4gICk7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgdmFsdWUgaXMgYSBVUkxTZWFyY2hQYXJhbXMgb2JqZWN0XG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7T2JqZWN0fSB2YWwgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHZhbHVlIGlzIGEgVVJMU2VhcmNoUGFyYW1zIG9iamVjdCwgb3RoZXJ3aXNlIGZhbHNlXG4gKi9cbnZhciBpc1VSTFNlYXJjaFBhcmFtcyA9IGtpbmRPZlRlc3QoJ1VSTFNlYXJjaFBhcmFtcycpO1xuXG4vKipcbiAqIFRyaW0gZXhjZXNzIHdoaXRlc3BhY2Ugb2ZmIHRoZSBiZWdpbm5pbmcgYW5kIGVuZCBvZiBhIHN0cmluZ1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIFN0cmluZyB0byB0cmltXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgU3RyaW5nIGZyZWVkIG9mIGV4Y2VzcyB3aGl0ZXNwYWNlXG4gKi9cbmZ1bmN0aW9uIHRyaW0oc3RyKSB7XG4gIHJldHVybiBzdHIudHJpbSA/IHN0ci50cmltKCkgOiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xufVxuXG4vKipcbiAqIERldGVybWluZSBpZiB3ZSdyZSBydW5uaW5nIGluIGEgc3RhbmRhcmQgYnJvd3NlciBlbnZpcm9ubWVudFxuICpcbiAqIFRoaXMgYWxsb3dzIGF4aW9zIHRvIHJ1biBpbiBhIHdlYiB3b3JrZXIsIGFuZCByZWFjdC1uYXRpdmUuXG4gKiBCb3RoIGVudmlyb25tZW50cyBzdXBwb3J0IFhNTEh0dHBSZXF1ZXN0LCBidXQgbm90IGZ1bGx5IHN0YW5kYXJkIGdsb2JhbHMuXG4gKlxuICogd2ViIHdvcmtlcnM6XG4gKiAgdHlwZW9mIHdpbmRvdyAtPiB1bmRlZmluZWRcbiAqICB0eXBlb2YgZG9jdW1lbnQgLT4gdW5kZWZpbmVkXG4gKlxuICogcmVhY3QtbmF0aXZlOlxuICogIG5hdmlnYXRvci5wcm9kdWN0IC0+ICdSZWFjdE5hdGl2ZSdcbiAqIG5hdGl2ZXNjcmlwdFxuICogIG5hdmlnYXRvci5wcm9kdWN0IC0+ICdOYXRpdmVTY3JpcHQnIG9yICdOUydcbiAqL1xuZnVuY3Rpb24gaXNTdGFuZGFyZEJyb3dzZXJFbnYoKSB7XG4gIGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiAobmF2aWdhdG9yLnByb2R1Y3QgPT09ICdSZWFjdE5hdGl2ZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IucHJvZHVjdCA9PT0gJ05hdGl2ZVNjcmlwdCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IucHJvZHVjdCA9PT0gJ05TJykpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIChcbiAgICB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCdcbiAgKTtcbn1cblxuLyoqXG4gKiBJdGVyYXRlIG92ZXIgYW4gQXJyYXkgb3IgYW4gT2JqZWN0IGludm9raW5nIGEgZnVuY3Rpb24gZm9yIGVhY2ggaXRlbS5cbiAqXG4gKiBJZiBgb2JqYCBpcyBhbiBBcnJheSBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCBwYXNzaW5nXG4gKiB0aGUgdmFsdWUsIGluZGV4LCBhbmQgY29tcGxldGUgYXJyYXkgZm9yIGVhY2ggaXRlbS5cbiAqXG4gKiBJZiAnb2JqJyBpcyBhbiBPYmplY3QgY2FsbGJhY2sgd2lsbCBiZSBjYWxsZWQgcGFzc2luZ1xuICogdGhlIHZhbHVlLCBrZXksIGFuZCBjb21wbGV0ZSBvYmplY3QgZm9yIGVhY2ggcHJvcGVydHkuXG4gKlxuICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IG9iaiBUaGUgb2JqZWN0IHRvIGl0ZXJhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBjYWxsYmFjayB0byBpbnZva2UgZm9yIGVhY2ggaXRlbVxuICovXG5mdW5jdGlvbiBmb3JFYWNoKG9iaiwgZm4pIHtcbiAgLy8gRG9uJ3QgYm90aGVyIGlmIG5vIHZhbHVlIHByb3ZpZGVkXG4gIGlmIChvYmogPT09IG51bGwgfHwgdHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBGb3JjZSBhbiBhcnJheSBpZiBub3QgYWxyZWFkeSBzb21ldGhpbmcgaXRlcmFibGVcbiAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKSB7XG4gICAgLyplc2xpbnQgbm8tcGFyYW0tcmVhc3NpZ246MCovXG4gICAgb2JqID0gW29ial07XG4gIH1cblxuICBpZiAoaXNBcnJheShvYmopKSB7XG4gICAgLy8gSXRlcmF0ZSBvdmVyIGFycmF5IHZhbHVlc1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gb2JqLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgZm4uY2FsbChudWxsLCBvYmpbaV0sIGksIG9iaik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIEl0ZXJhdGUgb3ZlciBvYmplY3Qga2V5c1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7XG4gICAgICAgIGZuLmNhbGwobnVsbCwgb2JqW2tleV0sIGtleSwgb2JqKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBY2NlcHRzIHZhcmFyZ3MgZXhwZWN0aW5nIGVhY2ggYXJndW1lbnQgdG8gYmUgYW4gb2JqZWN0LCB0aGVuXG4gKiBpbW11dGFibHkgbWVyZ2VzIHRoZSBwcm9wZXJ0aWVzIG9mIGVhY2ggb2JqZWN0IGFuZCByZXR1cm5zIHJlc3VsdC5cbiAqXG4gKiBXaGVuIG11bHRpcGxlIG9iamVjdHMgY29udGFpbiB0aGUgc2FtZSBrZXkgdGhlIGxhdGVyIG9iamVjdCBpblxuICogdGhlIGFyZ3VtZW50cyBsaXN0IHdpbGwgdGFrZSBwcmVjZWRlbmNlLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIHZhciByZXN1bHQgPSBtZXJnZSh7Zm9vOiAxMjN9LCB7Zm9vOiA0NTZ9KTtcbiAqIGNvbnNvbGUubG9nKHJlc3VsdC5mb28pOyAvLyBvdXRwdXRzIDQ1NlxuICogYGBgXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iajEgT2JqZWN0IHRvIG1lcmdlXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXN1bHQgb2YgYWxsIG1lcmdlIHByb3BlcnRpZXNcbiAqL1xuZnVuY3Rpb24gbWVyZ2UoLyogb2JqMSwgb2JqMiwgb2JqMywgLi4uICovKSB7XG4gIHZhciByZXN1bHQgPSB7fTtcbiAgZnVuY3Rpb24gYXNzaWduVmFsdWUodmFsLCBrZXkpIHtcbiAgICBpZiAoaXNQbGFpbk9iamVjdChyZXN1bHRba2V5XSkgJiYgaXNQbGFpbk9iamVjdCh2YWwpKSB7XG4gICAgICByZXN1bHRba2V5XSA9IG1lcmdlKHJlc3VsdFtrZXldLCB2YWwpO1xuICAgIH0gZWxzZSBpZiAoaXNQbGFpbk9iamVjdCh2YWwpKSB7XG4gICAgICByZXN1bHRba2V5XSA9IG1lcmdlKHt9LCB2YWwpO1xuICAgIH0gZWxzZSBpZiAoaXNBcnJheSh2YWwpKSB7XG4gICAgICByZXN1bHRba2V5XSA9IHZhbC5zbGljZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHRba2V5XSA9IHZhbDtcbiAgICB9XG4gIH1cblxuICBmb3IgKHZhciBpID0gMCwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBmb3JFYWNoKGFyZ3VtZW50c1tpXSwgYXNzaWduVmFsdWUpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogRXh0ZW5kcyBvYmplY3QgYSBieSBtdXRhYmx5IGFkZGluZyB0byBpdCB0aGUgcHJvcGVydGllcyBvZiBvYmplY3QgYi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYSBUaGUgb2JqZWN0IHRvIGJlIGV4dGVuZGVkXG4gKiBAcGFyYW0ge09iamVjdH0gYiBUaGUgb2JqZWN0IHRvIGNvcHkgcHJvcGVydGllcyBmcm9tXG4gKiBAcGFyYW0ge09iamVjdH0gdGhpc0FyZyBUaGUgb2JqZWN0IHRvIGJpbmQgZnVuY3Rpb24gdG9cbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIHJlc3VsdGluZyB2YWx1ZSBvZiBvYmplY3QgYVxuICovXG5mdW5jdGlvbiBleHRlbmQoYSwgYiwgdGhpc0FyZykge1xuICBmb3JFYWNoKGIsIGZ1bmN0aW9uIGFzc2lnblZhbHVlKHZhbCwga2V5KSB7XG4gICAgaWYgKHRoaXNBcmcgJiYgdHlwZW9mIHZhbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgYVtrZXldID0gYmluZCh2YWwsIHRoaXNBcmcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhW2tleV0gPSB2YWw7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGE7XG59XG5cbi8qKlxuICogUmVtb3ZlIGJ5dGUgb3JkZXIgbWFya2VyLiBUaGlzIGNhdGNoZXMgRUYgQkIgQkYgKHRoZSBVVEYtOCBCT00pXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbnRlbnQgd2l0aCBCT01cbiAqIEByZXR1cm4ge3N0cmluZ30gY29udGVudCB2YWx1ZSB3aXRob3V0IEJPTVxuICovXG5mdW5jdGlvbiBzdHJpcEJPTShjb250ZW50KSB7XG4gIGlmIChjb250ZW50LmNoYXJDb2RlQXQoMCkgPT09IDB4RkVGRikge1xuICAgIGNvbnRlbnQgPSBjb250ZW50LnNsaWNlKDEpO1xuICB9XG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlclxuICogQHBhcmFtIHtmdW5jdGlvbn0gY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ29uc3RydWN0b3JcbiAqIEBwYXJhbSB7b2JqZWN0fSBbcHJvcHNdXG4gKiBAcGFyYW0ge29iamVjdH0gW2Rlc2NyaXB0b3JzXVxuICovXG5cbmZ1bmN0aW9uIGluaGVyaXRzKGNvbnN0cnVjdG9yLCBzdXBlckNvbnN0cnVjdG9yLCBwcm9wcywgZGVzY3JpcHRvcnMpIHtcbiAgY29uc3RydWN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNvbnN0cnVjdG9yLnByb3RvdHlwZSwgZGVzY3JpcHRvcnMpO1xuICBjb25zdHJ1Y3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjb25zdHJ1Y3RvcjtcbiAgcHJvcHMgJiYgT2JqZWN0LmFzc2lnbihjb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3BzKTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIG9iamVjdCB3aXRoIGRlZXAgcHJvdG90eXBlIGNoYWluIHRvIGEgZmxhdCBvYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBzb3VyY2VPYmogc291cmNlIG9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IFtkZXN0T2JqXVxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2ZpbHRlcl1cbiAqIEByZXR1cm5zIHtPYmplY3R9XG4gKi9cblxuZnVuY3Rpb24gdG9GbGF0T2JqZWN0KHNvdXJjZU9iaiwgZGVzdE9iaiwgZmlsdGVyKSB7XG4gIHZhciBwcm9wcztcbiAgdmFyIGk7XG4gIHZhciBwcm9wO1xuICB2YXIgbWVyZ2VkID0ge307XG5cbiAgZGVzdE9iaiA9IGRlc3RPYmogfHwge307XG5cbiAgZG8ge1xuICAgIHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoc291cmNlT2JqKTtcbiAgICBpID0gcHJvcHMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0gPiAwKSB7XG4gICAgICBwcm9wID0gcHJvcHNbaV07XG4gICAgICBpZiAoIW1lcmdlZFtwcm9wXSkge1xuICAgICAgICBkZXN0T2JqW3Byb3BdID0gc291cmNlT2JqW3Byb3BdO1xuICAgICAgICBtZXJnZWRbcHJvcF0gPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBzb3VyY2VPYmogPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc291cmNlT2JqKTtcbiAgfSB3aGlsZSAoc291cmNlT2JqICYmICghZmlsdGVyIHx8IGZpbHRlcihzb3VyY2VPYmosIGRlc3RPYmopKSAmJiBzb3VyY2VPYmogIT09IE9iamVjdC5wcm90b3R5cGUpO1xuXG4gIHJldHVybiBkZXN0T2JqO1xufVxuXG4vKlxuICogZGV0ZXJtaW5lcyB3aGV0aGVyIGEgc3RyaW5nIGVuZHMgd2l0aCB0aGUgY2hhcmFjdGVycyBvZiBhIHNwZWNpZmllZCBzdHJpbmdcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWFyY2hTdHJpbmdcbiAqIEBwYXJhbSB7TnVtYmVyfSBbcG9zaXRpb249IDBdXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gZW5kc1dpdGgoc3RyLCBzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gIHN0ciA9IFN0cmluZyhzdHIpO1xuICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCB8fCBwb3NpdGlvbiA+IHN0ci5sZW5ndGgpIHtcbiAgICBwb3NpdGlvbiA9IHN0ci5sZW5ndGg7XG4gIH1cbiAgcG9zaXRpb24gLT0gc2VhcmNoU3RyaW5nLmxlbmd0aDtcbiAgdmFyIGxhc3RJbmRleCA9IHN0ci5pbmRleE9mKHNlYXJjaFN0cmluZywgcG9zaXRpb24pO1xuICByZXR1cm4gbGFzdEluZGV4ICE9PSAtMSAmJiBsYXN0SW5kZXggPT09IHBvc2l0aW9uO1xufVxuXG5cbi8qKlxuICogUmV0dXJucyBuZXcgYXJyYXkgZnJvbSBhcnJheSBsaWtlIG9iamVjdFxuICogQHBhcmFtIHsqfSBbdGhpbmddXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIHRvQXJyYXkodGhpbmcpIHtcbiAgaWYgKCF0aGluZykgcmV0dXJuIG51bGw7XG4gIHZhciBpID0gdGhpbmcubGVuZ3RoO1xuICBpZiAoaXNVbmRlZmluZWQoaSkpIHJldHVybiBudWxsO1xuICB2YXIgYXJyID0gbmV3IEFycmF5KGkpO1xuICB3aGlsZSAoaS0tID4gMCkge1xuICAgIGFycltpXSA9IHRoaW5nW2ldO1xuICB9XG4gIHJldHVybiBhcnI7XG59XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBmdW5jLW5hbWVzXG52YXIgaXNUeXBlZEFycmF5ID0gKGZ1bmN0aW9uKFR5cGVkQXJyYXkpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGZ1bmMtbmFtZXNcbiAgcmV0dXJuIGZ1bmN0aW9uKHRoaW5nKSB7XG4gICAgcmV0dXJuIFR5cGVkQXJyYXkgJiYgdGhpbmcgaW5zdGFuY2VvZiBUeXBlZEFycmF5O1xuICB9O1xufSkodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihVaW50OEFycmF5KSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpc0FycmF5OiBpc0FycmF5LFxuICBpc0FycmF5QnVmZmVyOiBpc0FycmF5QnVmZmVyLFxuICBpc0J1ZmZlcjogaXNCdWZmZXIsXG4gIGlzRm9ybURhdGE6IGlzRm9ybURhdGEsXG4gIGlzQXJyYXlCdWZmZXJWaWV3OiBpc0FycmF5QnVmZmVyVmlldyxcbiAgaXNTdHJpbmc6IGlzU3RyaW5nLFxuICBpc051bWJlcjogaXNOdW1iZXIsXG4gIGlzT2JqZWN0OiBpc09iamVjdCxcbiAgaXNQbGFpbk9iamVjdDogaXNQbGFpbk9iamVjdCxcbiAgaXNVbmRlZmluZWQ6IGlzVW5kZWZpbmVkLFxuICBpc0RhdGU6IGlzRGF0ZSxcbiAgaXNGaWxlOiBpc0ZpbGUsXG4gIGlzQmxvYjogaXNCbG9iLFxuICBpc0Z1bmN0aW9uOiBpc0Z1bmN0aW9uLFxuICBpc1N0cmVhbTogaXNTdHJlYW0sXG4gIGlzVVJMU2VhcmNoUGFyYW1zOiBpc1VSTFNlYXJjaFBhcmFtcyxcbiAgaXNTdGFuZGFyZEJyb3dzZXJFbnY6IGlzU3RhbmRhcmRCcm93c2VyRW52LFxuICBmb3JFYWNoOiBmb3JFYWNoLFxuICBtZXJnZTogbWVyZ2UsXG4gIGV4dGVuZDogZXh0ZW5kLFxuICB0cmltOiB0cmltLFxuICBzdHJpcEJPTTogc3RyaXBCT00sXG4gIGluaGVyaXRzOiBpbmhlcml0cyxcbiAgdG9GbGF0T2JqZWN0OiB0b0ZsYXRPYmplY3QsXG4gIGtpbmRPZjoga2luZE9mLFxuICBraW5kT2ZUZXN0OiBraW5kT2ZUZXN0LFxuICBlbmRzV2l0aDogZW5kc1dpdGgsXG4gIHRvQXJyYXk6IHRvQXJyYXksXG4gIGlzVHlwZWRBcnJheTogaXNUeXBlZEFycmF5LFxuICBpc0ZpbGVMaXN0OiBpc0ZpbGVMaXN0XG59O1xuIiwiLy8gSW1wb3J0c1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18gZnJvbSBcIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9jc3NXaXRoTWFwcGluZ1RvU3RyaW5nLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fIGZyb20gXCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2dldFVybC5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8wX19fIGZyb20gXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLndvZmZcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMV9fXyBmcm9tIFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci50dGZcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMl9fXyBmcm9tIFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci5zdmdcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfM19fXyBmcm9tIFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9vay53b2ZmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzRfX18gZnJvbSBcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvb2sudHRmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzVfX18gZnJvbSBcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvb2suc3ZnXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzZfX18gZnJvbSBcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQuZW90XCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzdfX18gZnJvbSBcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQud29mZlwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF84X19fIGZyb20gXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLnR0ZlwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF85X19fIGZyb20gXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLnN2Z1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xMF9fXyBmcm9tIFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIuZW90XCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzExX19fIGZyb20gXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci53b2ZmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzEyX19fIGZyb20gXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci50dGZcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMTNfX18gZnJvbSBcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLnN2Z1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xNF9fXyBmcm9tIFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2suZW90XCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE1X19fIGZyb20gXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay53b2ZmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE2X19fIGZyb20gXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay50dGZcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMTdfX18gZnJvbSBcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1Cb29rLnN2Z1wiO1xudmFyIF9fX0NTU19MT0FERVJfRVhQT1JUX19fID0gX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzBfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8wX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xX19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMV9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMl9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzJfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzNfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8zX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF80X19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfNF9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfNV9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzVfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzZfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF82X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF83X19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfN19fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfOF9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzhfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzlfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF85X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xMF9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzEwX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xMV9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzExX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xMl9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzEyX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xM19fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzEzX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xNF9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE0X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xNV9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE1X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xNl9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE2X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xN19fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE3X19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBcIkBjaGFyc2V0IFxcXCJVVEYtOFxcXCI7XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZUludGxcXFwiO1xcbiAgc3JjOiB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8wX19fICsgXCIpO1xcbiAgc3JjOiBsb2NhbChcXFwi4pi6XFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzBfX18gKyBcIikgZm9ybWF0KFxcXCJ3b2ZmXFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzFfX18gKyBcIikgZm9ybWF0KFxcXCJ0cnVldHlwZVxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8yX19fICsgXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbm9ybWFsO1xcbiAgZm9udC1zdHlsZTogNDAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzNfX18gKyBcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfM19fXyArIFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfNF9fXyArIFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzVfX18gKyBcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBtZWRpdW07XFxuICBmb250LXN0eWxlOiA1MDA7XFxufVxcbkBmb250LWZhY2Uge1xcbiAgZm9udC1mYW1pbHk6IFxcXCJTdWlzc2VJbnRsXFxcIjtcXG4gIHNyYzogdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfNl9fXyArIFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF83X19fICsgXCIpIGZvcm1hdChcXFwid29mZlxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF84X19fICsgXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfOV9fXyArIFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XFxuICBmb250LXN0eWxlOiA3MDA7XFxufVxcbkBmb250LWZhY2Uge1xcbiAgZm9udC1mYW1pbHk6IFxcXCJTdWlzc2VXb3Jrc1xcXCI7XFxuICBzcmM6IHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzEwX19fICsgXCIpO1xcbiAgc3JjOiBsb2NhbChcXFwi4pi6XFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzExX19fICsgXCIpIGZvcm1hdChcXFwid29mZlxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xMl9fXyArIFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzEzX19fICsgXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbm9ybWFsO1xcbiAgZm9udC1zdHlsZTogNDAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlV29ya3NcXFwiO1xcbiAgc3JjOiB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xNF9fXyArIFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xNV9fXyArIFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTZfX18gKyBcIikgZm9ybWF0KFxcXCJ0cnVldHlwZVxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xN19fXyArIFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IG1lZGl1bTtcXG4gIGZvbnQtc3R5bGU6IDUwMDtcXG59XFxuLmJ1dHRvbiB7XFxuICAtd2Via2l0LXRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2U7XFxuICAtby10cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlO1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuM3MgZWFzZTtcXG59XFxuXFxuYm9keSB7XFxuICBtYXJnaW46IDA7XFxufVxcblxcbi53cmFwcGVyIHtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXG59XFxuXFxuLmhlYWRlci13cmFwcGVyIHtcXG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjNTM1MzUzO1xcbn1cXG5cXG4uZm9vdGVyLXdyYXBwZXIge1xcbiAgYm9yZGVyLXRvcDogMXB4IHNvbGlkICM1MzUzNTM7XFxufVxcblxcbi53aGl0ZSB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmZmZmO1xcbn1cXG5cXG4ubWFpbi1jb250YWluZXIge1xcbiAgd2lkdGg6IDEyNDBweDtcXG4gIG1hcmdpbjogYXV0bztcXG59XFxuXFxuaHRtbCB7XFxuICBmb250LXNpemU6IDE2cHg7XFxufVxcblxcbi5zaGFkb3ctb3ZlcmxheSB7XFxuICB3aWR0aDogMTAwJTtcXG4gIGhlaWdodDogMTAwJTtcXG4gIGJhY2tncm91bmQ6ICMxODFlMzA7XFxuICBvcGFjaXR5OiAwLjY7XFxuICB6LWluZGV4OiA5MDtcXG4gIHRvcDogMDtcXG4gIHBvc2l0aW9uOiBmaXhlZDtcXG59XFxuXFxuLmhpZGRlbiB7XFxuICBkaXNwbGF5OiBub25lO1xcbn1cXG5cXG4uYnV0dG9uIHtcXG4gIGNvbG9yOiAjZmZmZmZmO1xcbiAgYmFja2dyb3VuZDogIzAwMDAwMDtcXG4gIHBhZGRpbmc6IDAuNXJlbSAwLjhyZW07XFxuICBib3JkZXI6IDA7XFxuICBmb250LXNpemU6IDAuOXJlbTtcXG4gIGJvcmRlci1yYWRpdXM6IDJyZW07XFxuICBjdXJzb3I6IHBvaW50ZXI7XFxufVxcblxcbi5idXR0b25fbGlnaHQge1xcbiAgYmFja2dyb3VuZDogI2ZmZmZmZjtcXG4gIG91dGxpbmU6IDFweCBzb2xpZCAjMDAwMDAwO1xcbiAgY29sb3I6ICMwMDAwMDA7XFxufVxcblxcbi5idXR0b246aG92ZXIge1xcbiAgYmFja2dyb3VuZDogI0UzRkI4RjtcXG4gIG91dGxpbmU6IDFweCBzb2xpZCAjMDAwMDAwO1xcbiAgY29sb3I6ICMwMDAwMDA7XFxufVwiLCBcIlwiLHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIndlYnBhY2s6Ly8uLy4uLy4uLy4uLy4uLy4uLyVEMCVBMCVEMCVCMCVEMCVCMSVEMCVCRSVEMSU4NyVEMCVCOCVEMCVCOSUyMCVEMSU4MSVEMSU4MiVEMCVCRSVEMCVCQi9naXQvdHJhc2gvcnNsYW5nZy9yc2xhbmcvc3JjL2NvbXBvbmVudHMvdmlldy9BcHBWaWV3LnNjc3NcIixcIndlYnBhY2s6Ly8uL3NyYy9jb21wb25lbnRzL3ZpZXcvYmFzZS1zdHlsZXMuc2Nzc1wiLFwid2VicGFjazovLy4vc3JjL2NvbXBvbmVudHMvdmlldy9BcHBWaWV3LnNjc3NcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIkFBQUEsZ0JBQWdCO0FDbURmO0VBQ0MseUJBQUE7RUFDQSw0Q0FBQTtFQUNBLDBMQUFBO0VBQ0EsbUJBQUE7RUFDQSxlQUFBO0FEakRGO0FDb0RDO0VBQ0MseUJBQUE7RUFDQSw0Q0FBQTtFQUNBLDBMQUFBO0VBQ0EsbUJBQUE7RUFDQSxlQUFBO0FEbERGO0FDcURDO0VBQ0EseUJBQUE7RUFDQSw0Q0FBQTtFQUNBLDBMQUFBO0VBQ0EsaUJBQUE7RUFDQSxlQUFBO0FEbkREO0FDc0RDO0VBQ0EsMEJBQUE7RUFDQSw2Q0FBQTtFQUNBLDZMQUFBO0VBQ0EsbUJBQUE7RUFDQSxlQUFBO0FEcEREO0FDdURBO0VBQ0MsMEJBQUE7RUFDQSw2Q0FBQTtFQUNBLDZMQUFBO0VBQ0EsbUJBQUE7RUFDQSxlQUFBO0FEckREO0FFakNBO0VBQ0UsaUNBQUE7RUFDQSw0QkFBQTtFQUNBLHlCQUFBO0FGbUNGOztBRWhDQTtFQUNFLFNBQUE7QUZtQ0Y7O0FFaENBO0VBQ0UsV0FBQTtFQUNBLHNCQUFBO0FGbUNGOztBRWhDQTtFQUNFLGdDQUFBO0FGbUNGOztBRWhDQTtFQUNFLDZCQUFBO0FGbUNGOztBRTVCQTtFQUNFLHlCREdjO0FENEJoQjs7QUU1QkE7RUFDRSxhQUFBO0VBQ0EsWUFBQTtBRitCRjs7QUU1QkE7RUFDRSxlQUFBO0FGK0JGOztBRTVCQTtFQUNFLFdBQUE7RUFDQSxZQUFBO0VBQ0EsbUJBQUE7RUFDQSxZQUFBO0VBQ0EsV0FBQTtFQUNBLE1BQUE7RUFDQSxlQUFBO0FGK0JGOztBRTVCQTtFQUNFLGFBQUE7QUYrQkY7O0FFNUJBO0VBQ0UsY0R4QmM7RUN5QmQsbUJEdkJjO0VDd0JkLHNCQUFBO0VBQ0EsU0FBQTtFQUNBLGlCQUFBO0VBQ0EsbUJBQUE7RUFDQSxlQUFBO0FGK0JGOztBRTVCQTtFQUNFLG1CRGxDYztFQ21DZCwwQkFBQTtFQUNBLGNEbENjO0FEaUVoQjs7QUUzQkE7RUFDRSxtQkQ3Qlk7RUM4QlosMEJBQUE7RUFDQSxjRHpDYztBRHVFaEJcIixcInNvdXJjZXNDb250ZW50XCI6W1wiQGNoYXJzZXQgXFxcIlVURi04XFxcIjtcXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci53b2ZmXFxcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLndvZmZcXFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLnR0ZlxcXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLnN2Z1xcXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbm9ybWFsO1xcbiAgZm9udC1zdHlsZTogNDAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9vay53b2ZmXFxcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLndvZmZcXFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLnR0ZlxcXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLnN2Z1xcXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbWVkaXVtO1xcbiAgZm9udC1zdHlsZTogNTAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9sZC5lb3RcXFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQud29mZlxcXCIpIGZvcm1hdChcXFwid29mZlxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQudHRmXFxcIikgZm9ybWF0KFxcXCJ0cnVldHlwZVxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQuc3ZnXFxcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xcbiAgZm9udC1zdHlsZTogNzAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlV29ya3NcXFwiO1xcbiAgc3JjOiB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLmVvdFxcXCIpO1xcbiAgc3JjOiBsb2NhbChcXFwi4pi6XFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIud29mZlxcXCIpIGZvcm1hdChcXFwid29mZlxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLnR0ZlxcXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci5zdmdcXFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcXG4gIGZvbnQtc3R5bGU6IDQwMDtcXG59XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZVdvcmtzXFxcIjtcXG4gIHNyYzogdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay5lb3RcXFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1Cb29rLndvZmZcXFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay50dGZcXFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2suc3ZnXFxcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBtZWRpdW07XFxuICBmb250LXN0eWxlOiA1MDA7XFxufVxcbi5idXR0b24ge1xcbiAgLXdlYmtpdC10cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlO1xcbiAgLW8tdHJhbnNpdGlvbjogYWxsIDAuM3MgZWFzZTtcXG4gIHRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2U7XFxufVxcblxcbmJvZHkge1xcbiAgbWFyZ2luOiAwO1xcbn1cXG5cXG4ud3JhcHBlciB7XFxuICB3aWR0aDogMTAwJTtcXG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxufVxcblxcbi5oZWFkZXItd3JhcHBlciB7XFxuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgIzUzNTM1MztcXG59XFxuXFxuLmZvb3Rlci13cmFwcGVyIHtcXG4gIGJvcmRlci10b3A6IDFweCBzb2xpZCAjNTM1MzUzO1xcbn1cXG5cXG4ud2hpdGUge1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZmZmZjtcXG59XFxuXFxuLm1haW4tY29udGFpbmVyIHtcXG4gIHdpZHRoOiAxMjQwcHg7XFxuICBtYXJnaW46IGF1dG87XFxufVxcblxcbmh0bWwge1xcbiAgZm9udC1zaXplOiAxNnB4O1xcbn1cXG5cXG4uc2hhZG93LW92ZXJsYXkge1xcbiAgd2lkdGg6IDEwMCU7XFxuICBoZWlnaHQ6IDEwMCU7XFxuICBiYWNrZ3JvdW5kOiAjMTgxZTMwO1xcbiAgb3BhY2l0eTogMC42O1xcbiAgei1pbmRleDogOTA7XFxuICB0b3A6IDA7XFxuICBwb3NpdGlvbjogZml4ZWQ7XFxufVxcblxcbi5oaWRkZW4ge1xcbiAgZGlzcGxheTogbm9uZTtcXG59XFxuXFxuLmJ1dHRvbiB7XFxuICBjb2xvcjogI2ZmZmZmZjtcXG4gIGJhY2tncm91bmQ6ICMwMDAwMDA7XFxuICBwYWRkaW5nOiAwLjVyZW0gMC44cmVtO1xcbiAgYm9yZGVyOiAwO1xcbiAgZm9udC1zaXplOiAwLjlyZW07XFxuICBib3JkZXItcmFkaXVzOiAycmVtO1xcbiAgY3Vyc29yOiBwb2ludGVyO1xcbn1cXG5cXG4uYnV0dG9uX2xpZ2h0IHtcXG4gIGJhY2tncm91bmQ6ICNmZmZmZmY7XFxuICBvdXRsaW5lOiAxcHggc29saWQgIzAwMDAwMDtcXG4gIGNvbG9yOiAjMDAwMDAwO1xcbn1cXG5cXG4uYnV0dG9uOmhvdmVyIHtcXG4gIGJhY2tncm91bmQ6ICNFM0ZCOEY7XFxuICBvdXRsaW5lOiAxcHggc29saWQgIzAwMDAwMDtcXG4gIGNvbG9yOiAjMDAwMDAwO1xcbn1cIixcIiRmYS1mb250LXBhdGg6ICcuLi8uLi9hc3NldHMvZm9udHMvJyAhZGVmYXVsdDtcXG5cXG4vLyDRiNGA0LjRhNGC0YtcXG4kcnVzRm9udDogJ1N1aXNzZUludGwsIFRhaG9tYSwgc2Fucy1zZXJpZic7XFxuJGVuRm9udDogJ1N1aXNzZVdvcmtzLCBHZW9yZ2lhLCBTZXJpZic7XFxuXFxuLy8g0YjRgNC40YTRgtGLLCDQvtGB0L3QvtCy0L3Ri9C1INGA0LDQt9C80LXRgNGLXFxuJHRleHRIZWFkZXI6IDNyZW07XFxuJHRleHRTdWJ0aXRsZTogMnJlbTtcXG4kdGV4dEJhc2ljOiAxLjVyZW07XFxuJHRleHREZXNjcmlwdGlvbjogMS4yNXJlbTtcXG5cXG4vLyDRhtCy0LXRgtCwINC00LvRjyDQuNC60L7QvdC+0Log0L3QsCDQutCw0YDRgtC+0YfQutCwINCh0LvQvtC20L3QvtC1LCDQmNC30YPRh9C10L3QvdC+0LVcXG4kaWNvbkNvbG9yQ29tcGxleDogI0ZGMDAwMDtcXG4kaWNvbkNvbG9yU3R1ZGllZDogIzY1RDcyRjtcXG5cXG4vLyDRhtCy0LXRgtCwINCw0LrRgtC40LLQvdGL0YUg0LrQvdC+0L/QvtC6INCyINCh0LvQvtCy0LDRgNC1XFxuJGJ0bkNvbG9yVW5pdDE6ICNFOTJEMzg7XFxuJGJ0bkNvbG9yVW5pdDI6ICNGMzZGMUU7XFxuJGJ0bkNvbG9yVW5pdDM6ICNGRENBMUY7XFxuJGJ0bkNvbG9yVW5pdDQ6ICM3QUI2M0U7XFxuJGJ0bkNvbG9yVW5pdDU6ICMzNUI0RDA7XFxuJGJ0bkNvbG9yVW5pdDY6ICMwODU1RTQ7XFxuXFxuLy8g0YbQstC10YLQsCDQsNC60YLQuNCy0L3Ri9GFINGE0L7QvdCwINC60LDRgNGC0L7Rh9C10Log0LIg0KHQu9C+0LLQsNGA0LVcXG4kYmdDb2xvclVuaXQxOiAjRkZFQUVCO1xcbiRiZ0NvbG9yVW5pdDI6ICNGRkYwRTc7XFxuJGJnQ29sb3JVbml0MzogI0ZGRjhFMTtcXG4kYmdDb2xvclVuaXQ0OiAjRUVGRERFO1xcbiRiZ0NvbG9yVW5pdDU6ICNCOUYyRkY7XFxuJGJnQ29sb3JVbml0NjogI0IyQ0FGOTtcXG5cXG4vLyDRhtCy0LXRgtCwINGE0L7QvdC+0LIg0Lgg0YLQtdC60YHRgtCwINC90LAg0YHQsNC50YLQtVxcbiRiZ1RDb2xvcldoaXRlOiAjZmZmZmZmO1xcbiRiZ1RDb2xvckdyZXk6ICNFOUU5RTk7XFxuJGJnVENvbG9yQmxhY2s6ICMwMDAwMDA7XFxuXFxuLy8g0YLQtdC60YHRgiDQvdC1INCw0LrRgtC40LLQvdGL0YUg0Y3Qu9C10LzQtdC90YLQvtCyKNGA0LDQt9C00LXQu9GLINC80LXQvdGOINC4INGC0L8pXFxuJFRleHROb3RBY3RpdmU6ICM4OTg5ODk7XFxuXFxuLy8g0YbQstC10YLQvdGL0LUg0Y3Qu9C10LzQtdC90YLRiyDQuNGB0L/QvtC70YzQt9GD0LXQvNGL0LUg0L3QsCDRgdCw0LnRgtC1XFxuJGVsZW1Db2xvckdyZWVuOiAjRDdFOTc3O1xcbiRlbGVtQ29sb3JDaWFuOiAjODlGQ0ZCO1xcblxcbi8vINC60L3QvtC/0LrQsCDQv9C+INGF0L7QstC10YDRg1xcbiRjb2xvckJ0bkhvdjogI0UzRkI4RjsgXFxuXFxuLy8g0YTQvtGA0LzQsCDRgNC10LPQuNGB0YLRgNCw0YbQuNC4LCDQstGF0L7QtNCwXFxuJGJnQ29sb3JJbnB1dDogI0YxRjFGMTtcXG5cXG5cXG4gQGZvbnQtZmFjZSB7XFxuIFxcdGZvbnQtZmFtaWx5OiAnU3Vpc3NlSW50bCc7XFxuIFxcdHNyYzogdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlSW50bC1SZWd1bGFyLndvZmYnKTtcXG4gXFx0c3JjOiBsb2NhbCgn4pi6JyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtUmVndWxhci53b2ZmJykgZm9ybWF0KCd3b2ZmJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtUmVndWxhci50dGYnKSBmb3JtYXQoJ3RydWV0eXBlJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtUmVndWxhci5zdmcnKSBmb3JtYXQoJ3N2ZycpO1xcbiBcXHRmb250LXdlaWdodDogbm9ybWFsO1xcbiBcXHRmb250LXN0eWxlOiA0MDA7XFxuIH1cXG5cXG4gQGZvbnQtZmFjZSB7XFxuIFxcdGZvbnQtZmFtaWx5OiAnU3Vpc3NlSW50bCc7XFxuIFxcdHNyYzogdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlSW50bC1Cb29rLndvZmYnKTtcXG4gXFx0c3JjOiBsb2NhbCgn4pi6JyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9vay53b2ZmJykgZm9ybWF0KCd3b2ZmJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9vay50dGYnKSBmb3JtYXQoJ3RydWV0eXBlJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9vay5zdmcnKSBmb3JtYXQoJ3N2ZycpO1xcbiBcXHRmb250LXdlaWdodDogbWVkaXVtO1xcbiBcXHRmb250LXN0eWxlOiA1MDA7XFxuIH1cXG5cXG4gQGZvbnQtZmFjZSB7XFxuXFx0Zm9udC1mYW1pbHk6ICdTdWlzc2VJbnRsJztcXG5cXHRzcmM6IHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9sZC5lb3QnKTtcXG5cXHRzcmM6IGxvY2FsKCfimLonKSwgdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlSW50bC1Cb2xkLndvZmYnKSBmb3JtYXQoJ3dvZmYnKSwgdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlSW50bC1Cb2xkLnR0ZicpIGZvcm1hdCgndHJ1ZXR5cGUnKSwgdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlSW50bC1Cb2xkLnN2ZycpIGZvcm1hdCgnc3ZnJyk7XFxuXFx0Zm9udC13ZWlnaHQ6IGJvbGQ7XFxuXFx0Zm9udC1zdHlsZTogNzAwO1xcbn1cXG5cXG4gQGZvbnQtZmFjZSB7XFxuXFx0Zm9udC1mYW1pbHk6ICdTdWlzc2VXb3Jrcyc7XFxuXFx0c3JjOiB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VXb3Jrcy1SZWd1bGFyLmVvdCcpO1xcblxcdHNyYzogbG9jYWwoJ+KYuicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VXb3Jrcy1SZWd1bGFyLndvZmYnKSBmb3JtYXQoJ3dvZmYnKSwgdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtUmVndWxhci50dGYnKSBmb3JtYXQoJ3RydWV0eXBlJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZVdvcmtzLVJlZ3VsYXIuc3ZnJykgZm9ybWF0KCdzdmcnKTtcXG5cXHRmb250LXdlaWdodDogbm9ybWFsO1xcblxcdGZvbnQtc3R5bGU6IDQwMDtcXG59XFxuXFxuQGZvbnQtZmFjZSB7XFxuXFx0Zm9udC1mYW1pbHk6ICdTdWlzc2VXb3Jrcyc7XFxuXFx0c3JjOiB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VXb3Jrcy1Cb29rLmVvdCcpO1xcblxcdHNyYzogbG9jYWwoJ+KYuicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VXb3Jrcy1Cb29rLndvZmYnKSBmb3JtYXQoJ3dvZmYnKSwgdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtQm9vay50dGYnKSBmb3JtYXQoJ3RydWV0eXBlJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZVdvcmtzLUJvb2suc3ZnJykgZm9ybWF0KCdzdmcnKTtcXG5cXHRmb250LXdlaWdodDogbWVkaXVtO1xcblxcdGZvbnQtc3R5bGU6IDUwMDtcXG59XFxuXCIsXCJAaW1wb3J0ICdiYXNlLXN0eWxlcy5zY3NzJztcXG5cXG4uYnV0dG9uICB7XFxuICAtd2Via2l0LXRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2U7XFxuICAtby10cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlO1xcbiAgdHJhbnNpdGlvbjogYWxsIDAuM3MgZWFzZTtcXG59XFxuXFxuYm9keSB7XFxuICBtYXJnaW46IDA7XFxufVxcblxcbi53cmFwcGVyIHtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcXG59XFxuXFxuLmhlYWRlci13cmFwcGVye1xcbiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICM1MzUzNTM7XFxufVxcblxcbi5mb290ZXItd3JhcHBlciB7XFxuICBib3JkZXItdG9wOiAxcHggc29saWQgIzUzNTM1MztcXG59XFxuXFxuLy8gLmdyYXkge1xcbi8vICAgYmFja2dyb3VuZC1jb2xvcjogJGdyYXlCZztcXG4vLyB9XFxuXFxuLndoaXRlIHtcXG4gIGJhY2tncm91bmQtY29sb3I6ICRiZ1RDb2xvcldoaXRlO1xcbn1cXG5cXG4ubWFpbi1jb250YWluZXJ7XFxuICB3aWR0aDogMTI0MHB4O1xcbiAgbWFyZ2luOiBhdXRvO1xcbn1cXG5cXG5odG1sIHtcXG4gIGZvbnQtc2l6ZTogMTZweDtcXG59XFxuXFxuLnNoYWRvdy1vdmVybGF5IHtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgaGVpZ2h0OiAxMDAlO1xcbiAgYmFja2dyb3VuZDogIzE4MWUzMDtcXG4gIG9wYWNpdHk6IDAuNjtcXG4gIHotaW5kZXg6IDkwO1xcbiAgdG9wOiAwO1xcbiAgcG9zaXRpb246IGZpeGVkO1xcbn1cXG5cXG4uaGlkZGVuIHtcXG4gIGRpc3BsYXk6IG5vbmU7XFxufVxcblxcbi5idXR0b24ge1xcbiAgY29sb3I6ICRiZ1RDb2xvcldoaXRlO1xcbiAgYmFja2dyb3VuZDogJGJnVENvbG9yQmxhY2s7XFxuICBwYWRkaW5nOiAwLjVyZW0gMC44cmVtO1xcbiAgYm9yZGVyOiAwO1xcbiAgZm9udC1zaXplOiAwLjlyZW07XFxuICBib3JkZXItcmFkaXVzOiAycmVtO1xcbiAgY3Vyc29yOiBwb2ludGVyO1xcbn1cXG5cXG4uYnV0dG9uX2xpZ2h0IHtcXG4gIGJhY2tncm91bmQ6ICRiZ1RDb2xvcldoaXRlO1xcbiAgb3V0bGluZTogMXB4IHNvbGlkICRiZ1RDb2xvckJsYWNrO1xcbiAgY29sb3I6ICRiZ1RDb2xvckJsYWNrO1xcbn1cXG5cXG5cXG4uYnV0dG9uOmhvdmVyIHtcXG4gIGJhY2tncm91bmQ6ICRjb2xvckJ0bkhvdjtcXG4gIG91dGxpbmU6IDFweCBzb2xpZCAkYmdUQ29sb3JCbGFjaztcXG4gIGNvbG9yOiAkYmdUQ29sb3JCbGFjaztcXG59XCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIi8vIEltcG9ydHNcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fIGZyb20gXCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvY3NzV2l0aE1hcHBpbmdUb1N0cmluZy5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2FwaS5qc1wiO1xudmFyIF9fX0NTU19MT0FERVJfRVhQT1JUX19fID0gX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18pO1xuLy8gTW9kdWxlXG5fX19DU1NfTE9BREVSX0VYUE9SVF9fXy5wdXNoKFttb2R1bGUuaWQsIFwiXCIsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W10sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIlwiLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIi8vIEltcG9ydHNcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fIGZyb20gXCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvY3NzV2l0aE1hcHBpbmdUb1N0cmluZy5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2FwaS5qc1wiO1xudmFyIF9fX0NTU19MT0FERVJfRVhQT1JUX19fID0gX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18pO1xuLy8gTW9kdWxlXG5fX19DU1NfTE9BREVSX0VYUE9SVF9fXy5wdXNoKFttb2R1bGUuaWQsIFwiXCIsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W10sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIlwiLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIi8vIEltcG9ydHNcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fIGZyb20gXCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvY3NzV2l0aE1hcHBpbmdUb1N0cmluZy5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2FwaS5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18gZnJvbSBcIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9nZXRVcmwuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMF9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci53b2ZmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzFfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLVJlZ3VsYXIudHRmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzJfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLVJlZ3VsYXIuc3ZnXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzNfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvb2sud29mZlwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF80X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLnR0ZlwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF81X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLnN2Z1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF82X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLmVvdFwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF83X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLndvZmZcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfOF9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9sZC50dGZcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfOV9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9sZC5zdmdcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMTBfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLmVvdFwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xMV9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIud29mZlwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xMl9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIudHRmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzEzX19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci5zdmdcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMTRfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1Cb29rLmVvdFwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xNV9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2sud29mZlwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xNl9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2sudHRmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE3X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay5zdmdcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8wX19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMF9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMV9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzFfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzJfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8yX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8zX19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfM19fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfNF9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzRfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzVfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF81X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF82X19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfNl9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfN19fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzdfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzhfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF84X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF85X19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfOV9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTBfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xMF9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTFfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xMV9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTJfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xMl9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTNfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xM19fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTRfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xNF9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTVfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xNV9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTZfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xNl9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTdfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xN19fXyk7XG4vLyBNb2R1bGVcbl9fX0NTU19MT0FERVJfRVhQT1JUX19fLnB1c2goW21vZHVsZS5pZCwgXCJAY2hhcnNldCBcXFwiVVRGLThcXFwiO1xcbkBmb250LWZhY2Uge1xcbiAgZm9udC1mYW1pbHk6IFxcXCJTdWlzc2VJbnRsXFxcIjtcXG4gIHNyYzogdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMF9fXyArIFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8wX19fICsgXCIpIGZvcm1hdChcXFwid29mZlxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xX19fICsgXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMl9fXyArIFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcXG4gIGZvbnQtc3R5bGU6IDQwMDtcXG59XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZUludGxcXFwiO1xcbiAgc3JjOiB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8zX19fICsgXCIpO1xcbiAgc3JjOiBsb2NhbChcXFwi4pi6XFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzNfX18gKyBcIikgZm9ybWF0KFxcXCJ3b2ZmXFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzRfX18gKyBcIikgZm9ybWF0KFxcXCJ0cnVldHlwZVxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF81X19fICsgXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbWVkaXVtO1xcbiAgZm9udC1zdHlsZTogNTAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzZfX18gKyBcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfN19fXyArIFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfOF9fXyArIFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzlfX18gKyBcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xcbiAgZm9udC1zdHlsZTogNzAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlV29ya3NcXFwiO1xcbiAgc3JjOiB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xMF9fXyArIFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xMV9fXyArIFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTJfX18gKyBcIikgZm9ybWF0KFxcXCJ0cnVldHlwZVxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xM19fXyArIFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcXG4gIGZvbnQtc3R5bGU6IDQwMDtcXG59XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZVdvcmtzXFxcIjtcXG4gIHNyYzogdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTRfX18gKyBcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTVfX18gKyBcIikgZm9ybWF0KFxcXCJ3b2ZmXFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzE2X19fICsgXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTdfX18gKyBcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBtZWRpdW07XFxuICBmb250LXN0eWxlOiA1MDA7XFxufVxcbi5mb290ZXItY29udGFpbmVyIHtcXG4gIHdpZHRoOiAxMjQwcHg7XFxuICBtYXJnaW46IGF1dG87XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcXG59XFxuLmZvb3Rlci1jb250YWluZXIgLmNvcHlyaWdodCB7XFxuICBmb250LXNpemU6IDFyZW07XFxuICBjb2xvcjogIzAwMDAwMDtcXG4gIHRleHQtYWxpZ246IGNlbnRlcjtcXG59XFxuLmZvb3Rlci1jb250YWluZXIgLmNvcHlyaWdodCBhIHtcXG4gIGNvbG9yOiAjMDAwMDAwO1xcbiAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xcbn1cXG4uZm9vdGVyLWNvbnRhaW5lciAuY29weXJpZ2h0IGE6aG92ZXIge1xcbiAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XFxufVxcbi5mb290ZXItY29udGFpbmVyIC5jb3B5cmlnaHQ6YmVmb3JlIHtcXG4gIGNvbnRlbnQ6IFxcXCLCqVxcXCI7XFxufVxcbi5mb290ZXItY29udGFpbmVyIC5naXRodWItbGluayB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgZ2FwOiAxNnB4O1xcbn1cXG4uZm9vdGVyLWNvbnRhaW5lciAuZ2l0aHViLWxpbmsgYSB7XFxuICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XFxuICBjb2xvcjogIzAwMDAwMDtcXG59XFxuXFxuLnJzc2Nob29sIHtcXG4gIHdpZHRoOiA4M3B4O1xcbiAgaGVpZ2h0OiAzMHB4O1xcbiAgbWFyZ2luLWxlZnQ6IDIwcHg7XFxufVxcbi5yc3NjaG9vbDpob3ZlciAucnNzY2hvb2wtcGFpbnQsIC5yc3NjaG9vbDpmb2N1cyAucnNzY2hvb2wtcGFpbnQge1xcbiAgZmlsbDogI0UzRkI4RjtcXG59XCIsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wid2VicGFjazovLy4vLi4vLi4vLi4vLi4vLi4vJUQwJUEwJUQwJUIwJUQwJUIxJUQwJUJFJUQxJTg3JUQwJUI4JUQwJUI5JTIwJUQxJTgxJUQxJTgyJUQwJUJFJUQwJUJCL2dpdC90cmFzaC9yc2xhbmdnL3JzbGFuZy9zcmMvY29tcG9uZW50cy92aWV3L2Zvb3Rlci9Gb290ZXIuc2Nzc1wiLFwid2VicGFjazovLy4vc3JjL2NvbXBvbmVudHMvdmlldy9iYXNlLXN0eWxlcy5zY3NzXCIsXCJ3ZWJwYWNrOi8vLi9zcmMvY29tcG9uZW50cy92aWV3L2Zvb3Rlci9Gb290ZXIuc2Nzc1wiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiQUFBQSxnQkFBZ0I7QUNtRGY7RUFDQyx5QkFBQTtFQUNBLDRDQUFBO0VBQ0EsMExBQUE7RUFDQSxtQkFBQTtFQUNBLGVBQUE7QURqREY7QUNvREM7RUFDQyx5QkFBQTtFQUNBLDRDQUFBO0VBQ0EsMExBQUE7RUFDQSxtQkFBQTtFQUNBLGVBQUE7QURsREY7QUNxREM7RUFDQSx5QkFBQTtFQUNBLDRDQUFBO0VBQ0EsMExBQUE7RUFDQSxpQkFBQTtFQUNBLGVBQUE7QURuREQ7QUNzREM7RUFDQSwwQkFBQTtFQUNBLDZDQUFBO0VBQ0EsNkxBQUE7RUFDQSxtQkFBQTtFQUNBLGVBQUE7QURwREQ7QUN1REE7RUFDQywwQkFBQTtFQUNBLDZDQUFBO0VBQ0EsNkxBQUE7RUFDQSxtQkFBQTtFQUNBLGVBQUE7QURyREQ7QUVqQ0E7RUFDRSxhQUFBO0VBQ0EsWUFBQTtFQUNBLGFBQUE7RUFDQSxtQkFBQTtFQUNBLDhCQUFBO0FGbUNGO0FFakNFO0VBQ0UsZUFBQTtFQUNBLGNEd0JZO0VDdkJaLGtCQUFBO0FGbUNKO0FFakNJO0VBQ0UsY0RvQlU7RUNuQlYscUJBQUE7QUZtQ047QUVoQ0k7RUFDRSwwQkFBQTtBRmtDTjtBRS9CSTtFQUNFLFlBQUE7QUZpQ047QUU3QkU7RUFDRSxhQUFBO0VBQ0EsU0FBQTtBRitCSjtBRTlCSTtFQUNFLHFCQUFBO0VBQ0EsY0RFVTtBRDhCaEI7O0FFM0JBO0VBQ0UsV0FBQTtFQUNBLFlBQUE7RUFDQSxpQkFBQTtBRjhCRjtBRTVCRTtFQUVFLGFBQUE7QUY2QkpcIixcInNvdXJjZXNDb250ZW50XCI6W1wiQGNoYXJzZXQgXFxcIlVURi04XFxcIjtcXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci53b2ZmXFxcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLndvZmZcXFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLnR0ZlxcXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLnN2Z1xcXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbm9ybWFsO1xcbiAgZm9udC1zdHlsZTogNDAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9vay53b2ZmXFxcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLndvZmZcXFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLnR0ZlxcXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLnN2Z1xcXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbWVkaXVtO1xcbiAgZm9udC1zdHlsZTogNTAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9sZC5lb3RcXFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQud29mZlxcXCIpIGZvcm1hdChcXFwid29mZlxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQudHRmXFxcIikgZm9ybWF0KFxcXCJ0cnVldHlwZVxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQuc3ZnXFxcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xcbiAgZm9udC1zdHlsZTogNzAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlV29ya3NcXFwiO1xcbiAgc3JjOiB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLmVvdFxcXCIpO1xcbiAgc3JjOiBsb2NhbChcXFwi4pi6XFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIud29mZlxcXCIpIGZvcm1hdChcXFwid29mZlxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLnR0ZlxcXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci5zdmdcXFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcXG4gIGZvbnQtc3R5bGU6IDQwMDtcXG59XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZVdvcmtzXFxcIjtcXG4gIHNyYzogdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay5lb3RcXFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1Cb29rLndvZmZcXFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay50dGZcXFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2suc3ZnXFxcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBtZWRpdW07XFxuICBmb250LXN0eWxlOiA1MDA7XFxufVxcbi5mb290ZXItY29udGFpbmVyIHtcXG4gIHdpZHRoOiAxMjQwcHg7XFxuICBtYXJnaW46IGF1dG87XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcXG59XFxuLmZvb3Rlci1jb250YWluZXIgLmNvcHlyaWdodCB7XFxuICBmb250LXNpemU6IDFyZW07XFxuICBjb2xvcjogIzAwMDAwMDtcXG4gIHRleHQtYWxpZ246IGNlbnRlcjtcXG59XFxuLmZvb3Rlci1jb250YWluZXIgLmNvcHlyaWdodCBhIHtcXG4gIGNvbG9yOiAjMDAwMDAwO1xcbiAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xcbn1cXG4uZm9vdGVyLWNvbnRhaW5lciAuY29weXJpZ2h0IGE6aG92ZXIge1xcbiAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XFxufVxcbi5mb290ZXItY29udGFpbmVyIC5jb3B5cmlnaHQ6YmVmb3JlIHtcXG4gIGNvbnRlbnQ6IFxcXCLCqVxcXCI7XFxufVxcbi5mb290ZXItY29udGFpbmVyIC5naXRodWItbGluayB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgZ2FwOiAxNnB4O1xcbn1cXG4uZm9vdGVyLWNvbnRhaW5lciAuZ2l0aHViLWxpbmsgYSB7XFxuICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XFxuICBjb2xvcjogIzAwMDAwMDtcXG59XFxuXFxuLnJzc2Nob29sIHtcXG4gIHdpZHRoOiA4M3B4O1xcbiAgaGVpZ2h0OiAzMHB4O1xcbiAgbWFyZ2luLWxlZnQ6IDIwcHg7XFxufVxcbi5yc3NjaG9vbDpob3ZlciAucnNzY2hvb2wtcGFpbnQsIC5yc3NjaG9vbDpmb2N1cyAucnNzY2hvb2wtcGFpbnQge1xcbiAgZmlsbDogI0UzRkI4RjtcXG59XCIsXCIkZmEtZm9udC1wYXRoOiAnLi4vLi4vYXNzZXRzL2ZvbnRzLycgIWRlZmF1bHQ7XFxuXFxuLy8g0YjRgNC40YTRgtGLXFxuJHJ1c0ZvbnQ6ICdTdWlzc2VJbnRsLCBUYWhvbWEsIHNhbnMtc2VyaWYnO1xcbiRlbkZvbnQ6ICdTdWlzc2VXb3JrcywgR2VvcmdpYSwgU2VyaWYnO1xcblxcbi8vINGI0YDQuNGE0YLRiywg0L7RgdC90L7QstC90YvQtSDRgNCw0LfQvNC10YDRi1xcbiR0ZXh0SGVhZGVyOiAzcmVtO1xcbiR0ZXh0U3VidGl0bGU6IDJyZW07XFxuJHRleHRCYXNpYzogMS41cmVtO1xcbiR0ZXh0RGVzY3JpcHRpb246IDEuMjVyZW07XFxuXFxuLy8g0YbQstC10YLQsCDQtNC70Y8g0LjQutC+0L3QvtC6INC90LAg0LrQsNGA0YLQvtGH0LrQsCDQodC70L7QttC90L7QtSwg0JjQt9GD0YfQtdC90L3QvtC1XFxuJGljb25Db2xvckNvbXBsZXg6ICNGRjAwMDA7XFxuJGljb25Db2xvclN0dWRpZWQ6ICM2NUQ3MkY7XFxuXFxuLy8g0YbQstC10YLQsCDQsNC60YLQuNCy0L3Ri9GFINC60L3QvtC/0L7QuiDQsiDQodC70L7QstCw0YDQtVxcbiRidG5Db2xvclVuaXQxOiAjRTkyRDM4O1xcbiRidG5Db2xvclVuaXQyOiAjRjM2RjFFO1xcbiRidG5Db2xvclVuaXQzOiAjRkRDQTFGO1xcbiRidG5Db2xvclVuaXQ0OiAjN0FCNjNFO1xcbiRidG5Db2xvclVuaXQ1OiAjMzVCNEQwO1xcbiRidG5Db2xvclVuaXQ2OiAjMDg1NUU0O1xcblxcbi8vINGG0LLQtdGC0LAg0LDQutGC0LjQstC90YvRhSDRhNC+0L3QsCDQutCw0YDRgtC+0YfQtdC6INCyINCh0LvQvtCy0LDRgNC1XFxuJGJnQ29sb3JVbml0MTogI0ZGRUFFQjtcXG4kYmdDb2xvclVuaXQyOiAjRkZGMEU3O1xcbiRiZ0NvbG9yVW5pdDM6ICNGRkY4RTE7XFxuJGJnQ29sb3JVbml0NDogI0VFRkRERTtcXG4kYmdDb2xvclVuaXQ1OiAjQjlGMkZGO1xcbiRiZ0NvbG9yVW5pdDY6ICNCMkNBRjk7XFxuXFxuLy8g0YbQstC10YLQsCDRhNC+0L3QvtCyINC4INGC0LXQutGB0YLQsCDQvdCwINGB0LDQudGC0LVcXG4kYmdUQ29sb3JXaGl0ZTogI2ZmZmZmZjtcXG4kYmdUQ29sb3JHcmV5OiAjRTlFOUU5O1xcbiRiZ1RDb2xvckJsYWNrOiAjMDAwMDAwO1xcblxcbi8vINGC0LXQutGB0YIg0L3QtSDQsNC60YLQuNCy0L3Ri9GFINGN0LvQtdC80LXQvdGC0L7QsijRgNCw0LfQtNC10LvRiyDQvNC10L3RjiDQuCDRgtC/KVxcbiRUZXh0Tm90QWN0aXZlOiAjODk4OTg5O1xcblxcbi8vINGG0LLQtdGC0L3Ri9C1INGN0LvQtdC80LXQvdGC0Ysg0LjRgdC/0L7Qu9GM0LfRg9C10LzRi9C1INC90LAg0YHQsNC50YLQtVxcbiRlbGVtQ29sb3JHcmVlbjogI0Q3RTk3NztcXG4kZWxlbUNvbG9yQ2lhbjogIzg5RkNGQjtcXG5cXG4vLyDQutC90L7Qv9C60LAg0L/QviDRhdC+0LLQtdGA0YNcXG4kY29sb3JCdG5Ib3Y6ICNFM0ZCOEY7IFxcblxcbi8vINGE0L7RgNC80LAg0YDQtdCz0LjRgdGC0YDQsNGG0LjQuCwg0LLRhdC+0LTQsFxcbiRiZ0NvbG9ySW5wdXQ6ICNGMUYxRjE7XFxuXFxuXFxuIEBmb250LWZhY2Uge1xcbiBcXHRmb250LWZhbWlseTogJ1N1aXNzZUludGwnO1xcbiBcXHRzcmM6IHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtUmVndWxhci53b2ZmJyk7XFxuIFxcdHNyYzogbG9jYWwoJ+KYuicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLVJlZ3VsYXIud29mZicpIGZvcm1hdCgnd29mZicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLVJlZ3VsYXIudHRmJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLVJlZ3VsYXIuc3ZnJykgZm9ybWF0KCdzdmcnKTtcXG4gXFx0Zm9udC13ZWlnaHQ6IG5vcm1hbDtcXG4gXFx0Zm9udC1zdHlsZTogNDAwO1xcbiB9XFxuXFxuIEBmb250LWZhY2Uge1xcbiBcXHRmb250LWZhbWlseTogJ1N1aXNzZUludGwnO1xcbiBcXHRzcmM6IHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9vay53b2ZmJyk7XFxuIFxcdHNyYzogbG9jYWwoJ+KYuicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLUJvb2sud29mZicpIGZvcm1hdCgnd29mZicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLUJvb2sudHRmJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLUJvb2suc3ZnJykgZm9ybWF0KCdzdmcnKTtcXG4gXFx0Zm9udC13ZWlnaHQ6IG1lZGl1bTtcXG4gXFx0Zm9udC1zdHlsZTogNTAwO1xcbiB9XFxuXFxuIEBmb250LWZhY2Uge1xcblxcdGZvbnQtZmFtaWx5OiAnU3Vpc3NlSW50bCc7XFxuXFx0c3JjOiB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLUJvbGQuZW90Jyk7XFxuXFx0c3JjOiBsb2NhbCgn4pi6JyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9sZC53b2ZmJykgZm9ybWF0KCd3b2ZmJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9sZC50dGYnKSBmb3JtYXQoJ3RydWV0eXBlJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9sZC5zdmcnKSBmb3JtYXQoJ3N2ZycpO1xcblxcdGZvbnQtd2VpZ2h0OiBib2xkO1xcblxcdGZvbnQtc3R5bGU6IDcwMDtcXG59XFxuXFxuIEBmb250LWZhY2Uge1xcblxcdGZvbnQtZmFtaWx5OiAnU3Vpc3NlV29ya3MnO1xcblxcdHNyYzogdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtUmVndWxhci5lb3QnKTtcXG5cXHRzcmM6IGxvY2FsKCfimLonKSwgdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtUmVndWxhci53b2ZmJykgZm9ybWF0KCd3b2ZmJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZVdvcmtzLVJlZ3VsYXIudHRmJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VXb3Jrcy1SZWd1bGFyLnN2ZycpIGZvcm1hdCgnc3ZnJyk7XFxuXFx0Zm9udC13ZWlnaHQ6IG5vcm1hbDtcXG5cXHRmb250LXN0eWxlOiA0MDA7XFxufVxcblxcbkBmb250LWZhY2Uge1xcblxcdGZvbnQtZmFtaWx5OiAnU3Vpc3NlV29ya3MnO1xcblxcdHNyYzogdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtQm9vay5lb3QnKTtcXG5cXHRzcmM6IGxvY2FsKCfimLonKSwgdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtQm9vay53b2ZmJykgZm9ybWF0KCd3b2ZmJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZVdvcmtzLUJvb2sudHRmJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VXb3Jrcy1Cb29rLnN2ZycpIGZvcm1hdCgnc3ZnJyk7XFxuXFx0Zm9udC13ZWlnaHQ6IG1lZGl1bTtcXG5cXHRmb250LXN0eWxlOiA1MDA7XFxufVxcblwiLFwiQGltcG9ydCAnLi4vYmFzZS1zdHlsZXMuc2Nzcyc7XFxuXFxuLmZvb3Rlci1jb250YWluZXIge1xcbiAgd2lkdGg6IDEyNDBweDtcXG4gIG1hcmdpbjogYXV0bztcXG4gIGRpc3BsYXk6IGZsZXg7XFxuICBhbGlnbi1pdGVtczogY2VudGVyO1xcbiAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xcblxcbiAgLmNvcHlyaWdodCB7XFxuICAgIGZvbnQtc2l6ZTogMXJlbTtcXG4gICAgY29sb3I6ICRiZ1RDb2xvckJsYWNrO1xcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxuXFxuICAgIGEge1xcbiAgICAgIGNvbG9yOiAkYmdUQ29sb3JCbGFjaztcXG4gICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XFxuICAgIH1cXG5cXG4gICAgYTpob3ZlciB7XFxuICAgICAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XFxuICAgIH1cXG5cXG4gICAgJjpiZWZvcmUge1xcbiAgICAgIGNvbnRlbnQ6ICfCqSc7XFxuICAgIH1cXG4gIH1cXG5cXG4gIC5naXRodWItbGluayB7XFxuICAgIGRpc3BsYXk6IGZsZXg7XFxuICAgIGdhcDogMTZweDtcXG4gICAgYSB7XFxuICAgICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xcbiAgICAgIGNvbG9yOiAkYmdUQ29sb3JCbGFjaztcXG4gICAgfVxcbiAgfVxcbn1cXG5cXG4ucnNzY2hvb2wge1xcbiAgd2lkdGg6IDgzcHg7XFxuICBoZWlnaHQ6IDMwcHg7XFxuICBtYXJnaW4tbGVmdDogMjBweDtcXG5cXG4gICY6aG92ZXIgLnJzc2Nob29sLXBhaW50LFxcbiAgJjpmb2N1cyAucnNzY2hvb2wtcGFpbnR7XFxuICAgIGZpbGw6ICRjb2xvckJ0bkhvdjtcXG4gIH1cXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIi8vIEltcG9ydHNcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fIGZyb20gXCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvY3NzV2l0aE1hcHBpbmdUb1N0cmluZy5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2FwaS5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18gZnJvbSBcIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9nZXRVcmwuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMF9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci53b2ZmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzFfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLVJlZ3VsYXIudHRmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzJfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLVJlZ3VsYXIuc3ZnXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzNfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvb2sud29mZlwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF80X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLnR0ZlwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF81X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLnN2Z1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF82X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLmVvdFwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF83X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLndvZmZcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfOF9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9sZC50dGZcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfOV9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9sZC5zdmdcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMTBfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLmVvdFwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xMV9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIud29mZlwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xMl9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIudHRmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzEzX19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci5zdmdcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMTRfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1Cb29rLmVvdFwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xNV9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2sud29mZlwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xNl9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2sudHRmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE3X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay5zdmdcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8wX19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMF9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMV9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzFfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzJfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8yX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8zX19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfM19fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfNF9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzRfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzVfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF81X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF82X19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfNl9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfN19fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzdfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzhfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF84X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF85X19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfOV9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTBfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xMF9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTFfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xMV9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTJfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xMl9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTNfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xM19fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTRfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xNF9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTVfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xNV9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTZfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xNl9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTdfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xN19fXyk7XG4vLyBNb2R1bGVcbl9fX0NTU19MT0FERVJfRVhQT1JUX19fLnB1c2goW21vZHVsZS5pZCwgXCJAY2hhcnNldCBcXFwiVVRGLThcXFwiO1xcbkBmb250LWZhY2Uge1xcbiAgZm9udC1mYW1pbHk6IFxcXCJTdWlzc2VJbnRsXFxcIjtcXG4gIHNyYzogdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMF9fXyArIFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8wX19fICsgXCIpIGZvcm1hdChcXFwid29mZlxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xX19fICsgXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMl9fXyArIFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcXG4gIGZvbnQtc3R5bGU6IDQwMDtcXG59XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZUludGxcXFwiO1xcbiAgc3JjOiB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8zX19fICsgXCIpO1xcbiAgc3JjOiBsb2NhbChcXFwi4pi6XFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzNfX18gKyBcIikgZm9ybWF0KFxcXCJ3b2ZmXFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzRfX18gKyBcIikgZm9ybWF0KFxcXCJ0cnVldHlwZVxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF81X19fICsgXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbWVkaXVtO1xcbiAgZm9udC1zdHlsZTogNTAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzZfX18gKyBcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfN19fXyArIFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfOF9fXyArIFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzlfX18gKyBcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xcbiAgZm9udC1zdHlsZTogNzAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlV29ya3NcXFwiO1xcbiAgc3JjOiB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xMF9fXyArIFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xMV9fXyArIFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTJfX18gKyBcIikgZm9ybWF0KFxcXCJ0cnVldHlwZVxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xM19fXyArIFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcXG4gIGZvbnQtc3R5bGU6IDQwMDtcXG59XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZVdvcmtzXFxcIjtcXG4gIHNyYzogdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTRfX18gKyBcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTVfX18gKyBcIikgZm9ybWF0KFxcXCJ3b2ZmXFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzE2X19fICsgXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTdfX18gKyBcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBtZWRpdW07XFxuICBmb250LXN0eWxlOiA1MDA7XFxufVxcbi5wb3B1cC1jb250YWluZXIge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgei1pbmRleDogMTAwO1xcbiAgd2lkdGg6IDUwMHB4O1xcbiAgaGVpZ2h0OiA1MDBweDtcXG4gIHJpZ2h0OiBjYWxjKDUwJSAtIDI1MHB4KTtcXG4gIHRvcDogY2FsYyg1MCUgLSAyNTBweCk7XFxuICBiYWNrZ3JvdW5kOiAjZmZmZmZmO1xcbiAgYm9yZGVyLXJhZGl1czogMXJlbTtcXG59XFxuXFxuLnBvcHVwIHtcXG4gIHBhZGRpbmc6IDNyZW0gM3JlbTtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bCwgVGFob21hLCBzYW5zLXNlcmlmXFxcIjtcXG4gIHdpZHRoOiA0MjBweDtcXG4gIGRpc3BsYXk6IGZsZXg7XFxuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcbiAgZmxleC13cmFwOiB3cmFwO1xcbiAgcm93LWdhcDogMXJlbTtcXG4gIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbn1cXG5cXG4ucG9wdXBfX2Nyb3NzLWJ1dHRvbiB7XFxuICBkaXNwbGF5OiBibG9jaztcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIHdpZHRoOiAycmVtO1xcbiAgaGVpZ2h0OiAycmVtO1xcbiAgcmlnaHQ6IDFyZW07XFxuICB0b3A6IDFyZW07XFxuICBjdXJzb3I6IHBvaW50ZXI7XFxuICBiYWNrZ3JvdW5kOiAjZmZmZmZmO1xcbiAgYm9yZGVyOiAxcHggc29saWQgIzAwMDAwMDtcXG4gIGJvcmRlci1yYWRpdXM6IDFyZW07XFxufVxcbi5wb3B1cF9fY3Jvc3MtYnV0dG9uOmhvdmVyIHtcXG4gIGJhY2tncm91bmQ6ICNFM0ZCOEY7XFxufVxcblxcbi5wb3B1cF9faGVhZGluZyB7XFxuICBmb250LXNpemU6IDJyZW07XFxuICBtYXJnaW46IDA7XFxufVxcblxcbi5wb3B1cF9fYnV0dG9ucyB7XFxuICBhbGlnbi1zZWxmOiBmbGV4LXN0YXJ0O1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGdhcDogMnJlbTtcXG59XFxuXFxuI3JlZ2lzdHJhdGlvbiB7XFxuICBhbGlnbi1zZWxmOiBjZW50ZXI7XFxufVxcblxcbi5wb3B1cF9faW5wdXQge1xcbiAgYm9yZGVyOiAwO1xcbiAgYmFja2dyb3VuZDogI0YxRjFGMTtcXG4gIHBhZGRpbmc6IDAuNnJlbTtcXG4gIGJvcmRlci1yYWRpdXM6IDAuNHJlbTtcXG59XCIsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wid2VicGFjazovLy4vLi4vLi4vLi4vLi4vLi4vJUQwJUEwJUQwJUIwJUQwJUIxJUQwJUJFJUQxJTg3JUQwJUI4JUQwJUI5JTIwJUQxJTgxJUQxJTgyJUQwJUJFJUQwJUJCL2dpdC90cmFzaC9yc2xhbmdnL3JzbGFuZy9zcmMvY29tcG9uZW50cy92aWV3L2hlYWRlci9BdXRoLnNjc3NcIixcIndlYnBhY2s6Ly8uL3NyYy9jb21wb25lbnRzL3ZpZXcvYmFzZS1zdHlsZXMuc2Nzc1wiLFwid2VicGFjazovLy4vc3JjL2NvbXBvbmVudHMvdmlldy9oZWFkZXIvQXV0aC5zY3NzXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJBQUFBLGdCQUFnQjtBQ21EZjtFQUNDLHlCQUFBO0VBQ0EsNENBQUE7RUFDQSwwTEFBQTtFQUNBLG1CQUFBO0VBQ0EsZUFBQTtBRGpERjtBQ29EQztFQUNDLHlCQUFBO0VBQ0EsNENBQUE7RUFDQSwwTEFBQTtFQUNBLG1CQUFBO0VBQ0EsZUFBQTtBRGxERjtBQ3FEQztFQUNBLHlCQUFBO0VBQ0EsNENBQUE7RUFDQSwwTEFBQTtFQUNBLGlCQUFBO0VBQ0EsZUFBQTtBRG5ERDtBQ3NEQztFQUNBLDBCQUFBO0VBQ0EsNkNBQUE7RUFDQSw2TEFBQTtFQUNBLG1CQUFBO0VBQ0EsZUFBQTtBRHBERDtBQ3VEQTtFQUNDLDBCQUFBO0VBQ0EsNkNBQUE7RUFDQSw2TEFBQTtFQUNBLG1CQUFBO0VBQ0EsZUFBQTtBRHJERDtBRWpDQTtFQUNFLGtCQUFBO0VBQ0EsWUFBQTtFQUNBLFlBQUE7RUFDQSxhQUFBO0VBQ0Esd0JBQUE7RUFDQSxzQkFBQTtFQUNBLG1CRHdCYztFQ3ZCZCxtQkFBQTtBRm1DRjs7QUVoQ0E7RUFDRSxrQkFBQTtFQUNBLDZDRFpRO0VDYVIsWUFBQTtFQUNBLGFBQUE7RUFDQSxzQkFBQTtFQUNBLGVBQUE7RUFDQSxhQUFBO0VBQ0Esb0JBQUE7RUFDQSxrQkFBQTtBRm1DRjs7QUVoQ0E7RUFDRSxjQUFBO0VBQ0Esa0JBQUE7RUFDQSxXQUFBO0VBQ0EsWUFBQTtFQUNBLFdBQUE7RUFDQSxTQUFBO0VBQ0EsZUFBQTtFQUNBLG1CQUFBO0VBQ0EseUJBQUE7RUFDQSxtQkFBQTtBRm1DRjtBRWpDRTtFQUNFLG1CRE9VO0FENEJkOztBRS9CQTtFQUNFLGVEbkNhO0VDb0NiLFNBQUE7QUZrQ0Y7O0FFL0JBO0VBQ0Usc0JBQUE7RUFDQSxhQUFBO0VBQ0EsU0FBQTtBRmtDRjs7QUUvQkE7RUFDRSxrQkFBQTtBRmtDRjs7QUUvQkE7RUFDRSxTQUFBO0VBQ0EsbUJEWGE7RUNZYixlQUFBO0VBQ0EscUJBQUE7QUZrQ0ZcIixcInNvdXJjZXNDb250ZW50XCI6W1wiQGNoYXJzZXQgXFxcIlVURi04XFxcIjtcXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci53b2ZmXFxcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLndvZmZcXFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLnR0ZlxcXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLnN2Z1xcXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbm9ybWFsO1xcbiAgZm9udC1zdHlsZTogNDAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9vay53b2ZmXFxcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLndvZmZcXFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLnR0ZlxcXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLnN2Z1xcXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbWVkaXVtO1xcbiAgZm9udC1zdHlsZTogNTAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9sZC5lb3RcXFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQud29mZlxcXCIpIGZvcm1hdChcXFwid29mZlxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQudHRmXFxcIikgZm9ybWF0KFxcXCJ0cnVldHlwZVxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQuc3ZnXFxcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xcbiAgZm9udC1zdHlsZTogNzAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlV29ya3NcXFwiO1xcbiAgc3JjOiB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLmVvdFxcXCIpO1xcbiAgc3JjOiBsb2NhbChcXFwi4pi6XFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIud29mZlxcXCIpIGZvcm1hdChcXFwid29mZlxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLnR0ZlxcXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci5zdmdcXFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcXG4gIGZvbnQtc3R5bGU6IDQwMDtcXG59XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZVdvcmtzXFxcIjtcXG4gIHNyYzogdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay5lb3RcXFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1Cb29rLndvZmZcXFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay50dGZcXFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2suc3ZnXFxcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBtZWRpdW07XFxuICBmb250LXN0eWxlOiA1MDA7XFxufVxcbi5wb3B1cC1jb250YWluZXIge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgei1pbmRleDogMTAwO1xcbiAgd2lkdGg6IDUwMHB4O1xcbiAgaGVpZ2h0OiA1MDBweDtcXG4gIHJpZ2h0OiBjYWxjKDUwJSAtIDI1MHB4KTtcXG4gIHRvcDogY2FsYyg1MCUgLSAyNTBweCk7XFxuICBiYWNrZ3JvdW5kOiAjZmZmZmZmO1xcbiAgYm9yZGVyLXJhZGl1czogMXJlbTtcXG59XFxuXFxuLnBvcHVwIHtcXG4gIHBhZGRpbmc6IDNyZW0gM3JlbTtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bCwgVGFob21hLCBzYW5zLXNlcmlmXFxcIjtcXG4gIHdpZHRoOiA0MjBweDtcXG4gIGRpc3BsYXk6IGZsZXg7XFxuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcbiAgZmxleC13cmFwOiB3cmFwO1xcbiAgcm93LWdhcDogMXJlbTtcXG4gIGFsaWduLWl0ZW1zOiBzdHJldGNoO1xcbiAgdGV4dC1hbGlnbjogY2VudGVyO1xcbn1cXG5cXG4ucG9wdXBfX2Nyb3NzLWJ1dHRvbiB7XFxuICBkaXNwbGF5OiBibG9jaztcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIHdpZHRoOiAycmVtO1xcbiAgaGVpZ2h0OiAycmVtO1xcbiAgcmlnaHQ6IDFyZW07XFxuICB0b3A6IDFyZW07XFxuICBjdXJzb3I6IHBvaW50ZXI7XFxuICBiYWNrZ3JvdW5kOiAjZmZmZmZmO1xcbiAgYm9yZGVyOiAxcHggc29saWQgIzAwMDAwMDtcXG4gIGJvcmRlci1yYWRpdXM6IDFyZW07XFxufVxcbi5wb3B1cF9fY3Jvc3MtYnV0dG9uOmhvdmVyIHtcXG4gIGJhY2tncm91bmQ6ICNFM0ZCOEY7XFxufVxcblxcbi5wb3B1cF9faGVhZGluZyB7XFxuICBmb250LXNpemU6IDJyZW07XFxuICBtYXJnaW46IDA7XFxufVxcblxcbi5wb3B1cF9fYnV0dG9ucyB7XFxuICBhbGlnbi1zZWxmOiBmbGV4LXN0YXJ0O1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGdhcDogMnJlbTtcXG59XFxuXFxuI3JlZ2lzdHJhdGlvbiB7XFxuICBhbGlnbi1zZWxmOiBjZW50ZXI7XFxufVxcblxcbi5wb3B1cF9faW5wdXQge1xcbiAgYm9yZGVyOiAwO1xcbiAgYmFja2dyb3VuZDogI0YxRjFGMTtcXG4gIHBhZGRpbmc6IDAuNnJlbTtcXG4gIGJvcmRlci1yYWRpdXM6IDAuNHJlbTtcXG59XCIsXCIkZmEtZm9udC1wYXRoOiAnLi4vLi4vYXNzZXRzL2ZvbnRzLycgIWRlZmF1bHQ7XFxuXFxuLy8g0YjRgNC40YTRgtGLXFxuJHJ1c0ZvbnQ6ICdTdWlzc2VJbnRsLCBUYWhvbWEsIHNhbnMtc2VyaWYnO1xcbiRlbkZvbnQ6ICdTdWlzc2VXb3JrcywgR2VvcmdpYSwgU2VyaWYnO1xcblxcbi8vINGI0YDQuNGE0YLRiywg0L7RgdC90L7QstC90YvQtSDRgNCw0LfQvNC10YDRi1xcbiR0ZXh0SGVhZGVyOiAzcmVtO1xcbiR0ZXh0U3VidGl0bGU6IDJyZW07XFxuJHRleHRCYXNpYzogMS41cmVtO1xcbiR0ZXh0RGVzY3JpcHRpb246IDEuMjVyZW07XFxuXFxuLy8g0YbQstC10YLQsCDQtNC70Y8g0LjQutC+0L3QvtC6INC90LAg0LrQsNGA0YLQvtGH0LrQsCDQodC70L7QttC90L7QtSwg0JjQt9GD0YfQtdC90L3QvtC1XFxuJGljb25Db2xvckNvbXBsZXg6ICNGRjAwMDA7XFxuJGljb25Db2xvclN0dWRpZWQ6ICM2NUQ3MkY7XFxuXFxuLy8g0YbQstC10YLQsCDQsNC60YLQuNCy0L3Ri9GFINC60L3QvtC/0L7QuiDQsiDQodC70L7QstCw0YDQtVxcbiRidG5Db2xvclVuaXQxOiAjRTkyRDM4O1xcbiRidG5Db2xvclVuaXQyOiAjRjM2RjFFO1xcbiRidG5Db2xvclVuaXQzOiAjRkRDQTFGO1xcbiRidG5Db2xvclVuaXQ0OiAjN0FCNjNFO1xcbiRidG5Db2xvclVuaXQ1OiAjMzVCNEQwO1xcbiRidG5Db2xvclVuaXQ2OiAjMDg1NUU0O1xcblxcbi8vINGG0LLQtdGC0LAg0LDQutGC0LjQstC90YvRhSDRhNC+0L3QsCDQutCw0YDRgtC+0YfQtdC6INCyINCh0LvQvtCy0LDRgNC1XFxuJGJnQ29sb3JVbml0MTogI0ZGRUFFQjtcXG4kYmdDb2xvclVuaXQyOiAjRkZGMEU3O1xcbiRiZ0NvbG9yVW5pdDM6ICNGRkY4RTE7XFxuJGJnQ29sb3JVbml0NDogI0VFRkRERTtcXG4kYmdDb2xvclVuaXQ1OiAjQjlGMkZGO1xcbiRiZ0NvbG9yVW5pdDY6ICNCMkNBRjk7XFxuXFxuLy8g0YbQstC10YLQsCDRhNC+0L3QvtCyINC4INGC0LXQutGB0YLQsCDQvdCwINGB0LDQudGC0LVcXG4kYmdUQ29sb3JXaGl0ZTogI2ZmZmZmZjtcXG4kYmdUQ29sb3JHcmV5OiAjRTlFOUU5O1xcbiRiZ1RDb2xvckJsYWNrOiAjMDAwMDAwO1xcblxcbi8vINGC0LXQutGB0YIg0L3QtSDQsNC60YLQuNCy0L3Ri9GFINGN0LvQtdC80LXQvdGC0L7QsijRgNCw0LfQtNC10LvRiyDQvNC10L3RjiDQuCDRgtC/KVxcbiRUZXh0Tm90QWN0aXZlOiAjODk4OTg5O1xcblxcbi8vINGG0LLQtdGC0L3Ri9C1INGN0LvQtdC80LXQvdGC0Ysg0LjRgdC/0L7Qu9GM0LfRg9C10LzRi9C1INC90LAg0YHQsNC50YLQtVxcbiRlbGVtQ29sb3JHcmVlbjogI0Q3RTk3NztcXG4kZWxlbUNvbG9yQ2lhbjogIzg5RkNGQjtcXG5cXG4vLyDQutC90L7Qv9C60LAg0L/QviDRhdC+0LLQtdGA0YNcXG4kY29sb3JCdG5Ib3Y6ICNFM0ZCOEY7IFxcblxcbi8vINGE0L7RgNC80LAg0YDQtdCz0LjRgdGC0YDQsNGG0LjQuCwg0LLRhdC+0LTQsFxcbiRiZ0NvbG9ySW5wdXQ6ICNGMUYxRjE7XFxuXFxuXFxuIEBmb250LWZhY2Uge1xcbiBcXHRmb250LWZhbWlseTogJ1N1aXNzZUludGwnO1xcbiBcXHRzcmM6IHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtUmVndWxhci53b2ZmJyk7XFxuIFxcdHNyYzogbG9jYWwoJ+KYuicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLVJlZ3VsYXIud29mZicpIGZvcm1hdCgnd29mZicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLVJlZ3VsYXIudHRmJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLVJlZ3VsYXIuc3ZnJykgZm9ybWF0KCdzdmcnKTtcXG4gXFx0Zm9udC13ZWlnaHQ6IG5vcm1hbDtcXG4gXFx0Zm9udC1zdHlsZTogNDAwO1xcbiB9XFxuXFxuIEBmb250LWZhY2Uge1xcbiBcXHRmb250LWZhbWlseTogJ1N1aXNzZUludGwnO1xcbiBcXHRzcmM6IHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9vay53b2ZmJyk7XFxuIFxcdHNyYzogbG9jYWwoJ+KYuicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLUJvb2sud29mZicpIGZvcm1hdCgnd29mZicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLUJvb2sudHRmJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLUJvb2suc3ZnJykgZm9ybWF0KCdzdmcnKTtcXG4gXFx0Zm9udC13ZWlnaHQ6IG1lZGl1bTtcXG4gXFx0Zm9udC1zdHlsZTogNTAwO1xcbiB9XFxuXFxuIEBmb250LWZhY2Uge1xcblxcdGZvbnQtZmFtaWx5OiAnU3Vpc3NlSW50bCc7XFxuXFx0c3JjOiB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLUJvbGQuZW90Jyk7XFxuXFx0c3JjOiBsb2NhbCgn4pi6JyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9sZC53b2ZmJykgZm9ybWF0KCd3b2ZmJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9sZC50dGYnKSBmb3JtYXQoJ3RydWV0eXBlJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9sZC5zdmcnKSBmb3JtYXQoJ3N2ZycpO1xcblxcdGZvbnQtd2VpZ2h0OiBib2xkO1xcblxcdGZvbnQtc3R5bGU6IDcwMDtcXG59XFxuXFxuIEBmb250LWZhY2Uge1xcblxcdGZvbnQtZmFtaWx5OiAnU3Vpc3NlV29ya3MnO1xcblxcdHNyYzogdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtUmVndWxhci5lb3QnKTtcXG5cXHRzcmM6IGxvY2FsKCfimLonKSwgdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtUmVndWxhci53b2ZmJykgZm9ybWF0KCd3b2ZmJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZVdvcmtzLVJlZ3VsYXIudHRmJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VXb3Jrcy1SZWd1bGFyLnN2ZycpIGZvcm1hdCgnc3ZnJyk7XFxuXFx0Zm9udC13ZWlnaHQ6IG5vcm1hbDtcXG5cXHRmb250LXN0eWxlOiA0MDA7XFxufVxcblxcbkBmb250LWZhY2Uge1xcblxcdGZvbnQtZmFtaWx5OiAnU3Vpc3NlV29ya3MnO1xcblxcdHNyYzogdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtQm9vay5lb3QnKTtcXG5cXHRzcmM6IGxvY2FsKCfimLonKSwgdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtQm9vay53b2ZmJykgZm9ybWF0KCd3b2ZmJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZVdvcmtzLUJvb2sudHRmJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VXb3Jrcy1Cb29rLnN2ZycpIGZvcm1hdCgnc3ZnJyk7XFxuXFx0Zm9udC13ZWlnaHQ6IG1lZGl1bTtcXG5cXHRmb250LXN0eWxlOiA1MDA7XFxufVxcblwiLFwiQGltcG9ydCAnLi4vLi4vdmlldy9iYXNlLXN0eWxlcy5zY3NzJztcXG5cXG4ucG9wdXAtY29udGFpbmVyIHtcXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcXG4gIHotaW5kZXg6IDEwMDtcXG4gIHdpZHRoOiA1MDBweDtcXG4gIGhlaWdodDogNTAwcHg7XFxuICByaWdodDogY2FsYyg1MCUgLSAyNTBweCk7XFxuICB0b3A6IGNhbGMoNTAlIC0gMjUwcHgpO1xcbiAgYmFja2dyb3VuZDogJGJnVENvbG9yV2hpdGU7XFxuICBib3JkZXItcmFkaXVzOiAxcmVtO1xcbn1cXG5cXG4ucG9wdXAge1xcbiAgcGFkZGluZzogM3JlbSAzcmVtO1xcbiAgZm9udC1mYW1pbHk6ICRydXNGb250O1xcbiAgd2lkdGg6IDQyMHB4O1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XFxuICBmbGV4LXdyYXA6IHdyYXA7XFxuICByb3ctZ2FwOiAxcmVtO1xcbiAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XFxuICB0ZXh0LWFsaWduOiBjZW50ZXI7XFxufVxcblxcbi5wb3B1cF9fY3Jvc3MtYnV0dG9uIHtcXG4gIGRpc3BsYXk6IGJsb2NrO1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgd2lkdGg6IDJyZW07XFxuICBoZWlnaHQ6IDJyZW07XFxuICByaWdodDogMXJlbTtcXG4gIHRvcDogMXJlbTtcXG4gIGN1cnNvcjogcG9pbnRlcjtcXG4gIGJhY2tncm91bmQ6ICRiZ1RDb2xvcldoaXRlO1xcbiAgYm9yZGVyOiAxcHggc29saWQgJGJnVENvbG9yQmxhY2s7XFxuICBib3JkZXItcmFkaXVzOiAxcmVtO1xcblxcbiAgJjpob3ZlciB7XFxuICAgIGJhY2tncm91bmQ6ICRjb2xvckJ0bkhvdjtcXG4gIH1cXG59XFxuXFxuLnBvcHVwX19oZWFkaW5nIHtcXG4gIGZvbnQtc2l6ZTogJHRleHRTdWJ0aXRsZTtcXG4gIG1hcmdpbjogMDtcXG59XFxuXFxuLnBvcHVwX19idXR0b25zIHtcXG4gIGFsaWduLXNlbGY6IGZsZXgtc3RhcnQ7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgZ2FwOiAycmVtO1xcbn1cXG5cXG4jcmVnaXN0cmF0aW9uIHtcXG4gIGFsaWduLXNlbGY6IGNlbnRlcjtcXG59XFxuXFxuLnBvcHVwX19pbnB1dCB7XFxuICBib3JkZXI6IDA7XFxuICBiYWNrZ3JvdW5kOiAkYmdDb2xvcklucHV0O1xcbiAgcGFkZGluZzogMC42cmVtO1xcbiAgYm9yZGVyLXJhZGl1czogMC40cmVtO1xcbn1cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcbi8vIEV4cG9ydHNcbmV4cG9ydCBkZWZhdWx0IF9fX0NTU19MT0FERVJfRVhQT1JUX19fO1xuIiwiLy8gSW1wb3J0c1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18gZnJvbSBcIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9jc3NXaXRoTWFwcGluZ1RvU3RyaW5nLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fIGZyb20gXCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2dldFVybC5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8wX19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLndvZmZcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMV9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci50dGZcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMl9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci5zdmdcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfM19fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9vay53b2ZmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzRfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvb2sudHRmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzVfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvb2suc3ZnXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzZfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQuZW90XCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzdfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQud29mZlwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF84X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLnR0ZlwiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF85X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLnN2Z1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xMF9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIuZW90XCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzExX19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci53b2ZmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzEyX19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci50dGZcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMTNfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLnN2Z1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8xNF9fXyBmcm9tIFwiLi4vLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2suZW90XCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE1X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay53b2ZmXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE2X19fIGZyb20gXCIuLi8uLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay50dGZcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMTdfX18gZnJvbSBcIi4uLy4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1Cb29rLnN2Z1wiO1xudmFyIF9fX0NTU19MT0FERVJfRVhQT1JUX19fID0gX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzBfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8wX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xX19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfMV9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMl9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzJfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzNfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8zX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF80X19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfNF9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfNV9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzVfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzZfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF82X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF83X19fID0gX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX1VSTF9JTVBPUlRfN19fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfOF9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzhfX18pO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzlfX18gPSBfX19DU1NfTE9BREVSX0dFVF9VUkxfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF85X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xMF9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzEwX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xMV9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzExX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xMl9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzEyX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xM19fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzEzX19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xNF9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE0X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xNV9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE1X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xNl9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE2X19fKTtcbnZhciBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xN19fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzE3X19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBcIkBjaGFyc2V0IFxcXCJVVEYtOFxcXCI7XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZUludGxcXFwiO1xcbiAgc3JjOiB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8wX19fICsgXCIpO1xcbiAgc3JjOiBsb2NhbChcXFwi4pi6XFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzBfX18gKyBcIikgZm9ybWF0KFxcXCJ3b2ZmXFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzFfX18gKyBcIikgZm9ybWF0KFxcXCJ0cnVldHlwZVxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8yX19fICsgXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbm9ybWFsO1xcbiAgZm9udC1zdHlsZTogNDAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bFxcXCI7XFxuICBzcmM6IHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzNfX18gKyBcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfM19fXyArIFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfNF9fXyArIFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzVfX18gKyBcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBtZWRpdW07XFxuICBmb250LXN0eWxlOiA1MDA7XFxufVxcbkBmb250LWZhY2Uge1xcbiAgZm9udC1mYW1pbHk6IFxcXCJTdWlzc2VJbnRsXFxcIjtcXG4gIHNyYzogdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfNl9fXyArIFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF83X19fICsgXCIpIGZvcm1hdChcXFwid29mZlxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF84X19fICsgXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfOV9fXyArIFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XFxuICBmb250LXN0eWxlOiA3MDA7XFxufVxcbkBmb250LWZhY2Uge1xcbiAgZm9udC1mYW1pbHk6IFxcXCJTdWlzc2VXb3Jrc1xcXCI7XFxuICBzcmM6IHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzEwX19fICsgXCIpO1xcbiAgc3JjOiBsb2NhbChcXFwi4pi6XFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzExX19fICsgXCIpIGZvcm1hdChcXFwid29mZlxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xMl9fXyArIFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIiksIHVybChcIiArIF9fX0NTU19MT0FERVJfVVJMX1JFUExBQ0VNRU5UXzEzX19fICsgXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbm9ybWFsO1xcbiAgZm9udC1zdHlsZTogNDAwO1xcbn1cXG5AZm9udC1mYWNlIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlV29ya3NcXFwiO1xcbiAgc3JjOiB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xNF9fXyArIFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xNV9fXyArIFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFwiICsgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMTZfX18gKyBcIikgZm9ybWF0KFxcXCJ0cnVldHlwZVxcXCIpLCB1cmwoXCIgKyBfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8xN19fXyArIFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IG1lZGl1bTtcXG4gIGZvbnQtc3R5bGU6IDUwMDtcXG59XFxuLmhlYWRlci1jb250YWluZXIge1xcbiAgd2lkdGg6IDEyNDBweDtcXG4gIG1hcmdpbjogYXV0bztcXG4gIGRpc3BsYXk6IGZsZXg7XFxuICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XFxuICBhbGlnbi1pdGVtczogY2VudGVyO1xcbn1cXG5cXG5oMSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZUludGwsIFRhaG9tYSwgc2Fucy1zZXJpZlxcXCI7XFxuICBmb250LXNpemU6IDIwcHg7XFxuICBtYXJnaW46IDA7XFxufVxcblxcbi5sb2dvX19saW5rIHtcXG4gIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcXG4gIGNvbG9yOiAjMDAwMDAwO1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGdhcDogMC4zcmVtO1xcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXG59XFxuLmxvZ29fX2xpbms6aG92ZXIge1xcbiAgY29sb3I6ICM3QUI2M0U7XFxufVxcblxcbi5sb2dnZWQtaW4ge1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGdhcDogMC44cmVtO1xcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXG59XFxuXFxuLnVzZXItbmFtZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZUludGwsIFRhaG9tYSwgc2Fucy1zZXJpZlxcXCI7XFxuICBmb250LXNpemU6IDEuMnJlbTtcXG4gIGNvbG9yOiAjMDAwMDAwO1xcbiAgY3Vyc29yOiBwb2ludGVyO1xcbn1cXG4udXNlci1uYW1lOmhvdmVyIHtcXG4gIGNvbG9yOiAjRTNGQjhGO1xcbiAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XFxufVxcblxcbi5jaXJjbGUge1xcbiAgaGVpZ2h0OiAwLjhyZW07XFxuICB3aWR0aDogMC44cmVtO1xcbiAgYm9yZGVyLXJhZGl1czogMC40cmVtO1xcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwMDAwMDtcXG59XFxuXFxuLm1haW4tbmF2X19pdGVtIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bCwgVGFob21hLCBzYW5zLXNlcmlmXFxcIjtcXG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcXG4gIHBhZGRpbmc6IDEuMnJlbTtcXG4gIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcXG4gIGNvbG9yOiAjMDAwMDAwO1xcbiAgb3BhY2l0eTogMTtcXG4gIGN1cnNvcjogcG9pbnRlcjtcXG59XFxuLm1haW4tbmF2X19pdGVtOmhvdmVyIHtcXG4gIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1xcbn1cXG5cXG4ubWFpbi1uYXZfX2l0ZW1fZGlzYWJsZWQge1xcbiAgb3BhY2l0eTogMC41O1xcbiAgY3Vyc29yOiBub3QtYWxsb3dlZDtcXG59XFxuLm1haW4tbmF2X19pdGVtX2Rpc2FibGVkOmhvdmVyIHtcXG4gIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcXG59XFxuXFxuLm1haW4tbmF2X19pdGVtX2FjdGl2ZSB7XFxuICBmb250LXdlaWdodDogYm9sZDtcXG59XFxuXFxuLm1haW4tbmF2IHtcXG4gIGRpc3BsYXk6IGZsZXg7XFxuICBnYXA6IDE1cHg7XFxufVwiLCBcIlwiLHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIndlYnBhY2s6Ly8uLy4uLy4uLy4uLy4uLy4uLyVEMCVBMCVEMCVCMCVEMCVCMSVEMCVCRSVEMSU4NyVEMCVCOCVEMCVCOSUyMCVEMSU4MSVEMSU4MiVEMCVCRSVEMCVCQi9naXQvdHJhc2gvcnNsYW5nZy9yc2xhbmcvc3JjL2NvbXBvbmVudHMvdmlldy9oZWFkZXIvSGVhZGVyLnNjc3NcIixcIndlYnBhY2s6Ly8uL3NyYy9jb21wb25lbnRzL3ZpZXcvYmFzZS1zdHlsZXMuc2Nzc1wiLFwid2VicGFjazovLy4vc3JjL2NvbXBvbmVudHMvdmlldy9oZWFkZXIvSGVhZGVyLnNjc3NcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIkFBQUEsZ0JBQWdCO0FDbURmO0VBQ0MseUJBQUE7RUFDQSw0Q0FBQTtFQUNBLDBMQUFBO0VBQ0EsbUJBQUE7RUFDQSxlQUFBO0FEakRGO0FDb0RDO0VBQ0MseUJBQUE7RUFDQSw0Q0FBQTtFQUNBLDBMQUFBO0VBQ0EsbUJBQUE7RUFDQSxlQUFBO0FEbERGO0FDcURDO0VBQ0EseUJBQUE7RUFDQSw0Q0FBQTtFQUNBLDBMQUFBO0VBQ0EsaUJBQUE7RUFDQSxlQUFBO0FEbkREO0FDc0RDO0VBQ0EsMEJBQUE7RUFDQSw2Q0FBQTtFQUNBLDZMQUFBO0VBQ0EsbUJBQUE7RUFDQSxlQUFBO0FEcEREO0FDdURBO0VBQ0MsMEJBQUE7RUFDQSw2Q0FBQTtFQUNBLDZMQUFBO0VBQ0EsbUJBQUE7RUFDQSxlQUFBO0FEckREO0FFakNBO0VBQ0UsYUFBQTtFQUNBLFlBQUE7RUFDQSxhQUFBO0VBQ0EsOEJBQUE7RUFDQSxtQkFBQTtBRm1DRjs7QUVoQ0E7RUFDRSw2Q0RSUTtFQ1NSLGVBQUE7RUFDQSxTQUFBO0FGbUNGOztBRWhDQTtFQUNFLHFCQUFBO0VBQ0EsY0RpQmM7RUNoQmQsYUFBQTtFQUNBLFdBQUE7RUFDQSxtQkFBQTtBRm1DRjtBRWpDRTtFQUNFLGNESlk7QUR1Q2hCOztBRS9CQTtFQUNFLGFBQUE7RUFDQSxXQUFBO0VBQ0EsbUJBQUE7QUZrQ0Y7O0FFL0JBO0VBQ0UsNkNEaENRO0VDaUNSLGlCQUFBO0VBQ0EsY0RGYztFQ0dkLGVBQUE7QUZrQ0Y7QUVoQ0U7RUFDRSxjRElVO0VDSFYsMEJBQUE7QUZrQ0o7O0FFOUJBO0VBQ0UsY0FBQTtFQUNBLGFBQUE7RUFDQSxxQkFBQTtFQUNBLHFCQUFBO0VBQ0EseUJEaEJjO0FEaURoQjs7QUU3QkE7RUFDRSw2Q0RyRFE7RUNzRFIscUJBQUE7RUFDQSxlQUFBO0VBQ0EscUJBQUE7RUFDQSxjRHpCYztFQzBCZCxVQUFBO0VBQ0EsZUFBQTtBRmdDRjtBRTlCRTtFQUNFLDBCQUFBO0FGZ0NKOztBRTVCQTtFQUNFLFlBQUE7RUFDQSxtQkFBQTtBRitCRjtBRTdCRTtFQUNFLHFCQUFBO0FGK0JKOztBRTNCQTtFQUNFLGlCQUFBO0FGOEJGOztBRTNCQTtFQUNFLGFBQUE7RUFDQSxTQUFBO0FGOEJGXCIsXCJzb3VyY2VzQ29udGVudFwiOltcIkBjaGFyc2V0IFxcXCJVVEYtOFxcXCI7XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZUludGxcXFwiO1xcbiAgc3JjOiB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLVJlZ3VsYXIud29mZlxcXCIpO1xcbiAgc3JjOiBsb2NhbChcXFwi4pi6XFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci53b2ZmXFxcIikgZm9ybWF0KFxcXCJ3b2ZmXFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci50dGZcXFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci5zdmdcXFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcXG4gIGZvbnQtc3R5bGU6IDQwMDtcXG59XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZUludGxcXFwiO1xcbiAgc3JjOiB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvb2sud29mZlxcXCIpO1xcbiAgc3JjOiBsb2NhbChcXFwi4pi6XFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9vay53b2ZmXFxcIikgZm9ybWF0KFxcXCJ3b2ZmXFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9vay50dGZcXFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9vay5zdmdcXFwiKSBmb3JtYXQoXFxcInN2Z1xcXCIpO1xcbiAgZm9udC13ZWlnaHQ6IG1lZGl1bTtcXG4gIGZvbnQtc3R5bGU6IDUwMDtcXG59XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZUludGxcXFwiO1xcbiAgc3JjOiB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQuZW90XFxcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLndvZmZcXFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLnR0ZlxcXCIpIGZvcm1hdChcXFwidHJ1ZXR5cGVcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLnN2Z1xcXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogYm9sZDtcXG4gIGZvbnQtc3R5bGU6IDcwMDtcXG59XFxuQGZvbnQtZmFjZSB7XFxuICBmb250LWZhbWlseTogXFxcIlN1aXNzZVdvcmtzXFxcIjtcXG4gIHNyYzogdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci5lb3RcXFwiKTtcXG4gIHNyYzogbG9jYWwoXFxcIuKYulxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLndvZmZcXFwiKSBmb3JtYXQoXFxcIndvZmZcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci50dGZcXFwiKSBmb3JtYXQoXFxcInRydWV0eXBlXFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIuc3ZnXFxcIikgZm9ybWF0KFxcXCJzdmdcXFwiKTtcXG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XFxuICBmb250LXN0eWxlOiA0MDA7XFxufVxcbkBmb250LWZhY2Uge1xcbiAgZm9udC1mYW1pbHk6IFxcXCJTdWlzc2VXb3Jrc1xcXCI7XFxuICBzcmM6IHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2suZW90XFxcIik7XFxuICBzcmM6IGxvY2FsKFxcXCLimLpcXFwiKSwgdXJsKFxcXCIuLi8uLi9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay53b2ZmXFxcIikgZm9ybWF0KFxcXCJ3b2ZmXFxcIiksIHVybChcXFwiLi4vLi4vYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2sudHRmXFxcIikgZm9ybWF0KFxcXCJ0cnVldHlwZVxcXCIpLCB1cmwoXFxcIi4uLy4uL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1Cb29rLnN2Z1xcXCIpIGZvcm1hdChcXFwic3ZnXFxcIik7XFxuICBmb250LXdlaWdodDogbWVkaXVtO1xcbiAgZm9udC1zdHlsZTogNTAwO1xcbn1cXG4uaGVhZGVyLWNvbnRhaW5lciB7XFxuICB3aWR0aDogMTI0MHB4O1xcbiAgbWFyZ2luOiBhdXRvO1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcXG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XFxufVxcblxcbmgxIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bCwgVGFob21hLCBzYW5zLXNlcmlmXFxcIjtcXG4gIGZvbnQtc2l6ZTogMjBweDtcXG4gIG1hcmdpbjogMDtcXG59XFxuXFxuLmxvZ29fX2xpbmsge1xcbiAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xcbiAgY29sb3I6ICMwMDAwMDA7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgZ2FwOiAwLjNyZW07XFxuICBhbGlnbi1pdGVtczogY2VudGVyO1xcbn1cXG4ubG9nb19fbGluazpob3ZlciB7XFxuICBjb2xvcjogIzdBQjYzRTtcXG59XFxuXFxuLmxvZ2dlZC1pbiB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgZ2FwOiAwLjhyZW07XFxuICBhbGlnbi1pdGVtczogY2VudGVyO1xcbn1cXG5cXG4udXNlci1uYW1lIHtcXG4gIGZvbnQtZmFtaWx5OiBcXFwiU3Vpc3NlSW50bCwgVGFob21hLCBzYW5zLXNlcmlmXFxcIjtcXG4gIGZvbnQtc2l6ZTogMS4ycmVtO1xcbiAgY29sb3I6ICMwMDAwMDA7XFxuICBjdXJzb3I6IHBvaW50ZXI7XFxufVxcbi51c2VyLW5hbWU6aG92ZXIge1xcbiAgY29sb3I6ICNFM0ZCOEY7XFxuICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcXG59XFxuXFxuLmNpcmNsZSB7XFxuICBoZWlnaHQ6IDAuOHJlbTtcXG4gIHdpZHRoOiAwLjhyZW07XFxuICBib3JkZXItcmFkaXVzOiAwLjRyZW07XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwMDAwO1xcbn1cXG5cXG4ubWFpbi1uYXZfX2l0ZW0ge1xcbiAgZm9udC1mYW1pbHk6IFxcXCJTdWlzc2VJbnRsLCBUYWhvbWEsIHNhbnMtc2VyaWZcXFwiO1xcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcbiAgcGFkZGluZzogMS4ycmVtO1xcbiAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xcbiAgY29sb3I6ICMwMDAwMDA7XFxuICBvcGFjaXR5OiAxO1xcbiAgY3Vyc29yOiBwb2ludGVyO1xcbn1cXG4ubWFpbi1uYXZfX2l0ZW06aG92ZXIge1xcbiAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XFxufVxcblxcbi5tYWluLW5hdl9faXRlbV9kaXNhYmxlZCB7XFxuICBvcGFjaXR5OiAwLjU7XFxuICBjdXJzb3I6IG5vdC1hbGxvd2VkO1xcbn1cXG4ubWFpbi1uYXZfX2l0ZW1fZGlzYWJsZWQ6aG92ZXIge1xcbiAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xcbn1cXG5cXG4ubWFpbi1uYXZfX2l0ZW1fYWN0aXZlIHtcXG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xcbn1cXG5cXG4ubWFpbi1uYXYge1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGdhcDogMTVweDtcXG59XCIsXCIkZmEtZm9udC1wYXRoOiAnLi4vLi4vYXNzZXRzL2ZvbnRzLycgIWRlZmF1bHQ7XFxuXFxuLy8g0YjRgNC40YTRgtGLXFxuJHJ1c0ZvbnQ6ICdTdWlzc2VJbnRsLCBUYWhvbWEsIHNhbnMtc2VyaWYnO1xcbiRlbkZvbnQ6ICdTdWlzc2VXb3JrcywgR2VvcmdpYSwgU2VyaWYnO1xcblxcbi8vINGI0YDQuNGE0YLRiywg0L7RgdC90L7QstC90YvQtSDRgNCw0LfQvNC10YDRi1xcbiR0ZXh0SGVhZGVyOiAzcmVtO1xcbiR0ZXh0U3VidGl0bGU6IDJyZW07XFxuJHRleHRCYXNpYzogMS41cmVtO1xcbiR0ZXh0RGVzY3JpcHRpb246IDEuMjVyZW07XFxuXFxuLy8g0YbQstC10YLQsCDQtNC70Y8g0LjQutC+0L3QvtC6INC90LAg0LrQsNGA0YLQvtGH0LrQsCDQodC70L7QttC90L7QtSwg0JjQt9GD0YfQtdC90L3QvtC1XFxuJGljb25Db2xvckNvbXBsZXg6ICNGRjAwMDA7XFxuJGljb25Db2xvclN0dWRpZWQ6ICM2NUQ3MkY7XFxuXFxuLy8g0YbQstC10YLQsCDQsNC60YLQuNCy0L3Ri9GFINC60L3QvtC/0L7QuiDQsiDQodC70L7QstCw0YDQtVxcbiRidG5Db2xvclVuaXQxOiAjRTkyRDM4O1xcbiRidG5Db2xvclVuaXQyOiAjRjM2RjFFO1xcbiRidG5Db2xvclVuaXQzOiAjRkRDQTFGO1xcbiRidG5Db2xvclVuaXQ0OiAjN0FCNjNFO1xcbiRidG5Db2xvclVuaXQ1OiAjMzVCNEQwO1xcbiRidG5Db2xvclVuaXQ2OiAjMDg1NUU0O1xcblxcbi8vINGG0LLQtdGC0LAg0LDQutGC0LjQstC90YvRhSDRhNC+0L3QsCDQutCw0YDRgtC+0YfQtdC6INCyINCh0LvQvtCy0LDRgNC1XFxuJGJnQ29sb3JVbml0MTogI0ZGRUFFQjtcXG4kYmdDb2xvclVuaXQyOiAjRkZGMEU3O1xcbiRiZ0NvbG9yVW5pdDM6ICNGRkY4RTE7XFxuJGJnQ29sb3JVbml0NDogI0VFRkRERTtcXG4kYmdDb2xvclVuaXQ1OiAjQjlGMkZGO1xcbiRiZ0NvbG9yVW5pdDY6ICNCMkNBRjk7XFxuXFxuLy8g0YbQstC10YLQsCDRhNC+0L3QvtCyINC4INGC0LXQutGB0YLQsCDQvdCwINGB0LDQudGC0LVcXG4kYmdUQ29sb3JXaGl0ZTogI2ZmZmZmZjtcXG4kYmdUQ29sb3JHcmV5OiAjRTlFOUU5O1xcbiRiZ1RDb2xvckJsYWNrOiAjMDAwMDAwO1xcblxcbi8vINGC0LXQutGB0YIg0L3QtSDQsNC60YLQuNCy0L3Ri9GFINGN0LvQtdC80LXQvdGC0L7QsijRgNCw0LfQtNC10LvRiyDQvNC10L3RjiDQuCDRgtC/KVxcbiRUZXh0Tm90QWN0aXZlOiAjODk4OTg5O1xcblxcbi8vINGG0LLQtdGC0L3Ri9C1INGN0LvQtdC80LXQvdGC0Ysg0LjRgdC/0L7Qu9GM0LfRg9C10LzRi9C1INC90LAg0YHQsNC50YLQtVxcbiRlbGVtQ29sb3JHcmVlbjogI0Q3RTk3NztcXG4kZWxlbUNvbG9yQ2lhbjogIzg5RkNGQjtcXG5cXG4vLyDQutC90L7Qv9C60LAg0L/QviDRhdC+0LLQtdGA0YNcXG4kY29sb3JCdG5Ib3Y6ICNFM0ZCOEY7IFxcblxcbi8vINGE0L7RgNC80LAg0YDQtdCz0LjRgdGC0YDQsNGG0LjQuCwg0LLRhdC+0LTQsFxcbiRiZ0NvbG9ySW5wdXQ6ICNGMUYxRjE7XFxuXFxuXFxuIEBmb250LWZhY2Uge1xcbiBcXHRmb250LWZhbWlseTogJ1N1aXNzZUludGwnO1xcbiBcXHRzcmM6IHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtUmVndWxhci53b2ZmJyk7XFxuIFxcdHNyYzogbG9jYWwoJ+KYuicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLVJlZ3VsYXIud29mZicpIGZvcm1hdCgnd29mZicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLVJlZ3VsYXIudHRmJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLVJlZ3VsYXIuc3ZnJykgZm9ybWF0KCdzdmcnKTtcXG4gXFx0Zm9udC13ZWlnaHQ6IG5vcm1hbDtcXG4gXFx0Zm9udC1zdHlsZTogNDAwO1xcbiB9XFxuXFxuIEBmb250LWZhY2Uge1xcbiBcXHRmb250LWZhbWlseTogJ1N1aXNzZUludGwnO1xcbiBcXHRzcmM6IHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9vay53b2ZmJyk7XFxuIFxcdHNyYzogbG9jYWwoJ+KYuicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLUJvb2sud29mZicpIGZvcm1hdCgnd29mZicpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLUJvb2sudHRmJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLUJvb2suc3ZnJykgZm9ybWF0KCdzdmcnKTtcXG4gXFx0Zm9udC13ZWlnaHQ6IG1lZGl1bTtcXG4gXFx0Zm9udC1zdHlsZTogNTAwO1xcbiB9XFxuXFxuIEBmb250LWZhY2Uge1xcblxcdGZvbnQtZmFtaWx5OiAnU3Vpc3NlSW50bCc7XFxuXFx0c3JjOiB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VJbnRsLUJvbGQuZW90Jyk7XFxuXFx0c3JjOiBsb2NhbCgn4pi6JyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9sZC53b2ZmJykgZm9ybWF0KCd3b2ZmJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9sZC50dGYnKSBmb3JtYXQoJ3RydWV0eXBlJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZUludGwtQm9sZC5zdmcnKSBmb3JtYXQoJ3N2ZycpO1xcblxcdGZvbnQtd2VpZ2h0OiBib2xkO1xcblxcdGZvbnQtc3R5bGU6IDcwMDtcXG59XFxuXFxuIEBmb250LWZhY2Uge1xcblxcdGZvbnQtZmFtaWx5OiAnU3Vpc3NlV29ya3MnO1xcblxcdHNyYzogdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtUmVndWxhci5lb3QnKTtcXG5cXHRzcmM6IGxvY2FsKCfimLonKSwgdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtUmVndWxhci53b2ZmJykgZm9ybWF0KCd3b2ZmJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZVdvcmtzLVJlZ3VsYXIudHRmJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VXb3Jrcy1SZWd1bGFyLnN2ZycpIGZvcm1hdCgnc3ZnJyk7XFxuXFx0Zm9udC13ZWlnaHQ6IG5vcm1hbDtcXG5cXHRmb250LXN0eWxlOiA0MDA7XFxufVxcblxcbkBmb250LWZhY2Uge1xcblxcdGZvbnQtZmFtaWx5OiAnU3Vpc3NlV29ya3MnO1xcblxcdHNyYzogdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtQm9vay5lb3QnKTtcXG5cXHRzcmM6IGxvY2FsKCfimLonKSwgdXJsKCcjeyRmYS1mb250LXBhdGh9U3Vpc3NlV29ya3MtQm9vay53b2ZmJykgZm9ybWF0KCd3b2ZmJyksIHVybCgnI3skZmEtZm9udC1wYXRofVN1aXNzZVdvcmtzLUJvb2sudHRmJykgZm9ybWF0KCd0cnVldHlwZScpLCB1cmwoJyN7JGZhLWZvbnQtcGF0aH1TdWlzc2VXb3Jrcy1Cb29rLnN2ZycpIGZvcm1hdCgnc3ZnJyk7XFxuXFx0Zm9udC13ZWlnaHQ6IG1lZGl1bTtcXG5cXHRmb250LXN0eWxlOiA1MDA7XFxufVxcblwiLFwiQGltcG9ydCAnLi4vLi4vdmlldy9iYXNlLXN0eWxlcy5zY3NzJztcXG5cXG4uaGVhZGVyLWNvbnRhaW5lciB7XFxuICB3aWR0aDogMTI0MHB4O1xcbiAgbWFyZ2luOiBhdXRvO1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcXG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XFxufVxcblxcbmgxIHtcXG4gIGZvbnQtZmFtaWx5OiAkcnVzRm9udDtcXG4gIGZvbnQtc2l6ZTogMjBweDtcXG4gIG1hcmdpbjogMDtcXG59XFxuXFxuLmxvZ29fX2xpbmsge1xcbiAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xcbiAgY29sb3I6ICRiZ1RDb2xvckJsYWNrO1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGdhcDogMC4zcmVtO1xcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXG5cXG4gICY6aG92ZXIge1xcbiAgICBjb2xvcjogJGJ0bkNvbG9yVW5pdDQ7XFxuICB9XFxufVxcblxcbi5sb2dnZWQtaW4ge1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGdhcDogMC44cmVtO1xcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXG59XFxuXFxuLnVzZXItbmFtZSB7XFxuICBmb250LWZhbWlseTogJHJ1c0ZvbnQ7XFxuICBmb250LXNpemU6IDEuMnJlbTtcXG4gIGNvbG9yOiAkYmdUQ29sb3JCbGFjaztcXG4gIGN1cnNvcjogcG9pbnRlcjtcXG5cXG4gICY6aG92ZXIge1xcbiAgICBjb2xvcjogJGNvbG9yQnRuSG92O1xcbiAgICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcXG4gIH1cXG59XFxuXFxuLmNpcmNsZSB7XFxuICBoZWlnaHQ6MC44cmVtO1xcbiAgd2lkdGg6MC44cmVtO1xcbiAgYm9yZGVyLXJhZGl1czogMC40cmVtO1xcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogJGJnVENvbG9yQmxhY2s7XFxufVxcblxcblxcbi5tYWluLW5hdl9faXRlbSB7XFxuICBmb250LWZhbWlseTogJHJ1c0ZvbnQ7XFxuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XFxuICBwYWRkaW5nOiAxLjJyZW07XFxuICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XFxuICBjb2xvcjogJGJnVENvbG9yQmxhY2s7XFxuICBvcGFjaXR5OiAxO1xcbiAgY3Vyc29yOiBwb2ludGVyO1xcblxcbiAgJjpob3ZlciB7XFxuICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1xcbiAgfVxcbn1cXG5cXG4ubWFpbi1uYXZfX2l0ZW1fZGlzYWJsZWQge1xcbiAgb3BhY2l0eTogMC41O1xcbiAgY3Vyc29yOiBub3QtYWxsb3dlZDtcXG5cXG4gICY6aG92ZXIge1xcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XFxuICB9XFxufVxcblxcbi5tYWluLW5hdl9faXRlbV9hY3RpdmUge1xcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XFxufVxcblxcbi5tYWluLW5hdiB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgZ2FwOiAxNXB4O1xcbn1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiAxMjc5cHgpIHtcXG4gIFxcblxcbn1cXG5cXG5AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjdweCkge1xcbiAgXFxuXFxufVwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuLy8gRXhwb3J0c1xuZXhwb3J0IGRlZmF1bHQgX19fQ1NTX0xPQURFUl9FWFBPUlRfX187XG4iLCIvLyBJbXBvcnRzXG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2Nzc1dpdGhNYXBwaW5nVG9TdHJpbmcuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18gZnJvbSBcIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanNcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBcIlwiLCBcIlwiLHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJcIixcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuLy8gRXhwb3J0c1xuZXhwb3J0IGRlZmF1bHQgX19fQ1NTX0xPQURFUl9FWFBPUlRfX187XG4iLCIvLyBJbXBvcnRzXG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2Nzc1dpdGhNYXBwaW5nVG9TdHJpbmcuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18gZnJvbSBcIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanNcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBcIlwiLCBcIlwiLHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJcIixcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuLy8gRXhwb3J0c1xuZXhwb3J0IGRlZmF1bHQgX19fQ1NTX0xPQURFUl9FWFBPUlRfX187XG4iLCIvLyBJbXBvcnRzXG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2Nzc1dpdGhNYXBwaW5nVG9TdHJpbmcuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18gZnJvbSBcIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanNcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBcIlwiLCBcIlwiLHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJcIixcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuLy8gRXhwb3J0c1xuZXhwb3J0IGRlZmF1bHQgX19fQ1NTX0xPQURFUl9FWFBPUlRfX187XG4iLCIvLyBJbXBvcnRzXG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2Nzc1dpdGhNYXBwaW5nVG9TdHJpbmcuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18gZnJvbSBcIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanNcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBcIlwiLCBcIlwiLHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJcIixcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuLy8gRXhwb3J0c1xuZXhwb3J0IGRlZmF1bHQgX19fQ1NTX0xPQURFUl9FWFBPUlRfX187XG4iLCIvLyBJbXBvcnRzXG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2Nzc1dpdGhNYXBwaW5nVG9TdHJpbmcuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18gZnJvbSBcIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanNcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBcIi5jYXJkcy1jb250YWluZXIge1xcbiAgd2lkdGg6IDEwMCU7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgZmxleC13cmFwOiB3cmFwO1xcbiAgZ2FwOiAxMHB4O1xcbn1cXG5cXG4udGV4dGJvb2stY2FyZCB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xcbiAgd2lkdGg6IDIwMHB4O1xcbiAgaGVpZ2h0OiA2MHB4O1xcbiAgYmFja2dyb3VuZDogcmdiKDIzMywgMTM4LCAxMzgpO1xcbiAgYm9yZGVyOiAxcHggc29saWQgcmVkO1xcbn1cXG5cXG4ucGFnaW5nIHtcXG4gIG1hcmdpbjogMTBweCAwO1xcbn1cIiwgXCJcIix7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCJ3ZWJwYWNrOi8vLi9zcmMvY29tcG9uZW50cy92aWV3L3RleHRib29rL1RleHRib29rLnNjc3NcIixcIndlYnBhY2s6Ly8uLy4uLy4uLy4uLy4uLy4uLyVEMCVBMCVEMCVCMCVEMCVCMSVEMCVCRSVEMSU4NyVEMCVCOCVEMCVCOSUyMCVEMSU4MSVEMSU4MiVEMCVCRSVEMCVCQi9naXQvdHJhc2gvcnNsYW5nZy9yc2xhbmcvc3JjL2NvbXBvbmVudHMvdmlldy90ZXh0Ym9vay9UZXh0Ym9vay5zY3NzXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJBQUFBO0VBQ0UsV0FBQTtFQUNBLGFBQUE7RUFDQSxlQUFBO0VBQ0EsU0FBQTtBQ0NGOztBREVBO0VBQ0UsYUFBQTtFQUNBLG1CQUFBO0VBQ0EsdUJBQUE7RUFDQSxZQUFBO0VBQ0EsWUFBQTtFQUNBLDhCQUFBO0VBQ0EscUJBQUE7QUNDRjs7QURFQTtFQUNFLGNBQUE7QUNDRlwiLFwic291cmNlc0NvbnRlbnRcIjpbXCIuY2FyZHMtY29udGFpbmVyIHtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGZsZXgtd3JhcDogd3JhcDtcXG4gIGdhcDogMTBweDtcXG59XFxuXFxuLnRleHRib29rLWNhcmQge1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XFxuICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXG4gIHdpZHRoOiAyMDBweDtcXG4gIGhlaWdodDogNjBweDtcXG4gIGJhY2tncm91bmQ6IHJnYigyMzMsIDEzOCwgMTM4KTtcXG4gIGJvcmRlcjogMXB4IHNvbGlkIHJlZDtcXG59XFxuXFxuLnBhZ2luZyB7XFxuICBtYXJnaW46IDEwcHggMDtcXG59XCIsXCIuY2FyZHMtY29udGFpbmVyIHtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGZsZXgtd3JhcDogd3JhcDtcXG4gIGdhcDogMTBweDtcXG59XFxuXFxuLnRleHRib29rLWNhcmQge1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XFxuICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcXG4gIHdpZHRoOiAyMDBweDtcXG4gIGhlaWdodDogNjBweDtcXG4gIGJhY2tncm91bmQ6IHJnYigyMzMsIDEzOCwgMTM4KTtcXG4gIGJvcmRlcjogMXB4IHNvbGlkIHJlZDtcXG59XFxuXFxuLnBhZ2luZyB7XFxuICBtYXJnaW46IDEwcHggMDtcXG59XCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vKlxuICBNSVQgTGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuICBBdXRob3IgVG9iaWFzIEtvcHBlcnMgQHNva3JhXG4qL1xuLy8gY3NzIGJhc2UgY29kZSwgaW5qZWN0ZWQgYnkgdGhlIGNzcy1sb2FkZXJcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBmdW5jLW5hbWVzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjc3NXaXRoTWFwcGluZ1RvU3RyaW5nKSB7XG4gIHZhciBsaXN0ID0gW107IC8vIHJldHVybiB0aGUgbGlzdCBvZiBtb2R1bGVzIGFzIGNzcyBzdHJpbmdcblxuICBsaXN0LnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICB2YXIgY29udGVudCA9IGNzc1dpdGhNYXBwaW5nVG9TdHJpbmcoaXRlbSk7XG5cbiAgICAgIGlmIChpdGVtWzJdKSB7XG4gICAgICAgIHJldHVybiBcIkBtZWRpYSBcIi5jb25jYXQoaXRlbVsyXSwgXCIge1wiKS5jb25jYXQoY29udGVudCwgXCJ9XCIpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY29udGVudDtcbiAgICB9KS5qb2luKFwiXCIpO1xuICB9OyAvLyBpbXBvcnQgYSBsaXN0IG9mIG1vZHVsZXMgaW50byB0aGUgbGlzdFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZnVuYy1uYW1lc1xuXG5cbiAgbGlzdC5pID0gZnVuY3Rpb24gKG1vZHVsZXMsIG1lZGlhUXVlcnksIGRlZHVwZSkge1xuICAgIGlmICh0eXBlb2YgbW9kdWxlcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG4gICAgICBtb2R1bGVzID0gW1tudWxsLCBtb2R1bGVzLCBcIlwiXV07XG4gICAgfVxuXG4gICAgdmFyIGFscmVhZHlJbXBvcnRlZE1vZHVsZXMgPSB7fTtcblxuICAgIGlmIChkZWR1cGUpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcHJlZmVyLWRlc3RydWN0dXJpbmdcbiAgICAgICAgdmFyIGlkID0gdGhpc1tpXVswXTtcblxuICAgICAgICBpZiAoaWQgIT0gbnVsbCkge1xuICAgICAgICAgIGFscmVhZHlJbXBvcnRlZE1vZHVsZXNbaWRdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBtb2R1bGVzLmxlbmd0aDsgX2krKykge1xuICAgICAgdmFyIGl0ZW0gPSBbXS5jb25jYXQobW9kdWxlc1tfaV0pO1xuXG4gICAgICBpZiAoZGVkdXBlICYmIGFscmVhZHlJbXBvcnRlZE1vZHVsZXNbaXRlbVswXV0pIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnRpbnVlXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAobWVkaWFRdWVyeSkge1xuICAgICAgICBpZiAoIWl0ZW1bMl0pIHtcbiAgICAgICAgICBpdGVtWzJdID0gbWVkaWFRdWVyeTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtWzJdID0gXCJcIi5jb25jYXQobWVkaWFRdWVyeSwgXCIgYW5kIFwiKS5jb25jYXQoaXRlbVsyXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGlzdC5wdXNoKGl0ZW0pO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gbGlzdDtcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmZ1bmN0aW9uIF9zbGljZWRUb0FycmF5KGFyciwgaSkgeyByZXR1cm4gX2FycmF5V2l0aEhvbGVzKGFycikgfHwgX2l0ZXJhYmxlVG9BcnJheUxpbWl0KGFyciwgaSkgfHwgX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5KGFyciwgaSkgfHwgX25vbkl0ZXJhYmxlUmVzdCgpOyB9XG5cbmZ1bmN0aW9uIF9ub25JdGVyYWJsZVJlc3QoKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlLlxcbkluIG9yZGVyIHRvIGJlIGl0ZXJhYmxlLCBub24tYXJyYXkgb2JqZWN0cyBtdXN0IGhhdmUgYSBbU3ltYm9sLml0ZXJhdG9yXSgpIG1ldGhvZC5cIik7IH1cblxuZnVuY3Rpb24gX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5KG8sIG1pbkxlbikgeyBpZiAoIW8pIHJldHVybjsgaWYgKHR5cGVvZiBvID09PSBcInN0cmluZ1wiKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTsgdmFyIG4gPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobykuc2xpY2UoOCwgLTEpOyBpZiAobiA9PT0gXCJPYmplY3RcIiAmJiBvLmNvbnN0cnVjdG9yKSBuID0gby5jb25zdHJ1Y3Rvci5uYW1lOyBpZiAobiA9PT0gXCJNYXBcIiB8fCBuID09PSBcIlNldFwiKSByZXR1cm4gQXJyYXkuZnJvbShvKTsgaWYgKG4gPT09IFwiQXJndW1lbnRzXCIgfHwgL14oPzpVaXxJKW50KD86OHwxNnwzMikoPzpDbGFtcGVkKT9BcnJheSQvLnRlc3QobikpIHJldHVybiBfYXJyYXlMaWtlVG9BcnJheShvLCBtaW5MZW4pOyB9XG5cbmZ1bmN0aW9uIF9hcnJheUxpa2VUb0FycmF5KGFyciwgbGVuKSB7IGlmIChsZW4gPT0gbnVsbCB8fCBsZW4gPiBhcnIubGVuZ3RoKSBsZW4gPSBhcnIubGVuZ3RoOyBmb3IgKHZhciBpID0gMCwgYXJyMiA9IG5ldyBBcnJheShsZW4pOyBpIDwgbGVuOyBpKyspIHsgYXJyMltpXSA9IGFycltpXTsgfSByZXR1cm4gYXJyMjsgfVxuXG5mdW5jdGlvbiBfaXRlcmFibGVUb0FycmF5TGltaXQoYXJyLCBpKSB7IHZhciBfaSA9IGFyciAmJiAodHlwZW9mIFN5bWJvbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBhcnJbU3ltYm9sLml0ZXJhdG9yXSB8fCBhcnJbXCJAQGl0ZXJhdG9yXCJdKTsgaWYgKF9pID09IG51bGwpIHJldHVybjsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfcywgX2U7IHRyeSB7IGZvciAoX2kgPSBfaS5jYWxsKGFycik7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pW1wicmV0dXJuXCJdICE9IG51bGwpIF9pW1wicmV0dXJuXCJdKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfVxuXG5mdW5jdGlvbiBfYXJyYXlXaXRoSG9sZXMoYXJyKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHJldHVybiBhcnI7IH1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjc3NXaXRoTWFwcGluZ1RvU3RyaW5nKGl0ZW0pIHtcbiAgdmFyIF9pdGVtID0gX3NsaWNlZFRvQXJyYXkoaXRlbSwgNCksXG4gICAgICBjb250ZW50ID0gX2l0ZW1bMV0sXG4gICAgICBjc3NNYXBwaW5nID0gX2l0ZW1bM107XG5cbiAgaWYgKCFjc3NNYXBwaW5nKSB7XG4gICAgcmV0dXJuIGNvbnRlbnQ7XG4gIH1cblxuICBpZiAodHlwZW9mIGJ0b2EgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuICAgIHZhciBiYXNlNjQgPSBidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShjc3NNYXBwaW5nKSkpKTtcbiAgICB2YXIgZGF0YSA9IFwic291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsXCIuY29uY2F0KGJhc2U2NCk7XG4gICAgdmFyIHNvdXJjZU1hcHBpbmcgPSBcIi8qIyBcIi5jb25jYXQoZGF0YSwgXCIgKi9cIik7XG4gICAgdmFyIHNvdXJjZVVSTHMgPSBjc3NNYXBwaW5nLnNvdXJjZXMubWFwKGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICAgIHJldHVybiBcIi8qIyBzb3VyY2VVUkw9XCIuY29uY2F0KGNzc01hcHBpbmcuc291cmNlUm9vdCB8fCBcIlwiKS5jb25jYXQoc291cmNlLCBcIiAqL1wiKTtcbiAgICB9KTtcbiAgICByZXR1cm4gW2NvbnRlbnRdLmNvbmNhdChzb3VyY2VVUkxzKS5jb25jYXQoW3NvdXJjZU1hcHBpbmddKS5qb2luKFwiXFxuXCIpO1xuICB9XG5cbiAgcmV0dXJuIFtjb250ZW50XS5qb2luKFwiXFxuXCIpO1xufTsiLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodXJsLCBvcHRpb25zKSB7XG4gIGlmICghb3B0aW9ucykge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgIG9wdGlvbnMgPSB7fTtcbiAgfSAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZXJzY29yZS1kYW5nbGUsIG5vLXBhcmFtLXJlYXNzaWduXG5cblxuICB1cmwgPSB1cmwgJiYgdXJsLl9fZXNNb2R1bGUgPyB1cmwuZGVmYXVsdCA6IHVybDtcblxuICBpZiAodHlwZW9mIHVybCAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiB1cmw7XG4gIH0gLy8gSWYgdXJsIGlzIGFscmVhZHkgd3JhcHBlZCBpbiBxdW90ZXMsIHJlbW92ZSB0aGVtXG5cblxuICBpZiAoL15bJ1wiXS4qWydcIl0kLy50ZXN0KHVybCkpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cbiAgICB1cmwgPSB1cmwuc2xpY2UoMSwgLTEpO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMuaGFzaCkge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuICAgIHVybCArPSBvcHRpb25zLmhhc2g7XG4gIH0gLy8gU2hvdWxkIHVybCBiZSB3cmFwcGVkP1xuICAvLyBTZWUgaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy12YWx1ZXMtMy8jdXJsc1xuXG5cbiAgaWYgKC9bXCInKCkgXFx0XFxuXS8udGVzdCh1cmwpIHx8IG9wdGlvbnMubmVlZFF1b3Rlcykge1xuICAgIHJldHVybiBcIlxcXCJcIi5jb25jYXQodXJsLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKS5yZXBsYWNlKC9cXG4vZywgXCJcXFxcblwiKSwgXCJcXFwiXCIpO1xuICB9XG5cbiAgcmV0dXJuIHVybDtcbn07IiwiZXhwb3J0IGRlZmF1bHQgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcInNyYy9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLmVvdFwiOyIsImV4cG9ydCBkZWZhdWx0IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCJzcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9sZC5zdmdcIjsiLCJleHBvcnQgZGVmYXVsdCBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyArIFwic3JjL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvbGQudHRmXCI7IiwiZXhwb3J0IGRlZmF1bHQgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcInNyYy9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb2xkLndvZmZcIjsiLCJleHBvcnQgZGVmYXVsdCBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyArIFwic3JjL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLUJvb2suc3ZnXCI7IiwiZXhwb3J0IGRlZmF1bHQgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcInNyYy9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1Cb29rLnR0ZlwiOyIsImV4cG9ydCBkZWZhdWx0IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCJzcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtQm9vay53b2ZmXCI7IiwiZXhwb3J0IGRlZmF1bHQgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcInNyYy9hc3NldHMvZm9udHMvU3Vpc3NlSW50bC1SZWd1bGFyLnN2Z1wiOyIsImV4cG9ydCBkZWZhdWx0IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCJzcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZUludGwtUmVndWxhci50dGZcIjsiLCJleHBvcnQgZGVmYXVsdCBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyArIFwic3JjL2Fzc2V0cy9mb250cy9TdWlzc2VJbnRsLVJlZ3VsYXIud29mZlwiOyIsImV4cG9ydCBkZWZhdWx0IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCJzcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2suZW90XCI7IiwiZXhwb3J0IGRlZmF1bHQgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcInNyYy9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtQm9vay5zdmdcIjsiLCJleHBvcnQgZGVmYXVsdCBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyArIFwic3JjL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1Cb29rLnR0ZlwiOyIsImV4cG9ydCBkZWZhdWx0IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCJzcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLUJvb2sud29mZlwiOyIsImV4cG9ydCBkZWZhdWx0IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCJzcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIuZW90XCI7IiwiZXhwb3J0IGRlZmF1bHQgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gKyBcInNyYy9hc3NldHMvZm9udHMvU3Vpc3NlV29ya3MtUmVndWxhci5zdmdcIjsiLCJleHBvcnQgZGVmYXVsdCBfX3dlYnBhY2tfcHVibGljX3BhdGhfXyArIFwic3JjL2Fzc2V0cy9mb250cy9TdWlzc2VXb3Jrcy1SZWd1bGFyLnR0ZlwiOyIsImV4cG9ydCBkZWZhdWx0IF9fd2VicGFja19wdWJsaWNfcGF0aF9fICsgXCJzcmMvYXNzZXRzL2ZvbnRzL1N1aXNzZVdvcmtzLVJlZ3VsYXIud29mZlwiOyIsImltcG9ydCBhcGkgZnJvbSBcIiEuLi8uLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanNcIjtcbiAgICAgICAgICAgIGltcG9ydCBjb250ZW50IGZyb20gXCIhIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4uLy4uLy4uL25vZGVfbW9kdWxlcy9yZXNvbHZlLXVybC1sb2FkZXIvaW5kZXguanMhLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Nhc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vQXBwVmlldy5zY3NzXCI7XG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuaW5zZXJ0ID0gXCJoZWFkXCI7XG5vcHRpb25zLnNpbmdsZXRvbiA9IGZhbHNlO1xuXG52YXIgdXBkYXRlID0gYXBpKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgY29udGVudC5sb2NhbHMgfHwge307IiwiaW1wb3J0IGFwaSBmcm9tIFwiIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgICAgICAgaW1wb3J0IGNvbnRlbnQgZnJvbSBcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Jlc29sdmUtdXJsLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc2Fzcy1sb2FkZXIvZGlzdC9janMuanMhLi9BdWRpb0NoYWxsZW5nZS5zY3NzXCI7XG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuaW5zZXJ0ID0gXCJoZWFkXCI7XG5vcHRpb25zLnNpbmdsZXRvbiA9IGZhbHNlO1xuXG52YXIgdXBkYXRlID0gYXBpKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgY29udGVudC5sb2NhbHMgfHwge307IiwiaW1wb3J0IGFwaSBmcm9tIFwiIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgICAgICAgaW1wb3J0IGNvbnRlbnQgZnJvbSBcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Jlc29sdmUtdXJsLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc2Fzcy1sb2FkZXIvZGlzdC9janMuanMhLi9EaWN0aW9uYXJ5LnNjc3NcIjtcblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5pbnNlcnQgPSBcImhlYWRcIjtcbm9wdGlvbnMuc2luZ2xldG9uID0gZmFsc2U7XG5cbnZhciB1cGRhdGUgPSBhcGkoY29udGVudCwgb3B0aW9ucyk7XG5cblxuXG5leHBvcnQgZGVmYXVsdCBjb250ZW50LmxvY2FscyB8fCB7fTsiLCJpbXBvcnQgYXBpIGZyb20gXCIhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5qZWN0U3R5bGVzSW50b1N0eWxlVGFnLmpzXCI7XG4gICAgICAgICAgICBpbXBvcnQgY29udGVudCBmcm9tIFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcmVzb2x2ZS11cmwtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zYXNzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL0Zvb3Rlci5zY3NzXCI7XG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuaW5zZXJ0ID0gXCJoZWFkXCI7XG5vcHRpb25zLnNpbmdsZXRvbiA9IGZhbHNlO1xuXG52YXIgdXBkYXRlID0gYXBpKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgY29udGVudC5sb2NhbHMgfHwge307IiwiaW1wb3J0IGFwaSBmcm9tIFwiIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgICAgICAgaW1wb3J0IGNvbnRlbnQgZnJvbSBcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Jlc29sdmUtdXJsLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc2Fzcy1sb2FkZXIvZGlzdC9janMuanMhLi9BdXRoLnNjc3NcIjtcblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5pbnNlcnQgPSBcImhlYWRcIjtcbm9wdGlvbnMuc2luZ2xldG9uID0gZmFsc2U7XG5cbnZhciB1cGRhdGUgPSBhcGkoY29udGVudCwgb3B0aW9ucyk7XG5cblxuXG5leHBvcnQgZGVmYXVsdCBjb250ZW50LmxvY2FscyB8fCB7fTsiLCJpbXBvcnQgYXBpIGZyb20gXCIhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5qZWN0U3R5bGVzSW50b1N0eWxlVGFnLmpzXCI7XG4gICAgICAgICAgICBpbXBvcnQgY29udGVudCBmcm9tIFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcmVzb2x2ZS11cmwtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zYXNzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL0hlYWRlci5zY3NzXCI7XG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuaW5zZXJ0ID0gXCJoZWFkXCI7XG5vcHRpb25zLnNpbmdsZXRvbiA9IGZhbHNlO1xuXG52YXIgdXBkYXRlID0gYXBpKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgY29udGVudC5sb2NhbHMgfHwge307IiwiaW1wb3J0IGFwaSBmcm9tIFwiIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgICAgICAgaW1wb3J0IGNvbnRlbnQgZnJvbSBcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Jlc29sdmUtdXJsLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc2Fzcy1sb2FkZXIvZGlzdC9janMuanMhLi9NYWluLnNjc3NcIjtcblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5pbnNlcnQgPSBcImhlYWRcIjtcbm9wdGlvbnMuc2luZ2xldG9uID0gZmFsc2U7XG5cbnZhciB1cGRhdGUgPSBhcGkoY29udGVudCwgb3B0aW9ucyk7XG5cblxuXG5leHBvcnQgZGVmYXVsdCBjb250ZW50LmxvY2FscyB8fCB7fTsiLCJpbXBvcnQgYXBpIGZyb20gXCIhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5qZWN0U3R5bGVzSW50b1N0eWxlVGFnLmpzXCI7XG4gICAgICAgICAgICBpbXBvcnQgY29udGVudCBmcm9tIFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcmVzb2x2ZS11cmwtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zYXNzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL05vdEZvdW5kLnNjc3NcIjtcblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5pbnNlcnQgPSBcImhlYWRcIjtcbm9wdGlvbnMuc2luZ2xldG9uID0gZmFsc2U7XG5cbnZhciB1cGRhdGUgPSBhcGkoY29udGVudCwgb3B0aW9ucyk7XG5cblxuXG5leHBvcnQgZGVmYXVsdCBjb250ZW50LmxvY2FscyB8fCB7fTsiLCJpbXBvcnQgYXBpIGZyb20gXCIhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5qZWN0U3R5bGVzSW50b1N0eWxlVGFnLmpzXCI7XG4gICAgICAgICAgICBpbXBvcnQgY29udGVudCBmcm9tIFwiISEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvcmVzb2x2ZS11cmwtbG9hZGVyL2luZGV4LmpzIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zYXNzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL1NwcmludC5zY3NzXCI7XG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuaW5zZXJ0ID0gXCJoZWFkXCI7XG5vcHRpb25zLnNpbmdsZXRvbiA9IGZhbHNlO1xuXG52YXIgdXBkYXRlID0gYXBpKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgY29udGVudC5sb2NhbHMgfHwge307IiwiaW1wb3J0IGFwaSBmcm9tIFwiIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgICAgICAgaW1wb3J0IGNvbnRlbnQgZnJvbSBcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Jlc29sdmUtdXJsLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc2Fzcy1sb2FkZXIvZGlzdC9janMuanMhLi9TdGF0cy5zY3NzXCI7XG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuaW5zZXJ0ID0gXCJoZWFkXCI7XG5vcHRpb25zLnNpbmdsZXRvbiA9IGZhbHNlO1xuXG52YXIgdXBkYXRlID0gYXBpKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgY29udGVudC5sb2NhbHMgfHwge307IiwiaW1wb3J0IGFwaSBmcm9tIFwiIS4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgICAgICAgaW1wb3J0IGNvbnRlbnQgZnJvbSBcIiEhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Jlc29sdmUtdXJsLWxvYWRlci9pbmRleC5qcyEuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc2Fzcy1sb2FkZXIvZGlzdC9janMuanMhLi9UZXh0Ym9vay5zY3NzXCI7XG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuaW5zZXJ0ID0gXCJoZWFkXCI7XG5vcHRpb25zLnNpbmdsZXRvbiA9IGZhbHNlO1xuXG52YXIgdXBkYXRlID0gYXBpKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgY29udGVudC5sb2NhbHMgfHwge307IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpc09sZElFID0gZnVuY3Rpb24gaXNPbGRJRSgpIHtcbiAgdmFyIG1lbW87XG4gIHJldHVybiBmdW5jdGlvbiBtZW1vcml6ZSgpIHtcbiAgICBpZiAodHlwZW9mIG1lbW8gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBUZXN0IGZvciBJRSA8PSA5IGFzIHByb3Bvc2VkIGJ5IEJyb3dzZXJoYWNrc1xuICAgICAgLy8gQHNlZSBodHRwOi8vYnJvd3NlcmhhY2tzLmNvbS8jaGFjay1lNzFkODY5MmY2NTMzNDE3M2ZlZTcxNWMyMjJjYjgwNVxuICAgICAgLy8gVGVzdHMgZm9yIGV4aXN0ZW5jZSBvZiBzdGFuZGFyZCBnbG9iYWxzIGlzIHRvIGFsbG93IHN0eWxlLWxvYWRlclxuICAgICAgLy8gdG8gb3BlcmF0ZSBjb3JyZWN0bHkgaW50byBub24tc3RhbmRhcmQgZW52aXJvbm1lbnRzXG4gICAgICAvLyBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJwYWNrLWNvbnRyaWIvc3R5bGUtbG9hZGVyL2lzc3Vlcy8xNzdcbiAgICAgIG1lbW8gPSBCb29sZWFuKHdpbmRvdyAmJiBkb2N1bWVudCAmJiBkb2N1bWVudC5hbGwgJiYgIXdpbmRvdy5hdG9iKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbWVtbztcbiAgfTtcbn0oKTtcblxudmFyIGdldFRhcmdldCA9IGZ1bmN0aW9uIGdldFRhcmdldCgpIHtcbiAgdmFyIG1lbW8gPSB7fTtcbiAgcmV0dXJuIGZ1bmN0aW9uIG1lbW9yaXplKHRhcmdldCkge1xuICAgIGlmICh0eXBlb2YgbWVtb1t0YXJnZXRdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIHN0eWxlVGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXQpOyAvLyBTcGVjaWFsIGNhc2UgdG8gcmV0dXJuIGhlYWQgb2YgaWZyYW1lIGluc3RlYWQgb2YgaWZyYW1lIGl0c2VsZlxuXG4gICAgICBpZiAod2luZG93LkhUTUxJRnJhbWVFbGVtZW50ICYmIHN0eWxlVGFyZ2V0IGluc3RhbmNlb2Ygd2luZG93LkhUTUxJRnJhbWVFbGVtZW50KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gVGhpcyB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBhY2Nlc3MgdG8gaWZyYW1lIGlzIGJsb2NrZWRcbiAgICAgICAgICAvLyBkdWUgdG8gY3Jvc3Mtb3JpZ2luIHJlc3RyaWN0aW9uc1xuICAgICAgICAgIHN0eWxlVGFyZ2V0ID0gc3R5bGVUYXJnZXQuY29udGVudERvY3VtZW50LmhlYWQ7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgICAgICAgIHN0eWxlVGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBtZW1vW3RhcmdldF0gPSBzdHlsZVRhcmdldDtcbiAgICB9XG5cbiAgICByZXR1cm4gbWVtb1t0YXJnZXRdO1xuICB9O1xufSgpO1xuXG52YXIgc3R5bGVzSW5Eb20gPSBbXTtcblxuZnVuY3Rpb24gZ2V0SW5kZXhCeUlkZW50aWZpZXIoaWRlbnRpZmllcikge1xuICB2YXIgcmVzdWx0ID0gLTE7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHlsZXNJbkRvbS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChzdHlsZXNJbkRvbVtpXS5pZGVudGlmaWVyID09PSBpZGVudGlmaWVyKSB7XG4gICAgICByZXN1bHQgPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gbW9kdWxlc1RvRG9tKGxpc3QsIG9wdGlvbnMpIHtcbiAgdmFyIGlkQ291bnRNYXAgPSB7fTtcbiAgdmFyIGlkZW50aWZpZXJzID0gW107XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldO1xuICAgIHZhciBpZCA9IG9wdGlvbnMuYmFzZSA/IGl0ZW1bMF0gKyBvcHRpb25zLmJhc2UgOiBpdGVtWzBdO1xuICAgIHZhciBjb3VudCA9IGlkQ291bnRNYXBbaWRdIHx8IDA7XG4gICAgdmFyIGlkZW50aWZpZXIgPSBcIlwiLmNvbmNhdChpZCwgXCIgXCIpLmNvbmNhdChjb3VudCk7XG4gICAgaWRDb3VudE1hcFtpZF0gPSBjb3VudCArIDE7XG4gICAgdmFyIGluZGV4ID0gZ2V0SW5kZXhCeUlkZW50aWZpZXIoaWRlbnRpZmllcik7XG4gICAgdmFyIG9iaiA9IHtcbiAgICAgIGNzczogaXRlbVsxXSxcbiAgICAgIG1lZGlhOiBpdGVtWzJdLFxuICAgICAgc291cmNlTWFwOiBpdGVtWzNdXG4gICAgfTtcblxuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgIHN0eWxlc0luRG9tW2luZGV4XS5yZWZlcmVuY2VzKys7XG4gICAgICBzdHlsZXNJbkRvbVtpbmRleF0udXBkYXRlcihvYmopO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZXNJbkRvbS5wdXNoKHtcbiAgICAgICAgaWRlbnRpZmllcjogaWRlbnRpZmllcixcbiAgICAgICAgdXBkYXRlcjogYWRkU3R5bGUob2JqLCBvcHRpb25zKSxcbiAgICAgICAgcmVmZXJlbmNlczogMVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWRlbnRpZmllcnMucHVzaChpZGVudGlmaWVyKTtcbiAgfVxuXG4gIHJldHVybiBpZGVudGlmaWVycztcbn1cblxuZnVuY3Rpb24gaW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMpIHtcbiAgdmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgdmFyIGF0dHJpYnV0ZXMgPSBvcHRpb25zLmF0dHJpYnV0ZXMgfHwge307XG5cbiAgaWYgKHR5cGVvZiBhdHRyaWJ1dGVzLm5vbmNlID09PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBub25jZSA9IHR5cGVvZiBfX3dlYnBhY2tfbm9uY2VfXyAhPT0gJ3VuZGVmaW5lZCcgPyBfX3dlYnBhY2tfbm9uY2VfXyA6IG51bGw7XG5cbiAgICBpZiAobm9uY2UpIHtcbiAgICAgIGF0dHJpYnV0ZXMubm9uY2UgPSBub25jZTtcbiAgICB9XG4gIH1cblxuICBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBzdHlsZS5zZXRBdHRyaWJ1dGUoa2V5LCBhdHRyaWJ1dGVzW2tleV0pO1xuICB9KTtcblxuICBpZiAodHlwZW9mIG9wdGlvbnMuaW5zZXJ0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgb3B0aW9ucy5pbnNlcnQoc3R5bGUpO1xuICB9IGVsc2Uge1xuICAgIHZhciB0YXJnZXQgPSBnZXRUYXJnZXQob3B0aW9ucy5pbnNlcnQgfHwgJ2hlYWQnKTtcblxuICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZG4ndCBmaW5kIGEgc3R5bGUgdGFyZ2V0LiBUaGlzIHByb2JhYmx5IG1lYW5zIHRoYXQgdGhlIHZhbHVlIGZvciB0aGUgJ2luc2VydCcgcGFyYW1ldGVyIGlzIGludmFsaWQuXCIpO1xuICAgIH1cblxuICAgIHRhcmdldC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gIH1cblxuICByZXR1cm4gc3R5bGU7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVN0eWxlRWxlbWVudChzdHlsZSkge1xuICAvLyBpc3RhbmJ1bCBpZ25vcmUgaWZcbiAgaWYgKHN0eWxlLnBhcmVudE5vZGUgPT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdHlsZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHN0eWxlKTtcbn1cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICAqL1xuXG5cbnZhciByZXBsYWNlVGV4dCA9IGZ1bmN0aW9uIHJlcGxhY2VUZXh0KCkge1xuICB2YXIgdGV4dFN0b3JlID0gW107XG4gIHJldHVybiBmdW5jdGlvbiByZXBsYWNlKGluZGV4LCByZXBsYWNlbWVudCkge1xuICAgIHRleHRTdG9yZVtpbmRleF0gPSByZXBsYWNlbWVudDtcbiAgICByZXR1cm4gdGV4dFN0b3JlLmZpbHRlcihCb29sZWFuKS5qb2luKCdcXG4nKTtcbiAgfTtcbn0oKTtcblxuZnVuY3Rpb24gYXBwbHlUb1NpbmdsZXRvblRhZyhzdHlsZSwgaW5kZXgsIHJlbW92ZSwgb2JqKSB7XG4gIHZhciBjc3MgPSByZW1vdmUgPyAnJyA6IG9iai5tZWRpYSA/IFwiQG1lZGlhIFwiLmNvbmNhdChvYmoubWVkaWEsIFwiIHtcIikuY29uY2F0KG9iai5jc3MsIFwifVwiKSA6IG9iai5jc3M7IC8vIEZvciBvbGQgSUVcblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgICovXG5cbiAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSByZXBsYWNlVGV4dChpbmRleCwgY3NzKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgY3NzTm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcyk7XG4gICAgdmFyIGNoaWxkTm9kZXMgPSBzdHlsZS5jaGlsZE5vZGVzO1xuXG4gICAgaWYgKGNoaWxkTm9kZXNbaW5kZXhdKSB7XG4gICAgICBzdHlsZS5yZW1vdmVDaGlsZChjaGlsZE5vZGVzW2luZGV4XSk7XG4gICAgfVxuXG4gICAgaWYgKGNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICBzdHlsZS5pbnNlcnRCZWZvcmUoY3NzTm9kZSwgY2hpbGROb2Rlc1tpbmRleF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHlsZS5hcHBlbmRDaGlsZChjc3NOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwbHlUb1RhZyhzdHlsZSwgb3B0aW9ucywgb2JqKSB7XG4gIHZhciBjc3MgPSBvYmouY3NzO1xuICB2YXIgbWVkaWEgPSBvYmoubWVkaWE7XG4gIHZhciBzb3VyY2VNYXAgPSBvYmouc291cmNlTWFwO1xuXG4gIGlmIChtZWRpYSkge1xuICAgIHN0eWxlLnNldEF0dHJpYnV0ZSgnbWVkaWEnLCBtZWRpYSk7XG4gIH0gZWxzZSB7XG4gICAgc3R5bGUucmVtb3ZlQXR0cmlidXRlKCdtZWRpYScpO1xuICB9XG5cbiAgaWYgKHNvdXJjZU1hcCAmJiB0eXBlb2YgYnRvYSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjc3MgKz0gXCJcXG4vKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LFwiLmNvbmNhdChidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShzb3VyY2VNYXApKSkpLCBcIiAqL1wiKTtcbiAgfSAvLyBGb3Igb2xkIElFXG5cbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICAqL1xuXG5cbiAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSBjc3M7XG4gIH0gZWxzZSB7XG4gICAgd2hpbGUgKHN0eWxlLmZpcnN0Q2hpbGQpIHtcbiAgICAgIHN0eWxlLnJlbW92ZUNoaWxkKHN0eWxlLmZpcnN0Q2hpbGQpO1xuICAgIH1cblxuICAgIHN0eWxlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcykpO1xuICB9XG59XG5cbnZhciBzaW5nbGV0b24gPSBudWxsO1xudmFyIHNpbmdsZXRvbkNvdW50ZXIgPSAwO1xuXG5mdW5jdGlvbiBhZGRTdHlsZShvYmosIG9wdGlvbnMpIHtcbiAgdmFyIHN0eWxlO1xuICB2YXIgdXBkYXRlO1xuICB2YXIgcmVtb3ZlO1xuXG4gIGlmIChvcHRpb25zLnNpbmdsZXRvbikge1xuICAgIHZhciBzdHlsZUluZGV4ID0gc2luZ2xldG9uQ291bnRlcisrO1xuICAgIHN0eWxlID0gc2luZ2xldG9uIHx8IChzaW5nbGV0b24gPSBpbnNlcnRTdHlsZUVsZW1lbnQob3B0aW9ucykpO1xuICAgIHVwZGF0ZSA9IGFwcGx5VG9TaW5nbGV0b25UYWcuYmluZChudWxsLCBzdHlsZSwgc3R5bGVJbmRleCwgZmFsc2UpO1xuICAgIHJlbW92ZSA9IGFwcGx5VG9TaW5nbGV0b25UYWcuYmluZChudWxsLCBzdHlsZSwgc3R5bGVJbmRleCwgdHJ1ZSk7XG4gIH0gZWxzZSB7XG4gICAgc3R5bGUgPSBpbnNlcnRTdHlsZUVsZW1lbnQob3B0aW9ucyk7XG4gICAgdXBkYXRlID0gYXBwbHlUb1RhZy5iaW5kKG51bGwsIHN0eWxlLCBvcHRpb25zKTtcblxuICAgIHJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgICAgIHJlbW92ZVN0eWxlRWxlbWVudChzdHlsZSk7XG4gICAgfTtcbiAgfVxuXG4gIHVwZGF0ZShvYmopO1xuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlU3R5bGUobmV3T2JqKSB7XG4gICAgaWYgKG5ld09iaikge1xuICAgICAgaWYgKG5ld09iai5jc3MgPT09IG9iai5jc3MgJiYgbmV3T2JqLm1lZGlhID09PSBvYmoubWVkaWEgJiYgbmV3T2JqLnNvdXJjZU1hcCA9PT0gb2JqLnNvdXJjZU1hcCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHVwZGF0ZShvYmogPSBuZXdPYmopO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1vdmUoKTtcbiAgICB9XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGxpc3QsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307IC8vIEZvcmNlIHNpbmdsZS10YWcgc29sdXRpb24gb24gSUU2LTksIHdoaWNoIGhhcyBhIGhhcmQgbGltaXQgb24gdGhlICMgb2YgPHN0eWxlPlxuICAvLyB0YWdzIGl0IHdpbGwgYWxsb3cgb24gYSBwYWdlXG5cbiAgaWYgKCFvcHRpb25zLnNpbmdsZXRvbiAmJiB0eXBlb2Ygb3B0aW9ucy5zaW5nbGV0b24gIT09ICdib29sZWFuJykge1xuICAgIG9wdGlvbnMuc2luZ2xldG9uID0gaXNPbGRJRSgpO1xuICB9XG5cbiAgbGlzdCA9IGxpc3QgfHwgW107XG4gIHZhciBsYXN0SWRlbnRpZmllcnMgPSBtb2R1bGVzVG9Eb20obGlzdCwgb3B0aW9ucyk7XG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUobmV3TGlzdCkge1xuICAgIG5ld0xpc3QgPSBuZXdMaXN0IHx8IFtdO1xuXG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChuZXdMaXN0KSAhPT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFzdElkZW50aWZpZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaWRlbnRpZmllciA9IGxhc3RJZGVudGlmaWVyc1tpXTtcbiAgICAgIHZhciBpbmRleCA9IGdldEluZGV4QnlJZGVudGlmaWVyKGlkZW50aWZpZXIpO1xuICAgICAgc3R5bGVzSW5Eb21baW5kZXhdLnJlZmVyZW5jZXMtLTtcbiAgICB9XG5cbiAgICB2YXIgbmV3TGFzdElkZW50aWZpZXJzID0gbW9kdWxlc1RvRG9tKG5ld0xpc3QsIG9wdGlvbnMpO1xuXG4gICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGxhc3RJZGVudGlmaWVycy5sZW5ndGg7IF9pKyspIHtcbiAgICAgIHZhciBfaWRlbnRpZmllciA9IGxhc3RJZGVudGlmaWVyc1tfaV07XG5cbiAgICAgIHZhciBfaW5kZXggPSBnZXRJbmRleEJ5SWRlbnRpZmllcihfaWRlbnRpZmllcik7XG5cbiAgICAgIGlmIChzdHlsZXNJbkRvbVtfaW5kZXhdLnJlZmVyZW5jZXMgPT09IDApIHtcbiAgICAgICAgc3R5bGVzSW5Eb21bX2luZGV4XS51cGRhdGVyKCk7XG5cbiAgICAgICAgc3R5bGVzSW5Eb20uc3BsaWNlKF9pbmRleCwgMSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGFzdElkZW50aWZpZXJzID0gbmV3TGFzdElkZW50aWZpZXJzO1xuICB9O1xufTsiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5oYW5kbGVSZWdpc3RyYXRpb24gPSBleHBvcnRzLmhhbmRsZUxvZ291dCA9IGV4cG9ydHMuaGFuZGxlQXV0aCA9IGV4cG9ydHMudXBkYXRlU3RhdGVPbkF1dGggPSBleHBvcnRzLmNoZWNrQXV0aFN0YXRlID0gdm9pZCAwO1xuY29uc3QgYXV0aF8xID0gcmVxdWlyZShcIi4uLy4uL21vZGVsL2FwaS9hdXRoXCIpO1xuY29uc3QgY2hlY2tBdXRoU3RhdGUgPSAoc3RhdGUpID0+IF9fYXdhaXRlcih2b2lkIDAsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgIGlmICghc3RhdGUudG9rZW4pIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgIH1cbiAgICBjb25zdCBuZXdTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKTtcbiAgICBpZiAoRGF0ZS5ub3coKSA+IHN0YXRlLmV4cGlyZSkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IHlpZWxkICgwLCBhdXRoXzEuZ2V0VG9rZW4pKG5ld1N0YXRlLnVzZXJJZCwgc3RhdGUucmVmcmVzaFRva2VuKTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICBuZXdTdGF0ZS5leHBpcmUgPSBEYXRlLm5vdygpICsgNzIwMDAwMDtcbiAgICAgICAgICAgIG5ld1N0YXRlLnJlZnJlc2hUb2tlbiA9IHJlc3BvbnNlLmRhdGEucmVmcmVzaFRva2VuO1xuICAgICAgICAgICAgbmV3U3RhdGUudG9rZW4gPSByZXNwb25zZS5kYXRhLnRva2VuO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBuZXdTdGF0ZS5sb2dnZWRJbiA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBuZXdTdGF0ZTtcbn0pO1xuZXhwb3J0cy5jaGVja0F1dGhTdGF0ZSA9IGNoZWNrQXV0aFN0YXRlO1xuY29uc3QgdXBkYXRlU3RhdGVPbkF1dGggPSAoc3RhdGUsIGRhdGEpID0+IHtcbiAgICBjb25zdCBuZXdTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKTtcbiAgICBuZXdTdGF0ZS5sb2dnZWRJbiA9IHRydWU7XG4gICAgbmV3U3RhdGUudG9rZW4gPSBkYXRhLnRva2VuO1xuICAgIG5ld1N0YXRlLnJlZnJlc2hUb2tlbiA9IGRhdGEucmVmcmVzaFRva2VuO1xuICAgIG5ld1N0YXRlLnVzZXJJZCA9IGRhdGEudXNlcklkO1xuICAgIG5ld1N0YXRlLnVzZXJOYW1lID0gZGF0YS5uYW1lO1xuICAgIGNvbnN0IGRhdGVFeHBpcmUgPSBEYXRlLm5vdygpICsgNzIwMDAwMDtcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgncmVmcmVzaFRva2VuJywgZGF0YS5yZWZyZXNoVG9rZW4pO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdleHBpcmUnLCBgJHtkYXRlRXhwaXJlfWApO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0b2tlbicsIGRhdGEudG9rZW4pO1xuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd1c2VySWQnLCBkYXRhLnVzZXJJZCk7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3VzZXJOYW1lJywgZGF0YS5uYW1lKTtcbiAgICByZXR1cm4gbmV3U3RhdGU7XG59O1xuZXhwb3J0cy51cGRhdGVTdGF0ZU9uQXV0aCA9IHVwZGF0ZVN0YXRlT25BdXRoO1xuY29uc3QgaGFuZGxlQXV0aCA9IChzdGF0ZSkgPT4gX19hd2FpdGVyKHZvaWQgMCwgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgbGV0IG5ld1N0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgc3RhdGUpO1xuICAgIGNvbnN0IGVtYWlsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW25hbWU9XCJlbWFpbFwiXScpO1xuICAgIGNvbnN0IHBhc3N3b3JkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW25hbWU9XCJwYXNzd29yZFwiXScpO1xuICAgIGNvbnN0IGF1dGhEYXRhID0ge1xuICAgICAgICBlbWFpbDogZW1haWwudmFsdWUsXG4gICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZC52YWx1ZSxcbiAgICB9O1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0geWllbGQgKDAsIGF1dGhfMS5hdXRoVXNlcikoYXV0aERhdGEpO1xuICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlRGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBuZXdTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sICgwLCBleHBvcnRzLnVwZGF0ZVN0YXRlT25BdXRoKShuZXdTdGF0ZSwgcmVzcG9uc2VEYXRhKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGUuaW5jbHVkZXMoJzQwMycpKSB7XG4gICAgICAgICAgICBhbGVydCgn0JvQvtCz0LjQvSDQuNC70Lgg0L/QsNGA0L7Qu9GMINC90LUg0LLQtdGA0L3RiyEg0J/QvtC/0YDQvtCx0YPQudGC0LUg0YHQvdC+0LLQsCEnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3U3RhdGU7XG59KTtcbmV4cG9ydHMuaGFuZGxlQXV0aCA9IGhhbmRsZUF1dGg7XG5jb25zdCBoYW5kbGVMb2dvdXQgPSAoc3RhdGUpID0+IHtcbiAgICBjb25zdCBuZXdTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKTtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgncmVmcmVzaFRva2VuJyk7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2V4cGlyZScpO1xuICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd0b2tlbicpO1xuICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VySWQnKTtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlck5hbWUnKTtcbiAgICBuZXdTdGF0ZS5sb2dnZWRJbiA9IGZhbHNlO1xuICAgIG5ld1N0YXRlLnRva2VuID0gJyc7XG4gICAgbmV3U3RhdGUucmVmcmVzaFRva2VuID0gJyc7XG4gICAgbmV3U3RhdGUudXNlcklkID0gJyc7XG4gICAgbmV3U3RhdGUudXNlck5hbWUgPSAnJztcbiAgICByZXR1cm4gbmV3U3RhdGU7XG59O1xuZXhwb3J0cy5oYW5kbGVMb2dvdXQgPSBoYW5kbGVMb2dvdXQ7XG5jb25zdCBoYW5kbGVSZWdpc3RyYXRpb24gPSAoc3RhdGUpID0+IF9fYXdhaXRlcih2b2lkIDAsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgIGxldCBuZXdTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIHN0YXRlKTtcbiAgICBjb25zdCBlbWFpbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tuYW1lPVwiZW1haWxcIl0nKTtcbiAgICBjb25zdCBuYW1lID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW25hbWU9XCJuYW1lXCJdJyk7XG4gICAgY29uc3QgcGFzc3dvcmQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbbmFtZT1cInBhc3N3b3JkXCJdJyk7XG4gICAgY29uc3QgcGFzc3dvcmRDb25maXJtYXRpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbbmFtZT1cInBhc3N3b3JkLWNvbmZpcm1cIl0nKTtcbiAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICBlbWFpbDogZW1haWwudmFsdWUsXG4gICAgICAgIG5hbWU6IG5hbWUudmFsdWUsXG4gICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZC52YWx1ZSxcbiAgICB9O1xuICAgIGlmIChwYXNzd29yZC52YWx1ZSAhPT0gcGFzc3dvcmRDb25maXJtYXRpb24udmFsdWUpIHtcbiAgICAgICAgYWxlcnQoJ9Cf0LDRgNC+0LvQuCDQtNC+0LvQttC90Ysg0YHQvtCy0L/QsNC00LDRgtGMIScpO1xuICAgICAgICByZXR1cm4gbmV3U3RhdGU7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlZ2lzdHJhdGlvbiA9IHlpZWxkICgwLCBhdXRoXzEucmVnTmV3VXNlcikoZGF0YSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGFsZXJ0KCfQkNC60LrQsNGD0L3RgiDRgSDRgtCw0LrQuNC8INC40LzQtdC50LvQvtC8INGD0LbQtSDRgdGD0YnQtdGB0YLQstGD0LXRgiEnKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgYXV0aERhdGEgPSB7XG4gICAgICAgICAgICBlbWFpbDogZW1haWwudmFsdWUsXG4gICAgICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQudmFsdWUsXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0geWllbGQgKDAsIGF1dGhfMS5hdXRoVXNlcikoYXV0aERhdGEpO1xuICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlRGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBuZXdTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sICgwLCBleHBvcnRzLnVwZGF0ZVN0YXRlT25BdXRoKShuZXdTdGF0ZSwgcmVzcG9uc2VEYXRhKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGUuaW5jbHVkZXMoJzQwMycpKSB7XG4gICAgICAgICAgICBhbGVydCgn0JvQvtCz0LjQvSDQuNC70Lgg0L/QsNGA0L7Qu9GMINC90LUg0LLQtdGA0L3RiyEg0J/QvtC/0YDQvtCx0YPQudGC0LUg0YHQvdC+0LLQsCEnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3U3RhdGU7XG59KTtcbmV4cG9ydHMuaGFuZGxlUmVnaXN0cmF0aW9uID0gaGFuZGxlUmVnaXN0cmF0aW9uO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMucm91dGUgPSBleHBvcnRzLmhhbmRsZVJvdXRlID0gdm9pZCAwO1xuY29uc3QgTm90Rm91bmRfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi4vdmlldy9ub3RGb3VuZC9Ob3RGb3VuZFwiKSk7XG5jb25zdCBNYWluXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4uL3ZpZXcvbWFpbi9NYWluXCIpKTtcbmNvbnN0IFRleHRib29rXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4uL3ZpZXcvdGV4dGJvb2svVGV4dGJvb2tcIikpO1xuY29uc3QgRGljdGlvbmFyeV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuLi92aWV3L2RpY3Rpb25hcnkvRGljdGlvbmFyeVwiKSk7XG5jb25zdCBTcHJpbnRfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi4vdmlldy9zcHJpbnQvU3ByaW50XCIpKTtcbmNvbnN0IEF1ZGlvQ2hhbGxlbmdlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4uL3ZpZXcvYXVkaW8vQXVkaW9DaGFsbGVuZ2VcIikpO1xuY29uc3QgU3RhdHNfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi4vdmlldy9zdGF0cy9TdGF0c1wiKSk7XG5jb25zdCBhdXRoX2hlbHBlcl8xID0gcmVxdWlyZShcIi4vaGVscGVycy9hdXRoLWhlbHBlclwiKTtcbmNvbnN0IHJvdXRlcyA9IHtcbiAgICBub3RGb3VuZDogJ25vdEZvdW5kJyxcbiAgICAnLyc6ICdtYWluJyxcbiAgICB0ZXh0Ym9vazogJ3RleHRib29rJyxcbiAgICBkaWN0aW9uYXJ5OiAnZGljdGlvbmFyeScsXG4gICAgc3ByaW50OiAnc3ByaW50JyxcbiAgICBhdWRpbzogJ2F1ZGlvJyxcbiAgICBzdGF0czogJ3N0YXRzJyxcbn07XG4vLyBUT0RPIGFkZCBhdXRoIGxvZ2ljXG4vLyBBZGQgdXNlciBkYXRhIGlmIGV4aXN0IHRva2VuIGluIGxvY2Fsc3RvcmFnZSBhbmQgaXQgaXMgdmFsaWRcbmNvbnN0IHJld3JpdGVVcmwgPSAoKSA9PiB7XG4gICAgY29uc3QgeyBoYXNoIH0gPSB3aW5kb3cubG9jYXRpb247XG4gICAgaWYgKCFoYXNoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gYCMke3dpbmRvdy5sb2NhdGlvbi5wYXRobmFtZX1gO1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPSAnJztcbiAgICB9XG59O1xuY29uc3Qgc2V0UHJvZ3Jlc3MgPSAocXVlcnlTdHIsIHRleHRib29rKSA9PiB7XG4gICAgbGV0IHsgdW5pdCB9ID0gdGV4dGJvb2s7XG4gICAgbGV0IHsgcGFnZSB9ID0gdGV4dGJvb2s7XG4gICAgaWYgKHF1ZXJ5U3RyWzFdICYmIHF1ZXJ5U3RyWzFdLmluY2x1ZGVzKCd1bml0JykpIHtcbiAgICAgICAgdW5pdCA9ICtxdWVyeVN0clsxXS5yZXBsYWNlKC8oW2EtekEtWl0pKy8sICcnKSB8fCAxO1xuICAgICAgICBpZiAocXVlcnlTdHJbMl0pIHtcbiAgICAgICAgICAgIHBhZ2UgPSArcXVlcnlTdHJbMl0gfHwgMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyB1bml0LCBwYWdlIH07XG59O1xuY29uc3QgaGFuZGxlUm91dGUgPSAoc3RhdGUpID0+IF9fYXdhaXRlcih2b2lkIDAsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgIGxldCBuZXdTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIHlpZWxkICgwLCBhdXRoX2hlbHBlcl8xLmNoZWNrQXV0aFN0YXRlKShzdGF0ZSkpO1xuICAgIHJld3JpdGVVcmwoKTtcbiAgICBjb25zdCBxdWVyeVN0ciA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoXG4gICAgICAgIC5yZXBsYWNlKCcvIycsICcnKVxuICAgICAgICAuc3BsaXQoJy8nKVxuICAgICAgICAuZmlsdGVyKChpdGVtKSA9PiBpdGVtICE9PSAnIycgJiYgaXRlbSAhPT0gJycpO1xuICAgIGNvbnN0IHBhdGggPSBxdWVyeVN0ci5sZW5ndGggPyBxdWVyeVN0clswXSA6ICcvJztcbiAgICBjb25zdCBwYWdlTmFtZSA9IHJvdXRlc1twYXRoXSB8fCByb3V0ZXMubm90Rm91bmQ7XG4gICAgbGV0IHBhZ2U7XG4gICAgc3dpdGNoIChwYWdlTmFtZSkge1xuICAgICAgICBjYXNlICdtYWluJzpcbiAgICAgICAgICAgIHBhZ2UgPSBuZXcgTWFpbl8xLmRlZmF1bHQobmV3U3RhdGUpO1xuICAgICAgICAgICAgbmV3U3RhdGUgPSB5aWVsZCBwYWdlLnJlbmRlcigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3RleHRib29rJzpcbiAgICAgICAgICAgIG5ld1N0YXRlLnRleHRib29rID0gc2V0UHJvZ3Jlc3MocXVlcnlTdHIsIG5ld1N0YXRlLnRleHRib29rKTtcbiAgICAgICAgICAgIHBhZ2UgPSBuZXcgVGV4dGJvb2tfMS5kZWZhdWx0KG5ld1N0YXRlKTtcbiAgICAgICAgICAgIG5ld1N0YXRlID0geWllbGQgcGFnZS5yZW5kZXIoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkaWN0aW9uYXJ5JzpcbiAgICAgICAgICAgIHBhZ2UgPSBuZXcgRGljdGlvbmFyeV8xLmRlZmF1bHQobmV3U3RhdGUpO1xuICAgICAgICAgICAgbmV3U3RhdGUgPSB5aWVsZCBwYWdlLnJlbmRlcigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3NwcmludCc6XG4gICAgICAgICAgICBwYWdlID0gbmV3IFNwcmludF8xLmRlZmF1bHQobmV3U3RhdGUpO1xuICAgICAgICAgICAgbmV3U3RhdGUgPSB5aWVsZCBwYWdlLnJlbmRlcigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2F1ZGlvJzpcbiAgICAgICAgICAgIHBhZ2UgPSBuZXcgQXVkaW9DaGFsbGVuZ2VfMS5kZWZhdWx0KG5ld1N0YXRlKTtcbiAgICAgICAgICAgIG5ld1N0YXRlID0geWllbGQgcGFnZS5yZW5kZXIoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdzdGF0cyc6XG4gICAgICAgICAgICBpZiAoIW5ld1N0YXRlLmxvZ2dlZEluKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lID0gJy8nO1xuICAgICAgICAgICAgICAgICgwLCBleHBvcnRzLmhhbmRsZVJvdXRlKShuZXdTdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYWdlID0gbmV3IFN0YXRzXzEuZGVmYXVsdChuZXdTdGF0ZSk7XG4gICAgICAgICAgICBuZXdTdGF0ZSA9IHlpZWxkIHBhZ2UucmVuZGVyKCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbm90Rm91bmQnOlxuICAgICAgICAgICAgcGFnZSA9IG5ldyBOb3RGb3VuZF8xLmRlZmF1bHQobmV3U3RhdGUpO1xuICAgICAgICAgICAgbmV3U3RhdGUgPSB5aWVsZCBwYWdlLnJlbmRlcigpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBwYWdlID0gbmV3IE1haW5fMS5kZWZhdWx0KG5ld1N0YXRlKTtcbiAgICAgICAgICAgIG5ld1N0YXRlID0geWllbGQgcGFnZS5yZW5kZXIoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gbmV3U3RhdGU7XG59KTtcbmV4cG9ydHMuaGFuZGxlUm91dGUgPSBoYW5kbGVSb3V0ZTtcbmNvbnN0IHJvdXRlID0gKGUsIHN0YXRlKSA9PiB7XG4gICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKHt9LCAnJywgdGFyZ2V0LmhyZWYpO1xuICAgICgwLCBleHBvcnRzLmhhbmRsZVJvdXRlKShzdGF0ZSk7XG59O1xuZXhwb3J0cy5yb3V0ZSA9IHJvdXRlO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBnZXRJbml0aWFsU3RhdGUgPSAoKSA9PiB7XG4gICAgY29uc3QgdGV4dGJvb2sgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndGV4dGJvb2snKTtcbiAgICBjb25zdCB0ZXh0Ym9va1Byb2dyZXNzID0gdGV4dGJvb2sgPyBKU09OLnBhcnNlKHRleHRib29rKSA6ICcnO1xuICAgIHJldHVybiB7XG4gICAgICAgIGxvZ2dlZEluOiBmYWxzZSxcbiAgICAgICAgcGFnZTogJ21haW4nLFxuICAgICAgICByZWZyZXNoVG9rZW46IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdyZWZyZXNoVG9rZW4nKSB8fCAnJyxcbiAgICAgICAgZXhwaXJlOiBOdW1iZXIobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2V4cGlyZScpKSB8fCAwLFxuICAgICAgICB0b2tlbjogbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJykgfHwgJycsXG4gICAgICAgIHVzZXJJZDogbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXJJZCcpIHx8ICcnLFxuICAgICAgICB1c2VyTmFtZTogbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXJOYW1lJykgfHwgJycsXG4gICAgICAgIHRleHRib29rOiB0ZXh0Ym9va1Byb2dyZXNzICE9PSBudWxsICYmIHRleHRib29rUHJvZ3Jlc3MgIT09IHZvaWQgMCA/IHRleHRib29rUHJvZ3Jlc3MgOiB7XG4gICAgICAgICAgICB1bml0OiAxLFxuICAgICAgICAgICAgcGFnZTogMSxcbiAgICAgICAgfSxcbiAgICB9O1xufTtcbmV4cG9ydHMuZGVmYXVsdCA9IGdldEluaXRpYWxTdGF0ZTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmdldFRva2VuID0gZXhwb3J0cy5hdXRoVXNlciA9IGV4cG9ydHMucmVnTmV3VXNlciA9IHZvaWQgMDtcbmNvbnN0IGF4aW9zXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcImF4aW9zXCIpKTtcbmNvbnN0IGNvbnN0YW50c18xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuLi9jb25zdGFudHNcIikpO1xuY29uc3QgcmVnTmV3VXNlciA9IChkYXRhKSA9PiBfX2F3YWl0ZXIodm9pZCAwLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHsgcmV0dXJuIGF4aW9zXzEuZGVmYXVsdC5wb3N0KGAke2NvbnN0YW50c18xLmRlZmF1bHR9L3VzZXJzYCwgZGF0YSk7IH0pO1xuZXhwb3J0cy5yZWdOZXdVc2VyID0gcmVnTmV3VXNlcjtcbmNvbnN0IGF1dGhVc2VyID0gKGRhdGEpID0+IF9fYXdhaXRlcih2b2lkIDAsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkgeyByZXR1cm4gYXhpb3NfMS5kZWZhdWx0LnBvc3QoYCR7Y29uc3RhbnRzXzEuZGVmYXVsdH0vc2lnbmluYCwgZGF0YSk7IH0pO1xuZXhwb3J0cy5hdXRoVXNlciA9IGF1dGhVc2VyO1xuY29uc3QgZ2V0VG9rZW4gPSAodXNlcklkLCB0b2tlbikgPT4gX19hd2FpdGVyKHZvaWQgMCwgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgcmV0dXJuIGF4aW9zXzEuZGVmYXVsdC5nZXQoYCR7Y29uc3RhbnRzXzEuZGVmYXVsdH0vdXNlcnMvJHt1c2VySWR9L3Rva2Vuc2AsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke3Rva2VufWAsXG4gICAgICAgIH0sXG4gICAgfSk7XG59KTtcbmV4cG9ydHMuZ2V0VG9rZW4gPSBnZXRUb2tlbjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgYXBpQmFzZVVybCA9ICdodHRwczovL3JzbGFuZy1sZWFybi13b3Jkcy5oZXJva3VhcHAuY29tJztcbmV4cG9ydHMuZGVmYXVsdCA9IGFwaUJhc2VVcmw7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IG1lbnVJdGVtcyA9IFtcbiAgICB7IG5hbWU6ICfQo9GH0LXQsdC90LjQuicsIGhyZWY6ICd0ZXh0Ym9vaycsIGF1dGg6IGZhbHNlIH0sXG4gICAgeyBuYW1lOiAn0KHQu9C+0LLQsNGA0YwnLCBocmVmOiAnZGljdGlvbmFyeScsIGF1dGg6IGZhbHNlIH0sXG4gICAgeyBuYW1lOiAn0KHQv9GA0LjQvdGCJywgaHJlZjogJ3NwcmludCcsIGF1dGg6IGZhbHNlIH0sXG4gICAgeyBuYW1lOiAn0JDRg9C00LjQvtCy0YvQt9C+0LInLCBocmVmOiAnYXVkaW8nLCBhdXRoOiBmYWxzZSB9LFxuICAgIHsgbmFtZTogJ9Ch0YLQsNGC0LjRgdGC0LjQutCwJywgaHJlZjogJ3N0YXRzJywgYXV0aDogdHJ1ZSB9LFxuXTtcbmV4cG9ydHMuZGVmYXVsdCA9IG1lbnVJdGVtcztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3Qgd29yZHMgPSBbXG4gICAgeyBpZDogMSwgbmFtZTogJ3dvcmQxJyB9LFxuICAgIHsgaWQ6IDIsIG5hbWU6ICd3b3JkMicgfSxcbiAgICB7IGlkOiAzLCBuYW1lOiAnd29yZDMnIH0sXG4gICAgeyBpZDogNCwgbmFtZTogJ3dvcmQ0JyB9LFxuICAgIHsgaWQ6IDUsIG5hbWU6ICd3b3JkNScgfSxcbiAgICB7IGlkOiA2LCBuYW1lOiAnd29yZDYnIH0sXG4gICAgeyBpZDogNywgbmFtZTogJ3dvcmQ3JyB9LFxuICAgIHsgaWQ6IDgsIG5hbWU6ICd3b3JkOCcgfSxcbiAgICB7IGlkOiA5LCBuYW1lOiAnd29yZDknIH0sXG4gICAgeyBpZDogMTAsIG5hbWU6ICd3b3JkMTAnIH0sXG4gICAgeyBpZDogMTEsIG5hbWU6ICd3b3JkMTEnIH0sXG4gICAgeyBpZDogMTIsIG5hbWU6ICd3b3JkMTInIH0sXG4gICAgeyBpZDogMTMsIG5hbWU6ICd3b3JkMTMnIH0sXG4gICAgeyBpZDogMTQsIG5hbWU6ICd3b3JkMTQnIH0sXG4gICAgeyBpZDogMTUsIG5hbWU6ICd3b3JkMTUnIH0sXG4gICAgeyBpZDogMTYsIG5hbWU6ICd3b3JkMTYnIH0sXG4gICAgeyBpZDogMTcsIG5hbWU6ICd3b3JkMTcnIH0sXG4gICAgeyBpZDogMTgsIG5hbWU6ICd3b3JkMTgnIH0sXG4gICAgeyBpZDogMTksIG5hbWU6ICd3b3JkMTknIH0sXG4gICAgeyBpZDogMjAsIG5hbWU6ICd3b3JkMjAnIH0sXG5dO1xuZXhwb3J0cy5kZWZhdWx0ID0gd29yZHM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3Qgcm91dGVyXzEgPSByZXF1aXJlKFwiLi4vY29udHJvbGxlci9yb3V0ZXJcIik7XG5jb25zdCBGb290ZXJfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9mb290ZXIvRm9vdGVyXCIpKTtcbmNvbnN0IHN0YXRlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4uL2NvbnRyb2xsZXIvc3RhdGVcIikpO1xucmVxdWlyZShcIi4vQXBwVmlldy5zY3NzXCIpO1xuY29uc3QgSGVhZGVyXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vaGVhZGVyL0hlYWRlclwiKSk7XG5jb25zdCBBcHBWaWV3ID0gKCkgPT4gX19hd2FpdGVyKHZvaWQgMCwgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgbGV0IHN0YXRlID0gKDAsIHN0YXRlXzEuZGVmYXVsdCkoKTtcbiAgICBzdGF0ZSA9IHlpZWxkICgwLCByb3V0ZXJfMS5oYW5kbGVSb3V0ZSkoc3RhdGUpO1xuICAgIGNvbnN0IGhlYWRlciA9IG5ldyBIZWFkZXJfMS5kZWZhdWx0KHN0YXRlKTtcbiAgICBzdGF0ZSA9IHlpZWxkIGhlYWRlci5yZW5kZXIoKTtcbiAgICAoMCwgRm9vdGVyXzEuZGVmYXVsdCkoKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICAoMCwgcm91dGVyXzEuaGFuZGxlUm91dGUpKHN0YXRlKTtcbiAgICB9KTtcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gQXBwVmlldztcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBBdWRpb1RlbXBsYXRlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vQXVkaW9UZW1wbGF0ZVwiKSk7XG5yZXF1aXJlKFwiLi9BdWRpb0NoYWxsZW5nZS5zY3NzXCIpO1xuY2xhc3MgQXVkaW9DaGFsbGVuZ2Uge1xuICAgIGNvbnN0cnVjdG9yKHN0YXRlKSB7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5wYWdlID0gJ2F1ZGlvJztcbiAgICAgICAgICAgIGNvbnN0IG5vdEZvdW5kTm9kZSA9IEF1ZGlvVGVtcGxhdGVfMS5kZWZhdWx0LmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21haW4tY29udGFpbmVyJyk7XG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kKG5vdEZvdW5kTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5kZWZhdWx0ID0gQXVkaW9DaGFsbGVuZ2U7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IGF1ZGlvVGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuYXVkaW9UZW1wbGF0ZS5pbm5lckhUTUwgPSBgXG4gIDxkaXYgY2xhc3M9XCJtYWluLXBhZ2VcIj5cbiAgICA8aDI+QXVkaW8gUGFnZTwvaDI+XG4gICAgPGgzPlNvbWUgTWFpbiBDb250ZW50PC9oMz5cbiAgPC9kaXY+YDtcbmV4cG9ydHMuZGVmYXVsdCA9IGF1ZGlvVGVtcGxhdGU7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgRGljdGlvbmFyeVRlbXBsYXRlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vRGljdGlvbmFyeVRlbXBsYXRlXCIpKTtcbnJlcXVpcmUoXCIuL0RpY3Rpb25hcnkuc2Nzc1wiKTtcbmNsYXNzIERpY3Rpb25hcnkge1xuICAgIGNvbnN0cnVjdG9yKHN0YXRlKSB7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5wYWdlID0gJ2RpY3Rpb25hcnknO1xuICAgICAgICAgICAgY29uc3Qgbm90Rm91bmROb2RlID0gRGljdGlvbmFyeVRlbXBsYXRlXzEuZGVmYXVsdC5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYWluLWNvbnRhaW5lcicpO1xuICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZChub3RGb3VuZE5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuZGVmYXVsdCA9IERpY3Rpb25hcnk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IGRpY3Rpb25hcnlUZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG5kaWN0aW9uYXJ5VGVtcGxhdGUuaW5uZXJIVE1MID0gYFxuICA8ZGl2IGNsYXNzPVwibWFpbi1wYWdlXCI+XG4gICAgPGgyPkRpc2N0aW9uYXJ5IFBhZ2U8L2gyPlxuICAgIDxoMz5Tb21lIE1haW4gQ29udGVudDwvaDM+XG4gIDwvZGl2PmA7XG5leHBvcnRzLmRlZmF1bHQgPSBkaWN0aW9uYXJ5VGVtcGxhdGU7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IEZvb3RlclRlbXBsYXRlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vRm9vdGVyVGVtcGxhdGVcIikpO1xucmVxdWlyZShcIi4vRm9vdGVyLnNjc3NcIik7XG5jb25zdCByZW5kZXJGb290ZXIgPSAoKSA9PiB7XG4gICAgY29uc3QgZm9vdGVyTm9kZSA9IEZvb3RlclRlbXBsYXRlXzEuZGVmYXVsdC5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZm9vdGVyLWNvbnRhaW5lcicpO1xuICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICBjb250YWluZXIuYXBwZW5kKGZvb3Rlck5vZGUpO1xufTtcbmV4cG9ydHMuZGVmYXVsdCA9IHJlbmRlckZvb3RlcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgZm9vdGVyVGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuZm9vdGVyVGVtcGxhdGUuaW5uZXJIVE1MID0gYFxuICA8cCBjbGFzcz1cImNvcHlyaWdodFwiPlxuICAgICAgMjAyMiBcbiAgPC9wPlxuICA8ZGl2IGNsYXNzPVwiZ2l0aHViLWxpbmtcIj5cbiAgICA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL2hhbGluYS1rXCIgY2xhc3M9XCJnaXRodWJcIiB0aXRsZT1cIkhhbGluYSBLdWxha292YVwiIHRhcmdldD1cIl9ibGFua1wiPkhLPC9hPlxuICAgIDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vZ29vZ3JheVwiIGNsYXNzPVwiZ2l0aHViXCIgdGl0bGU9XCJSb21hbiBTaGF0cm92XCIgdGFyZ2V0PVwiX2JsYW5rXCI+UlM8L2E+IFxuICAgIDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vdmVybWlsaW9uMjAyMFwiIHRpdGxlPVwiTWlsaXRzYSBUdXNlZXZhXCIgY2xhc3M9XCJnaXRodWJcIiB0YXJnZXQ9XCJfYmxhbmtcIj5UTTwvYT5cbiAgPC9kaXY+XG4gIDxhIGhyZWY9XCJodHRwczovL3JzLnNjaG9vbC9qcy9cIiB0YXJnZXQ9XCJfYmxhbmtcIiBjbGFzcz1cImxpbmstcnNcIj5cbiAgICA8c3ZnIGNsYXNzPVwicnNzY2hvb2xcIiB3aWR0aD1cIjEyNlwiIGhlaWdodD1cIjQ3XCIgdmlld0JveD1cIjAgMCAxMjYgNDdcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj5cbiAgICA8ZyBjbGlwLXBhdGg9XCJ1cmwoI2NsaXAwXzNfMTAzKVwiPlxuICAgIDxwYXRoIGQ9XCJNNjUuMDUxNCAxNS41Njc1TDcxLjA0NiAxNS4xNzgzQzcxLjE4MjcgMTYuMTYyNyA3MS40MzM0IDE2Ljg5NTMgNzEuODQzNyAxNy40MjE4QzcyLjUwNDcgMTguMjQ2IDczLjQxNjQgMTguNjU4MSA3NC42MjQ1IDE4LjY1ODFDNzUuNTEzNCAxOC42NTgxIDc2LjIyIDE4LjQ1MiA3Ni42OTg2IDE4LjAxNzFDNzcuMTU0NSAxNy42NzM3IDc3LjQyOCAxNy4xMjQyIDc3LjQyOCAxNi41NTE5Qzc3LjQyOCAxNi4wMDI1IDc3LjE3NzMgMTUuNDc1OSA3Ni43NDQyIDE1LjEzMjVDNzYuMjg4NCAxNC43MjA0IDc1LjIxNzEgMTQuMzA4NCA3My41MzA0IDEzLjk0MjFDNzAuNzcyNCAxMy4zMjM5IDY4Ljc4OTQgMTIuNDk5OCA2Ny42MjcgMTEuNDQ2N0M2Ni40NjQ1IDEwLjQ2MjMgNjUuODAzNSA5LjAyIDY1Ljg0OTEgNy40ODYxNEM2NS44NDkxIDYuNDMzMDUgNjYuMTY4MiA1LjM3OTk2IDY2Ljc2MDggNC41MTAwMUM2Ny40NDQ2IDMuNTI1NiA2OC4zNzkyIDIuNzQ3MjMgNjkuNDk2IDIuMzEyMjVDNzAuNzA0IDEuNzg1NzEgNzIuMzkwNyAxLjUxMDk5IDc0LjUxMDUgMS41MTA5OUM3Ny4xMDg5IDEuNTEwOTkgNzkuMDkxOSAxLjk5MTc1IDgwLjQ1OTUgMi45NzYxNkM4MS44MjcxIDMuOTM3NjggODIuNjQ3NiA1LjQ5NDQyIDgyLjg5ODMgNy42MjM1TDc2Ljk3MjEgNy45NjY5Qzc2LjgxMjYgNy4wNTExNyA3Ni40OTM1IDYuMzg3MjYgNzUuOTY5MiA1Ljk1MjI5Qzc1LjQ0NSA1LjUxNzMyIDc0Ljc2MTIgNS4zMTEyOCA3My44NzIzIDUuMzExMjhDNzMuMTQyOSA1LjMxMTI4IDcyLjU5NTkgNS40NzE1MyA3Mi4yMzEyIDUuNzY5MTVDNzEuODg5MyA2LjA0Mzg3IDcxLjY2MTQgNi40NTU5NSA3MS42ODQyIDYuOTEzODFDNzEuNjg0MiA3LjI1NzIxIDcxLjg2NjUgNy41Nzc3MiA3Mi4xNCA3Ljc4Mzc2QzcyLjQzNjMgOC4wNTg0OCA3My4xNDI5IDguMzEwMyA3NC4yNTk4IDguNTM5MjRDNzcuMDE3NyA5LjEzNDQ2IDc4Ljk3NzkgOS43Mjk2OSA4MC4xODYgMTAuMzQ3OEM4MS4zOTQgMTAuOTY1OSA4Mi4yNjAxIDExLjcyMTQgODIuNzg0NCAxMi42MTQyQzgzLjMzMTQgMTMuNTMgODMuNjA0OSAxNC41ODMxIDgzLjU4MjEgMTUuNjU5MUM4My41ODIxIDE2Ljk0MTEgODMuMjE3NCAxOC4yMjMxIDgyLjQ4ODEgMTkuMjk5MUM4MS43MzU5IDIwLjQyMDkgODAuNjg3NCAyMS4yOTA4IDc5LjQ1NjYgMjEuODE3NEM3OC4xNTc0IDIyLjM4OTcgNzYuNTE2MyAyMi42ODczIDc0LjU1NjEgMjIuNjg3M0M3MS4wOTE1IDIyLjY4NzMgNjguNjk4MyAyMi4wMjM0IDY3LjM1MzUgMjAuNjcyN0M2Ni4wMDg3IDE5LjMyMiA2NS4yMTA5IDE3LjYyNzkgNjUuMDUxNCAxNS41Njc1Wk0xLjQzNTk2IDIyLjM0MzlWMS44NzcyOEgxMS45NDM2QzEzLjg4MSAxLjg3NzI4IDE1LjM4NTMgMi4wMzc1MyAxNi40MTEgMi4zODA5M0MxNy40MTM5IDIuNzAxNDQgMTguMzAyOCAzLjM2NTM1IDE4Ljg5NTQgNC4yNTgxOUMxOS41NTY0IDUuMjQyNiAxOS44NzU1IDYuMzg3MjYgMTkuODUyNyA3LjU3NzcyQzE5LjkyMTEgOS41OTIzMyAxOC44OTU0IDExLjUxNTQgMTcuMTQwNCAxMi41MjI3QzE2LjQ1NjYgMTIuOTExOSAxNS43MDQ0IDEzLjE4NjYgMTQuOTI5NSAxMy4zMjM5QzE1LjQ5OTMgMTMuNDg0MiAxNi4wNjkxIDEzLjc1ODkgMTYuNTcwNSAxNC4wNzk0QzE2Ljk1OCAxNC4zOTk5IDE3LjI3NzEgMTQuNzY2MiAxNy41NzM0IDE1LjE1NTRDMTcuOTE1MyAxNS41NDQ2IDE4LjIxMTYgMTUuOTc5NiAxOC40NjI0IDE2LjQzNzRMMjEuNTE2NiAyMi4zNjY4SDE0LjM1OTZMMTAuOTg2MyAxNi4wNzExQzEwLjU1MzIgMTUuMjY5OSAxMC4xODg1IDE0Ljc0MzMgOS44NDY2IDE0LjQ5MTVDOS4zOTA3NCAxNC4xNzEgOC44NDM3MSAxNC4wMTA3IDguMjk2NjcgMTQuMDEwN0g3Ljc0OTY0VjIyLjMyMUgxLjQzNTk2VjIyLjM0MzlaTTcuNzQ5NjQgMTAuMTY0N0gxMC40MTY0QzEwLjk4NjMgMTAuMTE4OSAxMS41MzMzIDEwLjAyNzMgMTIuMDgwMyA5Ljg4OTk0QzEyLjQ5MDYgOS44MjEyNiAxMi44NTUzIDkuNTkyMzMgMTMuMTA2IDkuMjQ4OTNDMTMuNzIxNCA4LjQyNDc3IDEzLjYzMDIgNy4yNTcyMSAxMi44NzgxIDYuNTQ3NTJDMTIuNDY3OCA2LjIwNDEyIDExLjY3IDYuMDIwOTcgMTAuNTMwNCA2LjAyMDk3SDcuNzQ5NjRWMTAuMTY0N1pNMCAzOS44ODAyTDUuOTk0NTcgMzkuNDkxQzYuMTMxMzMgNDAuNDc1NCA2LjM4MjA1IDQxLjIwOCA2Ljc5MjMzIDQxLjczNDZDNy40MzA1NCA0Mi41NTg3IDguMzY1MDUgNDIuOTkzNyA5LjU3MzA4IDQyLjk5MzdDMTAuNDYyIDQyLjk5MzcgMTEuMTY4NiA0Mi43ODc3IDExLjY0NzMgNDIuMzUyN0MxMi4xMDMxIDQxLjk4NjQgMTIuMzc2NiA0MS40NTk4IDEyLjM3NjYgNDAuODg3NUMxMi4zNzY2IDQwLjMzODEgMTIuMTI1OSAzOS44MTE1IDExLjY5MjggMzkuNDY4MUMxMS4yMzcgMzkuMDU2IDEwLjE2NTcgMzguNjQ0IDguNDU2MjIgMzguMjc3N0M1LjY5ODI2IDM3LjY1OTUgMy43MTUyNyAzNi44MzU0IDIuNTUyODIgMzUuNzgyM0MxLjM5MDM4IDM0Ljc5NzkgMC43MjkzNzggMzMuMzU1NiAwLjc3NDk2NCAzMS44MjE3QzAuNzc0OTY0IDMwLjc2ODcgMS4wOTQwNyAyOS43MTU2IDEuNjg2NjkgMjguODQ1NkMyLjM3MDQ4IDI3Ljg2MTIgMy4zMDQ5OSAyNy4wODI4IDQuNDIxODUgMjYuNjQ3OUM1LjYyOTg4IDI2LjEyMTMgNy4zMTY1NyAyNS44NDY2IDkuNDM2MzIgMjUuODQ2NkMxMi4wMzQ3IDI1Ljg0NjYgMTQuMDE3NyAyNi4zMjc0IDE1LjM4NTMgMjcuMzExOEMxNi43NTI5IDI4LjI5NjIgMTcuNTUwNiAyOS44MyAxNy44MDE0IDMxLjk1OTFMMTEuODc1MiAzMi4zMDI1QzExLjcxNTYgMzEuMzg2OCAxMS4zOTY1IDMwLjcyMjkgMTAuODcyMyAzMC4yODc5QzEwLjM3MDggMjkuODUyOSA5LjY2NDI1IDI5LjY0NjkgOC43NzUzMyAyOS42Njk4QzguMDQ1OTUgMjkuNjY5OCA3LjQ5ODkxIDI5LjgzIDcuMTM0MjMgMzAuMTUwNUM2Ljc2OTU0IDMwLjQyNTMgNi41NjQ0IDMwLjgzNzMgNi41ODcxOSAzMS4yOTUyQzYuNTg3MTkgMzEuNjM4NiA2Ljc2OTU0IDMxLjk1OTEgNy4wNDMwNSAzMi4xNjUxQzcuMzM5MzYgMzIuNDM5OSA4LjA0NTk1IDMyLjY5MTcgOS4xNjI4MSAzMi45MjA2QzExLjkyMDggMzMuNTE1OSAxMy44ODEgMzQuMTExMSAxNS4wODkgMzQuNzI5MkMxNi4yOTcgMzUuMzQ3MyAxNy4xNjMyIDM2LjEwMjggMTcuNjg3NCAzNi45OTU2QzE4LjIzNDQgMzcuOTExNCAxOC41MDggMzguOTY0NSAxOC41MDggNDAuMDE3NkMxOC41MDggNDEuMjk5NiAxOC4xMjA1IDQyLjU1ODcgMTcuNDEzOSA0My42MzQ3QzE2LjY2MTcgNDQuNzU2NSAxNS42MTMyIDQ1LjYyNjQgMTQuMzgyNCA0Ni4xNTNDMTMuMDgzMiA0Ni43MjUzIDExLjQ0MjEgNDcuMDIyOSA5LjQ4MTkxIDQ3LjAyMjlDNi4wMTczNyA0Ny4wMjI5IDMuNjI0MSA0Ni4zNTkgMi4yNzkzMSA0NS4wMDgzQzAuOTM0NTE1IDQzLjYzNDcgMC4xODIzNDQgNDEuOTQwNiAwIDM5Ljg4MDJIMFpcIiBmaWxsPVwiYmxhY2tcIi8+XG4gICAgPHBhdGggZD1cIk0zMC4zMTQ1IDM4LjI3NzZMMzUuODMwNCAzOS45NDg4QzM1LjUzNDEgNDEuMzQ1MyAzNC45MTg3IDQyLjY3MzIgMzQuMDc1NCA0My44NDA3QzMzLjMwMDQgNDQuODcwOSAzMi4yNzQ3IDQ1LjY3MjIgMzEuMTEyMyA0Ni4xOTg3QzI5LjkyNyA0Ni43MjUzIDI4LjQyMjcgNDcgMjYuNTk5MyA0N0MyNC4zODgzIDQ3IDIyLjU2NDkgNDYuNjc5NSAyMS4xNzQ1IDQ2LjAzODVDMTkuNzYxMyA0NS4zOTc1IDE4LjU1MzMgNDQuMjUyOCAxNy41Mjc2IDQyLjYyNzRDMTYuNTAxOSA0MS4wMDE5IDE2LjAwMDUgMzguOTE4NiAxNi4wMDA1IDM2LjM3NzVDMTYuMDAwNSAzMi45ODkzIDE2Ljg4OTQgMzAuMzc5NCAxOC42OTAxIDI4LjU3MDlDMjAuNDkwNyAyNi43NjIzIDIzLjAyMDcgMjUuODQ2NiAyNi4zMDI5IDI1Ljg0NjZDMjguODc4NiAyNS44NDY2IDMwLjg4NDQgMjYuMzczMSAzMi4zNjU5IDI3LjQwMzNDMzMuODI0NyAyOC40NTY0IDM0LjkxODcgMzAuMDU4OSAzNS42NDgxIDMyLjIxMDlMMzAuMDg2NiAzMy40NDcxQzI5Ljk0OTggMzIuOTY2NCAyOS43NDQ3IDMyLjQ4NTYgMjkuNDcxMiAzMi4wNzM1QzI5LjEyOTMgMzEuNTkyOCAyOC42OTYyIDMxLjIyNjUgMjguMTcyIDMwLjk1MThDMjcuNjQ3NyAzMC42NzcgMjcuMDU1MSAzMC41NjI2IDI2LjQ2MjUgMzAuNTYyNkMyNS4wMjY1IDMwLjU2MjYgMjMuOTMyNSAzMS4xMzQ5IDIzLjE4MDMgMzIuMzAyNUMyMi42MTA1IDMzLjE0OTUgMjIuMzE0MiAzNC41MDAyIDIyLjMxNDIgMzYuMzMxN0MyMi4zMTQyIDM4LjU5ODEgMjIuNjU2MSA0MC4xNTQ5IDIzLjMzOTkgNDEuMDAxOUMyNC4wMjM2IDQxLjg0OSAyNC45ODEgNDIuMjYxMSAyNi4yMzQ2IDQyLjI2MTFDMjcuNDQyNiA0Mi4yNjExIDI4LjM1NDMgNDEuOTE3NyAyOC45Njk3IDQxLjI1MzhDMjkuNTg1MSA0MC41NDQxIDMwLjA0MSAzOS41NTk3IDMwLjMxNDUgMzguMjc3NlpNNDMuMTkyNiAyNi4xOUg0OS40ODM1VjMzLjM1NTZINTYuMzY3VjI2LjE5SDYyLjcwMzVWNDYuNjU2Nkg1Ni4zNjdWMzguMzY5Mkg0OS40ODM1VjQ2LjY1NjZINDMuMTkyNlYyNi4xOVpcIiBmaWxsPVwiYmxhY2tcIi8+XG4gICAgPHBhdGggZD1cIk02MS44Mzc0IDM2LjQyMzNDNjEuODM3NCAzMy4wODA5IDYyLjc3MTkgMzAuNDcxMSA2NC42MTgyIDI4LjYxNjdDNjYuNDY0NCAyNi43NjI0IDY5LjA2MjggMjUuODIzNyA3Mi4zNjc4IDI1LjgyMzdDNzUuNzY0IDI1LjgyMzcgNzguMzYyNCAyNi43Mzk1IDgwLjIwODYgMjguNTcwOUM4Mi4wNTQ4IDMwLjQwMjQgODIuOTY2NiAzMi45NjY0IDgyLjk2NjYgMzYuMjYzMUM4Mi45NjY2IDM4LjY2NjkgODIuNTU2MyA0MC42MTI4IDgxLjc1ODUgNDIuMTQ2N0M4MC45ODM2IDQzLjY1NzYgNzkuNzc1NSA0NC44OTM5IDc4LjI5NCA0NS43MThDNzYuNzY2OSA0Ni41NjUxIDc0Ljg3NSA0Ny4wMDAxIDcyLjYxODUgNDcuMDAwMUM3MC4zMTY0IDQ3LjAwMDEgNjguNDI0NiA0Ni42MzM4IDY2LjkyMDMgNDUuOTAxMkM2NS4zNzAzIDQ1LjEyMjggNjQuMDkzOSA0My45MDk1IDYzLjI1MDYgNDIuNDIxNEM2Mi4zMTYxIDQwLjgxODkgNjEuODM3NCAzOC44MjcxIDYxLjgzNzQgMzYuNDIzM1pNNjguMTI4MyAzNi40NDYyQzY4LjEyODMgMzguNTA2NiA2OC41MTU4IDM5Ljk5NDcgNjkuMjY3OSA0MC45MTA0QzcwLjAyMDEgNDEuODAzMyA3MS4wNjg2IDQyLjI2MTEgNzIuMzkwNiA0Mi4yNjExQzczLjczNTQgNDIuMjYxMSA3NC43ODM5IDQxLjgyNjIgNzUuNTM2IDQwLjkzMzNDNzYuMjg4MiA0MC4wNDA1IDc2LjY1MjkgMzguNDYwOCA3Ni42NTI5IDM2LjE3MTVDNzYuNjUyOSAzNC4yNDg1IDc2LjI2NTQgMzIuODI5MSA3NS40OTA0IDMxLjk1OTFDNzQuNzE1NSAzMS4wNjYzIDczLjY2NyAzMC42MzEzIDcyLjM0NSAzMC42MzEzQzcxLjE4MjYgMzAuNTg1NSA3MC4wNjU3IDMxLjA4OTIgNjkuMjkwNyAzMS45ODJDNjguNTE1OCAzMi44NzQ5IDY4LjEyODMgMzQuMzYyOSA2OC4xMjgzIDM2LjQ0NjJaTTg5LjQxNyAzNi40MjMzQzg5LjQxNyAzMy4wODA5IDkwLjM1MTUgMzAuNDcxMSA5Mi4xOTc4IDI4LjYxNjdDOTQuMDQ0IDI2Ljc2MjQgOTYuNjQyNCAyNS44MjM3IDk5Ljk0NzQgMjUuODIzN0MxMDMuMzQ0IDI1LjgyMzcgMTA1Ljk2NSAyNi43Mzk1IDEwNy43ODggMjguNTcwOUMxMDkuNjEyIDMwLjQwMjQgMTEwLjU0NiAzMi45NjY0IDExMC41NDYgMzYuMjYzMUMxMTAuNTQ2IDM4LjY2NjkgMTEwLjEzNiA0MC42MTI4IDEwOS4zMzggNDIuMTQ2N0MxMDguNTYzIDQzLjY1NzYgMTA3LjM1NSA0NC44OTM5IDEwNS44NzQgNDUuNzE4QzEwNC4zNDYgNDYuNTY1MSAxMDIuNDU1IDQ3LjAwMDEgMTAwLjE5OCA0Ny4wMDAxQzk3Ljg5NiA0Ny4wMDAxIDk2LjAwNDIgNDYuNjMzOCA5NC40OTk5IDQ1LjkwMTJDOTIuOTQ5OSA0NS4xMjI4IDkxLjY3MzUgNDMuOTA5NSA5MC44MzAyIDQyLjQyMTRDODkuODk1NyA0MC44MTg5IDg5LjQxNyAzOC44MjcxIDg5LjQxNyAzNi40MjMzWk05NS43MDc5IDM2LjQ0NjJDOTUuNzA3OSAzOC41MDY2IDk2LjA5NTQgMzkuOTk0NyA5Ni44NDc1IDQwLjkxMDRDOTcuNTk5NyA0MS44MDMzIDk4LjY0ODIgNDIuMjYxMSA5OS45NzAyIDQyLjI2MTFDMTAxLjMxNSA0Mi4yNjExIDEwMi4zNjMgNDEuODI2MiAxMDMuMTE2IDQwLjkzMzNDMTAzLjg2OCA0MC4wNDA1IDEwNC4yMzIgMzguNDYwOCAxMDQuMjMyIDM2LjE3MTVDMTA0LjIzMiAzNC4yNDg1IDEwMy44NDUgMzIuODI5MSAxMDMuMDcgMzEuOTU5MUMxMDIuMjk1IDMxLjA2NjMgMTAxLjI0NyAzMC42MzEzIDk5LjkyNDYgMzAuNjMxM0M5OC43NjIxIDMwLjU4NTUgOTcuNjIyNSAzMS4wODkyIDk2Ljg3MDMgMzEuOTgyQzk2LjA5NTQgMzIuODc0OSA5NS43MDc5IDM0LjM2MjkgOTUuNzA3OSAzNi40NDYyWlwiIGZpbGw9XCJibGFja1wiLz5cbiAgICA8cGF0aCBkPVwiTTEwOS44ODUgMjYuMTg5OUgxMTYuMTc2VjQxLjYySDEyNlY0Ni42NTY2SDEwOS44NjJWMjYuMTg5OUgxMDkuODg1WlwiIGZpbGw9XCJibGFja1wiLz5cbiAgICA8cGF0aCBkPVwiTTEwMi45NTEgMjUuMDA4OUMxMDkuMjg1IDIwLjIxNSAxMTEuMjM4IDEyLjA4ODcgMTA3LjMxNCA2Ljg1ODE0QzEwMy4zODkgMS42Mjc2MiA5NS4wNzM1IDEuMjczNjQgODguNzM5OSA2LjA2NzVDODIuNDA2NCAxMC44NjE0IDgwLjQ1MzMgMTguOTg3NyA4NC4zNzc2IDI0LjIxODJDODguMzAyIDI5LjQ0ODggOTYuNjE3NyAyOS44MDI3IDEwMi45NTEgMjUuMDA4OVpcIiBmaWxsPVwid2hpdGVcIi8+XG4gICAgPHBhdGggY2xhc3M9XCJyc3NjaG9vbC1wYWludFwiIGQ9XCJNNjguMjI1MSAxMi45NDRMMTAwLjk1NCAtMTEuODI4NkwxMjMuNjAyIDE4LjM1NjlMOTAuODcyNyA0My4xMjk1TDY4LjIyNTEgMTIuOTQ0WlwiIGZpbGw9XCJ3aGl0ZVwiLz5cbiAgICA8cGF0aCBkPVwiTTEwMi45NTEgMjUuMDA4OEMxMDkuMjg1IDIwLjIxNDkgMTExLjIzOCAxMi4wODg1IDEwNy4zMTQgNi44NTgwMUMxMDMuMzg5IDEuNjI3NSA5NS4wNzM1IDEuMjczNTIgODguNzM5OSA2LjA2NzM4QzgyLjQwNjQgMTAuODYxMiA4MC40NTMzIDE4Ljk4NzYgODQuMzc3NiAyNC4yMTgxQzg4LjMwMiAyOS40NDg2IDk2LjYxNzcgMjkuODAyNiAxMDIuOTUxIDI1LjAwODhaXCIgZmlsbD1cIndoaXRlXCIvPlxuICAgIDxwYXRoIGQ9XCJNNzcuMzM4OSAxNC45NTk2TDEwMC4yNTcgLTIuMzg2MzRMMTE0LjQ4MiAxNi41NzM2TDkxLjU2MzYgMzMuOTE5NUw3Ny4zMzg5IDE0Ljk1OTZaXCIgZmlsbD1cIndoaXRlXCIvPlxuICAgIDxwYXRoIGQ9XCJNMTAyLjk1MSAyNS4wMDg4QzEwOS4yODUgMjAuMjE0OSAxMTEuMjM4IDEyLjA4ODUgMTA3LjMxNCA2Ljg1ODAxQzEwMy4zODkgMS42Mjc1IDk1LjA3MzUgMS4yNzM1MiA4OC43Mzk5IDYuMDY3MzhDODIuNDA2NCAxMC44NjEyIDgwLjQ1MzMgMTguOTg3NiA4NC4zNzc2IDI0LjIxODFDODguMzAyIDI5LjQ0ODYgOTYuNjE3NyAyOS44MDI2IDEwMi45NTEgMjUuMDA4OFpcIiBmaWxsPVwid2hpdGVcIiBzdHJva2U9XCJibGFja1wiIHN0cm9rZS13aWR0aD1cIjRcIiBzdHJva2UtbWl0ZXJsaW1pdD1cIjEwXCIvPlxuICAgIDxwYXRoIGQ9XCJNNzcuMzM4OSAxNC45NTk2TDEwMC4yNTcgLTIuMzg2MzRMMTE0LjQ4MiAxNi41NzM2TDkxLjU2MzYgMzMuOTE5NUw3Ny4zMzg5IDE0Ljk1OTZaXCIgc3Ryb2tlPVwiYmxhY2tcIiBzdHJva2Utd2lkdGg9XCI0XCIgc3Ryb2tlLW1pdGVybGltaXQ9XCIxMFwiLz5cbiAgICA8cGF0aCBkPVwiTTEwMi45NTEgMjUuMDA4OEMxMDkuMjg1IDIwLjIxNDkgMTExLjIzOCAxMi4wODg1IDEwNy4zMTQgNi44NTgwMUMxMDMuMzg5IDEuNjI3NSA5NS4wNzM1IDEuMjczNTIgODguNzM5OSA2LjA2NzM4QzgyLjQwNjQgMTAuODYxMiA4MC40NTMzIDE4Ljk4NzYgODQuMzc3NiAyNC4yMTgxQzg4LjMwMiAyOS40NDg2IDk2LjYxNzcgMjkuODAyNiAxMDIuOTUxIDI1LjAwODhaXCIgc3Ryb2tlPVwiYmxhY2tcIiBzdHJva2Utd2lkdGg9XCI0XCIgc3Ryb2tlLW1pdGVybGltaXQ9XCIxMFwiLz5cbiAgICA8cGF0aCBkPVwiTTc3LjMzODkgMTQuOTU5NkwxMDAuMjU3IC0yLjM4NjM0TDExNC40ODIgMTYuNTczNkw5MS41NjM2IDMzLjkxOTVMNzcuMzM4OSAxNC45NTk2WlwiIGZpbGw9XCJ3aGl0ZVwiLz5cbiAgICA8cGF0aCBkPVwiTTEwMi45NTEgMjUuMDA4OEMxMDkuMjg1IDIwLjIxNDkgMTExLjIzOCAxMi4wODg1IDEwNy4zMTQgNi44NTgwMUMxMDMuMzg5IDEuNjI3NSA5NS4wNzM1IDEuMjczNTIgODguNzM5OSA2LjA2NzM4QzgyLjQwNjQgMTAuODYxMiA4MC40NTMzIDE4Ljk4NzYgODQuMzc3NiAyNC4yMTgxQzg4LjMwMiAyOS40NDg2IDk2LjYxNzcgMjkuODAyNiAxMDIuOTUxIDI1LjAwODhaXCIgZmlsbD1cIndoaXRlXCIgc3Ryb2tlPVwiYmxhY2tcIiBzdHJva2Utd2lkdGg9XCI0XCIgc3Ryb2tlLW1pdGVybGltaXQ9XCIxMFwiLz5cbiAgICA8cGF0aCBkPVwiTTc3LjMzODkgMTQuOTU5NkwxMDAuMjU3IC0yLjM4NjM0TDExNC40ODIgMTYuNTczNkw5MS41NjM2IDMzLjkxOTVMNzcuMzM4OSAxNC45NTk2WlwiIHN0cm9rZT1cImJsYWNrXCIgc3Ryb2tlLXdpZHRoPVwiNFwiIHN0cm9rZS1taXRlcmxpbWl0PVwiMTBcIi8+XG4gICAgPHBhdGggZD1cIk02OC4yMjUxIDEyLjk0NEwxMDAuOTU0IC0xMS44Mjg2TDEyMy42MDIgMTguMzU2OUw5MC44NzI3IDQzLjEyOTVMNjguMjI1MSAxMi45NDRaXCIgc3Ryb2tlPVwiYmxhY2tcIiBzdHJva2Utd2lkdGg9XCI0XCIgc3Ryb2tlLW1pdGVybGltaXQ9XCIxMFwiLz5cbiAgICA8cGF0aCBjbGFzcz1cInJzc2Nob29sLXBhaW50XCIgZD1cIk0xMDIuOTUxIDI1LjAwODhDMTA5LjI4NSAyMC4yMTQ5IDExMS4yMzggMTIuMDg4NSAxMDcuMzE0IDYuODU4MDFDMTAzLjM4OSAxLjYyNzUgOTUuMDczNSAxLjI3MzUyIDg4LjczOTkgNi4wNjczOEM4Mi40MDY0IDEwLjg2MTIgODAuNDUzMyAxOC45ODc2IDg0LjM3NzYgMjQuMjE4MUM4OC4zMDIgMjkuNDQ4NiA5Ni42MTc3IDI5LjgwMjYgMTAyLjk1MSAyNS4wMDg4WlwiIHN0cm9rZT1cImJsYWNrXCIgc3Ryb2tlLXdpZHRoPVwiNFwiIHN0cm9rZS1taXRlcmxpbWl0PVwiMTBcIi8+XG4gICAgPHBhdGggZD1cIk04OS40Mzk4IDE0LjAzMzZMOTEuNzE5MiAxMi40MzFMOTQuNTIyNyAxNi40Mzc0Qzk1LjAwMTQgMTcuMDc4NCA5NS4zNjYgMTcuNzY1MiA5NS42Mzk2IDE4LjUyMDZDOTUuNzk5MSAxOS4wOTMgOTUuNzUzNSAxOS43MTExIDk1LjUyNTYgMjAuMjYwNUM5NS4yMjkzIDIwLjk0NzMgOTQuNzUwNiAyMS41MTk3IDk0LjExMjQgMjEuOTMxOEM5My4zNjAzIDIyLjQ1ODMgOTIuNzIyIDIyLjc1NTkgOTIuMTc1IDIyLjg0NzVDOTEuNjUwOCAyMi45MzkxIDkxLjEwMzcgMjIuODQ3NSA5MC42MDIzIDIyLjYxODZDOTAuMDU1MyAyMi4zNDM4IDg5LjU3NjYgMjEuOTU0NiA4OS4yMTE5IDIxLjQ1MUw5MS4xNzIxIDE5LjYxOTVDOTEuMzMxNyAxOS44NzE0IDkxLjUzNjggMjAuMTAwMyA5MS43NjQ3IDIwLjI4MzRDOTEuOTI0MyAyMC4zOTc5IDkyLjEwNjYgMjAuNDY2NiA5Mi4zMTE4IDIwLjQ2NjZDOTIuNDcxMyAyMC40NjY2IDkyLjYzMDkgMjAuMzk3OSA5Mi43NDQ4IDIwLjMwNjNDOTIuOTcyOCAyMC4xNjkgOTMuMTMyMyAxOS44OTQyIDkzLjEwOTUgMTkuNjE5NUM5My4wNDExIDE5LjIzMDMgOTIuODgxNiAxOC44NDEyIDkyLjYzMDkgMTguNTQzNUw4OS40Mzk4IDE0LjAzMzZaTTk2LjI3NzggMTYuNTc0N0w5OC4zNTE5IDE0LjkyNjRDOTguNTc5OSAxNS4yMDExIDk4Ljg3NjIgMTUuNDA3MiA5OS4xOTUzIDE1LjUyMTZDOTkuNjUxMSAxNS42NTkgMTAwLjEzIDE1LjU2NzQgMTAwLjUxNyAxNS4yNjk4QzEwMC43OTEgMTUuMDg2NiAxMDEuMDE5IDE0LjgzNDggMTAxLjExIDE0LjUxNDNDMTAxLjI0NyAxNC4xMDIyIDEwMS4wMTkgMTMuNjQ0NCAxMDAuNjA4IDEzLjUwN0MxMDAuNTQgMTMuNDg0MSAxMDAuNDcyIDEzLjQ2MTIgMTAwLjQwMyAxMy40NjEyQzEwMC4xMyAxMy40MzgzIDk5LjY1MTEgMTMuNTUyOCA5OC45NDQ2IDEzLjg1MDRDOTcuNzgyMSAxNC4zMzEyIDk2Ljg3MDQgMTQuNTE0MyA5Ni4xODY2IDE0LjQ0NTZDOTUuNTI1NiAxNC4zNzcgOTQuOTEwMiAxNC4wMzM2IDk0LjU0NTUgMTMuNDYxMkM5NC4yNzIgMTMuMDcyIDk0LjEzNTIgMTIuNjE0MiA5NC4xMTI0IDEyLjE1NjNDOTQuMTEyNCAxMS42Mjk4IDk0LjI0OTIgMTEuMTAzMiA5NC41NDU1IDEwLjY2ODJDOTQuOTc4NiAxMC4wNTAxIDk1LjUwMjggOS41MjM1NyA5Ni4xNDEgOS4xMTE0OUM5Ny4wOTgzIDguNDQ3NTggOTcuOTQxNyA4LjEyNzA4IDk4LjY3MSA4LjEyNzA4Qzk5LjQwMDQgOC4xMjcwOCAxMDAuMDg0IDguNDcwNDcgMTAwLjcyMiA5LjE4MDE3TDk4LjY3MSAxMC44MDU2Qzk4LjI2MDggMTAuMjc5IDk3LjQ4NTggMTAuMTY0NiA5Ni45NjE2IDEwLjU3NjdMOTYuODkzMiAxMC42NDUzQzk2LjY2NTIgMTAuNzgyNyA5Ni41MDU3IDEwLjk4ODcgOTYuNDE0NSAxMS4yNDA2Qzk2LjM0NjEgMTEuNDIzNyA5Ni4zOTE3IDExLjYyOTggOTYuNTA1NyAxMS43OUM5Ni41OTY5IDExLjkwNDUgOTYuNzMzNiAxMS45OTYgOTYuODkzMiAxMS45OTZDOTcuMDc1NSAxMi4wMTg5IDk3LjM5NDYgMTEuOTI3NCA5Ny44NTA1IDExLjcyMTNDOTguOTkwMSAxMS4yNDA2IDk5Ljg1NjMgMTAuOTY1OCAxMDAuNDQ5IDEwLjg3NDNDMTAwLjk1IDEwLjc4MjcgMTAxLjQ3NSAxMC44Mjg1IDEwMS45NTMgMTEuMDM0NUMxMDIuMzg2IDExLjIxNzcgMTAyLjc1MSAxMS41MzgyIDEwMy4wMDIgMTEuOTI3NEMxMDMuMzIxIDEyLjM4NTIgMTAzLjUwMyAxMi45MzQ3IDEwMy41MjYgMTMuNTA3QzEwMy41NDkgMTQuMTAyMiAxMDMuMzg5IDE0LjY3NDYgMTAzLjA3IDE1LjE3ODJDMTAyLjY2IDE1Ljc5NjMgMTAyLjEzNiAxNi4zMjI5IDEwMS41MiAxNi43MzVDMTAwLjI2NyAxNy42MDQ5IDk5LjI0MDkgMTcuOTcxMiA5OC40MjAzIDE3LjgzMzhDOTcuNTMxNCAxNy42OTY1IDk2LjgwMiAxNy4yMzg2IDk2LjI3NzggMTYuNTc0N1pcIiBmaWxsPVwiYmxhY2tcIi8+XG4gICAgPC9nPlxuICAgIDxkZWZzPlxuICAgIDxjbGlwUGF0aCBpZD1cImNsaXAwXzNfMTAzXCI+XG4gICAgPHJlY3Qgd2lkdGg9XCIxMjZcIiBoZWlnaHQ9XCI0N1wiIGZpbGw9XCJ3aGl0ZVwiLz5cbiAgICA8L2NsaXBQYXRoPlxuICAgIDwvZGVmcz5cbiAgICA8L3N2Zz5cbiAgPC9hPmA7XG5leHBvcnRzLmRlZmF1bHQgPSBmb290ZXJUZW1wbGF0ZTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5hdXRoVGVtcGxhdGUgPSBleHBvcnRzLnJlZ2lzdHJhdGlvblRlbXBsYXRlID0gdm9pZCAwO1xuZXhwb3J0cy5yZWdpc3RyYXRpb25UZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG5leHBvcnRzLnJlZ2lzdHJhdGlvblRlbXBsYXRlLmlubmVySFRNTCA9IGBcbiAgPGZvcm0gaWQ9XCJhdXRoLWZvcm1cIiBjbGFzcz1cInBvcHVwXCI+XG4gICAgPGgyIGNsYXNzPVwicG9wdXBfX2hlYWRpbmdcIj5SUyBMYW5nPC9oMj5cbiAgICA8YnV0dG9uIGNsYXNzPVwicG9wdXBfX2Nyb3NzLWJ1dHRvblwiPlg8L2J1dHRvbj5cbiAgICA8cD7Qn9GA0LjQu9C+0LbQtdC90LjQtSDQtNC70Y8g0LjQt9GD0YfQtdC90LjRjyDQsNC90LPQu9C40LnRgdC60L7Qs9C+INGP0LfRi9C60LAg0YEg0L/QvtC80L7RidGM0Y4g0LjQs9GALjwvcD5cbiAgICA8c3BhbiBjbGFzcz1cInBvcHVwX19zdWJoZWFkaW5nXCI+0KDQtdCz0LjRgdGC0YDQsNGG0LjRjzwvc3Bhbj5cbiAgICA8aW5wdXQgY2xhc3M9XCJwb3B1cF9faW5wdXRcIiByZXF1aXJlZCB0eXBlPVwiZW1haWxcIiBuYW1lPVwiZW1haWxcIiBwbGFjZUhvbGRlcj1cItCt0LvQtdC60YLRgNC+0L3QvdCw0Y8g0L/QvtGH0YLQsFwiPlxuICAgIDxpbnB1dCBjbGFzcz1cInBvcHVwX19pbnB1dFwiIHJlcXVpcmVkIG1pbmxlbmd0aD1cIjNcIiB0eXBlPVwidGV4dFwiIG5hbWU9XCJuYW1lXCIgcGxhY2VIb2xkZXI9XCLQmNC80Y9cIj5cbiAgICA8aW5wdXQgY2xhc3M9XCJwb3B1cF9faW5wdXRcIiByZXF1aXJlZCBtaW5sZW5ndGg9XCI4XCIgdHlwZT1cInBhc3N3b3JkXCIgbmFtZT1cInBhc3N3b3JkXCIgcGxhY2VIb2xkZXI9XCLQn9Cw0YDQvtC70YxcIj5cbiAgICA8aW5wdXQgY2xhc3M9XCJwb3B1cF9faW5wdXRcIiByZXF1aXJlZCBtaW5sZW5ndGg9XCI4XCIgdHlwZT1cInBhc3N3b3JkXCIgbmFtZT1cInBhc3N3b3JkLWNvbmZpcm1cIiBwbGFjZUhvbGRlcj1cItCf0L7QstGC0L7RgNC90L4g0L/QsNGA0L7Qu9GMXCI+XG4gICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCIgaWQ9XCJyZWdpc3RyYXRpb25cIiBjbGFzcz1cInBvcHVwX19zdWJtaXQgYnV0dG9uXCI+0JfQsNGA0LXQs9C40YHRgtGA0LjRgNC+0LLQsNGC0YzRgdGPPC9idXR0b24+XG4gICAgPHNwYW4gY2xhc3M9XCJwb3B1cF9fY29weXJpZ2h0XCI+wqkg0JLRgdC1INC/0YDQsNCy0LAg0LfQsNGJ0LjRidC10L3RiyDigJQgMjAyMiDQsy4gUlMgTGFuZzwvc3Bhbj5cbiAgPC9mb3JtPmA7XG5leHBvcnRzLmF1dGhUZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG5leHBvcnRzLmF1dGhUZW1wbGF0ZS5pbm5lckhUTUwgPSBgXG4gIDxmb3JtIGlkPVwiYXV0aC1mb3JtXCIgY2xhc3M9XCJwb3B1cFwiPlxuICAgIDxoMiBjbGFzcz1cInBvcHVwX19oZWFkaW5nXCI+UlMgTGFuZzwvaDI+XG4gICAgPGJ1dHRvbiBjbGFzcz1cInBvcHVwX19jcm9zcy1idXR0b25cIj5YPC9idXR0b24+XG4gICAgPHA+0J/RgNC40LvQvtC20LXQvdC40LUg0LTQu9GPINC40LfRg9GH0LXQvdC40Y8g0LDQvdCz0LvQuNC50YHQutC+0LPQviDRj9C30YvQutCwINGBINC/0L7QvNC+0YnRjNGOINC40LPRgC48L3A+XG4gICAgPHNwYW4gY2xhc3M9XCJwb3B1cF9fc3ViaGVhZGluZ1wiPtCS0YXQvtC0PC9zcGFuPlxuICAgIDxpbnB1dCBjbGFzcz1cInBvcHVwX19pbnB1dFwiIHJlcXVpcmVkIG5hbWU9XCJlbWFpbFwiIHR5cGU9XCJlbWFpbFwiIHBsYWNlSG9sZGVyPVwi0K3Qu9C10LrRgtGA0L7QvdC90LDRjyDQv9C+0YfRgtCwXCI+XG4gICAgPGlucHV0IGNsYXNzPVwicG9wdXBfX2lucHV0XCIgcmVxdWlyZWQgbWlubGVuZ3RoPVwiOFwiIG5hbWU9XCJwYXNzd29yZFwiIHR5cGU9XCJwYXNzd29yZFwiIHBsYWNlSG9sZGVyPVwi0J/QsNGA0L7Qu9GMXCI+XG4gICAgPGRpdiBjbGFzcz1cInBvcHVwX19idXR0b25zXCI+XG4gICAgICA8YnV0dG9uIGlkPVwiYXV0aC1idXR0b25cIiBjbGFzcz1cImJ1dHRvbiBidXR0b25cIj7QktGF0L7QtDwvYnV0dG9uPlxuICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCIgaWQ9XCJyZWctYnV0dG9uXCIgY2xhc3M9XCJidXR0b24gYnV0dG9uX2xpZ2h0XCI+0KDQtdCz0LjRgdGC0YDQsNGG0LjRjzwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICAgIDxzcGFuIGNsYXNzPVwicG9wdXBfX2NvcHlyaWdodFwiPsKpINCS0YHQtSDQv9GA0LDQstCwINC30LDRidC40YnQtdC90Ysg4oCUIDIwMjIg0LMuIFJTIExhbmc8L3NwYW4+XG4gICAgPC9mb3JtPmA7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgSGVhZGVyVGVtcGxhdGVfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9IZWFkZXJUZW1wbGF0ZVwiKSk7XG5yZXF1aXJlKFwiLi9IZWFkZXIuc2Nzc1wiKTtcbnJlcXVpcmUoXCIuL0F1dGguc2Nzc1wiKTtcbmNvbnN0IHJvdXRlcl8xID0gcmVxdWlyZShcIi4uLy4uL2NvbnRyb2xsZXIvcm91dGVyXCIpO1xuY29uc3QgbWVudV9pdGVtc18xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCIuLi8uLi9tb2RlbC9tZW51LWl0ZW1zXCIpKTtcbmNvbnN0IEF1dGhUZW1wbGF0ZV8xID0gcmVxdWlyZShcIi4vQXV0aFRlbXBsYXRlXCIpO1xuY29uc3QgYXV0aF9oZWxwZXJfMSA9IHJlcXVpcmUoXCIuLi8uLi9jb250cm9sbGVyL2hlbHBlcnMvYXV0aC1oZWxwZXJcIik7XG5jbGFzcyBIZWFkZXIge1xuICAgIGNvbnN0cnVjdG9yKHN0YXRlKSB7XG4gICAgICAgIHRoaXMucG9wdXBDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcG9wdXAnKTtcbiAgICAgICAgdGhpcy5vdmVybGF5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI292ZXJsYXknKTtcbiAgICAgICAgdGhpcy5mb3JtID0gdGhpcy5wb3B1cENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjYXV0aC1mb3JtJyk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB9XG4gICAgY2xlYXJQb3B1cCgpIHtcbiAgICAgICAgdGhpcy5wb3B1cENvbnRhaW5lci5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcbiAgICAgICAgdGhpcy5vdmVybGF5LmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xuICAgICAgICB0aGlzLmZvcm0ucmVzZXQoKTtcbiAgICB9XG4gICAgc2hvd1BvcHVwKCkge1xuICAgICAgICB0aGlzLnBvcHVwQ29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xuICAgICAgICB0aGlzLm92ZXJsYXkuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XG4gICAgfVxuICAgIHJlbmRlclJlZ0Zvcm0oKSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgdGhpcy5wb3B1cENvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgY29uc3QgcmVnTm9kZSA9IEF1dGhUZW1wbGF0ZV8xLnJlZ2lzdHJhdGlvblRlbXBsYXRlLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICB0aGlzLnBvcHVwQ29udGFpbmVyLmFwcGVuZENoaWxkKHJlZ05vZGUpO1xuICAgICAgICAoX2EgPSB0aGlzLnBvcHVwQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5wb3B1cF9fY3Jvc3MtYnV0dG9uJykpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLmNsZWFyUG9wdXAoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlbmRlckF1dGhGb3JtKCkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIHRoaXMucG9wdXBDb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIHRoaXMucG9wdXBDb250YWluZXIuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XG4gICAgICAgIHRoaXMub3ZlcmxheS5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTtcbiAgICAgICAgY29uc3QgYXV0aE5vZGUgPSBBdXRoVGVtcGxhdGVfMS5hdXRoVGVtcGxhdGUuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIHRoaXMucG9wdXBDb250YWluZXIuYXBwZW5kQ2hpbGQoYXV0aE5vZGUpO1xuICAgICAgICAoX2EgPSB0aGlzLnBvcHVwQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5wb3B1cF9fY3Jvc3MtYnV0dG9uJykpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLmNsZWFyUG9wdXAoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucG9wdXBDb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBpZiAodGFyZ2V0LmlkID09PSAncmVnLWJ1dHRvbicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlclJlZ0Zvcm0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRhcmdldC5pZCA9PT0gJ3JlZ2lzdHJhdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0geWllbGQgKDAsIGF1dGhfaGVscGVyXzEuaGFuZGxlUmVnaXN0cmF0aW9uKSh0aGlzLnN0YXRlKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5sb2dnZWRJbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRhcmdldC5pZCA9PT0gJ2F1dGgtYnV0dG9uJykge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSB5aWVsZCAoMCwgYXV0aF9oZWxwZXJfMS5oYW5kbGVBdXRoKSh0aGlzLnN0YXRlKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS5sb2dnZWRJbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlLmxvZ2dlZEluKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclBvcHVwKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBoYW5kbGVJdGVtQ2xpY2soZSkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0O1xuICAgICAgICBpZiAodGFyZ2V0LnRhZ05hbWUgPT09ICdBJykge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgY29uc3QgbmV3TG9jYXRpb24gPSB0YXJnZXQuaHJlZjtcbiAgICAgICAgICAgIGNvbnN0IG1lbnVJdGVtID0gbWVudV9pdGVtc18xLmRlZmF1bHQuZmluZCgoaXRlbSkgPT4gbmV3TG9jYXRpb24uaW5jbHVkZXMoaXRlbS5ocmVmKSk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUubG9nZ2VkSW4gJiYgKG1lbnVJdGVtID09PSBudWxsIHx8IG1lbnVJdGVtID09PSB2b2lkIDAgPyB2b2lkIDAgOiBtZW51SXRlbS5hdXRoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIChfYSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tYWluLW5hdl9faXRlbV9hY3RpdmUnKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmNsYXNzTGlzdC5yZW1vdmUoJ21haW4tbmF2X19pdGVtX2FjdGl2ZScpO1xuICAgICAgICAgICAgdGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ21haW4tbmF2X19pdGVtX2FjdGl2ZScpO1xuICAgICAgICAgICAgKDAsIHJvdXRlcl8xLnJvdXRlKShlLCB0aGlzLnN0YXRlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBjb25zdCBoZWFkZXJDb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjaGVhZGVyLWNvbnRhaW5lcicpO1xuICAgICAgICAgICAgaGVhZGVyQ29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgY29uc3QgaGVhZGVyTm9kZSA9ICgwLCBIZWFkZXJUZW1wbGF0ZV8xLmRlZmF1bHQpKHRoaXMuc3RhdGUucGFnZSwgdGhpcy5zdGF0ZS5sb2dnZWRJbiwgdGhpcy5zdGF0ZS51c2VyTmFtZSkuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBoZWFkZXJDb250YWluZXIuYXBwZW5kQ2hpbGQoaGVhZGVyTm9kZSk7XG4gICAgICAgICAgICBjb25zdCBuYXYgPSBoZWFkZXJDb250YWluZXIucXVlcnlTZWxlY3RvcignbmF2Jyk7XG4gICAgICAgICAgICBjb25zdCBsb2dpbkJ1dHRvbiA9IGhlYWRlckNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjbG9nLWluJyk7XG4gICAgICAgICAgICBjb25zdCBsb2dvdXRCdXR0b24gPSBoZWFkZXJDb250YWluZXIucXVlcnlTZWxlY3RvcignI2xvZy1vdXQnKTtcbiAgICAgICAgICAgIG5hdi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVJdGVtQ2xpY2soZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChsb2dpbkJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGxvZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckF1dGhGb3JtKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobG9nb3V0QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgbG9nb3V0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gKDAsIGF1dGhfaGVscGVyXzEuaGFuZGxlTG9nb3V0KSh0aGlzLnN0YXRlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnN0YXRlLmxvZ2dlZEluKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5kZWZhdWx0ID0gSGVhZGVyO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBtZW51X2l0ZW1zXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4uLy4uL21vZGVsL21lbnUtaXRlbXNcIikpO1xuY29uc3QgZHJhd01lbnVJdGVtID0gKGl0ZW0sIGFjdGl2ZSwgbG9nZ2VkSW4pID0+IGBcbiAgICA8YSBocmVmPVwiLyMvJHtpdGVtLmhyZWZ9XCIgdGl0bGU9XCIkeyFsb2dnZWRJbiAmJiBpdGVtLmF1dGhcbiAgICA/ICdMb2cgaW4gdG8gc2VlIHRoaXMgcGFnZSdcbiAgICA6IGl0ZW0ubmFtZX1cIlxuICAgIGNsYXNzPVwibWFpbi1uYXZfX2l0ZW0ke2FjdGl2ZSA9PT0gaXRlbS5ocmVmID8gJyBtYWluLW5hdl9faXRlbV9hY3RpdmUnIDogJyd9ICR7IWxvZ2dlZEluICYmIGl0ZW0uYXV0aCA/ICcgbWFpbi1uYXZfX2l0ZW1fZGlzYWJsZWQnIDogJyd9XCIgaWQ9XCIke2l0ZW0uaHJlZn0tbWVudS1pdGVtXCI+JHtpdGVtLm5hbWV9XG4gICAgPC9hPmA7XG5jb25zdCBoZWFkZXJUZW1wbGF0ZSA9IChhY3RpdmUsIGxvZ2dlZEluLCB1c2VyTmFtZSkgPT4ge1xuICAgIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgY29uc3QgbWVudUJvZHkgPSBtZW51X2l0ZW1zXzEuZGVmYXVsdC5tYXAoKGl0ZW0pID0+IGRyYXdNZW51SXRlbShpdGVtLCBhY3RpdmUsIGxvZ2dlZEluKSkuam9pbignJyk7XG4gICAgY29uc3QgbG9nZ2VkT3V0QmxvY2sgPSBgXG4gICAgPGRpdiBjbGFzcz1cImxvZ2dlZC1vdXRcIj5cbiAgICAgIDxidXR0b24gY2xhc3M9XCJidXR0b25cIiBpZD1cImxvZy1pblwiPtCS0L7QudGC0Lg8L2J1dHRvbj5cbiAgICA8L2Rpdj5gO1xuICAgIGNvbnN0IGxvZ2dlZEluQmxvY2sgPSBgXG4gICAgPGRpdiBjbGFzcz1cImxvZ2dlZC1pblwiPlxuICAgICAgPGRpdiBjbGFzcz1cInVzZXItbmFtZVwiPiR7dXNlck5hbWV9PC9kaXY+XG4gICAgICA8YnV0dG9uIGNsYXNzPVwiYnV0dG9uXCIgaWQ9XCJsb2ctb3V0XCI+0JLRi9GF0L7QtDwvYnV0dG9uPlxuICAgIDwvZGl2PmA7XG4gICAgaGVhZGVyLmlubmVySFRNTCA9IGBcbiAgPGRpdiBjbGFzcz1cImxvZ29cIj48YSBocmVmPVwiL1wiIGNsYXNzPVwibG9nb19fbGlua1wiPjwvc3Bhbj48aDE+UlMgTGFuZzwvaDE+PC9hPjwvZGl2PlxuICA8bmF2IGNsYXNzPVwibWFpbi1uYXZcIiBpZD1cIm1haW4tbmF2XCI+XG4gICAgJHttZW51Qm9keX1cbiAgPC9uYXY+XG4gICR7IWxvZ2dlZEluID8gbG9nZ2VkT3V0QmxvY2sgOiBsb2dnZWRJbkJsb2NrfVxuICBgO1xuICAgIHJldHVybiBoZWFkZXI7XG59O1xuZXhwb3J0cy5kZWZhdWx0ID0gaGVhZGVyVGVtcGxhdGU7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgTWFpblRlbXBsYXRlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vTWFpblRlbXBsYXRlXCIpKTtcbnJlcXVpcmUoXCIuL01haW4uc2Nzc1wiKTtcbmNsYXNzIE1haW4ge1xuICAgIGNvbnN0cnVjdG9yKHN0YXRlKSB7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5wYWdlID0gJ21haW4nO1xuICAgICAgICAgICAgY29uc3Qgbm90Rm91bmROb2RlID0gTWFpblRlbXBsYXRlXzEuZGVmYXVsdC5jb250ZW50LmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYWluLWNvbnRhaW5lcicpO1xuICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZChub3RGb3VuZE5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGU7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuZGVmYXVsdCA9IE1haW47XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IG1haW5UZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG5tYWluVGVtcGxhdGUuaW5uZXJIVE1MID0gYFxuICA8ZGl2IGNsYXNzPVwibWFpbi1wYWdlXCI+XG4gICAgPGgyPk1haW4gUGFnZTwvaDI+XG4gICAgPGgzPlNvbWUgTWFpbiBDb250ZW50PC9oMz5cbiAgPC9kaXY+YDtcbmV4cG9ydHMuZGVmYXVsdCA9IG1haW5UZW1wbGF0ZTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBOb3RGb3VuZFRlbXBsYXRlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vTm90Rm91bmRUZW1wbGF0ZVwiKSk7XG5yZXF1aXJlKFwiLi9Ob3RGb3VuZC5zY3NzXCIpO1xuY2xhc3MgTm90Rm91bmQge1xuICAgIGNvbnN0cnVjdG9yKHN0YXRlKSB7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5wYWdlID0gJ25vdEZvdW5kJztcbiAgICAgICAgICAgIGNvbnN0IG5vdEZvdW5kTm9kZSA9IE5vdEZvdW5kVGVtcGxhdGVfMS5kZWZhdWx0LmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21haW4tY29udGFpbmVyJyk7XG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICBjb250YWluZXIuYXBwZW5kKG5vdEZvdW5kTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5kZWZhdWx0ID0gTm90Rm91bmQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IG5vdEZvdW5kVGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xubm90Rm91bmRUZW1wbGF0ZS5pbm5lckhUTUwgPSBgXG4gIDxkaXYgY2xhc3M9XCJub3QtZm91bmQtY29udGFpbmVyXCI+XG4gICAgPGgyPk5vdGhpbmcgaXMgZm91bmQ8L2gyPlxuICAgIDxoMz5Vc2UgbmF2aWdhdGlvbiB0byBvcGVuIGFwbGxpY2F0aW9uIHBhZ2VzPC9oMz5cbiAgICA8ZGl2IGNsYXNzPVwibm90LWZvdW5kLWNvbnRhaW5lcl9faW1nXCI+PC9kaXY+XG4gIDwvZGl2PmA7XG5leHBvcnRzLmRlZmF1bHQgPSBub3RGb3VuZFRlbXBsYXRlO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IFNwcmludFRlbXBsYXRlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vU3ByaW50VGVtcGxhdGVcIikpO1xucmVxdWlyZShcIi4vU3ByaW50LnNjc3NcIik7XG5jbGFzcyBTcHJpbnQge1xuICAgIGNvbnN0cnVjdG9yKHN0YXRlKSB7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcbiAgICB9XG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5wYWdlID0gJ3NwcmludCc7XG4gICAgICAgICAgICBjb25zdCBub3RGb3VuZE5vZGUgPSBTcHJpbnRUZW1wbGF0ZV8xLmRlZmF1bHQuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFpbi1jb250YWluZXInKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmQobm90Rm91bmROb2RlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLmRlZmF1bHQgPSBTcHJpbnQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IHNwcmludFRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbnNwcmludFRlbXBsYXRlLmlubmVySFRNTCA9IGBcbiAgPGRpdiBjbGFzcz1cIm1haW4tcGFnZVwiPlxuICAgIDxoMj5TcHJpbnQgUGFnZTwvaDI+XG4gICAgPGgzPlNvbWUgTWFpbiBDb250ZW50PC9oMz5cbiAgPC9kaXY+YDtcbmV4cG9ydHMuZGVmYXVsdCA9IHNwcmludFRlbXBsYXRlO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IFN0YXRzVGVtcGxhdGVfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiLi9TdGF0c1RlbXBsYXRlXCIpKTtcbnJlcXVpcmUoXCIuL1N0YXRzLnNjc3NcIik7XG5jbGFzcyBTdGF0cyB7XG4gICAgY29uc3RydWN0b3Ioc3RhdGUpIHtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnBhZ2UgPSAnc3RhdHMnO1xuICAgICAgICAgICAgY29uc3Qgc3RhdHNOb2RlID0gU3RhdHNUZW1wbGF0ZV8xLmRlZmF1bHQuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWFpbi1jb250YWluZXInKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmQoc3RhdHNOb2RlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5leHBvcnRzLmRlZmF1bHQgPSBTdGF0cztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3Qgc3RhdHNUZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG5zdGF0c1RlbXBsYXRlLmlubmVySFRNTCA9IGBcbiAgPGRpdiBjbGFzcz1cIm1haW4tcGFnZVwiPlxuICAgIDxoMj5TdGF0aXN0aWNzIFBhZ2U8L2gyPlxuICAgIDxoMz5Tb21lIE1haW4gQ29udGVudDwvaDM+XG4gIDwvZGl2PmA7XG5leHBvcnRzLmRlZmF1bHQgPSBzdGF0c1RlbXBsYXRlO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmNvbnN0IFRleHRib29rVGVtcGxhdGVfMSA9IHJlcXVpcmUoXCIuL1RleHRib29rVGVtcGxhdGVcIik7XG5yZXF1aXJlKFwiLi9UZXh0Ym9vay5zY3NzXCIpO1xuY29uc3QgbW9ja193b3Jkc19kYXRhXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4uLy4uL21vZGVsL21vY2std29yZHMtZGF0YVwiKSk7XG5jbGFzcyBUZXh0Ym9vayB7XG4gICAgY29uc3RydWN0b3Ioc3RhdGUpIHtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICAgIH1cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlLnBhZ2UgPSAndGV4dGJvb2snO1xuICAgICAgICAgICAgY29uc3QgdGV4dGJvb2tOb2RlID0gKDAsIFRleHRib29rVGVtcGxhdGVfMS50ZXh0Ym9va1RlbXBsYXRlKShtb2NrX3dvcmRzX2RhdGFfMS5kZWZhdWx0LCB0aGlzLnN0YXRlLnRleHRib29rLnBhZ2UpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21haW4tY29udGFpbmVyJyk7XG4gICAgICAgICAgICBjb25zdCBwYWdpbmdOb2RlID0gdGhpcy5wYWdpbmcoKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmQodGV4dGJvb2tOb2RlKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmQocGFnaW5nTm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNoYW5nZUN1cnJlbnRQYWdlKHVuaXQsIHBhZ2UpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gYWRkIHVuaXRzIHBhZ2luZyBoZXJlIGFsc28gYW5kIHNhdmUgdG9nZXRoZXJcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gYC8ke3RoaXMuc3RhdGUucGFnZX0vdW5pdCR7dW5pdH0vJHtwYWdlfWA7XG4gICAgICAgICAgICBjb25zdCB0ZXh0Ym9va1Byb2dyZXNzID0geyB1bml0OiB0aGlzLnN0YXRlLnRleHRib29rLnVuaXQsIHBhZ2U6IHRoaXMuc3RhdGUudGV4dGJvb2sucGFnZSB9O1xuICAgICAgICAgICAgY29uc3QgdGV4dGJvb2sgPSBKU09OLnN0cmluZ2lmeSh0ZXh0Ym9va1Byb2dyZXNzKTtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0ZXh0Ym9vaycsIHRleHRib29rKTtcbiAgICAgICAgICAgIHlpZWxkIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBwYWdpbmcoKSB7XG4gICAgICAgIC8vIFRPRE8gY29udFBhZ2VzIHNob3VsZCBiZSByZWNlaXZlZCBmcm9tIEJFIGFuZCBjYWxjdWxhdGVkXG4gICAgICAgIGNvbnN0IGNvbnRQYWdlcyA9IDU7XG4gICAgICAgIGNvbnN0IHBhZ2luZ05vZGUgPSAoMCwgVGV4dGJvb2tUZW1wbGF0ZV8xLnBhZ2luZ1RlbXBsYXRlKShjb250UGFnZXMsIHRoaXMuc3RhdGUudGV4dGJvb2sucGFnZSkuY29udGVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIGNvbnN0IHBhZ2luZyA9IHBhZ2luZ05vZGUucXVlcnlTZWxlY3RvcignLnBhZ2luZycpO1xuICAgICAgICBwYWdpbmcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQ7XG4gICAgICAgICAgICBpZiAodGFyZ2V0LmRhdGFzZXQubnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgeWllbGQgdGhpcy5jaGFuZ2VDdXJyZW50UGFnZSgxLCArdGFyZ2V0LmRhdGFzZXQubnVtYmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3BhZ2luZ19fcHJldicpKSB7XG4gICAgICAgICAgICAgICAgeWllbGQgdGhpcy5jaGFuZ2VDdXJyZW50UGFnZSgxLCB0aGlzLnN0YXRlLnRleHRib29rLnBhZ2UgLSAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ3BhZ2luZ19fbmV4dCcpKSB7XG4gICAgICAgICAgICAgICAgeWllbGQgdGhpcy5jaGFuZ2VDdXJyZW50UGFnZSgxLCB0aGlzLnN0YXRlLnRleHRib29rLnBhZ2UgKyAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gcGFnaW5nTm9kZTtcbiAgICB9XG59XG5leHBvcnRzLmRlZmF1bHQgPSBUZXh0Ym9vaztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5wYWdpbmdUZW1wbGF0ZSA9IGV4cG9ydHMudGV4dGJvb2tUZW1wbGF0ZSA9IGV4cG9ydHMuZHJhd0NhcmQgPSB2b2lkIDA7XG5jb25zdCBkcmF3Q2FyZCA9ICh3b3JkRGF0YSkgPT4gYFxuICAgIDxkaXYgY2xhc3M9XCJ0ZXh0Ym9vay1jYXJkXCI+XG4gICAgICA8aDU+JHt3b3JkRGF0YS5pZH06ICR7d29yZERhdGEubmFtZX08L2g1PlxuICAgIDwvZGl2PmA7XG5leHBvcnRzLmRyYXdDYXJkID0gZHJhd0NhcmQ7XG5jb25zdCB0ZXh0Ym9va1RlbXBsYXRlID0gKHdvcmRzLCBjdXJyZW50UGFnZSkgPT4ge1xuICAgIGNvbnN0IHRleHRib29rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICBjb25zdCBjYXJkcyA9IHdvcmRzLm1hcCgod29yZCkgPT4gKDAsIGV4cG9ydHMuZHJhd0NhcmQpKHdvcmQpKS5qb2luKCcnKTtcbiAgICB0ZXh0Ym9vay5pbm5lckhUTUwgPSBgXG4gICAgPGRpdiBjbGFzcz1cIm1haW4tcGFnZVwiPlxuICAgICAgPGgyPlRleHRib29rIFBhZ2UgJHtjdXJyZW50UGFnZX08L2gyPlxuICAgICAgPGRpdiBjbGFzcz1cImNhcmRzLWNvbnRhaW5lclwiPlxuICAgICAgICAke2NhcmRzfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+YDtcbiAgICByZXR1cm4gdGV4dGJvb2s7XG59O1xuZXhwb3J0cy50ZXh0Ym9va1RlbXBsYXRlID0gdGV4dGJvb2tUZW1wbGF0ZTtcbmNvbnN0IHBhZ2luZ1RlbXBsYXRlID0gKGNvdW50UGFnZXMsIGN1cnJlbnRQYWdlKSA9PiB7XG4gICAgY29uc3QgcGFnaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICAvLyBZb3UgbmVlZCBhZGQgc29tZSBsb2dpYyB0byBjYWxjdWxhdGUgaG93IG11Y2ggYnV0dG9ucyBzaG91bGQgYmUgaGVyZVxuICAgIC8vIGp1c3QgZ2VuZXJhdGluZyBwYWdlIG51bWJlcnMgaGVyZVxuICAgIGNvbnN0IGJ1dHRvbnMgPSBBcnJheS5mcm9tKEFycmF5KGNvdW50UGFnZXMpLmtleXMoKSlcbiAgICAgICAgLm1hcCgobnVtKSA9PiBudW0gKyAxKVxuICAgICAgICAubWFwKChwYWdlKSA9PiBgXG4gICAgICAgIDxidXR0b24gZGF0YS1udW1iZXI9XCIke3BhZ2V9XCIgY2xhc3M9XCJidXR0b24gJHtwYWdlID09PSBjdXJyZW50UGFnZSAmJiAnY3VycmVudC1wYWdlJ31cIj5cbiAgICAgICAgICAke3BhZ2V9XG4gICAgICAgIDwvYnV0dG9uPmApXG4gICAgICAgIC5qb2luKCcnKTtcbiAgICBwYWdpbmcuaW5uZXJIVE1MID0gYFxuICAgIDxkaXYgY2xhc3M9XCJwYWdpbmdcIj5cbiAgICAgIDxidXR0b24gY2xhc3M9XCJwYWdpbmdfX3ByZXYgYnV0dG9uXCI+UHJldjwvYnV0dG9uPlxuICAgICAgJHtidXR0b25zfVxuICAgICAgPGJ1dHRvbiBjbGFzcz1cInBhZ2luZ19fbmV4dCBidXR0b25cIj5OZXh0PC9idXR0b24+XG4gICAgPC9kaXY+YDtcbiAgICByZXR1cm4gcGFnaW5nO1xufTtcbmV4cG9ydHMucGFnaW5nVGVtcGxhdGUgPSBwYWdpbmdUZW1wbGF0ZTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBBcHBWaWV3XzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIi4vY29tcG9uZW50cy92aWV3L0FwcFZpZXdcIikpO1xuKCgpID0+IF9fYXdhaXRlcih2b2lkIDAsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgIHlpZWxkICgwLCBBcHBWaWV3XzEuZGVmYXVsdCkoKTtcbn0pKSgpO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHRpZDogbW9kdWxlSWQsXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwidmFyIHNjcmlwdFVybDtcbmlmIChfX3dlYnBhY2tfcmVxdWlyZV9fLmcuaW1wb3J0U2NyaXB0cykgc2NyaXB0VXJsID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmxvY2F0aW9uICsgXCJcIjtcbnZhciBkb2N1bWVudCA9IF9fd2VicGFja19yZXF1aXJlX18uZy5kb2N1bWVudDtcbmlmICghc2NyaXB0VXJsICYmIGRvY3VtZW50KSB7XG5cdGlmIChkb2N1bWVudC5jdXJyZW50U2NyaXB0KVxuXHRcdHNjcmlwdFVybCA9IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjXG5cdGlmICghc2NyaXB0VXJsKSB7XG5cdFx0dmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNjcmlwdFwiKTtcblx0XHRpZihzY3JpcHRzLmxlbmd0aCkgc2NyaXB0VXJsID0gc2NyaXB0c1tzY3JpcHRzLmxlbmd0aCAtIDFdLnNyY1xuXHR9XG59XG4vLyBXaGVuIHN1cHBvcnRpbmcgYnJvd3NlcnMgd2hlcmUgYW4gYXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCB5b3UgbXVzdCBzcGVjaWZ5IGFuIG91dHB1dC5wdWJsaWNQYXRoIG1hbnVhbGx5IHZpYSBjb25maWd1cmF0aW9uXG4vLyBvciBwYXNzIGFuIGVtcHR5IHN0cmluZyAoXCJcIikgYW5kIHNldCB0aGUgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gdmFyaWFibGUgZnJvbSB5b3VyIGNvZGUgdG8gdXNlIHlvdXIgb3duIGxvZ2ljLlxuaWYgKCFzY3JpcHRVcmwpIHRocm93IG5ldyBFcnJvcihcIkF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyXCIpO1xuc2NyaXB0VXJsID0gc2NyaXB0VXJsLnJlcGxhY2UoLyMuKiQvLCBcIlwiKS5yZXBsYWNlKC9cXD8uKiQvLCBcIlwiKS5yZXBsYWNlKC9cXC9bXlxcL10rJC8sIFwiL1wiKTtcbl9fd2VicGFja19yZXF1aXJlX18ucCA9IHNjcmlwdFVybDsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm5jID0gdW5kZWZpbmVkOyIsIiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyhcIi4vc3JjL2luZGV4LnRzXCIpO1xuIiwiIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9