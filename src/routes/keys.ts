import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";
import { KeyObject } from "node:crypto";

export default (idvPublicKey: KeyObject) => {
  return AsyncHandler(async (req: Request, res: Response) => {
    const pem = idvPublicKey.export({
      format: "pem",
      type: "spki",
    });
    res.render("key", { publicKey: pem });
  });
};
