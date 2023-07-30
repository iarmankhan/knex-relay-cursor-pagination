import { IFieldResolver } from '@graphql-tools/utils';

import * as schema from './schema';
import { PeopleProvider } from './providers';

export function createResolvers(peopleProvider: PeopleProvider) {
  const getPeople: IFieldResolver<unknown, unknown> = (_, {}) => {

  };

  const Person = {
    id: p => p.id,
    name: p => p.name,
    created: p => p.created,
  };

  return {
    Person,
    Query: {
      getPeople
    },
  };
}
