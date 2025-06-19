import React from 'react';

const ImagemUpload = () => {
  return (
    <div>
      <h2>Upload de Imagem</h2>
      <input type="file" accept="image/*" />
      <p>(ex: comprovante, gráfico, documento escaneado...)</p>
    </div>
  );
};

export default ImagemUpload;
