import {
  randomBytes,
  generateKeyPairSync,
  KeyObject,
  JsonWebKey,
} from "node:crypto";
import { logger } from "./Logger";
import { PrivateKeyInfo } from "./types";

export interface IPublicKeys {
  asJwks(): Array<JsonWebKey>;
}

export interface IPrivateKeys {
  getPrivateKey(keyId?: string): PrivateKeyInfo;
}

export class Keys implements IPublicKeys, IPrivateKeys {
  private _keys: Map<
    string,
    { keyAlg: string; publicKey: KeyObject; privateKey: KeyObject }
  > = new Map();

  public asJwks() {
    return Array.from(this._keys.entries()).map(
      ([id, { keyAlg, publicKey }]) => {
        const jwk = publicKey.export({ format: "jwk" });
        jwk.kid = id;
        jwk.use = "sig";
        jwk.alg = keyAlg;
        return jwk;
      }
    );
  }

  public addPair(
    keyId: string,
    keyAlg: string,
    publicKey: KeyObject,
    privateKey: KeyObject
  ) {
    this._keys.set(keyId, { keyAlg, publicKey, privateKey });
  }

  public getPrivateKey(keyId?: string): PrivateKeyInfo {
    logger.debug({ keyId }, "looking for private key");
    const _keyId = keyId ? keyId : this._keys.keys().next().value;

    const result = this._keys.get(_keyId);
    if (typeof result === "undefined") {
      throw new Error("Private key not found.");
    }

    return {
      keyId: _keyId,
      keyAlg: "ES256",
      privateKey: result.privateKey,
    };
  }

  static createKeyPair() {
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256",
    });
    return {
      keyAlg: "ES256",
      privateKey,
      publicKey,
    };
  }
  
  static createKeyId() {
    return randomBytes(32).toString("hex");
  }
}


