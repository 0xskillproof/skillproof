declare module "snarkjs" {
  export namespace groth16 {
    function fullProve(
      input: Record<string, string>,
      wasmFile: string,
      zkeyFile: string
    ): Promise<{ proof: any; publicSignals: string[] }>;

    function verify(
      vKey: any,
      publicSignals: string[],
      proof: any
    ): Promise<boolean>;

    function exportSolidityCallData(
      proof: any,
      publicSignals: string[]
    ): Promise<string>;
  }

  export namespace zKey {
    function exportVerificationKey(zkeyFile: string): Promise<any>;
  }
}
