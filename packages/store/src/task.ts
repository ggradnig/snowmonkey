import { Task } from "./types";
import { Repository } from "@zinc/plugin-base";
import { firstValueFrom } from "rxjs";
import { Store } from "./store";

export class InsertTask implements Task {
  constructor(
    private repository: Repository<any>,
    private destination: string,
    private data: object[]
  ) {}

  async execute() {
    await this.repository.insert(
      ...this.data.map((data) => ({ data, destination: this.destination }))
    );
  }
}

export class ReduceTask implements Task {
  constructor(
    private store: Store<any>,
    private repository: Repository<any>,
    private query: string,
    private data: any,
    private reducer: (result) => any
  ) {}

  async execute() {
    const queryResult = await firstValueFrom(
      this.store.query(this.query, this.data)
    );
    this.reducer(queryResult);
    await this.repository.upsert(...queryResult.map(res => ({data: res})));
  }
}
