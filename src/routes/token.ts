import { Request, Response } from "express";
import { KeyLike, SignJWT, jwtVerify } from "jose";
import { randomBytes, randomUUID } from "node:crypto";
import AsyncHandler from "../lib/AsyncHandler";
import { IClientConfigurations } from "../lib/ClientConfigurations";
import { TokenRequestParameters } from "../lib/RequestParameters";
import { ITokenExchangeStore } from "../lib/TokenExchangeResponseStore";
import { UrlResolver } from "../lib/UrlResolver";
import { PrivateKeyInfo, TokenSet } from "../lib/types";

export default (
  clientConfigurations: IClientConfigurations,
  tokenExchangeStore: ITokenExchangeStore,
  privateKeyInfo: PrivateKeyInfo
) => AsyncHandler(async (req: Request, res: Response) => {
  const urlResolver = new UrlResolver(req);
  const tokenEndpointUri = urlResolver.resolve("/token");
  const parameters = new TokenRequestParameters(req);

  // Validate grant type
  validateGrantType(parameters, req, res);

  // Validate Client Assertion Type
  validateClientAssertionType(parameters, req, res);

  // Validate Auth code
  const authCode = parameters.code;
  if (typeof authCode === "undefined") {
    req.log.error("'code' parameter is required.");
    showInternalServerError(res);
  } else {
    const tokenExchange = tokenExchangeStore.get(authCode);
    if (typeof tokenExchange === "undefined") {
      req.log.error("'code' parameter is not valid.");
      showInternalServerError(res);
    } else {
      const clientId = tokenExchange.authorizeRequestParameters.client_id;
      const clientConfiguration = clientConfigurations.get(clientId!);
      if (typeof clientConfiguration === "undefined") {
        throw new Error("'client_id' doesn't match a client configuration.");
      }

      // Validate Redirect Uri
      if (typeof parameters.redirect_uri !== "string") {
        req.log.error("'redirect_uri' parameter is required.");
        showInternalServerError(res);
      } else if (parameters.redirect_uri !==
        tokenExchange.authorizeRequestParameters.redirect_uri) {
        req.log.error(
          "'redirect_uri' parameter doesn't match authorization request"
        );
        showInternalServerError(res);
      }

      // Validate client assertion
      const clientAssertion = parameters.client_assertion;
      const clientPublicKey = clientConfiguration.getPublicKey;
      if (typeof clientAssertion === "undefined") {
        req.log.error("'client_assertion' parameter is required.");
        showInternalServerError(res);
      } else {
        try {
          await jwtVerify(clientAssertion, clientPublicKey, {
            issuer: clientId,
            audience: tokenEndpointUri,
          });
        } catch (err) {
          req.log.error(
            `'client_assertion' parameter is invalid. ${err}. '${clientAssertion}'`
          );
          showInternalServerError(res);
        }
      }

      // This is a successful request
      // Return a token set
      if(!res.headersSent){
        const accessToken = await generateRandomString();
        
        const idToken = await generateIdToken({
          audience: clientId!,
          issuer: urlResolver.resolve("/"),
          keyAlg: privateKeyInfo.keyAlg,
          keyId: privateKeyInfo.keyId,
          sub: tokenExchange.responseData.sub,
          privateKey: privateKeyInfo.privateKey}
        );
  
        const tokenSet: TokenSet = {
          token_type: "Bearer",
          access_token: accessToken,
          id_token: idToken
        }
    
        res.json(tokenSet);
        // Set the userinfo details so they can be served
    
      }
    }
  }
});

function validateClientAssertionType(parameters: TokenRequestParameters, req: Request, res: Response) {
  const clientAssertionType = parameters.client_assertion_type;
  if (typeof clientAssertionType === "undefined") {
    req.log.error("'client_assertion_type' parameter is required.");
    showInternalServerError(res);
  } else if (clientAssertionType !==
    "urn:ietf:params:oauth:client-assertion-type:jwt-bearer") {
    req.log.error(
      "'client_assertion_type' parameter must equal 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'."
    );
    showInternalServerError(res);
  }
}

function validateGrantType(parameters: TokenRequestParameters, req: Request, res: Response) {
  const grantType = parameters.grant_type;
  if (typeof grantType === "undefined") {
    req.log.error("'grant_type' parameter is required.");
    showInternalServerError(res);
  } else {
    // TODO: Do we support "refresh_token"?
    const validGrantTypes = ["authorization_code", "refresh_token"];
    if (!validGrantTypes.includes(grantType)) {
      req.log.error(
        `'grant_type' must be one of ${validGrantTypes
          .map((str) => `'${str}'`)
          .join(", ")}.`
      );
      showInternalServerError(res);
    }
  }
}

function showInternalServerError(res: Response) {
  if (res.headersSent) {
    return;
  }
  res.status(502);
  res.json({ message: "Internal server error" });
}


async function generateIdToken(generateIdTokenParams: {
  audience: string,
  issuer: string,
  keyAlg: string,
  keyId: string,
  sub: string,
  privateKey: KeyLike
}) {
  const {
    audience,
    issuer,
    keyAlg,
    keyId,
    sub,
    privateKey
  } = generateIdTokenParams;
  const payload = {};
  const claim = await new SignJWT(payload)
    .setAudience(audience)
    .setExpirationTime(0)
    .setIssuedAt(0)
    .setIssuer(issuer)
    .setJti(randomUUID())
    .setNotBefore(0)
    .setProtectedHeader({ alg: keyAlg, kid: keyId })
    .setSubject(sub)
    .sign(privateKey);
  return claim;
}

async function generateRandomString(): Promise<string> {
  return randomBytes(32).toString("base64");
}
