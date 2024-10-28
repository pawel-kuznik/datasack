import { CollectionPotential } from "./CollectionPotential";
import { Entry } from "./Entry";
import { EntryPotential } from "./EntryPotential";
import { StorageDriver } from "./StorageDriver";

export class UpdateAnnouncerDriver<TEntry extends Entry = Entry, TFilter extends object = { }> implements StorageDriver<TEntry> {
    fetch(id: string): Promise<TEntry | undefined> {
        throw new Error("Method not implemented.");
    }
    insert(input: TEntry): Promise<void> {
        throw new Error("Method not implemented.");
    }
    find(filter?: {} | undefined): Promise<TEntry[]> {
        throw new Error("Method not implemented.");
    }
    update(input: TEntry): Promise<void> {
        throw new Error("Method not implemented.");
    }
    delete(input: string | TEntry): Promise<void> {
        throw new Error("Method not implemented.");
    }
    insertCollection(input: TEntry[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    updateCollection(input: TEntry[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    deleteCollection(input: string[] | TEntry[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getEntryPotential(id: string): EntryPotential<TEntry> {
        throw new Error("Method not implemented.");
    }
    getCollectionPotential(filter?: {} | undefined): CollectionPotential<TEntry> {
        throw new Error("Method not implemented.");
    }
    dispose(): Promise<void> {
        throw new Error("Method not implemented.");
    }
};
