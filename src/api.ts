import { ApiConfig, AuthType } from "type";

import { RawApiReturnData } from "apiType";
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
}
