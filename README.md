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
