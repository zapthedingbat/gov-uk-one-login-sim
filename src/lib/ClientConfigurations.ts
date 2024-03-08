import { createRemoteJWKSet, importSPKI, JWTVerifyGetKey} from "jose";
import { ClientConfiguration, ClientRegistration } from "./types";

export interface IClientConfigurations {
  get(clientId: string): ClientConfiguration | undefined;
  getIds(): Array<string>;
}

export class ClientConfigurations implements IClientConfigurations {
  private _configs: Map<string, ClientConfiguration>;

  private constructor() {
    this._configs = new Map<string, ClientConfiguration>(); 
  }

  public static async Create(registrations: Array<ClientRegistration>): Promise<IClientConfigurations> {
    const clientConfigurationManager = new ClientConfigurations();
    for (const registration of registrations) {
      await clientConfigurationManager.register(registration);
    }
    return clientConfigurationManager;
  }

  async register(registration: ClientRegistration){
    let getPublicKey: JWTVerifyGetKey;
    if("jwks_uri" in registration){
      registration.jwks_uri
      getPublicKey = createRemoteJWKSet(new URL(registration.jwks_uri));
    } else {
      const publicKey = await importSPKI(registration.public_key, "ES256");
      getPublicKey = () => { return publicKey }
    }
    this._configs.set(registration.client_id, {
      redirect_uris: registration.redirect_uris,
      scopes: registration.scopes,
      client_id: registration.client_id,
      claims: registration.claims,
      getPublicKey
    });
  }

  get(clientId: string): ClientConfiguration | undefined {
    return this._configs.get(clientId);
  }

  getIds(): Array<string>{
    return Array.from(this._configs.keys());
  }
}