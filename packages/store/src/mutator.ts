import { SnapshotSlice, StoreConfig, Task } from './types';
import { InsertTask, ReduceTask } from './task';
import { Store } from './store';
import { Repository } from '@zinc/plugin-base';
import { Observer } from 'rxjs';

export class Mutator<Q, S> {
  constructor(
    private repository: Repository<Q>,
    private store: Store<Q, S>,
    private taskObserver: Observer<Task>,
    private storeConfig: StoreConfig<Q, S>
  ) {}

  query<T extends Record<string, unknown>[]>(query: string, data: Record<string, unknown>): SnapshotSlice<Q, T> {
    const self = this;
    const [schema] = query.split('.');
    return {
      reduce(reducer: (state: T) => void): Mutator<Q, T> {
        self.taskObserver.next(new ReduceTask(self.store, self.repository, query, data, reducer, schema));
        return this;
      }
    };
  }
  u;

  insert(schema: string, ...data: Record<string, unknown>[]): Mutator<Q, S> {
    this.taskObserver.next(new InsertTask(this.repository, schema, data));
    return this;
  }
}
