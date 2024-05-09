export type Handler<T extends string, U, V = never> = (event: Event<T, U>, dispatch: Dispatch<V>) => Promise<void>

export type Factory<T extends string, U> = (data: U) => Event<T, U>

export interface Module<T extends string, U, V> {
    topic: T,
    handler: Handler<T, U, V>
    factory: Factory<T, U>
}

export interface Event<T extends string, U> {
    topic: T,
    data: U
}

export interface Middleware {
    <T extends string, U, V>(next: Handler<T, U, V>): Handler<T, U, V>
}

export type Topics = { [key: string]: Array<symbol> }

export type Handlers = { [key: symbol]: Handler<any, any, any> } // remove any, any

export type Symbols = { [key: symbol]: string }

export type Dispatch<T> = (event: T) => void

export type Factories = { [key: symbol]: Factory<string, any> }

export interface IBus<T extends Event<string, any>> {
    dispatch: Dispatch<T>
}