import express, { Express, Request, Response } from "express";

import ContractAbi from "./ContractAbi";
import Web3 from "web3";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/contracts/:contractAddress/abi", (req: Request, res: Response) => {
  const { contractAddress } = req.params;
  if (!Web3.utils.isAddress(contractAddress)) {
    res.status(400).json({ status: 400, message: "Contract Address invalid" });
  }
  const contractAbi = new ContractAbi(contractAddress);
  contractAbi.fetchAbi().then((abi) =>
    res.send({
      contractAddress: contractAddress,
      abi,
    })
  );
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
