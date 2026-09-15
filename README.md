# Magia Glass — Site-Cliente VireMarca

> **Modelo:** Core → Template Serviços → **Site-cliente Magia Glass**  
> Repositório: `danielTSIseg/viremarca-Vidracaria-1`  
> Nicho: Vidraçaria / Serviços premium — Florianópolis (Norte da Ilha)

## Stack (padrão produção VireMarca — igual corretor-2)

| Camada | Tecnologia |
|--------|------------|
| Framework | **Next.js 15** (App Router) + TypeScript |
| Persistência | **Turso / libSQL** (`viremarca-vidracaria-1-tsiseguranca`) |
| Auth admin | Cookie httpOnly assinado (HMAC) + bcrypt |
| Deploy | Vercel (1 projeto / 1 repo / 1 banco) |

## Variáveis de ambiente

```bash
TURSO_DATABASE_URL=libsql://viremarca-vidracaria-1-tsiseguranca.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=
ADMIN_SECRET=
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
```

## Desenvolvimento

```bash
npm install
npm run dev
```

- Site: http://localhost:3000  
- Admin: http://localhost:3000/admin/login  
- Senha demo: `magia2024` (trocar em produção)

## Estado da migração

Migração do HTML estático → Next.js + Turso **em andamento**.  
Scaffold e APIs já em `main`. Código completo local: `magia-next-build` / tarball do projeto.

## Governança

- `main` = fonte de verdade
- Token Turso **nunca** no frontend nem no Git
- 1 repo / 1 Vercel / 1 banco
- Rodapé: `© 2026 Magia Glass · Todos os direitos reservados. · Desenvolvido por VireMarca`

---

**VireMarca** — fábrica de sites por nicho.
