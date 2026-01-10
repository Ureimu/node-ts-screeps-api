// authInfo模板文件，在使用test的时候会用到
import { ApiConfig } from "./src/type";

const userData = {
    email: "notMyEmail@abc.com",
    password: "notMyPassword"
};
export const apiConfig: ApiConfig<"signinByPassword"> = {
    authInfo: {
        type: "signinByPassword",
        email: userData.email,
        password: userData.password
    },
    hostInfo: {
        protocol: "localhost",
        port: 21025,
        path: "/",
        hostname: "127.0.0.1"
    }
};
