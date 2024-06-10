export interface DatabaseConfig {
  type: 'mysql' | 'postgresql'; // Adicione outros tipos de banco de dados conforme necessário
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}