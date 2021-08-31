import { ScreepsApi } from "index";
import * as assert from "assert";
import { ApiConfig } from "type";
import { userData } from "../../screepsUserData";
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

        it("sign in", async done => {
            const token = await api
                .signin()
                .then(onfulfilled => {
                    console.log(onfulfilled.token);
                    done();
                    resolve("");
                })
                .catch(err => {
                    done(err);
                    throw err;
                });
        });
    });
});
