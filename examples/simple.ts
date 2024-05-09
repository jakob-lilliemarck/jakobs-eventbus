import { Bus } from '../src'
import type { Event, Module } from '../src'

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