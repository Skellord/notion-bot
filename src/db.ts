import { Knex, knex } from 'knex'

const USERS = 'users';
const DB = 'db';
const PAGE = 'page';

interface User {
  id: number;
  user_id: number;
  allow: boolean;
  mode: 'db' | 'page';
  page_id?: string;
  db_id?: string;
  token?: string;
}

export default class DatabaseConnector {
  db: Knex;

  constructor() {
    this.db = this._open();
  }

  _open() {
    const db = knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:',
      },

      useNullAsDefault: true,
    });

    return db;
  }

  async createUsersTable() {
    try {
      await this.db.schema.createTable(USERS, table => {
        table.increments('id');
        table.integer('user_id');
        table.boolean('allow');
        table.string('page_id')
        table.string('db_id');
        table.string('token');
        table.string('mode');
      })

      await this.db<User>(USERS).insert({ mode: 'db' });
    } catch (err) {
      console.error(err);
    }
  }

  async addUser(id: number, allow: boolean) {
    try {
      await this.db<User>(USERS).insert({ user_id: id, allow });
    } catch (err) {
      console.error(err);
    }
  }

  async checkPermission(userId: number) {
    try {
      return await this.db<User>(USERS).where('user_id', userId).first('allow');
    } catch (err) {
      console.error(err);
    }
  }

  async addPageId(userId: number, pageId: string) {
    try {
      return await this.db<User>(USERS).where('user_id', userId).update({ page_id: pageId });
    } catch (err) {
      console.error(err);
    }
  }

  async getPageId(userId: number) {
    try {
      return await this.db<User>(USERS).where('user_id', userId).first('page_id');
    } catch (err) {
      console.error(err);
    }
  }

  async addDBId(userId: number, dbId: string) {
    try {
      return await this.db<User>(USERS).where('user_id', userId).update({ db_id: dbId });
    } catch (err) {
      console.error(err);
    }
  }

  async getDBId(userId: number) {
    try {
      return await this.db<User>(USERS).where('user_id', userId).first('db_id');
    } catch (err) {
      console.error(err);
    }
  }

  async addConnectionToken(userId: number, token: string) {
    try {
      return await this.db<User>(USERS).where('user_id', userId).update({ token });
    } catch (err) {
      console.error(err);
    }
  }

  async getConnectionToken(userId: number) {
    try {
      return await this.db<User>(USERS).where('user_id', userId).first('token');
    } catch (err) {
      console.error(err);
    }
  }
};
