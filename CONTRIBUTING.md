# Contributing to SkillProof

Thanks for your interest in contributing. This guide covers the basics for getting involved.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies:

```bash
npm install
```

4. Build all packages:

```bash
npm run build --workspace=packages/sdk
npm run build --workspace=packages/cli
npm run build --workspace=packages/auditor
```

5. Run tests:

```bash
npm test --workspace=packages/auditor
```

## Project Structure

```
packages/
  auditor/     — Runtime permission auditor + sandbox
  sdk/         — TypeScript SDK (viem + snarkjs)
  cli/         — Command-line interface
  contracts/   — Solidity contracts (Hardhat)
  circuits/    — Circom ZK circuits
```

## Development Workflow

1. Create a branch from `master`
2. Make your changes
3. Ensure builds pass: `npm run build` in the relevant package
4. Ensure tests pass: `npm test` in the relevant package
5. Commit with a clear message describing the change
6. Open a pull request

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Include a short description of what changed and why
- Add tests for new functionality
- Make sure existing tests still pass

## Commit Messages

Use concise, descriptive commit messages:

- `Add timeout option to sandbox runner`
- `Fix permission tracking for async skills`
- `Update PulseChain testnet RPC endpoint`

## Contracts

If modifying Solidity contracts:

```bash
cd packages/contracts
npm run compile
npm run test
```

## Circuits

If modifying ZK circuits, you'll need [circom](https://docs.circom.io/getting-started/installation/) installed:

```bash
cd packages/circuits
npm run compile
npm run setup
npm run test
```

## Reporting Issues

Open an issue on GitHub with:

- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior

## Questions

Reach out at **skillproof@proton.me**.
