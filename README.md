# Magia Glass | Site-cliente VireMarca

> **Modelo:** Core → Template Serviços → **Site-cliente Magia Glass**  
> **Nicho:** Vidraçaria / Serviços premium, Florianópolis (Norte da Ilha)

## Princípio de implementação

A camada visual existente é a fonte de verdade do produto. A migração para produção adiciona runtime, autenticação, persistência e aceleração de leitura **sem redesenhar o site aprovado**.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 15** + TypeScript |
| Persistência | **Turso / libSQL** |
| Auth admin | Cookie httpOnly assinado (HMAC) + bcrypt |
| Deploy | Vercel |
| Cache de conteúdo | Cache local do navegador + stale-while-revalidate + HTTP ETag |

## Persistência e cache

O **Turso/libSQL continua sendo a única fonte de verdade**. O navegador não substitui o banco e não é usado como persistência de conteúdo administrativo.

O conteúdo público usa uma estratégia **stale-while-revalidate**:

1. Se existir uma cópia local válida do conteúdo público, ela é aplicada imediatamente para evitar uma nova tela vazia/carregamento visual a cada visita.
2. Em paralelo, o navegador consulta `/api/content` em segundo plano.
3. A API calcula um **ETag SHA-256** do conteúdo atual e aceita `If-None-Match`.
4. Se nada mudou, responde `304 Not Modified`, sem reenviar o payload.
5. Se mudou, responde com a nova versão, atualiza o cache local e o DOM sem redesenhar a interface.
6. Se a rede falhar, a cópia local continua sendo usada quando disponível.

O cache local é limitado a aproximadamente **1,8 MB** para evitar transformar `localStorage` em depósito de imagens/Base64. Se o conteúdo ultrapassar esse limite, ele continua funcionando com a fonte de verdade no servidor, sem forçar armazenamento local.

**Credenciais, sessão administrativa e segredos não são armazenados nesse cache público.** Imagens continuam seguindo a estratégia própria de carregamento do site; o cache de conteúdo serve principalmente para os dados do CMS.

A escolha de cache local para o payload pequeno e estruturado evita bloquear o primeiro paint com uma consulta ao banco. `localStorage` é síncrono, por isso o limite é deliberadamente conservador. Para dados maiores ou binários, a plataforma web oferece [IndexedDB](https://developer.mozilla.org/pt-BR/docs/Web/API/IndexedDB_API), que é assíncrono e apropriado para volumes estruturados maiores.

A validação HTTP usa [ETag/If-None-Match](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Headers/ETag), permitindo que o servidor confirme uma versão inalterada com `304` sem retransmitir o corpo completo.

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
- Turso = fonte de verdade dos dados do CMS
- Cache local = acelerador, nunca autoridade
- Token Turso nunca no frontend nem no Git
- 1 repo / 1 Vercel / 1 banco
- Rodapé padrão: `© 2026 Magia Glass · Todos os direitos reservados. · Desenvolvido por VireMarca`

---

**VireMarca** — fábrica de sites por nicho.
