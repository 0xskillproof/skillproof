# SkillProof

ZK-verified agent skill proof infrastructure for PulseChain. Agents declare permissions, a sandbox audits actual behavior, and a ZK proof attests compliance on-chain — no trust required.

## How It Works

1. An agent packages its skill code with a **manifest** declaring required permissions
2. The **auditor** runs the skill in a sandboxed VM, intercepting all module calls to detect actual permission usage
3. If observed permissions are a subset of declared permissions, a **Groth16 ZK proof** is generated
4. The proof is submitted **on-chain** to PulseChain, where a Solidity verifier validates it and records the result in an ERC-8004 registry

## Packages

| Package | Description |
|---------|-------------|
| `@skillproof/auditor` | Sandbox-based runtime permission auditor with ZK proof generation |
| `@skillproof/sdk` | TypeScript SDK for proof generation, identity registration, and on-chain verification |
| `@skillproof/contracts` | Solidity contracts — ERC-8004 registries, Groth16 verifier, ZKSkillVerifier |
| `@skillproof/circuits` | Circom ZK circuits for skill audit proofs |
| `@skillproof/cli` | Command-line interface wrapping the SDK |

## Permission Model

Skills declare an 8-bit permission bitmask:

| Bit | Permission | Intercepted Modules |
|-----|-----------|-------------------|
| 0 | `FILE_READ` | `fs.readFileSync`, `fs.readdir`, `fs.stat`, etc. |
| 1 | `FILE_WRITE` | `fs.writeFileSync`, `fs.mkdir`, `fs.unlink`, etc. |
| 2 | `NETWORK_READ` | `http.get`, `https.get`, `dns` |
| 3 | `NETWORK_WRITE` | `http.request` (POST/PUT/DELETE) |
| 4 | `SHELL_EXEC` | `child_process.exec`, `spawn`, etc. |
| 5 | `ENV_ACCESS` | `process.env` |
| 6 | `CRYPTO_OPS` | `crypto` module |
| 7 | `SYSTEM_INFO` | `os` module, `process.memoryUsage`, etc. |

## Quick Start

```bash
npm install
npm run build --workspace=packages/sdk
npm run build --workspace=packages/auditor
```

### Audit a skill

```typescript
import { SkillAuditor } from "@skillproof/auditor";

const auditor = new SkillAuditor();
const result = await auditor.audit("./my-skill/manifest.json");

console.log(result.compliant);    // true if observed <= declared
console.log(result.observedMask); // bitmask of actually used permissions
console.log(result.declaredMask); // bitmask from manifest
```

### Audit and generate a ZK proof

```typescript
const result = await auditor.auditAndProve("./my-skill/manifest.json", {
  auditorSecret: "your-secret",
});

if (result.proof) {
  // Submit on-chain via SDK
}
```

### Skill manifest format

```json
{
  "name": "file-reader-skill",
  "version": "1.0.0",
  "agentId": "42",
  "entrypoint": "index.js",
  "permissions": { "FILE_READ": true },
  "timeout": 5000
}
```

## Networks

| Network | Chain ID | RPC |
|---------|----------|-----|
| PulseChain | 369 | `https://pulsechain-rpc.publicnode.com/` |
| PulseChain Testnet v4 | 943 | `https://rpc.v4.testnet.pulsechain.com` |

## Architecture

```
Skill Code + Manifest
        |
        v
  +-----------+
  |  Auditor  |  vm.createContext() sandbox
  |  Sandbox  |  intercepts fs, http, child_process, etc.
  +-----------+
        |
        v
  observed permissions bitmask
        |
        v
  +------------+
  | ZK Circuit |  Groth16 proof: observed is subset of declared
  +------------+
        |
        v
  +--------------+
  | PulseChain   |  On-chain verifier + ERC-8004 validation registry
  +--------------+
```

## License

MIT
