# Jakobs eventbus
A typesafe eventbus in Typescript with no external dependencies.

## Examples
A basic usage example may look like this:
```ts
import { Bus } from 'jakobs-eventbus'
import type { Event, Module } from 'jakobs-eventbus'

const moduleA: Module<'a', { value: number }, never> = {
    topic: 'a',
    factory: (data) => ({ topic: 'a', data }),
    handler: async (_data, _dispatch) => {
        console.log('Called moduleA!')
    }
}

const moduleB: Module<'b', { value: number }, Event<'a', { value: number }>> = {
    topic: 'b',
    factory: (data) => ({ topic: 'b', data }),
    handler: async (data, dispatch) => {
        console.log('Called moduleB!')
        dispatch({ topic: 'a', data: { value: 1 } })
    }
}

const bus = new Bus()
    .subscribe(moduleA)
    .subscribe(moduleB)

bus.dispatch({ topic: 'a', data: { value: 1 } })
```

Lets pick the pieces apart to better understand the different concepts.

---
### Modules
A `Module` is an object that define a type of event, how to create it and how to handle it. Modules respond to a single event but may in turn dispatch multiple new events using the dispatch callback passed as the second argument to its handler. They are the building blocks that you'll use to integrate different parts of your application to communicate over the `Bus` instance.

If a module dispatches an event, they must declare their type, If multiple types are dispatched, declare the type as a union of all. An module that does not dispatch any event may instead use `never`.

```ts
// ModuleA doesn't dispatch any events
type ModuleA = Module<'a', { value: number }, never>

// ModuleB dispatches events of type Event<'a', { value: number }>
type ModuleB = Module<'b', { value: number }, { topic: 'a', value: number }>
```

This package provides helper types for each concept it defines A full verbosely typed re-write of `moduleA` in the above example look like:

```ts
import type { Event, Module, Handler, Factory } from 'jakobs-eventbus'

type DataA = { value: number }

type EventA = Event<'a', DataA>

type HandlerA = Handler<'a', DataA>

type FactoryA = Factory<'a', DataA>

type ModuleA = Module<'a', DataA, never>

const handlerA: HandlerA = async (event, dispatch) => { }

const factoryA: FactoryA = (data) => ({ topic: 'a', data })

const moduleA: ModuleA = {
    topic: 'a',
    handler: handlerA,
    factory: factoryA
}
```

---
### Bus
The `Bus` is an object that `Modules` register with to subscribe to events dispatched over the bus. It exposes two key methods `subscribe`, for subscribing modules to dispatched events, and `dispatch` to dispatch events.

#### Subscribe

```ts
const bus = new Bus()
    .subscribe(moduleA)
    .subscribe(moduleB)
```
The bus provides type-saftey by statically keeping track of which events it supports, that dispatched events conform to any of the supported types. It does that by creating a new bus with the new type when new modules subscribes to it. Once instantiated, the bus itself is immutable.

Used naivly that behaviour of the bus may cause some unexpected results. Changing the first example to following will throw type errors.

```ts
const bus = new Bus()

bus.subscribe(moduleA)

bus.subscribe(moduleB)
// "...Type 'Event<"a", { value: number; }>' is not assignable to type 'never'"

bus.dispatch({ topic: 'a', data: { value: 1 } })
// "...Type 'Event<"a", { value: number; }>' is not assignable to type 'never'"
```
First, we get an error when attempting to subscribe `moduleB`. That's because `moduleB` declares it will dispatch events of type `Event<'a', { value: number }>` to the bus, and corresponding module has been subscribed to the bus. Then we get the same error again, for the same reason when directly trying to dispatch the event. 

The bus is _immutable_, calling `subscribe` doesn't modify the bus, it returns a new one, with a new type. Inspecting the type of each bus describes the type of events it supports:

```ts

const bus = new Bus()
// Bus<never>

const bus2 = bus.subscribe(moduleA)
// Bus<Event<"a", { value: number; }>>

const bus3 = bus2.subscribe(moduleB)
// Bus<Event<"a", { value: number; }> | Event<"b", { value: number; }>>
```

The above constraints also mean that the _order_ of subscriptions matter since modules declare their dependencies on other supported events that it intends on dispatching. Those events must already be registered with the bus. Changing the order will throw a type error:

```ts
const bus = new Bus()
    .subscribe(moduleB)
    // ...Type 'Event<"a", { value: number; }>' is not assignable to type 'never'
    .subscribe(moduleA)
```
#### Dispatch
Similarly to `subscribe`, `dispatch` also provides type-saftey by statically checking the type of the dispatched event. Coming back to our example above:

```ts
const bus = new Bus()
    .subscribe(moduleA)
    .subscribe(moduleB)

bus.dispatch({ topic: 'a', data: { value: 1 } })
// Ok

bus.dispatch({ topic: 'a', data: { value: "string" } })
// ...Type 'string' is not assignable to type 'number'

bus.dispatch({ topic: 'otherTopic', data: { value: 1 } })
// ...Type '"otherTopic"' is not assignable to type '"a" | "b"'
```

---
### Middlewares
The `Bus` may be instantiated with a set of middlewares. Middlewares can be used to transform or enrich events or to trigger some side effect, like logging, performance monitoring, etc.

Middlewares are simple functions of the type
```ts
type Middleware = <T extends string, U, V>(next: Handler<T, U, V>) => Handler<T, U, V>
```

Here's a modified version of the inital example including a middleware
```ts
import { Bus } from 'jakobs-eventbus'
import type { Event, Module, Middleware } from 'jakobs-eventbus'

const moduleA: Module<'a', { value: number }, never> = {
    topic: 'a',
    factory: (data) => ({ topic: 'a', data }),
    handler: async (data, dispatch) => {
        console.log('Called moduleA!')
    }
}

const moduleB: Module<'b', { value: number }, Event<'a', { value: number }>> = {
    topic: 'b',
    factory: (data) => ({ topic: 'b', data }),
    handler: async (data, dispatch) => {
        console.log('Called moduleB!')
        dispatch({ topic: 'a', data: { value: 1 } })
    }
}

const logEvents: Middleware = (next) => async (event, dispatch) => {
    console.groupCollapsed(`${event.topic}`)
    console.log(event.data)
    console.groupEnd
    return next(event, dispatch)
}

const calls = {
    a: 0,
    b: 0
}

const countCalls: Middleware = (next) => async (event, dispatch) => {
    if (event.topic === 'a') calls.a += 1
    if (event.topic === 'b') calls.a += 1
    return next(event, dispatch)
}

const bus = new Bus([logEvents, countCalls])
    .subscribe(moduleA)
    .subscribe(moduleB)

bus.dispatch({ topic: 'a', data: { value: 1 } })
console.log(`Calls: ${JSON.stringify(calls)}`)
```
Happy coding! Be type safe!