import { EventHandler, EmitterLike, Emitter, Event, EventHandlerUninstaller } from "@pawel-kuznik/iventy";
import { Entry } from "./Entry";
import { EntryPotential } from "./EntryPotential";
import { UpdateEventPayload } from "./UpdateEventPayload";
import { DeleteEventPayload } from "./DeleteEventPayload";

export class MemoryEntryPotential<TEntry extends Entry = Entry> implements EntryPotential<TEntry> {

    private _fetch: () => Promise<TEntry|undefined>;
    private _update: (update: TEntry) => Promise<void>;
    private _remove: () => Promise<void>;
    private _outsideEmitter: Emitter;
    private _emitter: Emitter = new Emitter();
    private _match: (entry: TEntry|string) => boolean;

    constructor(fetch: () => Promise<TEntry|undefined>, update: (update:TEntry) => Promise<void>, remove: () =>Promise<void>, emitter: Emitter, match: (entry: TEntry|string) => boolean) {

        this._fetch = fetch;
        this._update = update;
        this._remove = remove;
        this._outsideEmitter = emitter;
        this._match = match;

        this._outsideEmitter.on("update", (event: Event<UpdateEventPayload<TEntry>>) => {

            const entry = event.data.entry;
            if (!this._match(entry)) return;

            this._emitter.trigger<UpdateEventPayload<TEntry>>("update", event.data);
        });

        this._outsideEmitter.on("delete", (event: Event<DeleteEventPayload<TEntry>>) => {

            const entry = event.data.entry;
            if (!this._match(entry)) return;

            this._emitter.trigger<DeleteEventPayload<TEntry>>("delete", { entry });
        });
    }

    fetch(): Promise<TEntry|undefined> {

        return this._fetch();
    }

    update(entry: TEntry): Promise<void> {
        
        return this._update(entry);
    }

    delete(): Promise<void> {
        
        return this._remove();
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
