import { EventHandler, Event, EmitterLike, Emitter, EventHandlerUninstaller } from "@pawel-kuznik/iventy";
import { CollectionPotential } from "./CollectionPotential";
import { Entry } from "./Entry";
import { UpdateEventPayload } from "./UpdateEventPayload";
import { DeleteEventPayload } from "./DeleteEventPayload";

export class MemoryCollectionPotential<TEntry extends Entry = Entry> implements CollectionPotential<TEntry> {

    private _fetch: () => Promise<TEntry[]>;
    private _match: (entry: TEntry) => boolean;
    private _outsideEmitter: Emitter;
    private _emitter: Emitter;

    constructor(fetch: () => Promise<TEntry[]>, emitter: Emitter, match: (test: TEntry) => boolean) {
        this._fetch = fetch;
        this._match = match;
        this._outsideEmitter = emitter;
        this._emitter = new Emitter();

        this._outsideEmitter.on('update', (event: Event<UpdateEventPayload<TEntry>>) => {
            
            const entry = event.data.entry;
            if (this._match(entry)) this._emitter.trigger<UpdateEventPayload<TEntry>>("update", { entry });
        });

        this._outsideEmitter.on('delete', (event: Event<DeleteEventPayload<TEntry>>) => {
            
            const entry = event.data.entry;
            if (this._match(entry)) this._emitter.trigger<DeleteEventPayload<TEntry>>("delete", { entry });
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
