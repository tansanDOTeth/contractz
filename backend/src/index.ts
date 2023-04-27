import express, { Express, Request, Response } from "express";

import ContractAbi from "./ContractAbi";
import Web3 from "web3";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const corsOrigins = process.env.CORS_ORIGINS?.split(",");

app.use(
  cors({
    origin: corsOrigins,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/contracts/:contractAddress/abi", (req: Request, res: Response) => {
  const { contractAddress } = req.params;
  if (!Web3.utils.isAddress(contractAddress)) {
    return res
      .status(400)
      .json({ status: 400, message: "Contract Address invalid" });
  }
  const contractAbi = new ContractAbi(contractAddress);
  return contractAbi.fetchAbi().then((abi) =>
    res.send({
      contractAddress: contractAddress,
      abi,
    })
  );
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log("⚡️[server]: CORS Origins", corsOrigins);
});
