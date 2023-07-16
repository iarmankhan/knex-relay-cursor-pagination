import { config as configureEnv } from 'dotenv';
import knex from 'knex';

configureEnv();

const action = process.argv[2];

if (action === 'pg') {
  switch (process.argv[3]) {
    case 'up':
      void getDb()
        .then(db => db.migrate.up())
        .then(() => process.exit(0));
      break;
    case 'down':
      void getDb()
        .then(db => db.migrate.down())
        .then(() => process.exit(0));
      break;
  }
}

async function getDb() {
  return knex({
    client: 'pg',
    migrations: {
      directory: `${__dirname}/migrations`,
    },
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    }
  });
}
