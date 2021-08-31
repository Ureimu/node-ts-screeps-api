export type RawApiType = "signinByPassword" | "signinByToken" | "getSegment" | "postSegment";
export type RawApiPostData<T extends RawApiType> = T extends "signinByPassword"
    ? { email: string; password: string }
    : T extends "signinByToken"
    ? { token: string }
    : T extends "getSegment"
    ? { shard: string; segment: number }
    : T extends "postSegment"
    ? { shard: string; segment: number; data: string }
    : never;

export type RawApiReturnData<T extends RawApiType> = T extends "signinByPassword"
    ? { ok: number; token: string }
    : T extends "signinByToken"
    ? { ok: number; token: string }
    : T extends "getSegment"
    ? { ok: number; data: string }
    : T extends "postSegment"
    ? { ok: number; data: string }
    : never;
