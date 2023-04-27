import { readFileSync, writeFileSync } from "fs";

export class CacheMissError extends Error {}

export default class ContractAbiCache {
  contractAddress: string;
  artifactPath: string;
  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
    const currentPath = process.cwd();
    this.artifactPath = `${currentPath}/artifacts/abi-${this.contractAddress}.json`;
  }

  getAbi(): Promise<string> {
    try {
      const data = readFileSync(this.artifactPath, "utf-8");
      console.log("Cache hit", this.contractAddress);
      return Promise.resolve(data);
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.log("Cache miss", this.contractAddress);
        throw new CacheMissError();
      } else {
        throw error;
      }
    }
  }

  setAbi(data: string) {
    // Using sync here so I don't have to write a job system.
    // Ideally, async is better since we don't need to wait for it before we respond
    writeFileSync(this.artifactPath, data);
  }
}
