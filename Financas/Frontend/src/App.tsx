import React from 'react';
import EmprestimoForm from './components/EmprestimoForm';
import InvestimentoForm from './components/InvestimentoForm';
import RelatorioInvestimento from './components/Relatorio';
import './styles.css';

function App() {
  return (
    <div className="container">
      <div className="card">
        <div className="header">
          <h1>Simulador Financeiro</h1>
        </div>
        
        <div className="card-body">
          <div className="card">
            <div className="card-header">Simular Empréstimo</div>
            <div className="card-body">
              <EmprestimoForm />
            </div>
          </div>

          <div className="hr-divider" />

          <div className="card">
            <div className="card-header">Simular Investimento</div>
            <div className="card-body">
              <InvestimentoForm />
            </div>
          </div>

          <div className="hr-divider" />

          <div className="card">
            <div className="card-header">Relatórios</div>
            <div className="card-body">
              <RelatorioInvestimento />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;