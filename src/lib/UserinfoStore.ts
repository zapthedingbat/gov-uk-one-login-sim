import TTLCache from "@isaacs/ttlcache";
import { TestBehaviour, UserinfoData } from "./types";

type UserinfoStoreItem = {
  testBehaviour: TestBehaviour;
  userinfo?: UserinfoData
};

export interface IUserinfoStore {
  set(accessToken: string, value: UserinfoStoreItem): this;
  get(accessToken: string): UserinfoStoreItem | undefined;
}

export class UserinfoStore
  extends TTLCache<string, UserinfoStoreItem>
  implements IUserinfoStore {
    constructor() {
      super({
        ttl: 180000, // 3 mins
      });
    }
  }
