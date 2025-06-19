import { Client } from "pg";
import * as dotenv from "dotenv";
import pool from "./db";

dotenv.config({ path: __dirname + "/../.env" });

async function createDatabase(): Promise<void> {
  const client = new Client({
    host: process.env.INIT_DB_HOST,
    port: Number(process.env.INIT_DB_PORT),
    user: process.env.INIT_DB_USER,
    password: process.env.INIT_DB_PASSWORD,
    database: process.env.INIT_DB_NAME,
  });

  await client.connect();

  try {
    await client.query(`CREATE DATABASE bd_financas`);
    console.log("Banco de dados 'bd_financas' criado.");
  } catch (err: any) {
    if (err.code === "42P04") {
      console.log("Banco de dados 'bd_financas' já existe.");
    } else {
      throw err;
    }
  } finally {
    await client.end();
  }
}

async function waitForDatabaseReady(retries = 5, delay = 1000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      client.release();
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

async function setupTables(): Promise<void> {
  await waitForDatabaseReady();
  const client = await pool.connect();

  try {
    const tableExists = async (tableName: string): Promise<boolean> => {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )`,
        [tableName]
      );
      return result.rows[0].exists;
    };


    // Tabela emprestimos
    if (!(await tableExists("emprestimos"))) {
      await client.query(`
        CREATE TABLE emprestimos (
          id SERIAL PRIMARY KEY,
          usuario_id INT,
          item VARCHAR(100) NOT NULL,
          valor_total NUMERIC(10,2) NOT NULL,
          parcelas INT NOT NULL,
          tipo_juros VARCHAR(20) CHECK (tipo_juros IN ('simples', 'composto')),
          taxa_juros NUMERIC(5,2) NOT NULL,
          data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("Tabela 'emprestimos' criada.");
    }

    // Tabela investimentos
    if (!(await tableExists("investimentos"))) {
      await client.query(`
        CREATE TABLE investimentos (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          tipo_juros VARCHAR(20) CHECK (tipo_juros IN ('simples', 'composto')),
          taxa_juros NUMERIC(5,2) NOT NULL,
          descricao TEXT
        );
      `);
      console.log("Tabela 'investimentos' criada.");

      // Inserção dos 4 investimentos iniciais
      await client.query(`
        INSERT INTO investimentos (nome, tipo_juros, taxa_juros, descricao) VALUES
          ('CDB Banco XP', 'composto', 1.20, 'CDB de liquidez diária oferecido pelo Banco XP, indicado para investimentos de médio prazo.'),
          ('Poupança Caixa', 'simples', 0.50, 'Investimento tradicional com liquidez mensal e isenção de imposto de renda.'),
          ('Tesouro Selic 2029', 'composto', 1.10, 'Título público federal indicado para reserva de emergência com variação atrelada à taxa Selic.'),
          ('Fundo DI Itaú', 'simples', 0.90, 'Fundo de renda fixa de baixo risco com rentabilidade aproximada de 90% do CDI.');
      `);
      console.log("Investimentos iniciais inseridos.");
    }

    // Tabela simulacoes_investimento
    if (!(await tableExists("simulacoes_investimento"))) {
      await client.query(`
        CREATE TABLE simulacoes_investimento (
          id SERIAL PRIMARY KEY,
          investimento_id INT NOT NULL,
          valor_investido NUMERIC(10,2) NOT NULL,
          meses INT NOT NULL,
          rendimento_final NUMERIC(10,2),
          data_simulacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          nome_usuario VARCHAR(100) NOT NULL
        );
      `);
      console.log("Tabela 'simulacoes_investimento' criada.");
    }

    // Tabela simulacoes_emprestimo
    if (!(await tableExists("simulacoes_emprestimo"))) {
      await client.query(`
        CREATE TABLE simulacoes_emprestimo (
          id SERIAL PRIMARY KEY,
          nome_usuario VARCHAR(100) NOT NULL,
          valor_total NUMERIC(10,2) NOT NULL,
          parcelas INT NOT NULL,
          taxa_juros NUMERIC(5,2) NOT NULL,
          tipo_juros VARCHAR(20) CHECK (tipo_juros IN ('simples', 'composto')),
          data_simulacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("Tabela 'simulacoes_emprestimo' criada.");
    }

    console.log("Todas as tabelas e os dados iniciais foram verificados/criados.");
  } finally {
    client.release();
  }
}

async function init() {
  try {
    await createDatabase();
    await setupTables();
  } catch (error) {
    console.error("Erro ao inicializar:", error);
  }
}

init();
