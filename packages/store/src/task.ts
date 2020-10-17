import { Task } from './types';
import { Repository } from '@snowmonkey/plugin-base';
import { firstValueFrom } from 'rxjs';
import { Store } from './store';

export class InsertTask<Q> implements Task {
  constructor(private repository: Repository<Q>, private schema: string, private data: Record<string, unknown>[]) {}

  async execute(): Promise<void> {
    await this.repository.insert(this.schema, ...this.data);
  }
}

export class ReduceTask<Q> implements Task {
  constructor(
    private store: Store<Q>,
    private repository: Repository<Q>,
    private query: string,
    private data: Record<string, unknown>,
    private reducer: (result: Record<string, unknown>[]) => void,
    private schema: string
  ) {}

  async execute(): Promise<void> {
    const queryResult = await firstValueFrom(this.store.query(this.query, this.data));
    this.reducer(queryResult);
    await this.repository.upsert(this.schema, ...queryResult);
  }
}
