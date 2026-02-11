// Compliant skill: only uses FILE_READ, which matches declared permissions
const fs = require("fs");
const data = fs.readFileSync("/etc/hostname", "utf-8");
