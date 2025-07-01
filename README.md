# Pharma.AI - Sistema de Gestão para Farmácias de Manipulação

![Pharma.AI](https://img.shields.io/badge/Pharma.AI-v4.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-98%25-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)
![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E)
![Playwright](https://img.shields.io/badge/Tests%20E2E-Passing-2EAD33)
![CI/CD](https://img.shields.io/badge/CI%2FCD-Missing-red)

## 1. Visão Geral

Pharma.AI é um sistema de gestão completo (ERP) projetado especificamente para
farmácias de manipulação. A plataforma é construída com uma stack moderna e
robusta, focada em performance, segurança e escalabilidade, utilizando React
(Vite) no frontend e Supabase como Backend as a Service (BaaS).

Este repositório contém o código-fonte completo da aplicação, incluindo o
frontend, as funções serverless (Edge Functions) e as migrações de banco de
dados.

## 2. Stack Tecnológica

- **Frontend:**
  - **Framework:** React 18+ com TypeScript
  - **Build Tool:** Vite
  - **UI Kit:** shadcn/ui
  - **Estilização:** Tailwind CSS
  - **Estado do Servidor:** TanStack Query (React Query)
  - **Formulários:** React Hook Form + Zod
- **Backend (Supabase):**
  - **Banco de Dados:** PostgreSQL com RLS (Row Level Security) ativado
  - **Autenticação:** Supabase Auth
  - **Funções Serverless:** Deno Edge Functions
  - **Interação com DB:** Exclusivamente via ferramentas **MCP Supabase**
- **Testes:**
  - **E2E:** Playwright
  - **Unitários:** Vitest + React Testing Library

## 3. Status da Auditoria (2025-06-27)

Uma auditoria completa do projeto foi realizada. O sistema está bem estruturado
e segue as melhores práticas, mas possui pontos críticos a serem resolvidos:

- **✅ Pontos Fortes:** Arquitetura moderna, padronização de código, segurança
  de banco de dados (RLS), e testes E2E para fluxos críticos.
- **❌ Pontos Críticos:**
  - **Ausência de CI/CD:** Não há um pipeline de integração contínua para
    automatizar builds e testes. **Esta é a prioridade máxima a ser
    implementada.**
  - **Baixa Cobertura de Testes Unitários:** A lógica de negócio crítica precisa
    de uma cobertura de testes maior para garantir a estabilidade.

Para mais detalhes, consulte o relatório completo em
[`docs/auditoria/2025-06-27_STATUS_PROJETO.md`](./docs/auditoria/2025-06-27_STATUS_PROJETO.md).

## 4. Como Começar (Ambiente de Desenvolvimento)

1. **Clone o repositório:**
   ```bash
   git clone [URL_DO_REPOSITORIO]
   cd pharma-dev
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Configuração de Ambiente:**
   - Crie um arquivo `.env` na raiz do projeto.
   - Adicione as variáveis de ambiente do Supabase (URL e chave `anon`):
     ```
     VITE_SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
     VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_SUPABASE
     ```
4. **Execute o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

## 5. Próximos Passos (Plano de Ação)

1. **Implementar CI/CD:** Adicionar um workflow de GitHub Actions para build e
   teste automatizados.
2. **Aumentar Testes Unitários:** Focar nos hooks e componentes complexos.
3. **Limpeza do Repositório:** Remover arquivos de backup (`.bak`) e padronizar
   scripts SQL.
