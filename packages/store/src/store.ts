import { Repository } from "../../plugin-base";
import { StoreConfig, Task } from "./types";
import { combineLatest, defer, Observable, of, ReplaySubject } from "rxjs";
import { Mutator } from "./mutator";
import { concatMap, pairwise, switchMap, tap } from "rxjs/operators";

export class Store<S> {
  constructor(
    private config: StoreConfig<S>,
    private repository: Repository<any>
  ) {
    this.setupReactions();
  }

  mutate(mutation: string, data: object) {
    const mutationFn = this.config.mutations[mutation];
    if (!mutationFn) {
      throw Error(`No mutation defined for '${mutation}'`);
    }

    const taskSubject = new ReplaySubject<Task>();
    const mutator = new Mutator(this.repository, this, taskSubject);

    mutationFn(mutator, data);
    taskSubject.pipe(concatMap((task) => task.execute())).subscribe();
  }

  query(query: string, args?: object): Observable<any> {
    const queryConfig = this.config.queries[query];
    if (!queryConfig) {
      throw Error(`No query defined for '${query}'`);
    }
    const queryInSyntax = queryConfig[this.repository.syntax];
    if (!queryConfig) {
      throw Error(
        `Query '${query}' not available in syntax ${this.repository.syntax}`
      );
    }
    const preparedQuery = queryInSyntax(args);
    return this.repository.find(preparedQuery);
  }

  async teardown() {
    await this.repository.teardown();
  }

  private setupReactions() {
    for (let reaction of this.config.reactions || []) {
      this.query(reaction.query)
        .pipe(
          pairwise(),
          switchMap(([p, c]) => {
            const event = reaction.event(p, c);
            if (event && reaction.resolve) {
              return combineLatest({
                response: defer(() => reaction.resolve(event)),
                event: of(event),
              });
            } else {
              return of({ event, response: void 0 });
            }
          })
        )
        .subscribe(({ event, response }) => {
          if(!event) {
            return;
          }
          const mutations = reaction.mutate(event, response);
          (mutations instanceof Array
            ? mutations
            : [mutations]
          ).forEach((mutation) =>
            this.mutate(mutation.operation, mutation.data)
          );
        });
    }
  }
}
