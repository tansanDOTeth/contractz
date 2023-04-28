import {
  ExpressValidator,
  matchedData,
  validationResult,
} from "express-validator";
import express, { Express, Request, Response } from "express";

import { AbiItem } from "web3-utils";
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

const { body } = new ExpressValidator({
  isValidAbiFunction: async (functionName: string, { req }: { req: any }) => {
    const contractAbi = new ContractAbi(req.params.contractAddress);
    const abiItem = await contractAbi
      .getAbiFunction(functionName, req.body.inputs.length)
      .catch(() => {
        throw new Error("Contract Address invalid");
      });

    if (!abiItem) {
      throw new Error("Invalid function and/or arity for contract address");
    }
    return abiItem;
  },
});

const app: Express = express();
const port = process.env.PORT;
const corsOrigins = process.env.CORS_ORIGINS?.split(",");

app.use(express.json());
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
      const { contractAddress } = matchedData(req);
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

app.post(
  "/contracts/:contractAddress/run",
  param("contractAddress").notEmpty().isValidEthereumAddress(),
  body("type").custom((value) => value === "function"),
  body("inputs").isArray(),
  body("name").isValidAbiFunction(),
  async (req: Request, res: Response) => {
    const { contractAddress, name, inputs } = matchedData(req);
    console.log("data", matchedData(req));

    const result = validationResult(req);
    if (result.isEmpty()) {
      const contractAbi = new ContractAbi(contractAddress);
      const abiItem = await contractAbi.getAbiFunction(name, inputs.length);
      return contractAbi
        .runFunction(
          name,
          inputs.map((input: any) => input.value)
        )
        .then((result: any) =>
          res.send({
            result,
          })
        )
        .catch((error) => {
          console.log(error);
          return res.status(400).send();
        });
    }
    return res.status(400).send({ errors: result.array() });
  }
);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log("⚡️[server]: CORS Origins", corsOrigins);
});
