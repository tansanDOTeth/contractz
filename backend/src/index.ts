import { ExpressValidator, validationResult } from "express-validator";
import express, { Express, Request, Response } from "express";

import ContractAbi from "./ContractAbi";
import Web3 from "web3";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const { param } = new ExpressValidator({
  isValidEthereumAddress: async (value: string) => {
    if (!Web3.utils.isAddress(value)) {
      throw new Error("Contract Address invalid");
    }
  },
});

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

app.get(
  "/contracts/:contractAddress/abi",
  param("contractAddress").isValidEthereumAddress(),
  (req: Request, res: Response) => {
    const result = validationResult(req);
    if (result.isEmpty()) {
      const { contractAddress } = req.params;
      const contractAbi = new ContractAbi(contractAddress);
      return contractAbi.fetchAbi().then((abi) =>
        res.send({
          contractAddress: contractAddress,
          abi,
        })
      );
    }
    return res.status(400).send({ errors: result.array() });
  }
);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log("⚡️[server]: CORS Origins", corsOrigins);
});
