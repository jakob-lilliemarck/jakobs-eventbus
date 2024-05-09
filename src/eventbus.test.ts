import { describe, expect, test } from '@jest/globals';
import { Bus } from './eventbus'
import type {
    Ev,
    Mo,
    Mi,
    Factory,
    Handler,
} from './eventbus.model'

type EventA = Ev<'a', number>
type EventB = Ev<'b', string>
type EventC = Ev<'c', boolean>

type FactoryA = Factory<'a', number>
type FactoryB = Factory<'b', string>
type FactoryC = Factory<'c', boolean>

type HandlerA = Handler<'a', number, EventB | EventC>
type HandlerB = Handler<'b', string, EventC>
type HandlerC = Handler<'c', boolean, never>

type ModuleA = Mo<'a', number, EventB | EventC>
type ModuleB = Mo<'b', string, EventC>
type ModuleC = Mo<'c', boolean, never>

describe('Jakobs eventbus', () => {
    test('Test the eventbus', async () => {
        const aFactory: FactoryA = (data) => ({ topic: 'a', data })
        const bFactory: FactoryB = (data) => ({ topic: 'b', data })
        const cFactory: FactoryC = (data) => ({ topic: 'c', data })

        const middlewareResult: Array<string> = []
        const idMiddlewareA = 'middleware_a'
        const idMiddlewareB = 'middleware_b'

        const middlewareA: Mi = (next) => async (event, dispatch) => {
            middlewareResult.push(idMiddlewareA)
            return next(event, dispatch)
        }

        const middlewareB: Mi = (next) => async (event, dispatch) => {
            middlewareResult.push(idMiddlewareB)
            return next(event, dispatch)
        }

        const handlerResult: Array<string> = []
        const idHandlerA = 'handler_a'
        const idHandlerB = 'handler_b'
        const idHandlerC = 'handler_c'

        const aHandler: HandlerA = async (_event, dispatch) => {
            handlerResult.push(idHandlerA)
            await dispatch(bFactory('string'))
            await dispatch(cFactory(true))
        }

        const bHandler: HandlerB = async (_event, dispatch) => {
            handlerResult.push(idHandlerB)
            await dispatch(cFactory(true))
        }

        const cHandler: HandlerC = async (_event, _dispatch) => {
            handlerResult.push(idHandlerC)
        }

        const ma: ModuleA = { topic: 'a', handler: aHandler, factory: aFactory }
        const mb: ModuleB = { topic: 'b', handler: bHandler, factory: bFactory }
        const mc: ModuleC = { topic: 'c', handler: cHandler, factory: cFactory }

        const bus = new Bus([middlewareA, middlewareB])
            .subscribe(mc)
            .subscribe(mb)
            .subscribe(ma)

        const eventA = aFactory(1)
        const eventB = bFactory('string')
        const eventC = cFactory(false)

        await bus.dispatch(eventA)

        expect(eventA).toEqual({ topic: 'a', data: 1 })
        expect(eventB).toEqual({ topic: 'b', data: 'string' })
        expect(eventC).toEqual({ topic: 'c', data: false })

        expect(middlewareResult).toStrictEqual([
            idMiddlewareA,
            idMiddlewareB,
            idMiddlewareA,
            idMiddlewareB,
            idMiddlewareA,
            idMiddlewareB,
            idMiddlewareA,
            idMiddlewareB
        ]);

        expect(handlerResult).toContain(idHandlerA)
        expect(handlerResult).toContain(idHandlerB)
        expect(handlerResult).toContain(idHandlerC)

        const count = (key: string, arr: Array<string>): number => arr.reduce((a, e) => key === e ? a + 1 : a, 0)

        expect(count(idHandlerA, handlerResult)).toBe(1)
        expect(count(idHandlerB, handlerResult)).toBe(1)
        expect(count(idHandlerC, handlerResult)).toBe(2)
    });
});