import { Entry } from "./Entry";
import { MemoryDriver } from "./MemoryDriver";
import { Sack } from "./Sack";

describe("Sack", () => {
    it('should store entry', async () => {

        const sack = new Sack(new MemoryDriver());
        const input = await sack.prepare();

        await sack.store(input);
        const data = await sack.fetch(input.id);

        expect(data).not.toBeUndefined();
    });

    it('should not fetch data that was not stored', async () => {

        const sack = new Sack(new MemoryDriver());
        const fetch = async () => sack.fetch("aaabbb");

        await expect(fetch).rejects.toThrow();
    });

    it('should store a collection of items', async () => {

        const sack = new Sack(new MemoryDriver());
        const payload1 = await sack.prepare();
        const payload2 = await sack.prepare();

        await sack.store([ payload1, payload2 ]);

        const fetch1 = async () => sack.fetch(payload1.id);
        const fetch2 = async () => sack.fetch(payload2.id);

        await expect(fetch1).resolves;
        await expect(fetch2).resolves;
    });

    it('should fetch a collection of items', async () => {

        const sack = new Sack(new MemoryDriver());
        const payload1 = await sack.prepare();
        const payload2 = await sack.prepare();

        await sack.store([ payload1, payload2 ]);

        const items = await sack.find();

        expect(items).toHaveLength(2);
    });

    it('should prepare new entry with an id ready to go', async () => {

        const sack = new Sack(new MemoryDriver());
        const payload1 = await sack.prepare();
        const payload2 = await sack.prepare();

        expect(payload1.id).not.toEqual(payload2.id);
    });
    
    it('should work with custom entry interface', async () => {

        interface CustomData extends Entry {

            name: string;
        };

        const sack = new Sack<CustomData>(new MemoryDriver());
        const payload = await sack.prepare();
        payload.name = "Test";

        sack.store(payload);

        const fetched = await sack.fetch(payload.id);
        expect(fetched.name).toEqual("Test");
    });
});