import MySQLDatabase from './database/mysql';
import config from './config/database';

async function main(): Promise<void> {
    const db = new MySQLDatabase(config);

    try {
        await db.createMigrations("teste");
        await db.runMigrations();
        const migrationHistory = await db.getMigrationHistory();
        console.log('Migration history:', migrationHistory);
    } catch (error) {
        console.error('Error running migrations:', error);
    }
}

main();
