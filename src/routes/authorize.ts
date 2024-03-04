import { Request, Response } from "express";
import AsyncHandler from "../lib/AsyncHandler";
import { IClientConfigurations } from "../lib/ClientConfigurations";
import { AuthorizeRequestParameters } from "../lib/RequestParameters";
import { userTemplates } from "../config.users";
import {
  AuthorizeValidationResult,
  IAuthorizeValidationResult,
} from "../lib/ValidationResult";
import { ClientConfiguration } from "../lib/types";

export default (clientConfigurations: IClientConfigurations) => {
  return AsyncHandler(async (req: Request, res: Response) => {
    // Display all the request parameter values on the page,
    // Validate them against the client configuration
    // if successful ask what to do next; fail/succeed token exchange
    // and what userinfo to return

    // TODO:
    // Handle JAR format requests

    // TODO:
    // Handle POST method requests

    /*
    NB
    It's not secure to redirect to the redirect_uri in query parameters unless
    the client configuration contains a matching value. In the case of an
    invalid client_id or redirect_uri the browser isn't returned, so a generic
    server error is displayed
    */

    const parameters = new AuthorizeRequestParameters(req);
    //const result = new AuthorizeValidationResult();

    let clientConfiguration;

    // Validate ClientId
    const clientId = parameters.client_id;
    if (typeof clientId !== "string") {
      req.log.error("The authorize request 'client_id' parameter is missing.");
      showInternalServerError(res);
    } else {
      clientConfiguration = clientConfigurations.get(clientId);
      if (typeof clientConfiguration === "undefined") {
        req.log.error(
          "The authorize request 'client_id' parameter is not a registered client id."
        );
        showInternalServerError(res);
      }
    }

    // Validate Redirect Uri
    const redirectUri = parameters.redirect_uri;
    if (typeof redirectUri !== "string") {
      req.log.error(
        "The authorize request 'redirect_uri' parameter is missing."
      );
      showInternalServerError(res);
    }
    if (
      clientConfiguration &&
      !clientConfiguration.redirect_uris.some(
        (clientConfigRedirectUri: string) =>
          clientConfigRedirectUri == redirectUri
      )
    ) {
      req.log.error(
        `The authorize request 'redirect_uri' parameter must exactly match a redirect URI registered for the client. 'redirect_uri' parameter value was '${redirectUri}', valid values are ${clientConfiguration.redirect_uris
          .map((x) => `'${x}'`)
          .join(", ")}`
      );
      showInternalServerError(res);
    }

    // Validate Scopes
    const scope = parameters.scope;
    if (typeof scope !== "string" || scope === "") {
      req.log.error("The authorize request is missing the 'scope' parameter");
      redirectToRpWithError(
        res,
        redirectUri!,
        "invalid_request",
        "Invalid request: Missing scope parameter"
      );
    } else {
      const scopes = scope.split(" ");

      // Scopes must contain "openid"
      if (!scopes.includes("openid")) {
        req.log.error(
          "The authorize request 'scope' parameter must contain 'openid'"
        );
        redirectToRpWithError(
          res,
          redirectUri!,
          "invalid_request",
          "Invalid request: The scope must include an openid value"
        );
      }

      // Scopes must match client configuration
      if (
        clientConfiguration &&
        scopes.some((s) => !clientConfiguration.scopes.includes(s))
      ) {
        req.log.error(
          `The authorize request 'scope' parameter must exactly only match scope values registered for the client. 'scope' parameter values were ${scopes
            .map((x) => `'${x}'`)
            .join(", ")}', valid values are ${clientConfiguration.scopes
            .map((x) => `'${x}'`)
            .join(", ")}`
        );

        redirectToRpWithError(
          res,
          redirectUri!,
          "invalid_scope",
          "Invalid, unknown or malformed scope"
        );
      }
    }

    // Validate state
    const state = parameters.state;
    if (typeof state !== "string" || state == "") {
      req.log.error("The authorize request is missing the 'state' parameter");
      redirectToRpWithError(
        res,
        redirectUri!,
        "invalid_request",
        "Request is missing state parameter"
      );
    }

    // Validate VTR
    // See: https://github.com/alphagov/di-authentication-api/blob/b2eca7d511001a208b026b535f6bba4f72cbd9bd/shared/src/main/java/uk/gov/di/authentication/shared/entity/VectorOfTrust.java#L53
    const vtr = parameters.vtr;
    if (typeof vtr === "string" && vtr !== "") {
      let vtrObj: any | null = null;
      try {
        vtrObj = JSON.parse(vtr);
      } catch (e) {
        req.log.error(
          `Couldn't parse the JSON format of the authorize request 'vtr' parameter.
  The value of the parameter was '${vtr}'.
  The parsing error was ${e}`
        );
        redirectToRpWithError(
          res,
          redirectUri!,
          "invalid_request",
          "Request vtr not valid"
        );
      }

      if (!Array.isArray(vtrObj) || vtrObj.some((x) => typeof x !== "string")) {
        req.log.error(
          `The the authorize request 'vtr' parameter is in the wrong format. It should be an array of strings. 
   'The parameter was ${JSON.stringify(vtr, null, 2)}'`
        );
        redirectToRpWithError(
          res,
          redirectUri!,
          "invalid_request",
          "Request vtr not valid"
        );
      }

      for (const vtrItem of vtrObj) {
        const vtrItemParts = vtrItem.split(".");

        const levelOfConfidenceComponents = vtrItemParts.filter((x: string) =>
          x.startsWith("P")
        );

        // VTR must contain either 0 or 1 identity proofing components
        if (levelOfConfidenceComponents.length > 1) {
          req.log.error(
            `The the authorize request 'vtr' parameter must contain either 0 or 1 identity proofing components, beginning with 'P'. ${levelOfConfidenceComponents.length} were provided.`
          );
          redirectToRpWithError(
            res,
            redirectUri!,
            "invalid_request",
            "Request vtr not valid"
          );
        }

        const levelOfConfidence = levelOfConfidenceComponents.join(".");

        // Validate the Credential Trust Levels - "C*"
        const credentialTrustLevelComponents = vtrItemParts.filter(
          (x: string) => x.startsWith("C")
        );
        credentialTrustLevelComponents.sort();

        const credentialTrustLevel = credentialTrustLevelComponents.join(".");

        const validTrustLevels = [
          "Cl", // Low
          "Cl.Cm", // Medium
        ];
        if (!validTrustLevels.includes(credentialTrustLevel)) {
          req.log.error(
            `If the authorize request 'vrt' parameter isn't a valid trust level, it must be one of ${validTrustLevels.join(
              ","
            )}`
          );
          redirectToRpWithError(
            res,
            redirectUri!,
            "invalid_request",
            "Request vtr not valid"
          );
        }

        // "P2" also requires "Cl.Cm" - TODO: Is this documented?
        if (levelOfConfidence === "P2" && credentialTrustLevel !== "Cl.Cm") {
          req.log.error(
            "If the authorize request 'vtr' parameter contains 'P2', 'Cl.Cm' must also be specified"
          );
          redirectToRpWithError(
            res,
            redirectUri!,
            "invalid_request",
            "Request vtr not valid"
          );
        }
      }
    }

    // Validate claims
    let validRequestedClaimNames: Array<string> | undefined;
    if (typeof parameters.claims === "string") {
      let jsonParsedClaims:
        | { userinfo?: { [claim: string]: null } }
        | undefined = undefined;
      try {
        jsonParsedClaims = JSON.parse(parameters.claims);
      } catch (e) {
        req.log.error(
          `Couldn't parse the JSON format of the authorize request 'claims' parameter.
  The value of the parameter was '${parameters.claims}'.
  The parsing error was ${e}`
        );
        redirectToRpWithError(
          res,
          redirectUri!,
          //TODO: Check what happens in the real service
          "invalid_request",
          "Request claims not valid"
        );
      }

      const claims = jsonParsedClaims as {
        userinfo?: { [claim: string]: null };
      };
      if (typeof claims.userinfo !== "object") {
        req.log.error(
          `The authorize request 'claims' parameter doesn't contain a 'userinfo' property.
          It should be in the format described here https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#create-a-url-encoded-json-object-for-lt-claims-request-gt'`
        );
        redirectToRpWithError(
          res,
          redirectUri!, //TODO: Check what happens in the real service
          "invalid_request",
          "Request claims not valid"
        );
      } else if (clientConfiguration) {
        const claimNames = Object.keys(claims.userinfo);
        if (claimNames.some((c) => !clientConfiguration.claims.includes(c))) {
          req.log.error(
            `The authorize request 'claims' parameter contains a claim that is not registered in the client configuration.
  The value of the parameter was '${parameters.claims}.
  The available claims for the client are ${clientConfiguration.claims
    .map((c) => `'${c}'`)
    .join(", ")}'`
          );
          redirectToRpWithError(
            res,
            redirectUri!,
            //TODO: Check what happens in the real service
            "invalid_request",
            "Request claims not valid"
          );
        } else {
          validRequestedClaimNames = claimNames;
        }
      }
    }

    if (!res.headersSent) {
      res.render("authorize", {
        parameters,
        claims: validRequestedClaimNames,
        userTemplates,
      });
    }
  });
};

function showInternalServerError(res: Response) {
  if (res.headersSent) {
    return;
  }
  res.status(502);
  res.json({ message: "Internal server error" });
}

export function redirectToRpWithError(
  res: Response,
  redirectUri: string,
  error: string,
  errorDescription: string,
  state?: string
) {
  if (res.headersSent) {
    return;
  }
  let url = `${redirectUri}?error=${error}&error_description=${errorDescription}`;
  if (state) {
    url += `&state=${state}`;
  }
  res.redirect(url);
}
