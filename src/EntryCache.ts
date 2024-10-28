import { Entry } from "./Entry";

/**
 *  This class allows for caching entries. Mainly it's used inside
 *  the ConvertingDriver to make sure that the entities aren't constantly
 *  recreated.  
 */
export class EntryCache<TEntry extends Entry = Entry>  {

    private _cache: Map<string, TEntry> = new Map();

    get(id: string) : TEntry | undefined {
        return this._cache.get(id);
    }

    store(entry: TEntry) {
        this._cache.set(entry.id, entry);
    }

    invalidate(id: string) : void {
        this._cache.delete(id);
    }

    clear() {
        this._cache.clear();
    }
};
