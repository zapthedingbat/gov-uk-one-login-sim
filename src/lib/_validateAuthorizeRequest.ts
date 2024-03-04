// import {
//   AuthorizeValidationResult,
//   IAuthorizeValidationResult,
// } from "./ValidationResult";
// import { IClientConfigurations } from "./ClientConfigurations";
// import { AuthorizeRequestParameters } from "./RequestParameters";
// import { ClientConfiguration } from "./types";
// import { logger } from "./Logger";

// export async function validateAuthorizeRequest(
//   clientConfigurations: IClientConfigurations,
//   parameters: AuthorizeRequestParameters
// ): Promise<IAuthorizeValidationResult> {
//   /*
//   It's not secure to redirect to the redirect_uri in query parameters unless
//   the client configuration contains a matching value. In the case of an
//   invalid client_id or redirect_uri the browser isn't returned, so a generic error
//    */

//   const result = new AuthorizeValidationResult();
//   let client = validateClientId(parameters, result, clientConfigurations);
//   validateScopes(parameters, result, client);
//   validateState(parameters, result);
//   validateRedirectUri(parameters, result, client);
//   validateVtr(parameters, result);
//   validateClaims(parameters, result, client);
//   return result;
// }

// function validateClientId(
//   parameters: AuthorizeRequestParameters,
//   result: AuthorizeValidationResult,
//   clientConfigurations: IClientConfigurations
// ) {
//   let client;
//   const clientId = parameters.client_id;
//   if (typeof clientId !== "string") {
//     result.AddError("The authorize request 'client_id' parameter is missing.");
//   } else {
//     client = clientConfigurations.get(clientId);
//     if (typeof client === "undefined") {
//       result.AddError(
//         "The authorize request 'client_id' parameter is not a registered client id."
//       );
//     }
//   }
//   return client;
// }

// // See: https://github.com/alphagov/di-authentication-api/blob/b2eca7d511001a208b026b535f6bba4f72cbd9bd/shared/src/main/java/uk/gov/di/authentication/shared/entity/VectorOfTrust.java#L53
// function validateVtr(
//   parameters: AuthorizeRequestParameters,
//   result: AuthorizeValidationResult
// ) {
//   const vtr = parameters.vtr;
//   if (typeof vtr === "string" && vtr !== "") {
//     let vtrObj: any | null = null;
//     try {
//       vtrObj = JSON.parse(vtr);
//     } catch (e) {
//       result.AddError(
//         `Couldn't parse the JSON format of the authorize request 'vtr' parameter.
// The value of the parameter was '${vtr}'.
// The parsing error was ${e}`,
//         "invalid_request",
//         "Request vtr not valid"
//       );
//     }

//     if (!Array.isArray(vtrObj) || vtrObj.some((x) => typeof x !== "string")) {
//       result.AddError(
//         `The the authorize request 'vtr' parameter is in the wrong format. It should be an array of strings. 
//  'The parameter was ${JSON.stringify(vtr, null, 2)}'`,
//         "invalid_request",
//         "Request vtr not valid"
//       );
//     }

//     for (const vtrItem of vtrObj) {
//       const vtrItemParts = vtrItem.split(".");

//       const levelOfConfidenceComponents = vtrItemParts.filter((x: string) =>
//         x.startsWith("P")
//       );

//       // VTR must contain either 0 or 1 identity proofing components
//       if (levelOfConfidenceComponents.length > 1) {
//         result.AddError(
//           `The the authorize request 'vtr' parameter must contain either 0 or 1 identity proofing components, beginning with 'P'. ${levelOfConfidenceComponents.length} were provided.`,
//           "invalid_request",
//           "Request vtr not valid"
//         );
//       }

//       const levelOfConfidence = levelOfConfidenceComponents.join(".");

//       // Validate the Credential Trust Levels - "C*"
//       const credentialTrustLevelComponents = vtrItemParts.filter((x: string) =>
//         x.startsWith("C")
//       );
//       credentialTrustLevelComponents.sort();

//       const credentialTrustLevel = credentialTrustLevelComponents.join(".");

//       const validTrustLevels = [
//         "Cl", // Low
//         "Cl.Cm", // Medium
//       ];
//       if (!validTrustLevels.includes(credentialTrustLevel)) {
//         result.AddError(
//           `If the authorize request 'vrt' parameter isn't a valid trust level, it must be one of ${validTrustLevels.join(
//             ","
//           )}`,
//           "invalid_request",
//           "Request vtr not valid"
//         );
//       }

