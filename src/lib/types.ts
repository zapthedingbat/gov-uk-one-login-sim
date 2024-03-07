import { AuthorizeRequestParameters } from "./RequestParameters";
import { JWTVerifyGetKey } from "jose";
import { KeyObject } from "node:crypto";

export type ClientConfiguration = {
  readonly client_id: string;
  readonly redirect_uris: ReadonlyArray<string>;
  readonly scopes: ReadonlyArray<string>;
  readonly claims: ReadonlyArray<string>;
  getPublicKey: JWTVerifyGetKey;
};

export type ClientRegistration = {
  client_id: string;
  redirect_uris: Array<string>;
  scopes: Array<string>;
  claims: Array<string>;
} & ({ jwks_uri: string } | { public_key: string });

export type PrivateKeyInfo = {
  keyId: string;
  keyAlg: string;
  privateKey: KeyObject;
};

export type TokenSet = TokenSetBase | (TokenSetBase & RefreshTokenSet);

type TokenSetBase = {
  token_type: "Bearer";
  access_token: string;
  id_token: string;
};

type RefreshTokenSet = {
  refresh_token: string;
  expires_in: number;
};

export type TestBehaviour =
  | "Success"
  | "AuthorizeStateMismatch"
  | "TokenExchangeInvalidJson"
  | "TokenExchangeServerError"
  | "TokenExchangeNonceMismatch"
  | "TokenExchangeExpired"
  | "TokenExchangeInvalidAudience"
  | "TokenExchangeInvalidIssuer"
  | "UserinfoIdentityClaimExpired"
  | "UserinfoIdentityClaimInvalidAudience"
  | "UserinfoIdentityClaimInvalidIssuer"
  | "UserinfoServerError"
  | "UserinfoInvalidJson";

export type TokenExchangeData = {
  testBehaviour: TestBehaviour;
  authorizeRequestParameters: AuthorizeRequestParameters;
  userinfo: UserinfoData;
};

type UserinfoDataBase = {
  sub: string;
  email?: string;
  phone_number?: string;
};

type UserinfoDrivingPermitClaimData = {
  drivingPermit?: Array<{
    expiryDate: string;
    issueNumber: string;
    issuedBy: string;
    personalNumber: string;
  }>;
};

type UserinfoAddressClaimData = {
  address?: Array<{
    validFrom?: string;
    validUntil?: string;
    uprn: string;
    subBuildingName: string;
    buildingName: string;
    buildingNumber: string;
    dependentStreetName: string;
    streetName: string;
    doubleDependentAddressLocality: string;
    dependentAddressLocality: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
  }>;
};

type UserinfoPassportClaimData = {
  passport?: Array<{
    documentNumber: string;
    icaoIssuerCode: string;
    expiryDate: string;
  }>;
};

type UserinfoSocialSecurityRecordClaimData = {
  socialSecurityRecord?: Array<{
    personalNumber: string;
  }>;
};

export type UserinfoCredentialSubjectData = {
  name: Array<{
    validFrom?: string;
    validUntil?: string;
    nameParts: Array<{
      value: string;
      type: "GivenName" | "FamilyName";
    }>;
  }>;
  birthDate: Array<{
    value: string;
  }>;
};

type UserinfoUnsignedClaimsData = UserinfoAddressClaimData &
  UserinfoDrivingPermitClaimData &
  UserinfoPassportClaimData &
  UserinfoSocialSecurityRecordClaimData;

export type UserinfoData = UserinfoDataBase &
  UserinfoUnsignedClaimsData & {
    coreIdentity?: {
      audience: string;
      issuer: string;
      vot: string;
      credentialSubject: UserinfoCredentialSubjectData;
    };
  };

export type UserinfoTemplate = UserinfoDataBase &
  UserinfoUnsignedClaimsData & {
    coreIdentity?: UserinfoCredentialSubjectData;
  };
