import * as vm from "vm";
import * as path from "path";
import { PermissionTracker } from "./permission-tracker";
import { createModuleProxies, createProcessProxy } from "./module-proxy";

const SAFE_MODULES = new Set([
  "path", "util", "buffer", "url", "events", "stream",
  "assert", "string_decoder", "querystring",
]);

const INTERCEPTED_MODULES = new Set([
  "fs", "http", "https", "net", "dns",
  "child_process", "crypto", "os",
]);

export function buildSandboxContext(
  tracker: PermissionTracker,
  allowExecution: boolean = false
): vm.Context {
  const moduleProxies = createModuleProxies(tracker, allowExecution);
  const processProxy = createProcessProxy(tracker);

  const sandboxRequire = (moduleName: string): unknown => {
    if (SAFE_MODULES.has(moduleName)) {
      return require(moduleName);
    }

    if (INTERCEPTED_MODULES.has(moduleName)) {
      return moduleProxies[moduleName];
    }

    // Block relative/absolute paths to real modules
    if (moduleName.startsWith(".") || moduleName.startsWith("/")) {
      throw new Error(
        `Sandbox: cannot require path-based module "${moduleName}"`
      );
    }

    throw new Error(
      `Sandbox: module "${moduleName}" is not available`
    );
  };

  const sandboxGlobals: Record<string, unknown> = {
    require: sandboxRequire,
    module: { exports: {} },
    exports: {},
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {},
      debug: () => {},
    },
    process: processProxy,
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, Math.min(ms, 5000)),
    clearTimeout,
    setInterval: () => {
      throw new Error("Sandbox: setInterval() is not allowed");
    },
    setImmediate: (fn: () => void) => setImmediate(fn),
    clearImmediate,
    Buffer: Buffer,
    URL: URL,
    URLSearchParams: URLSearchParams,
    TextEncoder: TextEncoder,
    TextDecoder: TextDecoder,
    Promise: Promise,
    JSON: JSON,
    Math: Math,
    Date: Date,
    RegExp: RegExp,
    Error: Error,
    TypeError: TypeError,
    RangeError: RangeError,
    Array: Array,
    Object: Object,
    Map: Map,
    Set: Set,
    WeakMap: WeakMap,
    WeakSet: WeakSet,
    Symbol: Symbol,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI,
  };

  return vm.createContext(sandboxGlobals);
}
