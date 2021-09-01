/* eslint-disable camelcase */
import { RawApiPostData, RawApiReturnData } from "apiType";
import axios, { AxiosInstance } from "axios";
import { promisify } from "util";
import { gunzip, inflate } from "zlib";
import { ApiConfig, AuthType, Badge, BasicRequestMethod, MyUserInfo, RequestOpts } from "type";

const gunzipAsync = promisify(gunzip);
const inflateAsync = promisify(inflate);
export class RawApi<T extends AuthType> {
    public apiConfig: ApiConfig<T>;
    public xToken?: string;
    private http?: AxiosInstance;
    public opts?: Partial<RequestOpts>;
    private baseUrl: string;
    public constructor(apiConfig: ApiConfig<T>) {
        this.apiConfig = apiConfig;
        const { protocol, hostname, path } = this.apiConfig.hostInfo;
        this.baseUrl = `${protocol}://${hostname}${path}`;
    }

    private setServer(opts: Partial<RequestOpts>): void {
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
    private async req<T>(method: BasicRequestMethod, path: string, body = {}, headers = {}): Promise<T> {
        this.setServer({ method, url: this.baseUrl, headers });
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
            return res.data as unknown as T;
        } catch (err) {
            if ((err as { response: any }).response) {
                throw new Error(JSON.stringify(((err as { response: any }).response as { data: any }).data));
            }
            throw err;
        }
    }

    public async inflate(data: string): Promise<string> {
        const buf = Buffer.from(data.slice(3), "base64");
        const ret = (await inflateAsync(buf)) as Buffer;
        return JSON.parse(ret.toString()) as string;
    }

    public async signin(
        args: RawApiPostData<"signinByPassword" | "signinByToken">
    ): Promise<RawApiReturnData<"signinByPassword">> {
        return this.req("POST", "/api/auth/signin", args);
    }

    public async getSegment(args: RawApiPostData<"getSegment">): Promise<RawApiReturnData<"getSegment">> {
        return this.req("GET", "/api/user/memory-segment", args);
    }

    public async postSegment(args: RawApiPostData<"postSegment">): Promise<RawApiReturnData<"postSegment">> {
        return this.req("POST", "/api/user/memory-segment", args);
    }

    public async findUser(username: string): Promise<{
        ok: number;
        user: {
            _id: string;
            username: string;
            badge: Badge;
            gcl: number;
        };
    }> {
        return this.req("GET", "/api/user/find", { username });
    }

    public async me(): Promise<MyUserInfo> {
        return this.req("GET", "/api/auth/me");
    }

    public async queryToken(token: string): Promise<{ token: string }> {
        return this.req("GET", "/api/auth/query-token", { token });
    }

    /**
     * GET /api/user/name
     * @returns {Object}
     */
    public async myName(): Promise<{ username: string }> {
        return this.req("GET", "/api/user/name");
    }
}
