import fs from 'fs';
import path from 'path';
import { Database } from '../interfaces/IDatabase';
import { DatabaseConfig } from '../interfaces/IDatabaseConfig';
import mysql, { Pool } from 'mysql2/promise';
import { IMigration } from '../interfaces/IMigration';

class MySQLDatabase implements Database {
    private readonly config: DatabaseConfig;
    private readonly pool: Pool;

    constructor(config: DatabaseConfig) {
        this.config = config;
        this.pool = mysql.createPool({
            host: this.config.host,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database,
            port: this.config.port,
        });
    }

    async createMigrations(name: string): Promise<void> {
        try {
            const timestamp = new Date().toISOString().replace(/[-T:]/g, '').slice(0, -5);
            const migrationName = `${timestamp}_${name}.ts`;
            const migrationsDir = path.join(__dirname, '../../src', 'database', 'migrations');
            await this.createMigrationsDirectoryIfNotExists();
            const migrationContent = this.generateMigrationContent(name);
            await fs.promises.writeFile(path.join(migrationsDir, migrationName), migrationContent);
            console.log(`Migration '${migrationName}' created successfully.`);
        } catch (error) {
            console.error('Error creating migration:', error);
            throw error;
        }
    }

    private generateMigrationContent(name: string): string {
        const className = this.toClassName(name);
        return `import { IMigration } from '../../interfaces/IMigration';
import { Pool } from 'mysql2/promise';

export class ${className} implements IMigration {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async up(): Promise<void> {
        // Adicione aqui o seu SQL de migração para aplicar as alterações
    }

    async down(): Promise<void> {
        // Adicione aqui o seu SQL de migração para desfazer as alterações
    }
}`;
    }

    private async createMigrationsDirectoryIfNotExists(): Promise<void> {
        const migrationsDir = path.join(__dirname, '../../src', 'database', 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            await fs.promises.mkdir(migrationsDir, { recursive: true });
        }
    }

    private toClassName(name: string): string {
        return name.replace(/(?:^|\s|-)\S/g, (a) => a.toUpperCase()).replace(/_/g, '');
    }

    async checkIntegrityBeforeMigration(): Promise<void> {
        // Implemente a lógica para verificar a integridade do banco de dados
        // Isso pode incluir a verificação da existência de tabelas necessárias, índices, etc.
        // Se alguma verificação falhar, lance um erro ou avise o usuário.
      }

    async runMigrations(): Promise<void> {
        try {
            const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
            const migrationFiles = await fs.promises.readdir(migrationsDir);
            const migrationHistory = await this.getMigrationHistory();
            const migrationsToRun = migrationFiles.filter(migration => !migrationHistory.includes(migration));
            migrationsToRun.sort();
    
            for (const migrationFile of migrationsToRun) {
                const migrationPath = path.join(migrationsDir, migrationFile);
    
                // Verifica se a migração já foi executada
                if (migrationHistory.includes(migrationFile)) {
                    console.log(`Migration '${migrationFile}' already executed.`);
                    continue;
                }
    
                console.log(`Executing migration '${migrationFile}'...`);
                await this.executeMigration(migrationPath, 'up');
    
                // Atualiza o histórico de migrações
                migrationHistory.push(migrationFile);
                await fs.promises.writeFile(
                    path.join(__dirname, '../../src', 'database', 'migration-history.json'),
                    JSON.stringify(migrationHistory, null, 2)
                );
    
                console.log(`Migration '${migrationFile}' executed successfully.`);
            }
    
            console.log('All migrations executed successfully.');
        } catch (error) {
            console.error('Error running migrations:', error);
            throw error;
        }
    }
    
    async runMigrationByName(name: string): Promise<void> {
        try {
            const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
            const migrationFiles = await fs.promises.readdir(migrationsDir);
            const migrationPath = migrationFiles.find(file => file.includes(name));
    
            if (!migrationPath) {
                throw new Error(`Migration '${name}' not found.`);
            }
    
            const migrationHistory = await this.getMigrationHistory();
    
            if (migrationHistory.includes(migrationPath)) {
                console.log(`Migration '${migrationPath}' already executed.`);
                return;
            }
    
            console.log(`Executing migration '${migrationPath}'...`);
            await this.executeMigration(path.join(migrationsDir, migrationPath), 'up');
    
            migrationHistory.push(migrationPath);
            await fs.promises.writeFile(
                path.join(__dirname, '../../src', 'database', 'migration-history.json'),
                JSON.stringify(migrationHistory, null, 2)
            );
    
            console.log(`Migration '${migrationPath}' executed successfully.`);
        } catch (error) {
            console.error('Error running migration:', error);
            throw error;
        }
    }

    private async executeMigration(migrationPath: string, method: 'up' | 'down'): Promise<void> {
        const migrationModule = await import(migrationPath);
        const MigrationClass = migrationModule[Object.keys(migrationModule)[0]];
        const migrationInstance: IMigration = new MigrationClass(this.pool);

        if (method === 'up') {
            await migrationInstance.up();
        } else {
            await migrationInstance.down();
        }
    }

    async rollbackMigrations(count: number): Promise<void> {
        const migrationHistory = await this.getMigrationHistory();
      
        // Verificar se há migrações suficientes no histórico
        if (count > migrationHistory.length) {
          throw new Error('Not enough migrations to rollback.');
        }
      
        // Reverter o número especificado de migrações
        for (let i = 0; i < count; i++) {
          const migrationName = migrationHistory.pop();

            if (migrationName !== undefined) {
                await this.rollbackMigration(migrationName);
            }
            else {
                console.error('Migration name is undefined');
            }
        }
      
        // Atualizar o histórico de migrações
        await this.writeMigrationHistory(migrationHistory);
      }
      
      async rollbackAllMigrations(): Promise<void> {
        const migrationHistory = await this.getMigrationHistory();
      
        // Reverter todas as migrações
        for (const migrationName of migrationHistory) {
          await this.rollbackMigration(migrationName);
        }
      
        // Limpar o histórico de migrações
        await this.writeMigrationHistory([]);
      }
      
      async rollbackMigration(migrationName: string): Promise<void> {
        const migrationPath = path.join(__dirname, '..', 'database', 'migrations', migrationName);
        const migrationModule = await import(migrationPath);
        const MigrationClass = migrationModule[Object.keys(migrationModule)[0]];
        const migrationInstance = new MigrationClass(this.pool);
      
        // Reverter a migração
        await migrationInstance.down();
      }

      async writeMigrationHistory(migrationHistory: string[]): Promise<void> { // Adição da função de escrita do histórico
        try {
          await fs.promises.writeFile(
            path.join(__dirname, '../../src', 'database', 'migration-history.json'),
            JSON.stringify(migrationHistory, null, 2)
          );
        } catch (error) {
          console.error('Error writing migration history:', error);
          throw error;
        }
      }
      

    async getMigrationHistory(): Promise<string[]> {
        const historyPath = path.join(__dirname, '../../src', 'database', 'migration-history.json');
        try {
            const historyContent = await fs.promises.readFile(historyPath, 'utf-8');
            return JSON.parse(historyContent);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                await fs.promises.writeFile(historyPath, '[]');
                return [];
            }
            throw error;
        }
    }
}

export default MySQLDatabase;
