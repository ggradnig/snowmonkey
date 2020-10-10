import { RxDBRepository } from "./rxdb-repository";
import { Repository } from "@zinc/plugin-base";
import {RxDatabaseCreator, ServerOptions} from "rxdb";

export async function createRxDBRepository(
  config: RxDatabaseCreator,
  server?: ServerOptions,
  remotes?: string[]
): Promise<Repository<any>> {
  const repo = new RxDBRepository(config, server, remotes);
  await repo.init();
  return repo;
}
