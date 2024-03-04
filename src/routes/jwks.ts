import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";
import { IPublicKeyStore } from "../lib/KeyStore";

export default (publicKeys: IPublicKeyStore) => {
    return AsyncHandler(async (req: Request, res: Response) => {
      res.json({keys:publicKeys.asJwks()});
    });
};
