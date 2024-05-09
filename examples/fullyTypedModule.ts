import type { Event, Module, Handler, Factory } from '../src'

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
