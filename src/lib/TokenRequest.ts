import { Request } from "express";
import { TokenRequestParameters } from "./RequestParameters";

export class TokenRequest {
  parameters: TokenRequestParameters;
  constructor(req: Request) {
    const requestBody = req.body;
    this.parameters = {
      client_assertion_type: requestBody.client_assertion_type,
      client_assertion: requestBody.client_assertion,
      code: requestBody.code,
      grant_type: requestBody.grant_type,
      redirect_uri: requestBody.redirect_uri,
      ...requestBody
    };
  }
}
