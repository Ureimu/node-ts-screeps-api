export interface ApiConfig<T extends AuthType> {
    authInfo: AuthInfo<T>;
    hostInfo: HostInfo;
}

export type AuthInfo<T extends AuthType> = T extends "signinByToken"
    ? {
          type: T;
          token: string;
      }
    : { type: T; email: string; password: string };

export interface HostInfo {
    protocol: "http" | "https";
    hostname: string;
    port: number;
    path: string;
}

export type AuthType = "signinByToken" | "signinByPassword";
export type BasicRequestMethod = "GET" | "POST";
export interface RequestOpts {
    params?: Record<string, unknown>;
    data?: Record<string, unknown>;
    method: BasicRequestMethod;
    url: string;
    path?: string;
    xToken?: string;
    headers: Record<string, unknown>;
}
