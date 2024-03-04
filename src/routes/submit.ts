import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";
import { generateAuthorizationCode } from "../lib/tokens";
import { TokenExchange, TokenExchangeResponseData, TokenExchangeTestBehaviour } from "../lib/types";
import { AuthorizeRequestParameters } from "../lib/RequestParameters";
import { UrlResolver } from "../lib/UrlResolver";
import { ITokenExchangeStore } from "../lib/TokenExchangeResponseStore";

export default (tokenExchangeStore: ITokenExchangeStore) => {
  return AsyncHandler(async (req: Request, res: Response) => {
    switch (req.body.action) {
      case "state_mismatch":
        redirectWithWrongState(req, res);
        break;
      case "nonce_mismatch":
        tokenExchangeFailure(req, res, tokenExchangeStore, "NonceMismatch");
        break;
      default:
        success(req, res, tokenExchangeStore);
        break;
    }
  });
};

function tokenExchangeFailure(
  req: Request,
  res: Response,
  tokenExchangeStore: ITokenExchangeStore,
  testBehaviour: TokenExchangeTestBehaviour
){
  const authCode = generateAuthorizationCode();
  const tokenExchange: TokenExchange = {
    authorizeRequestParameters: new AuthorizeRequestParameters(req),
    testBehaviour: testBehaviour,
    responseData: {}
  };
  tokenExchangeStore.set(authCode, tokenExchange);
  // Redirect back to RP with authorization code and state parameters
  const locationUrl = new URL(req.body.redirect_uri);
  locationUrl.searchParams.set("code", authCode);
  locationUrl.searchParams.set("state", req.body.state);
  res.redirect(locationUrl.toString());
}

function success(
  req: Request,
  res: Response,
  tokenExchangeStore: ITokenExchangeStore
) {
  const urlResolver: UrlResolver = new UrlResolver(req);
  const authCode = generateAuthorizationCode();
  const parameters = new AuthorizeRequestParameters(req);
  const responseData = {
    sub: req.body.sub,
    userinfo: {
      behaviour: "Success",
      resource:{
        sub: req.body.sub,
        coreIdentity: {
          issuer: urlResolver.resolve("/"),
          aud: parameters.client_id!,
          vot: "P2",
          birthDate: [], //TODO: read these up from parameters
          name: [], //TODO: read these up from parameters
        }
      }
    },
  };
  const tokenExchange: TokenExchange = {
    testBehaviour: "Success",
    authorizeRequestParameters: parameters,
    responseData
  };
  tokenExchangeStore.set(authCode, tokenExchange);
  // Redirect back to RP with authorization code and state parameters
  const locationUrl = new URL(req.body.redirect_uri);
  locationUrl.searchParams.set("code", authCode);
  locationUrl.searchParams.set("state", req.body.state);
  res.redirect(locationUrl.toString());
}

function redirectWithWrongState(req: Request, res: Response) {
  const authCode = generateAuthorizationCode();
  const locationUrl = new URL(req.body.redirect_uri);
  locationUrl.searchParams.set("code", authCode);
  // Make the state parameter incorrect
  locationUrl.searchParams.set("state", "bad_state_" + req.body.state);
  res.redirect(locationUrl.toString());
}
