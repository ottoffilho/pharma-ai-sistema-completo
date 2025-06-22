# Mapa de Páginas e Rotas – Pharma.AI

> Última geração: 2025-06-12
>
> • Estrutura baseada em `src/App.tsx` (React-Router). • Hierarquia indicada por
> recuo. ➜ indica descrição resumida. • Parâmetros dinâmicos são mostrados entre
> `:`.

---

## 1. Páginas Públicas (sem login)

- `/`\
  ➜ Landing page / tela inicial para usuários não autenticados.
- `/login`\
  ➜ Formulário de autenticação.
- `/primeiro-acesso`\
  ➜ Wizard para configurar conta após convite.
- `/esqueci-senha`\
  ➜ Solicitar redefinição de senha.
- `/redefinir-senha`\
  ➜ Formulário para definir nova senha via token.
- `/aceitar-convite`\
  ➜ Aceitar convite de novo usuário.
- `/emergency-logout`\
  ➜ Força logout em caso de falha de sessão.

## 2. Páginas de Debug (sem auth, apenas DEV)

- `/admin-debug`
  - `` (raiz) ➜ Dashboard administrativo completo (debug).
  - `usuarios` ➜ Listagem de usuários (debug).

## 3. Área Protegida – `/admin` (requere login Supabase)

```
/admin
│
├── (raiz) ➜ DashboardRouter – carrega painel conforme perfil (Atendente, Farmacêutico, Manipulador, Administrador)
│
├── diagnostico-sistema ➜ Diagnóstico e health-check do backend.
│
├── pedidos
│   ├── `` (dashboard de pedidos)
│   ├── listar ➜ Lista completa de pedidos
│   ├── nova-receita ➜ Upload/parse de nova receita
│   └── :id ➜ Detalhes do pedido/receita processada
│
├── estoque
│   ├── `` (overview de estoque)
│   ├── importacao-nf ➜ Importar Nota Fiscal
│   ├── produtos
│   │   ├── `` ➜ Lista de produtos
│   │   ├── novo ➜ Cadastro de produto
│   │   ├── editar/:id ➜ Edição de produto
│   │   └── :id ➜ Detalhes do produto
│   └── lotes
│       ├── `` ➜ Lista de lotes de insumos
│       ├── novo ➜ Cadastro de lote
│       ├── editar/:id ➜ Edição de lote
│       └── :id ➜ Detalhes do lote
│
├── financeiro
│   ├── `` ➜ Visão geral financeira
│   ├── caixa ➜ Fluxo de caixa diário
│   ├── contas-a-pagar
│   │   ├── `` ➜ Lista de contas a pagar
│   │   ├── novo ➜ Nova conta
│   │   └── editar/:id ➜ Editar conta
│   └── categorias
│       ├── `` ➜ Lista de categorias financeiras
│       ├── novo ➜ Nova categoria
│       └── editar/:id ➜ Editar categoria
│
├── cadastros
│   ├── `` ➜ Visão geral de cadastros
│   └── fornecedores
│       ├── `` ➜ Lista de fornecedores
│       ├── novo ➜ Cadastro de fornecedor
│       └── editar/:id ➜ Editar fornecedor
│
├── producao
│   ├── `` ➜ Ordens de Produção (dashboard principal)
│   ├── overview ➜ Central de Produção (layout marketing + métricas)
│   ├── nova ➜ Criar nova ordem
│   ├── relatorios ➜ Relatórios de produção
│   ├── :id ➜ Detalhes da ordem
│   ├── :id/editar ➜ Editar ordem
│   └── :id/controle-qualidade ➜ Controle de qualidade da ordem
│
├── ia  (Inteligência Artificial)
│   ├── `` ➜ Visão geral de IA
│   ├── processamento-receitas ➜ Pipeline de processamento IA de receitas
│   ├── previsao-demanda ➜ Previsão de demanda de estoque
│   ├── otimizacao-compras ➜ Sugestão de compras
│   ├── analise-clientes ➜ Clusterização e LTV
│   └── monitoramento ➜ Monitorar drift / performance dos modelos
│
├── vendas
│   ├── `` ➜ Dashboard de vendas
│   ├── pdv ➜ Frente de caixa (PDV)
│   ├── historico ➜ Histórico de vendas
│   ├── caixa ➜ Controle de caixa de vendas
│   └── fechamento ➜ Fechamento diário
│
├── usuarios
│   ├── `` ➜ Gestão de usuários
│   ├── novo ➜ Criar usuário (protegido por permissão)
│   ├── editar/:id ➜ Editar usuário
│   ├── debug ➜ Página de debug de usuários
│   ├── debug-permissions ➜ Debug de permissões
│   ├── simple / backup / test-permissions ➜ Utilidades internas
│
├── clientes
│   ├── `` ➜ Gestão de clientes
│   ├── novo ➜ Novo cliente
│   ├── :id ➜ Detalhes do cliente
│   └── :id/editar ➜ Editar cliente
│
├── perfil ➜ Configurações do perfil logado
├── configuracoes
│   ├── `` ➜ Configurações gerais do sistema
│   └── markup ➜ Configurar markup de produtos
│
├── sistema/verificar-tabelas ➜ Ferramenta interna para verificar/gerar tabelas Supabase
│
└── vendas (ver seção vendas)

## 4. Páginas de Erro / utilitárias

- `/acesso-negado` ➜ Tela de acesso negado
- `/404` ➜ Página não encontrada

---

### Observações
1. Rotas duplicadas em `App.tsx` foram consolidadas acima.  
2. URLs dinâmicas (`:id`) aceitam UUIDs ou códigos; copie o ID real ao acessar.  
3. Algumas rotas marcadas como *Em breve* no UI possuem página, mas lógica interna ainda é mock.  
4. Caso alguma rota retorne 404, verifique se o módulo está habilitado e se o usuário possui permissão.
```
