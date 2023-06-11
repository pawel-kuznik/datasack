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
});