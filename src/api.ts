import { ApiConfig, AuthType } from "type";

import { RawApiPostData, RawApiReturnData } from "apiType";
import { RawApi } from "rawApi";

export class ScreepsApi<T extends AuthType> {
    public apiConfig: ApiConfig<T>;
    public rawApi: RawApi<T>;
    public constructor(apiConfig: ApiConfig<T>) {
        this.apiConfig = apiConfig;
        this.rawApi = new RawApi(apiConfig);
    }
    public async signin(): Promise<RawApiReturnData<"signinByPassword" | "signinByToken">> {
        const rawData = await this.rawApi.signin(this.apiConfig.authInfo);
        this.rawApi.xToken = rawData.token;
        return rawData;
    }
    public async getSegment(args: RawApiPostData<"getSegment">): Promise<RawApiReturnData<"getSegment">> {
        return await this.rawApi.getSegment(args);
    }
    public async postSegment(args: RawApiPostData<"postSegment">): Promise<RawApiReturnData<"postSegment">> {
        return await this.rawApi.postSegment(args);
    }
}
