import { EventHandler, EmitterLike, Emitter } from "@pawel-kuznik/iventy";
import { EventHandlerUninstaller } from "@pawel-kuznik/iventy/build/lib/Channel";
import { Collection } from "./CollectionPotential";
import { Entry } from "./Entry";

export class MemoryCollection<TEntry extends Entry = Entry> implements Collection<TEntry> {

    private _fetch: () => Promise<TEntry[]>;
    private _match: (entry: TEntry) => boolean;
    private _outsideEmitter: Emitter;
    private _emitter: Emitter;

    constructor(fetch: () => Promise<TEntry[]>, emitter: Emitter, match: (test: TEntry) => boolean) {
        this._fetch = fetch;
        this._match = match;
        this._outsideEmitter = emitter;
        this._emitter = new Emitter();

        this._outsideEmitter.on('update', event => {
            
            const data = event.data as TEntry;
            if (this._match(data)) this._emitter.trigger("update", data);
        });

        this._outsideEmitter.on('remove', event => {
            
            const data = event.data as TEntry;
            if (this._match(data)) this._emitter.trigger("remove", data);
        });
    }

    all(): Promise<TEntry[]> {
        return this._fetch();
    }

    handle(name: string, callback: EventHandler): EventHandlerUninstaller {
        return this._emitter.handle(name, callback);
    }

    on(name: string, callback: EventHandler): EmitterLike {
        this._emitter.on(name, callback);
        return this;
    }
    
    off(name: string, callback: EventHandler | null): EmitterLike {
        this._emitter.off(name, callback);
        return this;
    }
};
