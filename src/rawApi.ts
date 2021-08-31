import { RawApiPostData, RawApiReturnData } from "apiType";
import axios, { AxiosInstance } from "axios";
import { promisify } from "util";
import { gunzip } from "zlib";
import { ApiConfig, AuthType, BasicRequestMethod, RequestOpts } from "type";
const gunzipAsync = promisify(gunzip);
export class RawApi<T extends AuthType> {
    public apiConfig: ApiConfig<T>;
    public xToken?: string;
    private http?: AxiosInstance;
    private opts?: Partial<RequestOpts>;
    private baseUrl: string;
    public constructor(apiConfig: ApiConfig<T>) {
        this.apiConfig = apiConfig;
        const { protocol, hostname, path } = this.apiConfig.hostInfo;
        this.baseUrl = `${protocol}://${hostname}${path}`;
    }

    private setServer(opts: RequestOpts): void {
        if (!this.opts) {
            this.opts = {};
        }
        Object.assign(this.opts, opts);
        const xToken = opts.xToken;
        if (xToken) {
            this.xToken = xToken;
        }
        this.http = axios.create({
            baseURL: this.opts.url
        });
    }
    private async gz<T>(data: string): Promise<T> {
        const buf = Buffer.from(data.slice(3), "base64");
        const ret = (await gunzipAsync(buf)) as { toString: () => string };
        return JSON.parse(ret.toString()) as T;
    }
    private async req(method: BasicRequestMethod, path: string, body = {}): Promise<Record<string, unknown>> {
        const opts: RequestOpts = {
            method,
            url: path,
            headers: {}
        };
        if (this.xToken) {
            Object.assign(opts.headers, {
                "X-Token": this.xToken,
                "X-Username": this.xToken
            });
        }
        if (method === "GET") {
            opts.params = body;
        } else {
            opts.data = body;
        }
        try {
            if (!this.http) throw new Error("no server");
            const res: { data: { data: string }; headers: { "x-token": string } } = await this.http(opts);
            const token = res.headers["x-token"];
            if (token) {
                this.xToken = token;
            }
            if (typeof res.data.data === "string" && res.data.data.slice(0, 3) === "gz:") {
                res.data.data = await this.gz(res.data.data);
            }
            return res.data;
        } catch (err) {
            if ((err as { response: any }).response) {
                throw new Error(((err as { response: any }).response as { data: any }).data);
            }
            throw err;
        }
    }

    public async signin(
        args: RawApiPostData<"signinByPassword" | "signinByToken">
    ): Promise<RawApiReturnData<"signinByPassword">> {
        const method = "POST";
        this.setServer({ method, url: this.baseUrl, headers: {} });
        return this.req(method, "/api/auth/signin", args) as Promise<
            RawApiReturnData<"signinByPassword" | "signinByToken">
        >;
    }

    public async getSegment(args: RawApiPostData<"getSegment">): Promise<RawApiReturnData<"getSegment">> {
        const method = "GET";
        this.setServer({ method, url: this.baseUrl, headers: {} });
        return this.req(method, "/api/user/memory-segment", args) as Promise<RawApiReturnData<"getSegment">>;
    }

    public async postSegment(args: RawApiPostData<"postSegment">): Promise<RawApiReturnData<"postSegment">> {
        const method = "POST";
        this.setServer({ method, url: this.baseUrl, headers: {} });
        return this.req(method, "/api/user/memory-segment", args) as Promise<RawApiReturnData<"postSegment">>;
    }
}
