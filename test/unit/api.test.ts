import { ScreepsApi } from "index";
import * as assert from "assert";
import { ApiConfig } from "type";
import { userData } from "../../authInfo";
// 上面的userData需要自己在根目录创建，示例参照根目录的authInfoSample.ts
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

        it("throw Error when unauthorized", async () => {
            let anErr;
            try {
                await api.postSegment({ shard: "shard3", segment: 30, data: "test" });
            } catch (err) {
                anErr = err;
                const message = (err as Error).message;
                assert.strictEqual(message, `{"error":"unauthorized"}`);
            }
            if (!anErr) assert.fail("no error was thrown");
        });

        it("test socket", async () => {
            let hasCpu = false;

            await api.signin();
            await api.socket.connect();
            await api.socket.subscribe("cpu");
            api.socket.on("cpu", ev => {
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
