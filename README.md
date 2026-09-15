# Magia Glass | Site-cliente VireMarca

> **Modelo:** Core → Template Serviços → **Site-cliente Magia Glass**  
> **Nicho:** Vidraçaria / Serviços premium, Florianópolis (Norte da Ilha)

## Princípio de implementação

A camada visual existente é a fonte de verdade do produto. A migração para produção adiciona runtime, autenticação e persistência **sem redesenhar o site aprovado**.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 15** + TypeScript |
| Persistência | **Turso / libSQL** |
| Auth admin | Cookie httpOnly assinado (HMAC) + bcrypt |
| Deploy | Vercel |

## Variáveis de ambiente

```bash
TURSO_DATABASE_URL=libsql://seu-banco.turso.io
TURSO_AUTH_TOKEN=
ADMIN_SECRET=
ADMIN_INITIAL_PASSWORD=
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
```

`TURSO_AUTH_TOKEN`, `ADMIN_SECRET` e `ADMIN_INITIAL_PASSWORD` são segredos e devem existir somente nas variáveis de ambiente da Vercel ou no ambiente local seguro.

## Desenvolvimento

```bash
npm install
npm run dev
```

- Site: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## Produção

O build copia a camada HTML/CSS/JS e os assets aprovados para `public/` antes do `next build`. Assim, o visual existente continua sendo servido pela aplicação Next.js enquanto as APIs usam Turso.

O primeiro login cria o usuário administrativo a partir de `ADMIN_INITIAL_PASSWORD`. Depois disso, a senha deve ser alterada pelo próprio painel administrativo.

## Governança

- `main` = fonte de verdade
- Token Turso nunca no frontend nem no Git
- 1 repo / 1 Vercel / 1 banco
- Rodapé padrão: `© 2026 Magia Glass · Todos os direitos reservados. · Desenvolvido por VireMarca`

---

**VireMarca** — fábrica de sites por nicho.