//       // "P2" also requires "Cl.Cm" - TODO: Is this documented?
//       if (levelOfConfidence === "P2" && credentialTrustLevel !== "Cl.Cm") {
//         result.AddError(
//           "If the authorize request 'vtr' parameter contains 'P2', 'Cl.Cm' must also be specified",
//           "invalid_request",
//           "Request vtr not valid"
//         );
//       }
//     }
//   }
// }

// function validateRedirectUri(
//   parameters: AuthorizeRequestParameters,
//   result: AuthorizeValidationResult,
//   client: ClientConfiguration | undefined
// ) {
//   const redirectUri = parameters.redirect_uri;
//   if (typeof redirectUri !== "string") {
//     result.AddError(
//       "The authorize request 'redirect_uri' parameter is missing."
//     );
//   }
//   if (
//     client &&
//     !client.redirect_uris.some(
//       (clientConfigRedirectUri: string) =>
//         clientConfigRedirectUri == redirectUri
//     )
//   ) {
//     result.AddError(
//       `The authorize request 'redirect_uri' parameter must exactly match a redirect URI registered for the client. 'redirect_uri' parameter value was '${redirectUri}', valid values are ${client.redirect_uris
//         .map((x) => `'${x}'`)
//         .join(", ")}`
//     );
//   }
// }

// function validateState(
//   parameters: AuthorizeRequestParameters,
//   result: AuthorizeValidationResult
// ) {
//   const state = parameters.state;
//   if (typeof state !== "string" || state == "") {
//     result.AddError(
//       "The authorize request is missing the 'state' parameter",
//       "invalid_request",
//       "Request is missing state parameter"
//     );
//   }
// }

// function validateScopes(
//   parameters: AuthorizeRequestParameters,
//   result: AuthorizeValidationResult,
//   client?: ClientConfiguration
// ) {
//   const scope = parameters.scope;
//   if (typeof scope !== "string" || scope == "") {
//     result.AddError(
//       "The authorize request is missing the 'scope' parameter",
//       "invalid_request",
//       "Invalid request: Missing scope parameter"
//     );
//   } else {
//     const scopes = scope.split(" ");
//     if (!scopes.includes("openid")) {
//       result.AddError(
//         "The authorize request 'scope' parameter must contain 'openid'",
//         "invalid_request",
//         "Invalid request: The scope must include an openid value"
//       );
//     }
//     if (client && scopes.some((s) => !client.scopes.includes(s))) {
//       result.AddError(
//         `The authorize request 'scope' parameter must exactly only match scope values registered for the client. 'scope' parameter values were ${scopes
//           .map((x) => `'${x}'`)
//           .join(", ")}', valid values are ${client.scopes
//           .map((x) => `'${x}'`)
//           .join(", ")}`,
//         "invalid_scope",
//         "Invalid, unknown or malformed scope"
//       );
//     }
//   }
// }
// function validateClaims(
//   parameters: AuthorizeRequestParameters,
//   result: AuthorizeValidationResult,
//   client?: ClientConfiguration
// ) {
//   if (typeof parameters.claims === "string") {
//     let jsonParsedClaims: { userinfo?: { [claim: string]: null } } | undefined =
//       undefined;
//     try {
//       jsonParsedClaims = JSON.parse(parameters.claims);
//     } catch (e) {
//       result.AddError(
//         `Couldn't parse the JSON format of the authorize request 'claims' parameter.
// The value of the parameter was '${parameters.claims}'.
// The parsing error was ${e}`,
//         //TODO: Check what happens in the real service
//         "invalid_request",
//         "Request claims not valid"
//       );
//     }

//     const claims = jsonParsedClaims as { userinfo?: { [claim: string]: null } };
//     if (typeof claims.userinfo !== "object") {
//       result.AddError(
//         `The authorize request 'claims' parameter doesn't contain a 'userinfo' property.
//         It should be in the format described here https://docs.sign-in.service.gov.uk/integrate-with-integration-environment/authenticate-your-user/#create-a-url-encoded-json-object-for-lt-claims-request-gt'`,
//         //TODO: Check what happens in the real service
//         "invalid_request",
//         "Request claims not valid"
//       );
//     } else if (client) {
//       const claimNames = Object.keys(claims.userinfo);
//       if (claimNames.some((c) => !client.claims.includes(c))) {
//         result.AddError(
//           `The authorize request 'claims' parameter contains a claim that is not registered in the client configuration.
// The value of the parameter was '${parameters.claims}.
// The available claims for the client are ${client.claims
//             .map((c) => `'${c}'`)
//             .join(", ")}'`,
//           //TODO: Check what happens in the real service
//           "invalid_request",
//           "Request claims not valid"
//         );
//       } else {
//         result.SetIdentityVerificationClaims(claimNames);
//       }
//     }
//   }
// }
