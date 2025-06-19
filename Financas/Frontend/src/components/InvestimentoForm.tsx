import React, { useEffect, useState } from 'react';

interface Investimento {
  id: number | string;
  nome: string;
}

interface ResultadoSimulacao {
  nome_usuario: string;
  investimento: string;
  valor_investido: number;
  meses: number;
  rendimento_final: number;
}

const InvestimentoForm = () => {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [investimentoId, setInvestimentoId] = useState<string | null>(null);
  const [valor, setValor] = useState(0);
  const [meses, setMeses] = useState(0);
  const [resultados, setResultados] = useState<ResultadoSimulacao[]>([]);
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/investimentos')
      .then(res => res.json())
      .then(data => setInvestimentos(data))
      .catch(() => setInvestimentos([]));
  }, []);

  const simular = async () => {
    if (!investimentoId || !nomeUsuario || valor <= 0 || meses <= 0) {
      alert("Preencha nome, investimento, valor e meses com valores positivos.");
      return;
    }

    localStorage.setItem('usuario', nomeUsuario);

    const res = await fetch('http://localhost:3000/api/simular-investimento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_usuario: nomeUsuario,
        investimento_id: investimentoId,
        valor_investido: valor,
        meses,
      }),
    });

    const data = await res.json();
    if (Array.isArray(data)) {
      setResultados(data);
    } else {
      setResultados([data]);
    }
  };

  return (
    <div>
      <div className="input-group">
        <input
          type="text"
          placeholder="Insira seu nome"
          value={nomeUsuario}
          onChange={e => setNomeUsuario(e.target.value)}
        />
      </div>

      <div className="input-group">
        <select onChange={e => setInvestimentoId(e.target.value)} defaultValue="">
          <option value="" disabled>Tipo de investimento</option>
          {investimentos.map(inv => (
            <option key={inv.id} value={inv.id}>{inv.nome}</option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <input type="number" placeholder="Valor Investido" min={1} onChange={e => setValor(+e.target.value)} />
      </div>

      <div className="input-group">
        <input type="number" placeholder="Meses" min={1} onChange={e => setMeses(+e.target.value)} />
      </div>

      <button onClick={simular}>Simular</button>

      {resultados.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Investimento</th>
              <th>Valor Investido (R$)</th>
              <th>Meses</th>
              <th>Rendimento Final (R$)</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((res, idx) => (
              <tr key={idx}>
                <td>{res.nome_usuario}</td>
                <td>{res.investimento}</td>
                <td>{res.valor_investido.toFixed(2)}</td>
                <td>{res.meses}</td>
                <td>{res.rendimento_final.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InvestimentoForm;