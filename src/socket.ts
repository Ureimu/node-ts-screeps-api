/* eslint-disable @typescript-eslint/prefer-regexp-exec */
import { EventEmitter } from "events";
import WebSocket from "ws";
import { URL } from "url";
const debug = console.log;
import { ScreepsApi } from "./api";
import { AuthType } from "./type";
const DEFAULTS = {
    reconnect: true,
    resubscribe: true,
    keepAlive: true,
    maxRetries: 10,
    maxRetryDelay: 60 * 1000 // in mill-seconds
};

export class Socket extends EventEmitter {
    public api: ScreepsApi<AuthType>;
    public opts: typeof DEFAULTS;
    public authed = false;
    public connected = false;
    public reconnecting = false;
    public keepAliveInter?: NodeJS.Timeout;
    public __queue: string[] = []; // pending messages  (to send once authenticated)
    public __subQueue: string[] = []; // pending subscriptions (to request once authenticated)
    public __subs: Record<string, number> = {}; // number of callbacks for each subscription
    public ws?: WebSocket;
    public constructor(api: ScreepsApi<AuthType>) {
        super();
        this.api = api;
        this.opts = Object.assign({}, DEFAULTS);
        this.on("error", () => {
            const a = 1;
        }); // catch to prevent unhandled-exception errors
        this.reset();
        this.on("auth", ev => {
            const event = ev as { data: { status?: "ok" } };
            if (event.data.status === "ok") {
                while (this.__queue.length) {
                    this.emit(this.__queue.shift() as string);
                }
                if (this.keepAliveInter) clearInterval(this.keepAliveInter);
                if (this.opts.keepAlive) {
                    this.keepAliveInter = setInterval(() => this.ws && this.ws.ping(1), 10000);
                }
            }
        });
    }
    public reset(): void {
        this.authed = false;
        this.connected = false;
        this.reconnecting = false;
        if (this.keepAliveInter) clearInterval(this.keepAliveInter);
        this.keepAliveInter = undefined;
        this.__queue = []; // pending messages  (to send once authenticated)
        this.__subQueue = []; // pending subscriptions (to request once authenticated)
        this.__subs = {}; // number of callbacks for each subscription
    }

    public async connect(opts = {}): Promise<void> {
        Object.assign(this.opts, opts);
        if (!this.api.rawApi.xToken) {
            throw new Error("No token! Call api.auth() before connecting the socket!");
        }
        return new Promise((resolve, reject) => {
            if (!this.api.rawApi.opts?.url) return;
            const baseURL = this.api.rawApi.opts.url.replace("http", "ws");
            const wsUrl = new URL("socket/websocket", baseURL);
            this.ws = new WebSocket(wsUrl);
            this.ws.on("open", () => {
                this.connected = true;
                this.reconnecting = false;
                if (this.opts.resubscribe) {
                    this.__subQueue.push(...Object.keys(this.__subs));
                }
                debug("connected");
                this.emit("connected");
                resolve(this.auth(this.api.rawApi.xToken as string) as unknown as void);
            });
            this.ws.on("close", () => {
                clearInterval(this.keepAliveInter as unknown as NodeJS.Timeout);
                this.authed = false;
                this.connected = false;
                debug("disconnected");
                this.emit("disconnected");
                if (this.opts.reconnect) {
                    this.reconnect().catch(() => {
                        /* error emitted in reconnect() */
                    });
                }
            });

            this.ws.on("error", err => {
                if (!this.ws) return;
                this.ws.terminate();
                this.emit("error", err);
                debug(`error ${err.message}`);
                if (!this.connected) {
                    reject(err);
                }
            });
            this.ws.on("unexpected-response", (req, res) => {
                const err = new Error(
                    `WS Unexpected Response: ${res.statusCode as number} ${res.statusMessage as string}`
                );
                this.emit("error", err);
                reject(err);
            });
            this.ws.on("message", data => void this.handleMessage(data.toString()));
        });
    }

