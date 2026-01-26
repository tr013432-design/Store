import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import { Product } from '../types';

export const generateBarcodePDF = (products: Product[]) => {
  const doc = new jsPDF('p', 'mm', 'a4'); // A4 em Milímetros
  const marginX = 10;
  const marginY = 15;
  const colWidth = 65; // Largura da etiqueta
  const rowHeight = 35; // Altura da etiqueta
  const cols = 3; 
  const rows = 8; // Etiquetas por página

  let currentX = marginX;
  let currentY = marginY;
  let count = 0;

  products.forEach((product) => {
    // Se a página encher, cria nova
    if (count > 0 && count % (cols * rows) === 0) {
      doc.addPage();
      currentX = marginX;
      currentY = marginY;
    }

    // 1. Desenha a Borda da Etiqueta (opcional, ajuda a cortar)
    doc.setDrawColor(200); // Cinza claro
    doc.rect(currentX, currentY, colWidth - 2, rowHeight - 2);

    // 2. Nome do Produto (Cortado se for longo)
    doc.setFontSize(8);
    doc.text(product.name.substring(0, 25), currentX + 3, currentY + 5);

    // 3. Preço
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${product.price.toFixed(2)}`, currentX + 3, currentY + 10);

    // 4. Gera o Código de Barras em Canvas virtual
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, product.barcode || product.id, {
      format: "CODE128",
      displayValue: true,
      fontSize: 10,
      margin: 0,
      height: 40
    });
    
    // 5. Adiciona o Código de Barras ao PDF
    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    doc.addImage(imgData, 'JPEG', currentX + 3, currentY + 12, 50, 15);

    // 6. Calcula próxima posição
    count++;
    if (count % cols === 0) {
      currentX = marginX; // Volta p/ esquerda
      currentY += rowHeight; // Desce linha
    } else {
      currentX += colWidth; // Avança coluna
    }
  });

  doc.save('etiquetas_sara_store.pdf');
};
