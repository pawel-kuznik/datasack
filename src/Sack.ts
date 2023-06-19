import { v4 as uuid } from "uuid";
import { Entry } from "./Entry";
import { StorageDriver } from "./StorageDriver";

/**
 *  This is a class representing a certain group of data. The elements in the group should
 *  be objects.
 * 
 *  @event  update  This event rises when an entry was updated (or inserted) inside the sack.
 *                  The data will contain the whole entry.
 *  @event  remove  This event rises when an entry was removed from the sack. The data
 *                  will contain an id with the removed entry.
 */
export class Sack<TEntry extends Entry = Entry, TFilter extends object = {}> {

    private _storage: StorageDriver<TEntry>;

    constructor(driver: StorageDriver<TEntry>) {
        this._storage = driver;
    }
      
    /**
     *  Prepare a new entry. This entry will not be automatically stored, but it will
     *  be ready to be used.
     */
    async prepare() : Promise<TEntry> {
        return Promise.resolve({ id: uuid() } as TEntry);
    }

    /**
     *  Create a new entry in the sack. The entry will be stored before returned.
     */
    async create() : Promise<TEntry> {

        const payload = await this.prepare();
        await this.store(payload, { mode: "replace" });

        return payload;
    }

    /**
     *  Fetch an entry based on id.
     */
    async fetch(id: string) : Promise<TEntry> {

        const entry = await this._storage.fetch(id);
        if (!entry) throw Error(`Entry with id: ${id} not found`);

        return entry;
    }

    /**
     *  Find entries matching a specific filter or all items as they are.
     */
    async find(filter?: TFilter) : Promise<TEntry[]> {

        return this._storage.find(filter);
    }

    /**
     *  Update or insert an entry.
     */
    async upsert(input: TEntry|TEntry[]) : Promise<void> {

        return this.store(input, { mode: "update" });
    }

    /**
     *  Insert an entry.
     */
    async insert(input: TEntry|TEntry[]) : Promise<void> {

        this.store(input, { mode: "replace" });
    }

    /**
     *  Store a specific entry or a collection of entries.
     */
    async store(input: TEntry|TEntry[], options: { mode: "replace" | "update" } = { mode: "replace" }) : Promise<void> {

        if (Array.isArray(input)) {

            if (options.mode === 'replace') return this._storage.insertCollection(input);
            return this._storage.updateCollection(input);
        }

        else {
            if (options.mode === 'replace') return this._storage.insert(input);
            return this._storage.update(input);
        }
    }

    async delete(input: TEntry|TEntry[]|string|string[]) {

        if (Array.isArray(input)) return this._storage.deleteCollection(input);
        else this._storage.delete(input);
    }
};
