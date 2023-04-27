import ContractAbiCache, { CacheMissError } from "./ContractAbiCache";

import fetch from "node-fetch";
import { json } from "stream/consumers";

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

  private readCache(): Promise<object> {
    return this.abiCache.getAbi().then(JSON.parse);
  }

  private writeCache(data: any) {
    this.abiCache.setAbi(data);
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
  fetchAbi(): Promise<object> {
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
}
