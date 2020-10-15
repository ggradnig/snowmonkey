import { Mutator } from './mutator';
import { Observable } from 'rxjs';
import { JSONSchema7 } from 'json-schema';

export interface Mutation {
  operation: string;
  data: Record<string, unknown>;
}

type QueryImplementations<S> = {
  [P in keyof S]: (data: Record<string, unknown>) => S[P];
};

interface Query<S> {
  [name: string]: QueryImplementations<S>;
}

export interface Queries<S> {
  [schema: string]: Query<S>;
}

export interface Schemas {
  [key: string]: JSONSchema7;
}

export interface Task {
  execute(): Promise<void>;
}

export type SnapshotSlice<Q, S extends Record<string, unknown>[]> = {
  reduce(stateReducer: (state: S) => void): Mutator<Q, S>;
};

export interface Reaction<E extends Record<string, unknown> = Record<string, unknown>, R = unknown> {
  query: string;

  event: (previous: E[], current: E[]) => unknown | undefined;

  resolve(event: unknown): Promise<R>;

  mutate(E, R): Mutation | Mutation[];
}

export interface Mutations<Q, S> {
  [key: string]: (snapshot: Mutator<Q, S>, data: Record<string, unknown>) => S;
}

export interface StoreConfig<Q, S> {
  schema?: Schemas;
  queries?: Queries<Q>;
  mutations?: Mutations<Q, S>;
  reactions?: Reaction[];
}

export interface Store {
  mutate(mutation: string, data: Record<string, unknown>);

  query(query: string, args?: Record<string, unknown>): Observable<Record<string, unknown>[]>;

  teardown(): Promise<void>;
}
