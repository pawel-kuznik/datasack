import { EventHandler, EmitterLike, Emitter } from "@pawel-kuznik/iventy";
import { EventHandlerUninstaller } from "@pawel-kuznik/iventy/build/lib/Channel";
import { Entry } from "./Entry";
import { EntryPotential } from "./EntryPotential";

export class ConvertingEntryPotential<TEntry extends Entry = Entry, TData extends Entry = Entry> implements EntryPotential<TEntry> {

    private _entry: EntryPotential<TData>;

    private _wrap: (input: TData) => Promise<TEntry>;
    private _process: (input:TEntry) => Promise<TData>;

    private _emitter: Emitter = new Emitter();

    constructor(dataEntry: EntryPotential<TData>, wrap: (input: TData) => Promise<TEntry>, process: (input:TEntry) => Promise<TData>) {
        this._entry = dataEntry;
        this._wrap = wrap;
        this._process = process;

        this._entry.on('update', async event => {

            const entry = await this._wrap(event.data);
            this._emitter.trigger('update', entry);
        });

        this._entry.on('delete', async event => {

            const entry = await this._wrap(event.data);
            this._emitter.trigger('delete', entry);
        });
    }
    
    /**
     *  Fetch the actual entry.
     */
    fetch() : Promise<TEntry|undefined> {
        return this._entry.fetch().then(data => data === undefined ? undefined : this._wrap(data));
    }

    /**
     *  Update the entry with new data.
     */
    update(entry: TEntry) : Promise<void> {
        return this._process(entry).then(data => this._entry.update(data));
    }
 
    /**
     *  Detelet the entry.
     */
    delete() : Promise<void> {
        return this._entry.delete();
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
