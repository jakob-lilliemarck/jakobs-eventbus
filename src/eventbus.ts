import type {
    Event,
    Module,
    Middleware,
    IBus,
    Topics,
    Handlers,
    Symbols,
    Factories
} from './eventbus.model'

export class Bus<V extends Event<string, any> = never> implements IBus<V> {
    private middlewares: Array<Middleware>
    private topics: Topics;
    private handlers: Handlers;
    private symbols: Symbols;
    private factories: Factories;

    constructor(
        middlewares: Array<Middleware> = [],
        topics: Topics = {},
        handlers: Handlers = {},
        symbols: Symbols = {},
        factories: Factories = {}
    ) {
        this.middlewares = middlewares
        this.topics = topics
        this.handlers = handlers
        this.symbols = symbols
        this.factories = factories
    }

    subscribe<T extends string, U, E extends V>(module: Module<T, U, E>): Bus<V | Event<T, U>> {
        const symbol = Symbol(module.topic)
        const topics = Object
            .entries(this.topics)
            .reduce((a, [topic, symbols]) =>
                topic in a
                    ? { ...a, [topic]: [...a[topic], ...symbols] }
                    : { ...a, [topic]: symbols },
                { [module.topic]: [symbol] })
        const handlers = { ...this.handlers, [symbol]: module.handler }
        const symbols = { ...this.symbols, [symbol]: module.topic }
        const factories = { ...this.factories, [symbol]: module.factory }
        return new Bus<V | Event<T, U>>(
            this.middlewares,
            topics,
            handlers,
            symbols,
            factories
        );
    }

    dispatch<E extends V>(event: E): Array<Promise<void>> {
        const symbols = this.topics[event.topic]
        if (symbols && symbols.length > 0) {
            return this.topics[event.topic].reduce((promises, symbol) => {
                return [
                    ...promises,
                    this.middlewares.reduceRight(
                        (n, m) => m(n),
                        this.handlers[symbol]
                    )(event, this.dispatch.bind(this))]
            }, [] as Array<Promise<void>>)
        } else {
            throw new Error(`Unhandled event type "${event.topic}"`)
        }
    }
}