import React, { useState } from 'react';

interface Parcela {
  parcela: number;
  total: number;
  juros: number;
}

const EmprestimoForm = () => {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [valor, setValor] = useState(0);
  const [parcelas, setParcelas] = useState(0);
  const [taxa, setTaxa] = useState(0);
  const [tipo, setTipo] = useState<'simples' | 'composto'>('simples');
  const [resultado, setResultado] = useState<Parcela[]>([]);

  const simular = async () => {
    if (!nomeUsuario || valor <= 0 || parcelas <= 0 || taxa < 0) {
      alert("Preencha o nome e os campos numéricos corretamente.");
      return;
    }

    localStorage.setItem('usuario', nomeUsuario);

    const res = await fetch('http://localhost:3000/api/simular-emprestimo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_usuario: nomeUsuario,
        valor_total: valor,
        parcelas,
        taxa_juros: taxa,
        tipo_juros: tipo,
      }),
    });

    const data = await res.json();
    setResultado(data.parcelas);
  };

  const totalGasto = resultado.reduce((acc, p) => acc + p.total, 0);
  const totalJuros = resultado.reduce((acc, p) => acc + p.juros, 0);

  return (
    <div>
      <div className="input-group">
        <input
          type="text"
          placeholder="Nome do usuário"
          value={nomeUsuario}
          onChange={e => setNomeUsuario(e.target.value)}
        />
      </div>
      
      <div className="input-group">
        <input type="number" placeholder="Valor total" min={1} onChange={e => setValor(+e.target.value)} />
      </div>
      
      <div className="input-group">
        <input type="number" placeholder="Parcelas" min={1} onChange={e => setParcelas(+e.target.value)} />
      </div>
      
      <div className="input-group">
        <input type="number" placeholder="Taxa (%)" min={0} onChange={e => setTaxa(+e.target.value)} />
      </div>
      
      <div className="input-group">
        <select onChange={e => setTipo(e.target.value as 'simples' | 'composto')}>
          <option value="simples">Juros Simples</option>
          <option value="composto">Juros Compostos</option>
        </select>
      </div>
      
      <button onClick={simular}>Simular</button>

      {resultado.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>Parcela</th>
                <th>Valor Total (R$)</th>
                <th>Juros (R$)</th>
              </tr>
            </thead>
            <tbody>
              {resultado.map(p => (
                <tr key={p.parcela}>
                  <td>{p.parcela}</td>
                  <td>{p.total.toFixed(2)}</td>
                  <td>{p.juros.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="results-summary">
            <p>Total Gasto: R$ {totalGasto.toFixed(2)}</p>
            <p>Total de Juros Pagos: R$ {totalJuros.toFixed(2)}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default EmprestimoForm;