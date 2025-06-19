import express, { Request, Response } from "express";
import pool from "../controllers/db";

const router = express.Router();

function calcularJurosSimples(capital: number, taxa: number, meses: number): number {
  return capital + (capital * taxa / 100) * meses;
}

function calcularJurosComposto(capital: number, taxa: number, meses: number): number {
  return capital * Math.pow(1 + taxa / 100, meses);
}

// ===============================
// INVESTIMENTOS
// ===============================

router.post("/investimento", async (req: Request, res: Response) => {
  const { nome, tipo_juros, taxa_juros, descricao } = req.body;
  const result = await pool.query(
    `INSERT INTO investimentos (nome, tipo_juros, taxa_juros, descricao)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [nome, tipo_juros, taxa_juros, descricao]
  );
  res.json(result.rows[0]);
});

router.get("/investimentos", async (_req, res) => {
  try {
    const result = await pool.query("SELECT id, nome FROM investimentos ORDER BY nome ASC");
    res.json([{ id: "todos", nome: "Todos os investimentos" }, ...result.rows]);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar investimentos" });
  }
});

router.post("/simular-investimento", async (req, res) => {
  const { nome_usuario, investimento_id, valor_investido, meses } = req.body;

  if (valor_investido <= 0 || meses <= 0) {
    return res.status(400).json({ erro: "Valor investido e meses devem ser positivos" });
  }

  const dataAtual = new Date().toISOString().replace('T', ' ').substring(0, 19);

  try {
    let investimentos;

    if (investimento_id === "todos") {
      const result = await pool.query(`SELECT * FROM investimentos`);
      investimentos = result.rows;
    } else {
      const result = await pool.query(`SELECT * FROM investimentos WHERE id = $1`, [investimento_id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ erro: "Investimento não encontrado" });
      }
      investimentos = result.rows;
    }

    const simulacoes: any[] = [];

    for (const investimento of investimentos) {
      const { id, nome, tipo_juros, taxa_juros } = investimento;

      const rendimento_final = tipo_juros === 'simples'
        ? calcularJurosSimples(valor_investido, taxa_juros, meses)
        : calcularJurosComposto(valor_investido, taxa_juros, meses);

      await pool.query(
        `INSERT INTO simulacoes_investimento (nome_usuario, investimento_id, valor_investido, meses, rendimento_final, data_simulacao)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [nome_usuario, id, valor_investido, meses, rendimento_final, dataAtual]
      );

      simulacoes.push({
        nome_usuario,
        investimento: nome,
        valor_investido,
        meses,
        rendimento_final: Number(rendimento_final.toFixed(2)),
      });
    }

    res.json(simulacoes);
  } catch (err) {
    console.error("Erro ao simular investimento:", err);
    res.status(500).json({ erro: "Erro interno ao simular investimento" });
  }
});

// ===============================
// RELATÓRIO INVESTIMENTO
// ===============================

router.get("/baixar-relatorio-investimentos", async (req: Request, res: Response) => {
  const usuario = req.query.usuario as string;

  if (!usuario) {
    return res.status(400).send("Usuário não especificado.");
  }

  try {
    const ultimaDataResult = await pool.query(
      `SELECT MAX(data_simulacao) AS ultima_data FROM simulacoes_investimento WHERE nome_usuario = $1`,
      [usuario]
    );

    const ultimaData = ultimaDataResult.rows[0].ultima_data;

    if (!ultimaData) {
      return res.status(404).send("Nenhuma simulação encontrada.");
    }

    const result = await pool.query(
      `
      SELECT
        s.nome_usuario AS usuario,
        i.nome AS investimento,
        s.valor_investido,
        s.meses,
        s.rendimento_final
      FROM simulacoes_investimento s
      JOIN investimentos i ON i.id = s.investimento_id
      WHERE s.nome_usuario = $1 AND s.data_simulacao = $2
      ORDER BY s.rendimento_final DESC
      `,
      [usuario, ultimaData]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Nenhuma simulação encontrada.");
    }

    let txt = `Olá ${usuario},\n\n`;
    txt += `Resumo da sua última simulação de investimento:\n\n`;

    let melhor = result.rows[0];

    result.rows.forEach((row, index) => {
      txt += `Investimento ${index + 1}:\n`;
      txt += `- Tipo: ${row.investimento}\n`;
      txt += `- Valor Investido: R$ ${Number(row.valor_investido).toFixed(2)}\n`;
      txt += `- Meses: ${row.meses}\n`;
      txt += `- Rendimento Final: R$ ${Number(row.rendimento_final).toFixed(2)}\n\n`;
    });

    txt += `Comparando os investimentos dessa simulação, o melhor rendimento foi "${melhor.investimento}" com R$ ${Number(melhor.rendimento_final).toFixed(2)}.\n`;
    txt += `\nObrigado por utilizar o simulador!\n`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_investimentos.txt');
    res.send(txt);
  } catch (err) {
    console.error("Erro ao gerar relatório de investimento:", err);
    res.status(500).send("Erro ao gerar relatório.");
  }
});

