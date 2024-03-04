import TTLCache from "@isaacs/ttlcache";
import { Userinfo } from "./types";

export interface IUserinfoStore {
  set(accessToken: string, value: Userinfo): this;
  get(accessToken: string): Userinfo | undefined;
}

export class UserinfoStore
  extends TTLCache<string, Userinfo>
  implements IUserinfoStore {}
