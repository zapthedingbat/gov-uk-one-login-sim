import TTLCache from "@isaacs/ttlcache"
import { TokenExchange } from "./types"

export interface ITokenExchangeStore{
  set(authCode: string, value: TokenExchange): ITokenExchangeStore
  get(authCode: string): TokenExchange | undefined
}

export class TokenExchangeStore extends TTLCache<string, TokenExchange>{}