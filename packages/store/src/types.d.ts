import { Mutator } from "./mutator";
import { Observable } from "rxjs";
import { JSONSchema7 } from "json-schema";

export interface Mutation {
  operation: string;
  data: object;
}

interface QueryImplementations {
  [syntax: string]: (...args: any) => any;
}

interface Query {
  [name: string]: QueryImplementations;
}

export interface Queries {
  [schema: string]: Query;
}

export interface Schemas {
  [key: string]: JSONSchema7;
}

export interface Task {
  execute(): Promise<void>;
}

export type SnapshotSlice<S> = S & {
  reduce(stateReducer: (state: S) => S): Mutator;
};

export interface Reaction<S, E = object, R = unknown> {
  query: string;

  event: (previous: E[], current: E[]) => object;

  resolve(event: E): Promise<R>;

  mutate(E, R): Mutation | Mutation[];
}

export interface Mutations<S> {
  [key: string]: (snapshot: Mutator, data: any) => S;
}

export interface StoreConfig<S> {
  schema?: Schemas;
  queries?: Queries;
  mutations?: Mutations<S>;
  reactions?: Reaction<S>[];
}

export interface Store {
  mutate(mutation: string, data: object);

  query(query: string, args?: object): Observable<any>;

  teardown(): Promise<void>;
}

export interface Syncable<R> {
  sync(remote: R): Promise<void>;
}

export interface Servable<C> {
  serve(config: C): Promise<void>;
}
