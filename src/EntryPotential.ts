import { EmitterLike } from "@pawel-kuznik/iventy";
import { Entry } from "./Entry";

/**
 *  This interface describes a potential for an entry. By that it means that
 *  the interface describes a way to fetch an entry or observe it.
 */
export interface EntryPotential<TEntry extends Entry = Entry> extends EmitterLike {

    fetch() : Promise<TEntry>;

    update(entry: TEntry) : Promise<void>;

    delete() : Promise<void>;
};