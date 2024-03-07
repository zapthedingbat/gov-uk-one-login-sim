import {
  randomBytes,
  generateKeyPairSync,
  KeyObject,
  JsonWebKey,
  createPublicKey,
  createPrivateKey,
} from "node:crypto";
import { PrivateKeyInfo } from "./types";
import { readFile, writeFile } from "node:fs/promises";

export interface IPublicKeyStore {
  asJwks(): Array<JsonWebKey>;
}

export interface IPrivateKeyStore {
  getPrivateKey(keyId?: string): PrivateKeyInfo;
}

export type KeyPair = { keyAlg: string; publicKey: KeyObject; privateKey: KeyObject }

export class KeyStore implements IPublicKeyStore, IPrivateKeyStore {
  private _keys: Map<
    string,
    KeyPair
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

  static createKeyPair():KeyPair {
    const { privateKey, publicKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256",
    });
    return {
      keyAlg: "ES256",
      privateKey,
      publicKey,
    };
  }

  static async writeKeyPairFile(privateKeyFilePath: string, pair: KeyPair){
    await writeFile(privateKeyFilePath, pair.privateKey.export({
      format: "pem",
      type: "pkcs8"
    }));
  }
  
  static async readKeyPairFile(privateKeyFilePath: string): Promise<KeyPair | undefined>{
    let privateKeyPem;
    try{
      privateKeyPem = await readFile(privateKeyFilePath);
    } catch (e) {
      return undefined;
    }
    const publicKey = createPublicKey(privateKeyPem);
    const privateKey = createPrivateKey(privateKeyPem);
    return {
      keyAlg: "ES256",
      publicKey,
      privateKey,
    }
  }

  static createKeyId() {
    return randomBytes(32).toString("hex");
  }
}


