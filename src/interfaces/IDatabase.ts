export interface Database {
  createMigrations(name: string): Promise<void>;
  runMigrations(): Promise<void>;
  runMigrationByName(name: string): Promise<void>;
  getMigrationHistory(): Promise<string[]>;
}