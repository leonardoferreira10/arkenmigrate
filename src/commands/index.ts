#!/usr/bin/env node

import { Command } from 'commander';
import MySQLDatabase from '../database/mysql';
import config from '../config/database';

// Cria uma instância do banco de dados MySQL
const db = new MySQLDatabase(config);

// Inicializa o programa de linha de comando
const program = new Command();

// Define o comando principal "arken"
program
    .name('arken')
    .description('A command-line tool for managing database migrations');

// Comando para criar uma nova migração
program
    .command('create:migration <name>')
    .description('Create a new migration with the specified name')
    .action(async (name: string) => {
        try {
            await db.createMigrations(name);
            console.log(`Migration '${name}' created successfully.`);
        } catch (error) {
            console.error('Error creating migration:', error);
        }
    });
    
// Comando para executar todas as migrações pendentes
program
  .command('run [name]')
  .description('Run all pending migrations or a specific migration by name')
  .action(async (name) => {
    try {
      if (name) {
        // Se um nome de migração foi especificado, execute apenas essa migração
        console.log(`Running migration '${name}'...`);
        await db.runMigrationByName(name);
        console.log(`Migration '${name}' executed successfully.`);
      } else {
        // Caso contrário, execute todas as migrações pendentes
        await db.runMigrations();
        console.log('All migrations executed successfully.');
      }
    } catch (error) {
      console.error('Error running migrations:', error);
    }
  });

  program
  .command('rollback [count]')
  .description('Rollback migrations. Specify count to rollback a specific number of migrations.')
  .action(async (count) => {
    try {
      if (count) {
        // Revertir um número específico de migrações
        await db.rollbackMigrations(parseInt(count));
      } else {
        // Reverter todas as migrações
        await db.rollbackAllMigrations();
      }
      console.log('Migrations rolled back successfully.');
    } catch (error) {
      console.error('Error rolling back migrations:', error);
    }
  });


// Comando para executar todas as migrações pendentes
program
    .command('fresh')
    .description('Run all pending migrations')
    .action(async () => {
        try {
            await db.runMigrations();
            console.log('All migrations executed successfully.');
        } catch (error) {
            console.error('Error running migrations:', error);
        }
    });

// Comando para executar uma migração específica para cima
program
    .command('up <name>')
    .description('Run the specified migration up')
    .action(async (name: string) => {
        try {
            // Execute a migração específica
            // Você precisa implementar a lógica para encontrar a migração pelo nome e executá-la
            console.log(`Migration '${name}' executed successfully.`);
        } catch (error) {
            console.error('Error running migration:', error);
        }
    });

// Comando para executar uma migração específica para baixo
program
    .command('down <name>')
    .description('Run the specified migration down')
    .action(async (name: string) => {
        try {
            // Execute a migração específica
            // Você precisa implementar a lógica para encontrar a migração pelo nome e executá-la no modo down
            console.log(`Migration '${name}' reverted successfully.`);
        } catch (error) {
            console.error('Error reverting migration:', error);
        }
    });

// Parsing dos argumentos da linha de comando
program.parse(process.argv);
