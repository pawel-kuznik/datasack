import { Entry } from "./Entry";
import { StorageDriver } from "./StorageDriver";
import { CollectionPotential } from "./CollectionPotential";
import { EntryPotential } from "./EntryPotential";
import { ConvertingEntryPotential } from "./ConvertingEntryPotential";
import { ConvertingCollectionPotential } from "./ConvertingCollectionPotential";

/**
 *  This is a driver that can wrap over another driver to convert
 *  between a user-space entry and a backend-specific data. Mainly,
 *  it is useful when dealing with classes in user space and with
 *  POJOs in the backend side.
 */
export abstract class ConvertingDriver<TEntry extends Entry = Entry, TData extends Entry = Entry, TFilter extends object = { }> implements StorageDriver<TEntry, TFilter> {

    private _storage: StorageDriver<TData, TFilter>;

    constructor(storage: StorageDriver<TData, TFilter>) {
        this._storage = storage;
    }

    abstract wrap(input: TData) : Promise<TEntry>;
    abstract process(input: TEntry) : Promise<TData>;

    async fetch(id: string): Promise<TEntry | undefined> {

        const data = await this._storage.fetch(id);
        if (data === undefined) return Promise.resolve(undefined);

        return this.wrap(data);
    }

    async insert(input: TEntry): Promise<void> {

        const data = await this.process(input);
        return this._storage.insert(data);
    }

    async find(filter?: TFilter | undefined): Promise<TEntry[]> {

        const result = await this._storage.find(filter);
        return Promise.all([ ...result.map(data => this.wrap(data)) ]);
    }

    async update(input: TEntry): Promise<void> {
        
        return this.process(input).then(data => this._storage.update(data));
    }

    async delete(input: string | TEntry): Promise<void> {
        
        const data = typeof(input) === 'string' ? input : await this.process(input);
        return this._storage.delete(data);
    }

    async insertCollection(input: TEntry[]): Promise<void> {
    
        const data = await Promise.all([...input.map(entry => this.process(entry))]);
        return this._storage.insertCollection(data);
    }

    async updateCollection(input: TEntry[]): Promise<void> {
        
        const data = await Promise.all([...input.map(entry => this.process(entry))]);
        return this._storage.updateCollection(data);
    }

    async deleteCollection(input: string[] | TEntry[]): Promise<void> {
        
        if (input.length === 1) return Promise.resolve();

        if (typeof(input[0] === 'string')) {   
            return this._storage.deleteCollection(input as string[]);
        }
        else {

            const data = await Promise.all((input as TEntry[]).map(value => this.process(value)));
            return this._storage.deleteCollection(data);
        }
    }

    /**
     *  Get a potential of an entry.
     */
    getEntryPotential(id: string): EntryPotential<TEntry> {
        
        const dataPotential = this._storage.getEntryPotential(id);
        return new ConvertingEntryPotential<TEntry, TData>(
            dataPotential,
            (data: TData) => this.wrap(data),
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
            (data: TData) => this.wrap(data),
            (entry: TEntry) => this.process(entry)
        );
    }

    async dispose(): Promise<void> {

        // @todo should the converting driver dispose of the passed driver?
        return this._storage.dispose();
    }
};
