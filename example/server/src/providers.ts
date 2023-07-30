import { Knex } from 'knex';

export interface GetPeopleParams {

}

export class PeopleProvider {
  constructor(
    private db: Knex
  ) {}

  getPeople = async () => {

  }
}
