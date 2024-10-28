import { EventHandler, EmitterLike, Emitter } from "@pawel-kuznik/iventy";
import { EventHandlerUninstaller } from "@pawel-kuznik/iventy/build/lib/Channel";
import { CollectionPotential } from "./CollectionPotential";
import { Entry } from "./Entry";

/**
 *  This is an implementation of the collection potential for converting driver.
 *  Essentially, it will make sure that we have a collection potential that is
 *  able to serve converted entities.
 */
export class ConvertingCollectionPotential<TEntry extends Entry = Entry, TData extends Entry = Entry> implements CollectionPotential<TEntry> {

    private _collection: CollectionPotential<TData>;

    private _wrap: (input: TData) => Promise<TEntry>;
    private _process: (input:TEntry) => Promise<TData>;

    private _emitter: Emitter = new Emitter();

    constructor(dataCollection: CollectionPotential<TData>, wrap: (input: TData) => Promise<TEntry>, process: (input:TEntry) => Promise<TData>) {
        this._collection = dataCollection;
        this._wrap = wrap;
        this._process = process;

        this._collection.on('update', async event => {

            const entry = await this._wrap(event.data);
            this._emitter.trigger('update', entry);
        });

        this._collection.on('delete', async event => {

            const entry = await this._wrap(event.data);
            this._emitter.trigger('delete', entry);
        });
    }

    all(): Promise<TEntry[]> {
        return this._collection.all().then(dataEntries => {
            return Promise.all(dataEntries.map(e => this._wrap(e)));
        });
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
