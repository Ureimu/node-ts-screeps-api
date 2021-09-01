/* eslint-disable no-underscore-dangle */
import { ApiConfig, AuthType, MyUserInfo } from "type";

import { RawApiPostData, RawApiReturnData } from "apiType";
import { RawApi } from "rawApi";
import { Socket } from "socket";

export class ScreepsApi<T extends AuthType> {
    public apiConfig: ApiConfig<T>;
    public rawApi: RawApi<T>;
    public myUserInfo?: MyUserInfo;
    public myTokenInfo?: { token?: string; full?: boolean };
    public socket: Socket;
    public constructor(apiConfig: ApiConfig<T>) {
        this.apiConfig = apiConfig;
        this.rawApi = new RawApi(apiConfig);
        this.socket = new Socket(this);
    }
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

    public async tokenInfo(): Promise<{ token?: string; full?: boolean }> {
        if (this.myTokenInfo) {
            return this.myTokenInfo;
        }
        if (this.rawApi.xToken) {
            const { token } = await this.rawApi.queryToken(this.rawApi.xToken);
            this.myTokenInfo = { token };
        } else {
            this.myTokenInfo = { full: true };
        }
        return this.myTokenInfo;
    }

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
    public async signin(): Promise<RawApiReturnData<"signinByPassword" | "signinByToken">> {
        const rawData = await this.rawApi.signin(this.apiConfig.authInfo);
        this.rawApi.xToken = rawData.token;
        return rawData;
    }
    /**
     * 获取segment内容
     *
     * @param {RawApiPostData<"getSegment">} args
     * @returns {Promise<RawApiReturnData<"getSegment">>}
     * @memberof ScreepsApi
     */
    public async getSegment(args: RawApiPostData<"getSegment">): Promise<RawApiReturnData<"getSegment">> {
        return await this.rawApi.getSegment(args);
    }
    /**
     * 发送内容到segment
     *
     * @param {RawApiPostData<"postSegment">} args
     * @returns {Promise<RawApiReturnData<"postSegment">>}
     * @memberof ScreepsApi
     */
    public async postSegment(args: RawApiPostData<"postSegment">): Promise<RawApiReturnData<"postSegment">> {
        return await this.rawApi.postSegment(args);
    }
}
