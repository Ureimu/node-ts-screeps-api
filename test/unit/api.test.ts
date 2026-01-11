import * as assert from "assert";

import { localServerApiConfig } from "../../authInfo";
import { writeFileSync } from "fs";
import { ScreepsApi } from "../../src";
// 上面的userData需要自己在根目录创建，示例参照根目录的authInfoSample.ts
describe("api", () => {
    describe("create api", () => {
        const api = new ScreepsApi(localServerApiConfig);
        const rawApi = api.rawApi;
        const socket = api.socket;
        it("is apiConfig stored properly", () => {
            assert.deepStrictEqual(api.apiConfig, localServerApiConfig);
        });

        it("throw Error when unauthorized", async () => {
            let anErr;
            try {
                await rawApi.postSegment({ segment: 30, data: "test" });
            } catch (err) {
                anErr = err;
                const message = (err as Error).message;
                assert.strictEqual(message, `{"error":"unauthorized"}`);
            }
            if (!anErr) assert.fail("no error was thrown");
        });

        it("test socket", async () => {
            let hasCpu = false;
            if (api.apiConfig.hostInfo.protocol === "localhost") {
                console.log("socket is not usable in private server");
                return;
            }
            await api.auth();
            await socket.connect();
            await socket.subscribe("cpu");
            socket.on("cpu", ev => {
                const event = ev as { data: { cpu: number } };
                console.log(`cpu: ${event.data.cpu}`); // cpu used last tick
                hasCpu = true;
            });
            await new Promise(function (resolve) {
                setInterval(() => {
                    if (hasCpu) {
                        api.socket
                            .unsubscribe("cpu")
                            .then(() => {
                                resolve("done");
                            })
                            .catch(() => void 0);
                    }
                }, 1000);
            });
        });

        it("sign in", async () => {
            const data = await api.auth();
            console.log(data);
        });

        const testStr = `test${Date.now()}`;
        it("post segment", async () => {
            const data = await rawApi.postSegment({ shard: "shard3", segment: 30, data: testStr });
            console.log(data);
            assert.strictEqual(data.ok, 1);
        });

        it("get segment", async () => {
            const data = await rawApi.getSegment({ shard: "shard3", segment: 30 });
            console.log(data);
            assert.strictEqual(data.data, testStr);
        });

        it("get world size", async () => {
            const data = await rawApi.getWorldSize({ shard: "shard3" });
            console.log(data);
            // const name = "test-E34S21";
            // writeFileSync(`test/data/roomObjects/${name}.json`, JSON.stringify(data, null, 4));
        });

        it("get roomObjects", async () => {
            const data = await rawApi.getRoomObjects({ shard: "shard3", room: "E4N1" });
            console.log(data.objects?.[0]?._id);
            // const name = "test-E34S21";
            // writeFileSync(`test/data/roomObjects/${name}.json`, JSON.stringify(data, null, 4));
        });

        it("get highway roomObjects", async () => {
            const data = await rawApi.getRoomObjects({ shard: "shard3", room: "E10N10" });
            console.log(data.objects?.[0]?._id);
            const name = "highway";
            writeFileSync(`test/data/roomObjects/${name}.json`, JSON.stringify(data, null, 4));
        });

        it("get encoded roomTerrain", async () => {
            const data = await rawApi.getEncodedRoomTerrain({ shard: "shard3", room: "E4N1" });
            console.log(data);
        });

        it("get me", async () => {
            const data = await rawApi.me();
            console.log(data);
            const name = "test-me";
            writeFileSync(`test/data/roomObjects/${name}.json`, JSON.stringify(data, null, 4));
        });

        it("test", async () => {
            const data = await rawApi.req("GET", "/api/user/overview", { interval: 8, statName: "energy" });
            console.log(data);
            const name = "test-test";
            writeFileSync(`test/data/roomObjects/${name}.json`, JSON.stringify(data, null, 4));
        });
    });
});
