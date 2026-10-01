# Diário de Atividades

O **Diário de Atividades** é uma aplicação web focada em registrar o que você *realmente fez* durante o dia. Em vez de funcionar como um planejador rigoroso (to-do list), ele serve como um repositório da sua execução, gerando insights valiosos sobre alocação de tempo, impacto gerado e oscilações de energia em diferentes horários.

A IA (Gemini) está integrada para ajudar na classificação e formatação automática das descrições das atividades.

## Arquitetura & Stack Tecnológica

- **Next.js 16 (App Router)** - Framework React para SSR, rotas e server actions.
- **React 19** - Componentes, Hooks e Suspense para UI.
- **TypeScript** - Tipagem estática em toda a aplicação.
- **Prisma (v5)** - ORM para acesso estruturado ao banco de dados.
- **SQLite** - Banco de dados local para armazenar as atividades (`prisma/dev.db`).
- **Google Gemini API** (`@google/genai`) - IA que processa e sugere formatação ou metadados das atividades.
- **Recharts** - Biblioteca para gerar os gráficos dos dashboards diário e semanal.
- **Lucide React** - Ícones limpos e modernos usados pela interface.

## Funcionalidades Principais

1. **Registro Rápido de Atividades:** Formulário direto com campos como duração (início e fim), impacto, energia antes e depois, tipo de atividade e classificação de área. Opção de aprimorar descrições via IA.
2. **Dashboard Diário (`/`):** Visão rápida do dia, onde o seu tempo e suas energias foram alocados e quais atividades geraram maior impacto.
3. **Dashboard Semanal (`/semana`):** Visão estendida da semana atual, trazendo a evolução temporal do tempo gasto, quantidade de impacto alto por dia e cruzamento de impacto x energia.
4. **Visão Geral e Edição (`/dados`):** Tabela robusta com todas as atividades cadastradas, exportação para CSV e dezenas de filtros disponíveis (Data, Área, Retorno, etc). A partir dela é possível editar e deletar atividades já cadastradas.

## Como Executar Localmente

### Pré-requisitos
- Node.js versão >= 18.x
- Conta e Chave API do Google Gemini (`GEMINI_API_KEY`)

### Passo a passo

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configuração de Variáveis de Ambiente:**
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione a sua chave API do Gemini no formato:
     ```env
     GEMINI_API_KEY=sua_chave_aqui
     ```

3. **Inicie o Banco de Dados (Prisma/SQLite):**
   - Gere o cliente do Prisma e atualize o schema:
     ```bash
     npx prisma generate
     npx prisma db push
     ```

4. **Gerar Dados de Demonstração (Opcional):**
   - Para não iniciar com o aplicativo vazio, você pode popular o banco com 7 dias de dados aleatórios gerados automaticamente:
     ```bash
     npx tsx prisma/seed.ts
     ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

O aplicativo estará disponível em: [http://localhost:3000](http://localhost:3000).
