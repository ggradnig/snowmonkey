import { SnapshotSlice, Task } from "./types";
import { InsertTask, ReduceTask } from "./task";
import { Store } from "./store";
import { Repository } from "@zinc/plugin-base";
import { Observer } from "rxjs";

export class Mutator {
  constructor(
    private repository: Repository<any>,
    private store: Store<any>,
    private taskObserver: Observer<Task>
  ) {}

  runTransaction(transaction: (mutator: Mutator) => Mutator) {
    throw Error("Transactions are not implemented yet");
  }

  query(query: string, data: any): SnapshotSlice<any> {
    const self = this;
    return {
      reduce(reducer: (state: any) => any): Mutator {
        self.taskObserver.next(
          new ReduceTask(self.store, self.repository, query, data, reducer)
        );
        return this;
      },
    };
  }

  insert(destination: string, ...data: object[]): Mutator {
    this.taskObserver.next(new InsertTask(this.repository, destination, data));
    return this;
  }
}
