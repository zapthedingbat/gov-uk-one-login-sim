import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";
import { IPublicKeys } from "../lib/Keys";

export default (publicKeys: IPublicKeys) => {
    return AsyncHandler(async (req: Request, res: Response) => {
      res.json({keys:publicKeys.asJwks()});
    });
};
