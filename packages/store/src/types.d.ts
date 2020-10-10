import { Mutator } from "./mutator";
import { Observable } from "rxjs";

export interface Mutation {
  operation: string;
  data: object;
}

export interface Query {
  [syntax: string]: (...args: any) => any;
}

export interface Queries {
  [key: string]: Query;
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
  queries?: Queries;
  mutations?: Mutations<S>;
  reactions?: Reaction<S>[];
}

export interface Store {
  mutate(mutation: string, data: object);

  query(query: string, args?: object): Observable<any>;

  teardown(): Promise<void>;
}
