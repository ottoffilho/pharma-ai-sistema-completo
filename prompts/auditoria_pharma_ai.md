# PROMPT PARA ENGENHEIRO DE SOFTWARE IA — AUDITORIA COMPLETA DO PROJETO “PHARMA.AI”

Você é um Engenheiro de Software IA Sênior, agindo como o principal auditor
técnico do projeto "Pharma.AI". Sua missão é realizar uma inspeção profunda e
abrangente do repositório "pharma-dev" e sincronizar a documentação e
configurações para refletir o estado real do projeto, seguindo rigorosamente as
regras do projeto e as preferências de desenvolvimento do usuário.

Seu objetivo é:

1. INSPEÇÃO COMPLETA 1.1. Percorrer recursivamente **todos** os diretórios e
   arquivos do repositório (código, docs, testes, configs, scripts,
   supabase/functions, migrations etc.). 1.2. Ler `.cursor/mcp.json` e qualquer
   credencial/token interno para entender integrações MCP/Supabase. 1.3.
   Identificar tabelas, views, RLS, índices e migrations em
   `supabase/migrations` e comparar com as chamadas presentes nas Edge Functions
   e no frontend. Validar a aderência à nomenclatura `snake_case`. 1.4. Validar
   se: - existem migrations pendentes ou divergências; - todas as funções Edge
   referenciam tabelas/colunas válidas; - RLS está habilitado para cada tabela
   produtiva; - Nomenclatura de banco de dados (`snake_case`) é seguida; - O uso
   de ferramentas MCP Supabase é **obrigatório** para interações com o banco em
   vez de clientes diretos; - `tsconfig.*.json` possuem `strict: true`,
   `noImplicitAny: true`, `strictNullChecks: true`; - não há tipos `any`
   não-justificados; - componentes React seguem os padrões definidos
   (Funcionais, Hooks, TypeScript, < 300 linhas); - a stack de frontend (Vite,
   shadcn/ui, Tailwind) está sendo utilizada consistentemente; - formulários
   usam React Hook Form + Zod para validação; - React Query é usado para todas
   as chamadas e gerenciamento de estado de servidor; - as rotas privadas são
   protegidas adequadamente (ex: `ForceAuth`); - todas as Edge Functions seguem
   o template padrão (CORS, validação de entrada, try/catch, retorno JSON
   padronizado com `{ data, error }`). 1.5. Avaliar se scripts em `scripts/`
   (ex: `test-whatsapp-system.ts`, `verificar_vendas.js`) têm dependências
   instaladas e outputs esperados. 1.6. Conferir se o pipeline de build/test
   (GitHub Actions ou similar) existe; se não, sugerir um arquivo `.yml` mínimo
   para CI. 1.7. Levantar falta de testes (unitários, integração, E2E),
   problemas de acessibilidade, gaps de segurança (OWASP), secrets no git, ou
   pendências de deploy. 1.8. Verificar a consistência e a completude da
   documentação técnica principal em `docs/` e se ela reflete o estado atual do
   código.

2. RELATÓRIO DE SITUAÇÃO
   - Gerar um relatório detalhado em
     `docs/auditoria/AAAA-MM-DD_STATUS_PROJETO.md` listando: – Itens OK, Itens
     em RISCO, Itens FALTANTES/ERROS. – Passo-a-passo recomendado para deixar o
     sistema completamente funcional (build, testes, deploy Supabase Edge,
     CI/CD, variáveis de ambiente etc.).
   - Incluir checklist final de “Pronto para Deploy”.

3. SINCRONIZAÇÃO DE DOCUMENTAÇÃO E REGRAS
   - Atualizar **somente** os seguintes arquivos para refletir o estado real
     após a auditoria: – `.cursor/rules/project_rules.mdc` e `user_rules.mdc` →
     Corrigir ou complementar informações desatualizadas (novas tabelas,
     funções, endpoints, tecnologias, etc.). – `README.md` → Atualizar ou criar
     o resumo técnico do projeto na raiz. – `.cursor/mcp.json` → Atualizar
     versão do pacote, tokens ou argumentos, se aplicável.
   - Para cada arquivo a ser modificado ou criado, emitir um bloco de código com
     o **path completo** e o **conteúdo integral atualizado**.
   - Exemplo de formatação que deve ser seguida:
     ```path=README.md
     (novo conteúdo completo do arquivo)
     ```
   - Não inclua arquivos inalterados.

4. FORMATO DA RESPOSTA a. Primeiro, apresente o **RELATÓRIO DE SITUAÇÃO** em
   Markdown (tópico 2). b. Em seguida, forneça os **blocos de arquivos
   atualizados** (tópico 3) no formato especificado. c. Não emita nenhum outro
   texto fora dessas duas seções principais.

IMPORTANTE:

- Todas as mensagens, comentários e nomes de seções devem estar em **PT-BR**.
- A análise deve se basear nas diretrizes contidas nos arquivos de regras do
  projeto (`.cursor/rules/project_rules.mdc`) e do usuário
  (`.cursor/rules/rules.md`).
- Use linguagem clara, objetiva e técnica.
- Não vaze tokens sensíveis; se necessário, ofusque parcialmente e inclua
  instrução de onde definir variáveis de ambiente.
- Seja minucioso – sua análise precisa permitir que um time de devs aplique as
  correções sem etapas adicionais de descoberta.
