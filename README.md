# datasack

This is TypeScript/JavaScript library that creates an easy to use facade for data manipulation.
The main idea is to facilitate for code that interacts with the facade and the actual storage is
done with specific driver. The library comes with a in-memory driver which allows for storing
entries in runtime memory. However, the intention is that the actual storage driver is implemented
in the application that uses this library. The in-memory driver can still be used for testing
and proof-of-concept implementations.

This library came into exitance cause of specific problems I faced while developing personal
projects:

- Uniform data management across server, cli, and client. It's possible to manage data across these
execution envrionnment, but it's very clunky without a tailored solution. Using a state management frontends-side with a REST API or electron backend goes good way, but to achieve a comfortable abstraction it takes a lot of effort with a huge dependency trail.
- No hard dependency on a big system (like next.js), cause they change to violently, and it takes
forever to understand these systems. 
- Real time updates capability. Updating frontend about chnges occuring in server or electron backend is somewhat challenging without a good abstraction in the middle. Again, it's possible to
achieve this with an alomeration of ready-to-use libraries, but it puts a huge dependency trail
and is rather fragile.
- Performance and optimisation. It's really hard to optimise a ready-to-use huge system. Especially,
ones that insisnt on supporting old Interner Explorer browsers.

This library is here to provide an easy way to deal with the these issues.

## Sacks

The consumer part of the library is a Sack. These objects are facades over the storage driver and
allow for high level of abstraction from the actual storage level. This allows to build your data
model in a way that you can share code in the client, server, electron app, or cli. This also allows
for easy test setup and inspection of results, as the tests would hold the total control over the
raw data.

To define a stack:
```
import { Entry, Sack } from "@pawel-kuznik/datasack";

interface Person extends  {
    name: string;
};

// construct your persons sack
const persons = new Sack<Person>(new YourStorageOfChoice());

// insert alice and bob
await persons.insert({ id: "alice-id", name: "Alice" });
await persons.insert({ id: "bob-id", name: "Bob" });

// fetch alice object
const alice = persons.fetch("alice-id");
```

The above example works well with POJOs. However, sometimes there is a need to work with class-based
entries. For such, there is a helper class: `ConvertingDriver`. This class allows for converting data
from and to ready and storage formats.

```
import { Entry, ConvertingDriver, Sack } from "@pawel-kuznik/datasack";

interface PersonData extends Entry {
    name: string;
};

class Person implements Entry {
    
};

class PersonsDriver extends ConvertingDriver<Person, PersonData> {

};
```

## Potentials

The library operates on a concept of potentials for the storage implementations. These objects describe
a potential entry or a collection. In simple words: they are wrappers of entries and collections allowing
to defer actions on the actual data.

@TODO explain the concept of potentials.