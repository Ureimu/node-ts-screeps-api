import { ScreepsApi } from "index";
import * as assert from "assert";
import { ApiConfig } from "type";
import { userData } from "../../authInfo";
import { resolve } from "path";

describe("api", () => {
    describe("create api", () => {
        const apiConfig: ApiConfig<"signinByPassword"> = {
            authInfo: {
                type: "signinByPassword",
                email: userData.email,
                password: userData.password
            },
            hostInfo: {
                protocol: "https",
                port: 443,
                path: "/",
                hostname: "screeps.com"
            }
        };
        const api = new ScreepsApi(apiConfig);
        it("is apiConfig stored properly", () => {
            assert.deepStrictEqual(api.apiConfig, apiConfig);
        });

        it("sign in", async () => {
            const data = await api.signin();
            console.log(data);
        });

        const testStr = `test${Date.now()}`;
        it("post segment", async () => {
            const data = await api.postSegment({ shard: "shard3", segment: 30, data: testStr });
            console.log(data);
            assert.strictEqual(data.ok, 1);
        });

        it("get segment", async () => {
            const data = await api.getSegment({ shard: "shard3", segment: 30 });
            console.log(data);
            assert.strictEqual(data.data, testStr);
        });
    });
});
