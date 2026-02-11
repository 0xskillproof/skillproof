import { PermissionTracker } from "./permission-tracker";

type ProxyHandler = (...args: unknown[]) => unknown;

function createTrackedMethod(
  tracker: PermissionTracker,
  permission: import("../permissions").PermissionName,
  moduleName: string,
  methodName: string,
  allowExecution: boolean,
  realImpl?: (...args: unknown[]) => unknown
): ProxyHandler {
  return (...args: unknown[]) => {
    tracker.record(permission, moduleName, methodName, args.map((a) => String(a)));
    if (allowExecution && realImpl) {
      return realImpl(...args);
    }
    // Return safe stub values instead of throwing so execution continues
    // and all permission accesses are recorded
    return undefined;
  };
}

function createTrackedModule(
  tracker: PermissionTracker,
  permission: import("../permissions").PermissionName,
  moduleName: string,
  methods: string[],
  allowExecution: boolean,
  realModule?: Record<string, unknown>
): Record<string, ProxyHandler> {
  const proxy: Record<string, ProxyHandler> = {};
  for (const method of methods) {
    const realImpl =
      allowExecution && realModule && typeof realModule[method] === "function"
        ? (realModule[method] as (...args: unknown[]) => unknown)
        : undefined;
    proxy[method] = createTrackedMethod(
      tracker, permission, moduleName, method, allowExecution, realImpl
    );
  }
  return proxy;
}

export interface ModuleProxies {
  [moduleName: string]: Record<string, unknown>;
}

export function createModuleProxies(
  tracker: PermissionTracker,
  allowExecution: boolean = false
): ModuleProxies {
  const proxies: ModuleProxies = {};

  // fs — FILE_READ and FILE_WRITE
  const fsReadMethods = [
    "readFileSync", "readFile", "readdir", "readdirSync",
    "stat", "statSync", "lstat", "lstatSync",
    "access", "accessSync", "existsSync", "realpath", "realpathSync",
    "createReadStream",
  ];
  const fsWriteMethods = [
    "writeFileSync", "writeFile", "appendFileSync", "appendFile",
    "mkdir", "mkdirSync", "rmdir", "rmdirSync",
    "unlink", "unlinkSync", "rename", "renameSync",
    "copyFileSync", "copyFile", "createWriteStream",
  ];

  const fsProxy: Record<string, unknown> = {};
  for (const method of fsReadMethods) {
    fsProxy[method] = createTrackedMethod(
      tracker, "FILE_READ", "fs", method, allowExecution,
      allowExecution ? (require("fs") as Record<string, unknown>)[method] as any : undefined
    );
  }
  for (const method of fsWriteMethods) {
    fsProxy[method] = createTrackedMethod(
      tracker, "FILE_WRITE", "fs", method, allowExecution,
      allowExecution ? (require("fs") as Record<string, unknown>)[method] as any : undefined
    );
  }
  proxies["fs"] = fsProxy;

  // http — NETWORK_READ (GET) and NETWORK_WRITE (POST/PUT/DELETE)
  const httpProxy: Record<string, unknown> = {
    get: createTrackedMethod(tracker, "NETWORK_READ", "http", "get", false),
    request: createTrackedMethod(tracker, "NETWORK_WRITE", "http", "request", false),
    createServer: createTrackedMethod(tracker, "NETWORK_WRITE", "http", "createServer", false),
  };
  proxies["http"] = httpProxy;

  // https — same as http
  const httpsProxy: Record<string, unknown> = {
    get: createTrackedMethod(tracker, "NETWORK_READ", "https", "get", false),
    request: createTrackedMethod(tracker, "NETWORK_WRITE", "https", "request", false),
  };
  proxies["https"] = httpsProxy;

  // net
  proxies["net"] = createTrackedModule(
    tracker, "NETWORK_WRITE", "net",
    ["createConnection", "connect", "createServer", "Socket"],
    false
  );

  // dns
  proxies["dns"] = createTrackedModule(
    tracker, "NETWORK_READ", "dns",
    ["lookup", "resolve", "resolve4", "resolve6", "resolveMx"],
    false
  );

  // child_process — SHELL_EXEC
  proxies["child_process"] = createTrackedModule(
    tracker, "SHELL_EXEC", "child_process",
    ["exec", "execSync", "spawn", "spawnSync", "execFile", "execFileSync", "fork"],
    false
  );

  // crypto — CRYPTO_OPS
  proxies["crypto"] = createTrackedModule(
    tracker, "CRYPTO_OPS", "crypto",
    [
      "createHash", "createHmac", "createCipheriv", "createDecipheriv",
      "randomBytes", "randomUUID", "generateKeyPairSync", "createSign",
      "createVerify", "pbkdf2Sync", "scryptSync",
    ],
    allowExecution,
    allowExecution ? require("crypto") : undefined
  );

  // os — SYSTEM_INFO
  proxies["os"] = createTrackedModule(
    tracker, "SYSTEM_INFO", "os",
    [
      "platform", "arch", "cpus", "totalmem", "freemem",
      "homedir", "tmpdir", "hostname", "type", "release",
      "networkInterfaces", "userInfo", "uptime", "loadavg",
    ],
    false
  );

  return proxies;
}

export function createProcessProxy(
  tracker: PermissionTracker
): Record<string, unknown> {
  const envProxy = new Proxy({} as Record<string, string | undefined>, {
    get(_target, prop: string) {
      tracker.record("ENV_ACCESS", "process", "env." + prop);
      return undefined;
    },
    has(_target, prop: string) {
      tracker.record("ENV_ACCESS", "process", "env.has(" + prop + ")");
      return false;
    },
  });

  const memoryUsageProxy = () => {
    tracker.record("SYSTEM_INFO", "process", "memoryUsage");
    return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 };
  };

  const cpuUsageProxy = () => {
    tracker.record("SYSTEM_INFO", "process", "cpuUsage");
    return { user: 0, system: 0 };
  };

  return {
    env: envProxy,
    version: process.version,
    versions: { ...process.versions },
    platform: "sandbox",
    arch: "sandbox",
    pid: 0,
    memoryUsage: memoryUsageProxy,
    cpuUsage: cpuUsageProxy,
    cwd: () => "/sandbox",
    exit: () => {
      throw new Error("Sandbox: process.exit() is not allowed");
    },
  };
}
