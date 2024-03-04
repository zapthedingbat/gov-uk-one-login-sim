// import { jwtVerify, JWTVerifyGetKey } from "jose";
// import { TokenValidationResult } from "./ValidationResult";
// import { IClientConfigurations } from "./ClientConfigurations";
// import { TokenRequestParameters } from "./RequestParameters";
// import { ITokenExchangeStore as ITokenExchangeStore } from "./TokenExchangeResponseStore";

// export async function validateTokenRequest(
//   tokenExchangeStore: ITokenExchangeStore,
//   clientConfigurations: IClientConfigurations,
//   parameters: TokenRequestParameters,
//   tokenEndpointUri: string
// ): Promise<TokenValidationResult> {
//   const result = new TokenValidationResult();
//   await validateGrantType(parameters, result);
//   await validateClientAssertionType(parameters, result);

//   const authCode = parameters.code;
//   if (typeof authCode === "undefined") {
//     result.AddError("'code' parameter is required.");
//   } else {

//     // Stuff we need to validate the request and construct a response
//     const tokenExchange = tokenExchangeStore.get(authCode);
//     if (typeof tokenExchange === "undefined") {
//       result.AddError("'code' parameter is not valid.");
//     } else {
//       /***
//        * This shouldn't happen because validation at authorize should catch it
//        */
//       const redirectUri = tokenExchange.authorizeRequestParameters.redirect_uri;
//       if (typeof redirectUri === "undefined") {
//         throw new Error(
//           "'redirect_uri' parameter is required in authorize request."
//         );
//       }
//       const clientId = tokenExchange.authorizeRequestParameters.client_id;
//       if (typeof clientId === "undefined") {
//         throw new Error(
//           "'client_id' parameter is required in authorize request."
//         );
//       }
//       const clientConfiguration = clientConfigurations.get(clientId);
//       if (typeof clientConfiguration === "undefined") {
//         throw new Error("'client_id' doesn't match a client configuration.");
//       }
//       /***/

//       await validateRedirectUri(parameters, result, redirectUri);

//       await validateClientAssertion(
//         parameters,
//         result,
//         clientId,
//         clientConfiguration.getPublicKey,
//         tokenEndpointUri
//       );

//       if (result.IsValid()) {
//         result.response = tokenExchange.responseData;
//         result.testBehaviour = tokenExchange.testBehaviour;
//         result.nonce = tokenExchange.authorizeRequestParameters.nonce;
//       }
//     }
//   }

//   return result;
// }

// function validateGrantType(
//   parameters: TokenRequestParameters,
//   result: TokenValidationResult
// ) {
//   const grantType = parameters.grant_type;
//   if (typeof grantType === "undefined") {
//     result.AddError("'grant_type' parameter is required.");
//     return;
//   }
//   const validGrantTypes = ["authorization_code", "refresh_token"];
//   if (!validGrantTypes.includes(grantType)) {
//     result.AddError(
//       `'grant_type' must be one of ${validGrantTypes
//         .map((str) => `'${str}'`)
//         .join(", ")}.`
//     );
//   }
// }

// function validateClientAssertionType(
//   parameters: TokenRequestParameters,
//   result: TokenValidationResult
// ) {
//   const clientAssertionType = parameters.client_assertion_type;
//   if (typeof clientAssertionType === "undefined") {
//     result.AddError("'client_assertion_type' parameter is required.");
//   }

//   if (
//     clientAssertionType !==
//     "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
//   ) {
//     result.AddError(
//       "'client_assertion_type' parameter must equal 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'."
//     );
//   }
// }

// async function validateClientAssertion(
//   parameters: TokenRequestParameters,
//   result: TokenValidationResult,
//   clientId: string,
//   jwtVerifyGetKey: JWTVerifyGetKey,
//   audience: string
// ) {
//   const clientAssertion = parameters.client_assertion;
//   if (typeof clientAssertion === "undefined") {
//     result.AddError("'client_assertion' parameter is required.");
//     return;
//   }

//   try {
//     await jwtVerify(clientAssertion, jwtVerifyGetKey, {
//       issuer: clientId,
//       audience,
//     });
//   } catch (err) {
//     result.AddError(
//       `'client_assertion' parameter is invalid. ${err}. '${clientAssertion}'`
//     );
//   }
// }

// function validateRedirectUri(
//   parameters: TokenRequestParameters,
//   result: TokenValidationResult,
//   authorization_redirect_uri: string
// ) {
//   if (typeof parameters.redirect_uri !== "string") {
//     result.AddError("`redirect_uri` parameter is required.");
//   } else if (parameters.redirect_uri !== authorization_redirect_uri) {
//     result.AddError(
//       "`redirect_uri` parameter doesn't match authorization request"
//     );
//   }
// }