    public async reconnect(): Promise<void> {
        if (this.reconnecting) {
            return;
        }
        this.reconnecting = true;
        let retries = 0;
        let retry;
        do {
            let time = Math.pow(2, retries) * 100;
            if (time > this.opts.maxRetryDelay) time = this.opts.maxRetryDelay;
            await this.sleep(time);
            if (!this.reconnecting) return; // reset() called in-between
            try {
                await this.connect();
                retry = false;
            } catch (err) {
                retry = true;
            }
            retries++;
            debug(`reconnect ${retries}/${this.opts.maxRetries}`);
        } while (retry && retries < this.opts.maxRetries);
        if (retry) {
            const err = new Error(`Reconnection failed after ${this.opts.maxRetries} retries`);
            this.reconnecting = false;
            debug("reconnect failed");
            this.emit("error", err);
            throw err;
        } else {
            // Resume existing subscriptions on the new socket
            Object.keys(this.__subs).forEach(sub => void this.subscribe(sub));
        }
    }

    public disconnect(): void {
        debug("disconnect");
        if (this.keepAliveInter) clearInterval(this.keepAliveInter);
        if (!this.ws) return;
        this.ws.removeAllListeners(); // remove listeners first or we may trigger reconnection & Co.
        this.ws.terminate();
        this.reset();
        this.emit("disconnected");
    }

    public sleep(time: number): Promise<unknown> {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, time);
        });
    }

    public async handleMessage(msg: string): Promise<void> {
        if ((msg as unknown as { data: string }).data) msg = (msg as unknown as { data: string }).data; // Handle ws/browser difference
        if (msg.slice(0, 3) === "gz:") {
            msg = await this.api.rawApi.inflate(msg);
        }
        debug(`message ${msg}`);
        if (msg[0] === "[") {
            const msgList: string[] = JSON.parse(msg) as string[];
            // eslint-disable-next-line prefer-const
            let [, type, id, channel] = msgList[0].match(/^(.+):(.+?)(?:\/(.+))?$/) as RegExpMatchArray;
            channel = channel || type;
            const event = { channel, id, type, data: msgList[1] };
            this.emit(msgList[0], event);
            this.emit(event.channel, event);
            this.emit("message", event);
        } else {
            const [channel, ...data] = msg.toString().split(" ");
            const event: { type: "server"; channel: string; data: string[] | { status?: string; token?: string } } = {
                type: "server",
                channel,
                data
            };
            if (channel === "auth") {
                event.data = { status: data[0], token: data[1] };
            }
            if (["protocol", "time", "package"].includes(channel)) {
                event.data = { [channel]: data[0] };
            }
            this.emit(channel, event);
            this.emit("message", event);
        }
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async gzip(bool: boolean): Promise<void> {
        await this.send(`gzip ${bool ? "on" : "off"}`);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async send(data: string): Promise<void> {
        if (!this.connected) {
            this.__queue.push(data);
        } else {
            if (!this.ws) throw new Error();
            this.ws.send(data);
        }
    }

    public auth(token: string): Promise<void> {
        return new Promise((resolve, reject) => {
            void this.send(`auth ${token}`);
            this.once("auth", ev => {
                const event = ev as { data: { status?: "ok"; token?: string } };
                const { data } = event;
                if (data.status === "ok") {
                    this.authed = true;
                    this.emit("token", data.token);
                    this.emit("authed");
                    while (this.__subQueue.length) {
                        void this.send(this.__subQueue.shift() as string);
                    }
                    resolve();
                } else {
                    reject(new Error("socket auth failed"));
                }
            });
        });
    }

    public async subscribe(path: string, cb?: (...args: unknown[]) => unknown): Promise<void> {
        if (!path) return;
        const userID = await this.api.userID();

        if (!path.match(/^(\w+):(.+?)$/)) {
            path = `user:${userID}/${path}`;
        }
        if (this.authed) {
            await this.send(`subscribe ${path}`);
        } else {
            this.__subQueue.push(`subscribe ${path}`);
        }
        debug(`subscribe ${path} succeed`);
        this.emit("subscribe", path);
        this.__subs[path] = this.__subs[path] || 0;
        this.__subs[path]++;
        if (cb) this.on(path, cb);
    }

    public async unsubscribe(path: string): Promise<void> {
        if (!path) return;
        const userID = await this.api.userID();
        if (!path.match(/^(\w+):(.+?)$/)) {
            path = `user:${userID}/${path}`;
        }
        void this.send(`unsubscribe ${path}`);
        this.emit("unsubscribe", path);
        if (this.__subs[path]) this.__subs[path]--;
    }
}
