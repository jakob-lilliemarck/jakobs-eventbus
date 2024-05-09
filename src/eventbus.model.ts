export type Handler<T extends string, U, V = never> = (event: Ev<T, U>, dispatch: Dispatch<V>) => Promise<void>

export type Factory<T extends string, U> = (data: U) => Ev<T, U>

export interface Mo<T extends string, U, Events> {
    topic: T,
    handler: Handler<T, U, Events>
    factory: Factory<T, U>
}

export interface Ev<T extends string, U> {
    topic: T,
    data: U
}

export interface Mi {
    <T extends string, U, V>(next: Handler<T, U, V>): Handler<T, U, V>
}

export type Topics = { [key: string]: Array<symbol> }

export type Handlers = { [key: symbol]: Handler<any, any, any> } // remove any, any

export type Symbols = { [key: symbol]: string }

export type Dispatch<T> = (event: T) => void

export type Factories = { [key: symbol]: Factory<string, any> }

export interface IBus<T extends Ev<string, any>> {
    dispatch: Dispatch<T>
}