// ===============================
// EMPRÉSTIMO
// ===============================

router.post("/simular-emprestimo", async (req: Request, res: Response) => {
  const { nome_usuario, valor_total, parcelas, tipo_juros, taxa_juros } = req.body;

  if (!nome_usuario || valor_total <= 0 || parcelas <= 0 || taxa_juros < 0) {
    return res.status(400).json({ erro: "Dados inválidos." });
  }

  const dataAtual = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const capitalBase = valor_total / parcelas;
  const resultados: { parcela: number; total: number; juros: number }[] = [];

  for (let i = 1; i <= parcelas; i++) {
    let totalParcela: number;
    if (tipo_juros === 'simples') {
      totalParcela = calcularJurosSimples(capitalBase, taxa_juros, i);
    } else {
      totalParcela = calcularJurosComposto(capitalBase, taxa_juros, i);
    }

    const juros = totalParcela - capitalBase;
    resultados.push({
      parcela: i,
      total: Number(totalParcela.toFixed(2)),
      juros: Number(juros.toFixed(2)),
    });
  }

  await pool.query(
    `INSERT INTO simulacoes_emprestimo (nome_usuario, valor_total, parcelas, taxa_juros, tipo_juros, data_simulacao)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [nome_usuario, valor_total, parcelas, taxa_juros, tipo_juros, dataAtual]
  );

  res.json({ parcelas: resultados });
});

// ===============================
// RELATÓRIO EMPRÉSTIMO - NOVO FORMATO
// ===============================

router.get("/baixar-relatorio-emprestimo", async (req: Request, res: Response) => {
  const usuario = req.query.usuario as string;

  if (!usuario) {
    return res.status(400).send("Usuário não especificado.");
  }

  try {
    const ultimaDataResult = await pool.query(
      `SELECT MAX(data_simulacao) AS ultima_data FROM simulacoes_emprestimo WHERE nome_usuario = $1`,
      [usuario]
    );

    const ultimaData = ultimaDataResult.rows[0].ultima_data;

    if (!ultimaData) {
      return res.status(404).send("Nenhuma simulação encontrada.");
    }

    const result = await pool.query(
      `
      SELECT *
      FROM simulacoes_emprestimo
      WHERE nome_usuario = $1 AND data_simulacao = $2
      `,
      [usuario, ultimaData]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Nenhuma simulação de empréstimo encontrada.");
    }

    const s = result.rows[0];

    const capitalBase = s.valor_total / s.parcelas;
    const resultados: { parcela: number; total: number; juros: number }[] = [];

    for (let i = 1; i <= s.parcelas; i++) {
      let totalParcela: number;
      if (s.tipo_juros === 'simples') {
        totalParcela = calcularJurosSimples(capitalBase, s.taxa_juros, i);
      } else {
        totalParcela = calcularJurosComposto(capitalBase, s.taxa_juros, i);
      }

      const juros = totalParcela - capitalBase;
      resultados.push({
        parcela: i,
        total: Number(totalParcela.toFixed(2)),
        juros: Number(juros.toFixed(2)),
      });
    }

    const totalGasto = resultados.reduce((acc, p) => acc + p.total, 0);
    const totalJuros = resultados.reduce((acc, p) => acc + p.juros, 0);

    let txt = `Olá ${usuario},\n\n`;
    txt += `Aqui estão os detalhes da sua última simulação de empréstimo:\n\n`;
    txt += `- Valor Total: R$ ${Number(s.valor_total).toFixed(2)}\n`;
    txt += `- Parcelas: ${s.parcelas}\n`;
    txt += `- Tipo de Juros: ${s.tipo_juros}\n`;
    txt += `- Taxa de Juros: ${s.taxa_juros}%\n\n`;

    txt += `Tabela de Parcelas:\n`;
    txt += `Parcela | Valor Total (R$) | Juros (R$)\n`;
    txt += `---------------------------------------\n`;
    resultados.forEach(p => {
      txt += `${p.parcela.toString().padEnd(7)} | ${p.total.toFixed(2).padEnd(15)} | ${p.juros.toFixed(2)}\n`;
    });

    txt += `\nTotal Gasto: R$ ${totalGasto.toFixed(2)}\n`;
    txt += `Total de Juros Pagos: R$ ${totalJuros.toFixed(2)}\n\n`;

    txt += `Análise de Quitação Antecipada:\n`;
    txt += `Para reduzir o custo total do empréstimo, a melhor estratégia é antecipar as últimas parcelas primeiro, pois são as que concentram maior quantidade de juros acumulados.\n`;
    txt += `Se você tiver capital disponível, solicite ao banco a quitação das últimas parcelas. Isso pode gerar uma boa economia.\n`;

    txt += `\nObrigado por utilizar o simulador!\n`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_emprestimo.txt');
    res.send(txt);
  } catch (err) {
    console.error("Erro ao gerar relatório de empréstimo:", err);
    res.status(500).send("Erro ao gerar relatório.");
  }
});

export default router;
