import { AbiItem, fromWei, toBN } from "web3-utils";
import ContractAbiCache, { CacheMissError } from "./ContractAbiCache";

import Web3 from "web3";
import fetch from "node-fetch";

export default class ContractAbi {
  contractAddress: string;
  abiCache: ContractAbiCache;

  constructor(contractAddress: string) {
    if (
      !process.env.ETHERSCAN_API_KEY ||
      process.env.ETHERSCAN_API_KEY?.length === 0
    ) {
      throw new Error("Etherscan API key is required");
    }
    this.contractAddress = contractAddress;
    this.abiCache = new ContractAbiCache(contractAddress);
  }

  private fetchFromEtherscan() {
    const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${this.contractAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`;
    return fetch(url);
  }

  private readCache(): Promise<AbiItem[]> {
    return this.abiCache.getAbi().then(JSON.parse);
  }

  private writeCache(data: any) {
    this.abiCache.setAbi(data);
  }

  private findAbi(
    abi: AbiItem[],
    functionName: string,
    arity: number
  ): AbiItem | undefined {
    return abi
      .filter((abi: AbiItem) => abi.type === "function")
      .find(
        (abiItem: AbiItem) =>
          abiItem.name === functionName && abiItem.inputs?.length === arity
      );
  }

  getAbiFunction(
    functionName: string,
    arity: number
  ): Promise<AbiItem | undefined> {
    return this.fetchAbi().then((abi) =>
      this.findAbi(abi, functionName, arity)
    );
  }

  /* 
    TODO: Implement high priority queue for ABI indexing service
    
    Etherscan has a low rate limit, so ABIs need to be cached for all requests.
    
    fetch from ABI indexing service
      if abi exists 
        return abi
      else
        queue job in ABI indexing service to fetch from etherscan
        poll until abi is indexed
        return abi
  */
  fetchAbi(): Promise<AbiItem[]> {
    try {
      return this.readCache();
    } catch (error: any) {
      switch (error.constructor.name) {
        case CacheMissError.name: {
          console.log("Fetching from Etherscan...");
          return this.fetchFromEtherscan()
            .then((response) => response.json())
            .then((parsedResponse) => {
              this.writeCache(parsedResponse["result"]);
              return JSON.parse(parsedResponse["result"]);
            });
        }
        default: {
          throw error;
        }
      }
    }
  }

  runFunction(
    functionName: string,
    functionInputs: Array<string | number>,
    formatResult = true
  ) {
    if (
      !process.env.ETHEREUM_RPC_URL ||
      process.env.ETHEREUM_RPC_URL.length === 0
    ) {
      throw new Error("Need Ethereum RPC");
    }

    return this.fetchAbi().then((abi) => {
      const web3 = new Web3(process.env.ETHEREUM_RPC_URL!);
      const Contract = web3.eth.Contract;
      const contract = new Contract(abi, this.contractAddress);
      const contractFunction = contract.methods[functionName];

      return new Promise((resolve, reject) => {
        contractFunction(...functionInputs).call((error: any, result: any) => {
          if (error) {
            return reject(error);
          }
          if (formatResult) {
            const abiItem = this.findAbi(
              abi,
              functionName,
              functionInputs.length
            );
            return resolve(this.formatResult(abiItem!, result));
          }
          return resolve(result);
        });
      });
    });
  }

  private format(value: any, type: string) {
    switch (type) {
      case "uint256": {
        return value;
      }
      default: {
        console.log("Type unsupported and needs to be formatted", value, type);
        return value;
      }
    }
  }

  private formatResult(abiItem: AbiItem, result: any) {
    // TODO: Implement multiple return values
    if (Array.isArray(result)) {
      // Loop through outputs
      console.log(
        "Multiple return formatting not yet supported! Please add this!",
        abiItem,
        result
      );
      throw new Error(
        "Multiple return formatting not yet supported! Please add this!"
      );
    } else {
      const output = abiItem.outputs![0];
      return this.format(result, output.type);
    }
  }
}
