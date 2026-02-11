// Minimal skill: pure computation, no permissions needed
const result = Array.from({ length: 10 }, (_, i) => i * i);
const sum = result.reduce((a, b) => a + b, 0);
