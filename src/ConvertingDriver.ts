import { Entry } from "./Entry";
import { StorageDriver } from "./StorageDriver";
import { CollectionPotential } from "./CollectionPotential";
import { EntryPotential } from "./EntryPotential";
import { ConvertingEntryPotential } from "./ConvertingEntryPotential";
import { ConvertingCollectionPotential } from "./ConvertingCollectionPotential";
import { EntryCache } from "./EntryCache";
import { Emitter, EmitterLike, Event, EventHandler, EventHandlerUninstaller } from "@pawel-kuznik/iventy";
import { UpdateEventPayload } from "./UpdateEventPayload";
import { DeleteEventPayload } from "./DeleteEventPayload";

/**
 *  This is a driver that can wrap over another driver to convert
 *  between a user-space entry and a backend-specific data. Mainly,
 *  it is useful when dealing with classes in user space and with
 *  POJOs in the backend side.
 * 
 *  Note that creating instances of classes might be computationally
 *  expensive. If that's the case it's advised to pass a cache instance
 *  to the driver so that fetching instances of entries will not cause
 *  an additional instance construction.
 */
export abstract class ConvertingDriver<TEntry extends Entry = Entry, TData extends Entry = Entry, TFilter extends object = { }>
    implements StorageDriver<TEntry, TFilter>
{
    private _emitter: Emitter = new Emitter();
    private _cache: EntryCache<TEntry> | undefined;
    private _storage: StorageDriver<TData, TFilter>;

    private _onUpdate = async (event: Event<UpdateEventPayload<TData>>) => {

        if (this._cache) this._cache.invalidate(event.data.entry.id);

        const entry = await this.obtain(event.data.entry);
        this._emitter.trigger<UpdateEventPayload<TEntry>>("update", { entry });
    };

    private _onDelete = async (event: Event<DeleteEventPayload<TData>>) => {

        const entry = await this.obtain(event.data.entry);

        if (this._cache) this._cache.invalidate(event.data.entry.id);
        this._emitter.trigger<DeleteEventPayload<TEntry>>("delete", { entry });
    };

    constructor(storage: StorageDriver<TData, TFilter>, cache: EntryCache<TEntry> | undefined = undefined) {
        this._storage = storage;
        this._cache = cache;

        this._storage.on("update", this._onUpdate);
        this._storage.on("delete", this._onDelete);
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

    abstract wrap(input: TData) : Promise<TEntry>;
    abstract process(input: TEntry) : Promise<TData>;

    async fetch(id: string): Promise<TEntry | undefined> {

        if (this._cache) {

            const cached = this._cache.get(id);
            if (cached) return Promise.resolve(cached);
        }

        const data = await this._storage.fetch(id);
        if (data === undefined) return Promise.resolve(undefined);

        return this.wrap(data);
    }

    async insert(input: TEntry): Promise<void> {
        
        const data = await this.process(input);
        if (this._cache) this._cache.store(input);

        // we will remove the update handler for the moment of the update cause
        // we know which entry will be inserterd.  
        this._storage.off("update", this._onUpdate);
        await this._storage.insert(data);
        this._storage.on("update", this._onUpdate);

        this._emitter.trigger<UpdateEventPayload<TEntry>>("update", { entry: input });
    }

    async find(filter?: TFilter | undefined): Promise<TEntry[]> {
        const result = await this._storage.find(filter);
        return Promise.all([ ...result.map(data => this.obtain(data)) ]);
    }

    async update(input: TEntry): Promise<void> {
        
        const data = await this.process(input)
        if (this._cache) this._cache.store(input);

        // we will remove the update handler for the moment of the update cause
        // we know which entry will be inserterd.  
        this._storage.off("update", this._onUpdate);
        await this._storage.update(data);
        this._storage.on("update", this._onUpdate);

        this._emitter.trigger<UpdateEventPayload<TEntry>>("update", { entry: input });
    }

    async delete(input: string | TEntry): Promise<void> {
        
        const data = typeof(input) === 'string' ? input : await this.process(input);
        await this._storage.delete(data);
        if (this._cache) this._cache.invalidate(typeof(data) === 'string' ? data : data.id);
    }

    async insertCollection(input: TEntry[]): Promise<void> {
    
        const data = await Promise.all([...input.map(entry => this.process(entry))]);
        this._storage.off("update", this._onUpdate);
        await this._storage.insertCollection(data);
        this._storage.on("update", this._onUpdate);

        if (this._cache) {
            input.forEach(e => this._cache?.store(e));
        }

        input.forEach(entry => this._emitter.trigger<UpdateEventPayload<TEntry>>("update", { entry }));
    }

    async updateCollection(input: TEntry[]): Promise<void> {
        
        const data = await Promise.all([...input.map(entry => this.process(entry))]);
        this._storage.off("update", this._onUpdate);
        await this._storage.updateCollection(data);
        this._storage.on("update", this._onUpdate);

        if (this._cache) {
            input.forEach(e => this._cache?.store(e));
        }

        input.forEach(entry => this._emitter.trigger<UpdateEventPayload<TEntry>>("update", { entry }));
    }

    async deleteCollection(input: string[] | TEntry[]): Promise<void> {
        
        // nothing to remove?
        if (input.length === 0) return Promise.resolve();

        if (typeof(input[0] === 'string')) {   
            await this._storage.deleteCollection(input as string[]);
        }
        else {

            const data = await Promise.all((input as TEntry[]).map(value => this.process(value)));
            await this._storage.deleteCollection(data);
        }

        if (this._cache) {
            input.forEach(v => this._cache?.invalidate(typeof(v) === "string" ? v : v.id));
        }
    }

    /**
     *  Get a potential of an entry.
     */
    getEntryPotential(id: string): EntryPotential<TEntry> {
        
        const dataPotential = this._storage.getEntryPotential(id);
        return new ConvertingEntryPotential<TEntry, TData>(
            dataPotential,
            (data: TData) => this.obtain(data),
            (entry: TEntry) => this.process(entry)
        ); 
    }

    /**
     *  Get a potential of a collection of an entry.
     */
    getCollectionPotential(filter?: TFilter | undefined): CollectionPotential<TEntry> {
        
        const dataCollection = this._storage.getCollectionPotential(filter);
        return new ConvertingCollectionPotential<TEntry, TData>(
            dataCollection,
            (data: TData) => this.obtain(data),
            (entry: TEntry) => this.process(entry)
        );
    }

    async dispose(): Promise<void> {

        if (this._cache) this._cache.clear();

        this._storage.off("update", this._onUpdate);
        this._storage.off("delete", this._onDelete);

        // @todo should the converting driver dispose of the passed driver?
        return this._storage.dispose();
    }

    private async obtain(input: TData) : Promise<TEntry> {

        if (this._cache) {
            const cached = this._cache.get(input.id);
            if (cached) return Promise.resolve(cached);
        }

        const entity = await this.wrap(input);
        this._cache?.store(entity);
        return entity;
    }
};
