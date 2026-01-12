import * as assert from "assert";

import { officialServerApiConfig } from "../../authInfo";
import { ScreepsApi } from "../../src";
import { writeFileSync } from "fs";
// 上面的userData需要自己在根目录创建，示例参照根目录的authInfoSample.ts
describe("api", () => {
    describe("create api", () => {
        const api = new ScreepsApi(officialServerApiConfig);
        const rawApi = api.rawApi;
        const socket = api.socket;
        it("sign in", async () => {
            const data = await api.auth();
            console.log(data);
        });

        it("is apiConfig stored properly", async () => {
            assert.deepStrictEqual(api.apiConfig, officialServerApiConfig);
        });

        it("test getMemory", async () => {
            const data = await rawApi.getMemory({ shard: "shard3" });
            const name = "memory";
            writeFileSync(`test/data/roomObjects/${name}.json`, JSON.stringify(data, null, 4));
        });

        it("test getMemory by path", async () => {
            const data = await rawApi.getMemory({ path: "creeps", shard: "shard3" });
            const name = "memory-creeps";
            writeFileSync(`test/data/roomObjects/${name}.json`, JSON.stringify(data, null, 4));
        });

        it("test getMemory with invalid path", async () => {
            const data = await rawApi.getMemory({ path: "__path_not_exist", shard: "shard3" });
            const name = "memory-invalid-path";
            writeFileSync(`test/data/roomObjects/${name}.json`, JSON.stringify(data, null, 4));
        });

        it("test postMemory", async () => {
            const data = await rawApi.postMemory({ value: { testValue: 1 }, path: "__test__", shard: "shard3" });
            const name = "post-memory";
            writeFileSync(`test/data/roomObjects/${name}.json`, JSON.stringify(data, null, 4));
        });

        it("test postMemory with modify", async () => {
            const data = await rawApi.postMemory({
                value: { testValue: 2, anotherValue: 3 },
                path: "__test__",
                shard: "shard3"
            });
            const name = "post-memory-modify";
            writeFileSync(`test/data/roomObjects/${name}.json`, JSON.stringify(data, null, 4));
        });
    });
});
