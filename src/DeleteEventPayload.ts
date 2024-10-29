import { Entry } from "./Entry";

export interface DeleteEventPayload<TEntry extends Entry = Entry> {
    entry: TEntry;
};