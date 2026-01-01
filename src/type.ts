/* eslint-disable camelcase */
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
    protocol: "http" | "https" | "localhost";
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

export interface Badge {
    type: number;
    color1: string;
    color2: string;
    color3: string;
    param: number[];
    flip: boolean;
}
export interface MyUserInfo {
    ok: number;
    _id: string;
    email: string;
    username: string;
    cpu: number;
    badge: Badge;
    password: string;
    notifyPrefs: {
        sendOnline: any;
        errorsInterval: any;
        disabledOnMessages: any;
        disabled: any;
        interval: any;
    };
    gcl: number;
    credits: number;
    lastChargeTime: string;
    lastTweetTime: string;
    github: {
        id: string;
        username: string;
    };
    twitter: {
        username: string;
        followers_count: number;
    };
    cpuShard?: {
        [shardName: string]: number;
    };
}
