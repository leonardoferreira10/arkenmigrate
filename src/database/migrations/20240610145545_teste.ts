import { IMigration } from '../../interfaces/IMigration';
import { Pool } from 'mysql2/promise';

export class Teste implements IMigration {
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
}