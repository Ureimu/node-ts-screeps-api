import { ApiConfig, AuthType, MyUserInfo } from "./type";

import { RawApiReturnData } from "./apiType";
import { RawApi } from "./rawApi";
import { Socket } from "./socket";

export class ScreepsApi<T extends AuthType> {
    public apiConfig: ApiConfig<T>;
    public rawApi: RawApi<T>;
    public socket: Socket;
    public myUserInfo?: MyUserInfo;
    public myTokenInfo?: { token?: string; full?: boolean };

    public constructor(apiConfig: ApiConfig<T>) {
        this.apiConfig = apiConfig;
        this.rawApi = new RawApi(apiConfig);
        this.socket = new Socket(this);
    }

    /**
     * 获取账号信息
     *
     * @returns {Promise<MyUserInfo>}
     * @memberof ScreepsApi
     */
    public async me(): Promise<MyUserInfo> {
        if (this.myUserInfo) return this.myUserInfo;
        const tokenInfo = await this.tokenInfo();
        if (tokenInfo.full) {
            this.myUserInfo = await this.rawApi.me();
        } else {
            const { username } = await this.rawApi.myName();
            const { user } = await this.rawApi.findUser(username);
            this.myUserInfo = user as MyUserInfo;
        }
        return this.myUserInfo;
    }

    /**
     * 获取webSocket会用到的token
     *
     * @returns {Promise<{ token?: string; full?: boolean }>}
     * @memberof ScreepsApi
     */
    public async tokenInfo(): Promise<{ token?: string; full?: boolean }> {
        if (this.myTokenInfo) {
            return this.myTokenInfo;
        }
        if (this.rawApi.xToken) {
            const { token } = await this.rawApi.queryToken({ token: this.rawApi.xToken });
            this.myTokenInfo = { token };
        } else {
            this.myTokenInfo = { full: true };
        }
        return this.myTokenInfo;
    }

    /**
     * 获取用户id
     *
     * @returns {Promise<string>}
     * @memberof ScreepsApi
     */
    public async userID(): Promise<string> {
        const user = await this.me();
        return user._id;
    }

    /**
     * 登录获取x-token。
     *
     * @returns {(Promise<RawApiReturnData<"signinByPassword" | "signinByToken">>)}
     * @memberof ScreepsApi
     */
    public async auth(): Promise<RawApiReturnData<"signinByPassword" | "signinByToken">> {
        const rawData = await this.rawApi.auth();
        this.rawApi.xToken = rawData.token;
        return rawData;
    }
}
