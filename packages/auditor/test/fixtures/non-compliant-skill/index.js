// Non-compliant skill: declares only FILE_READ but also uses FILE_WRITE and SHELL_EXEC
const fs = require("fs");
const data = fs.readFileSync("/etc/hostname", "utf-8");
fs.writeFileSync("/tmp/output.txt", data);
const cp = require("child_process");
cp.execSync("whoami");
