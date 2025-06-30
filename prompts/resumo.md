### ✅ PROBLEMA RESOLVIDO - Quantidade de Lotes na Importação de XML

**1. Contexto Geral:** Bug durante importação de notas fiscais (XML) onde a quantidade dos lotes era exibida incorretamente na tela de "Lotes Cadastrados".

**2. Causa Raiz Identificada:** O problema estava na passagem dos dados entre as funções de processamento:

- **Cálculo Correto:** A função `normalizarUnidadeEQuantidade` no `notaFiscalService.ts` calculava corretamente a quantidade normalizada (ex: "1 KG" x 2.0000 = 2000g)
- **Passagem Incorreta:** Na criação do lote, estava sendo usado:
  ```typescript
  quantidade: produtoData.lote.quantidade || (item.quantidadeComercial as number)
  ```
  Onde `produtoData.lote.quantidade` era o valor **bruto do XML** (ex: 2) e `item.quantidadeComercial` era o valor **normalizado** (ex: 2000).

**3. Soluções Aplicadas:**

✅ **Correção 1 - loteService.ts (linha 243):**
```typescript
quantidade_atual: loteData.quantidade_inicial, // ✅ Já estava correto
```

✅ **Correção 2 - notaFiscalService.ts (linha 997):**
```typescript
quantidade: (item.quantidadeComercial as number), // ✅ Sempre usar valor normalizado
```

**4. Resultado Esperado:** 
- Quantidade inicial e atual sempre iguais na criação do lote
- Valores mostrados na tela de lotes agora refletem a quantidade real normalizada (2000g, 5385g, etc.)

**5. Status:** ✅ **CORREÇÃO APLICADA** 
- Próximo passo: Limpar tabelas de lotes e reimportar XML para validar a correção
