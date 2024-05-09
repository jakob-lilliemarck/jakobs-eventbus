import { Bus } from '../src'
import type { Event, Module, Middleware } from '../src'

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