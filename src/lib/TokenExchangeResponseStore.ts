import TTLCache from "@isaacs/ttlcache"
import { TokenExchangeData } from "./types"

export interface ITokenExchangeStore{
  set(authCode: string, value: TokenExchangeData): ITokenExchangeStore
  get(authCode: string): TokenExchangeData | undefined
}

export class TokenExchangeStore extends TTLCache<string, TokenExchangeData>{
  constructor(authCodeExpiry: number) {
    super({
      ttl: authCodeExpiry
    });
  }
}