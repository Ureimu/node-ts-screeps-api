import { Badge } from "../type";

export interface RoomObjectReturn {
    ok: 1;
    objects: AnyRoomObjects[];
    user: { [name: string]: { _id: string; username: string; badge: Badge } };
}
export type AnyRoomObjects = Source | Mineral | Controller;
export type RoomObjectType = "source" | "mineral" | "controller";
export interface BasicRoomObject {
    x: number;
    y: number;
    type: RoomObjectType;
    _id: string;
    room: string;
}

export interface Source extends BasicRoomObject {
    type: "source";
    energy: number;
    energyCapacity: number;
    ticksToRegeneration: number;
    invaderHarvested: number;
    nextRegenerationTime: number;
}
export interface Mineral extends BasicRoomObject {
    type: "mineral";
    mineralType: string;
    mineralAmount: number;
}
export interface Controller extends BasicRoomObject {
    type: "controller";
    level?: number;
    /**
     * 占领了该controller的玩家id
     *
     * @type {string}
     * @memberof Controller
     */
    user?: string;
    /**
     * 升级进度
     *
     * @type {number}
     * @memberof Controller
     */
    progress: number;
    /**
     * 将要在什么时候降级
     *
     * @type {number}
     * @memberof Controller
     */
    downgradeTime: number;
    /**
     * 上次启用的时间
     *
     * @type {number}
     * @memberof Controller
     */
    safeMode: number;
    /**
     * 可用次数
     *
     * @type {number}
     * @memberof Controller
     */
    safeModeAvailable: number;
}
