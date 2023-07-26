import { Knex } from 'knex';

export async function up(knex: Knex) {
  await knex.schema.createTable('people', function (table) {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.timestamp('created_at').notNullable();
  });

  await knex.into('people').insert([
    {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Luke Skywalker',
      created_at: new Date('2023-07-06'),
    },
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'C-3PO',
      created_at: new Date('2023-07-07'),
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'R2-D2',
      created_at: new Date('2023-07-08'),
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Darth Vader',
      created_at: new Date('2023-07-09'),
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Leia Organa',
      created_at: new Date('2023-07-10'),
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'Owen Lars',
      created_at: new Date('2023-07-11'),
    },
    {
      id: '00000000-0000-0000-0000-000000000006',
      name: 'Beru Whitesun lars',
      created_at: new Date('2023-07-12'),
    },
    {
      id: '00000000-0000-0000-0000-000000000007',
      name: 'R5-D4',
      created_at: new Date('2023-07-13'),
    }
  ]);
}

export function down(knex: Knex) {
  return knex.schema.dropTableIfExists('people');
}
