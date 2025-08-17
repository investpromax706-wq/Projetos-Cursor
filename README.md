# Barbearia PWA – App de Gestão

Aplicativo PWA completo para gestão de barbearia: agenda, clientes, barbeiros, serviços, caixa e estoque. Funciona no navegador, pode ser instalado no dispositivo e suporta uso offline básico.

## Stack
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Frontend: React + Vite + vite-plugin-pwa
- Auth: JWT (login por email/senha)

## Requisitos
- Node.js 18+

## Como rodar (desenvolvimento)
1. Instalar dependências:
```bash
npm --prefix /workspace/server install
npm --prefix /workspace/web install
```
2. Iniciar o backend (porta 3001):
```bash
npm --prefix /workspace/server start
```
3. Em outro terminal, iniciar o frontend (porta 5173):
```bash
npm --prefix /workspace/web run dev
```
4. Acesse `http://localhost:5173`

Credenciais iniciais:
- Email: `admin@barbearia.local`
- Senha: `admin123`

## Build de produção
```bash
npm --prefix /workspace/web run build
npm --prefix /workspace/web run preview
```

## Estrutura
- `server/`: API REST + banco SQLite
- `web/`: PWA React

## PWA
- Manifest e Service Worker via `vite-plugin-pwa`
- Cache de assets e fallback básico offline

## Variáveis de ambiente (server/.env)
- `PORT` (padrão 3001)
- `JWT_SECRET` (padrão dev-secret)