# Painel Online de Gestão de Planilhas Numbers & Google Drive

Painel web completo e moderno para gerenciamento, acompanhamento e projeção orçamentária integrado diretamente com suas planilhas do Apple Numbers (`.numbers`) localizadas no Google Drive (`~/Library/CloudStorage/GoogleDrive-reisfilho1116@gmail.com/My Drive/Numbers`).

---

## 🚀 Como Executar

O servidor já está ativo e rodando. Para reiniciar ou abrir no futuro, basta executar na pasta do projeto:

```bash
./start.sh
```

Acesse no seu navegador: **[http://localhost:8000](http://localhost:8000)**

---

## ✨ Funcionalidades Principais

1. **Leitura e Sincronização Direta com Google Drive**:
   - Lê nativamente todos os arquivos `.numbers` (incluindo o formato de Outubro de 2026, meses anteriores e históricos).
   - Botão **Sincronizar no Google Drive** para regravar e atualizar a planilha original diretamente na nuvem.

2. **Gestão de Próximos Meses (Futuras Planilhas)**:
   - Botão **+ Novo Mês**: cria meses futuros (ex: Novembro 2026, Dezembro 2026, 2027...).
   - **Clonagem Inteligente**:
     - Copia despesas fixas recorrentes (aluguel, água, luz, contabilidade, escola, etc.).
     - Reseta o status para "Pendente" no novo mês.
     - Ajusta as datas de vencimento automaticamente para o novo mês.
     - Transfere o saldo positivo restante como "Economias (Mês anterior)".
     - Gera o arquivo `.numbers` diretamente no Google Drive.

3. **Controle Interativo de Contas & Liquidação**:
   - Checkbox com 1 clique para alternar entre **PAGO** e **PENDENTE**.
   - Atualização em tempo real de KPIs: Entradas, Despesas, Total Pago, Pendente a Pagar e Saldo Restante.
   - Animação festiva de confetti quando todas as contas do mês forem quitadas!
   - Alerta visual de **Próximos Vencimentos** prioritários com baixa rápida.

4. **Gráficos e Indicadores Visuais**:
   - **Distribuição por Categoria**: Casa vs. Pessoal vs. Crédito.
   - **Top 5 Maiores Gastos**: Ranking das principais despesas do mês.
   - **Cronograma Diário Acumulado**: Linha do tempo de vencimentos ao longo dos 31 dias.
   - **Aba Comparativo / Histórico**: Gráficos e tabela comparativa de todos os 18 meses indexados.

5. **Exportação Multi-formato**:
   - Download da planilha Apple Numbers (`.numbers`).
   - Download de planilha Excel estilizada (`.xlsx`).

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: Python 3.11, FastAPI, Uvicorn, `numbers-parser`, `openpyxl`, Pydantic.
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti, Vite.
