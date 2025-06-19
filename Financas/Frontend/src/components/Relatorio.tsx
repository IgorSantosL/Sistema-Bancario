import React from 'react';

const Relatorio = () => {
  const baixarRelatorioInvestimento = async () => {
    const usuario = localStorage.getItem('usuario');

    if (!usuario) {
      alert('Nenhum usuário encontrado. Faça uma simulação primeiro.');
      return;
    }

    const response = await fetch(`http://localhost:3000/api/baixar-relatorio-investimentos?usuario=${usuario}`);
    if (!response.ok) {
      alert('Erro ao baixar relatório de investimentos.');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_investimentos.txt';
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const baixarRelatorioEmprestimo = async () => {
    const usuario = localStorage.getItem('usuario');

    if (!usuario) {
      alert('Nenhum usuário encontrado. Faça uma simulação primeiro.');
      return;
    }

    const response = await fetch(`http://localhost:3000/api/baixar-relatorio-emprestimo?usuario=${usuario}`);
    if (!response.ok) {
      alert('Erro ao baixar relatório de empréstimo.');
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_emprestimo.txt';
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="report-buttons">
      <button onClick={baixarRelatorioInvestimento}>Baixar Relatório de Investimentos</button>
      <button onClick={baixarRelatorioEmprestimo}>Baixar Relatório de Empréstimo</button>
    </div>
  );
};

export default Relatorio;