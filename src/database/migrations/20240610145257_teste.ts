import { IMigration } from '../../interfaces/IMigration';
import { Pool } from 'mysql2/promise';

export class Teste implements IMigration {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async up(): Promise<void> {
        const connection = await this.pool.getConnection();
        try {
            // Execute o SQL para criar a tabela
            await connection.query(`
                CREATE TABLE IF NOT EXISTS teste (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    teste VARCHAR(255) NOT NULL
                )
            `);
        } catch (error) {
            console.error('Error executing migration:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    async down(): Promise<void> {
        const connection = await this.pool.getConnection();
        try {
            // Execute o SQL para remover a tabela
            await connection.query('DROP TABLE IF EXISTS teste');
        } catch (error) {
            console.error('Error executing migration:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}