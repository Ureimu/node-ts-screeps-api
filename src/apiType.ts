export type RawApiType = "signinByPassword" | "signinByToken";
export type RawApiPostData<T extends RawApiType> = T extends "signinByPassword"
    ? { email: string; password: string }
    : T extends "signinByToken"
    ? { token: string }
    : never;

export type RawApiReturnData<T extends RawApiType> = T extends "signinByPassword"
    ? { ok: number; token: string }
    : T extends "signinByToken"
    ? { ok: number; token: string }
    : never;
