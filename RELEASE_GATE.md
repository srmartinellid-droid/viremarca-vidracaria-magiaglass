# Release Gate — Magia Glass

## Escopo
Este contrato vale exclusivamente para `srmartinellid-droid/viremarca-vidracaria-magiaglass` e o projeto Vercel `viremarca-vidracaria-magiaglass`.

## Fonte de verdade
- Código: branch `main`
- Build: `npm run build`
- Backend: Turso/libSQL Magia Glass
- Publicação: Vercel `prj_1aVC3FkJ1VcwgqepuDd0nks10N8k`
- Identidade: `/build-info.json`

## Gate antes do merge
1. `fix/nota-10` contém todas as mudanças.
2. `npm ci`, `tsc --noEmit`, lint e build passam.
3. Testes locais usam banco `file:` e dados fictícios.
4. Não houve escrita no banco de produção durante testes.
5. Nenhum segredo aparece no diff.
6. Visual e fluxos críticos foram testados em 375×812 e 1440×900.
7. Lighthouse mobile foi executado nas quatro páginas públicas.

## Frente G — validação automatizada
O workflow `.github/workflows/validate.yml` executa o gate técnico com `npm ci`, TypeScript, ESLint e build. Em seguida inicia o build de produção local e coleta uma baseline Lighthouse mobile das quatro rotas públicas (`/`, `/servicos`, `/galeria`, `/contato`). O relatório é preservado como artifact do workflow. A baseline é informativa nesta etapa, sem transformar score de performance em bloqueio arbitrário.

## Gate de produção
1. O squash merge entra em `main`.
2. Existe somente o deployment Production autorizado desta entrega.
3. `/build-info.json` corresponde ao SHA publicado.
4. `/robots.txt`, `/sitemap.xml`, `/favicon.ico`, `/og-image` respondem 200.
5. As rotas públicas limpas respondem 200 e os antigos `.html` redirecionam 301.
6. Headers de segurança estão presentes.
7. `/api/content` fica abaixo do limite definido e atinge HIT após o primeiro aquecimento.
8. Login, CRUD, leads e WhatsApp são testados.
9. Migrações de produção só ocorrem após autorização expressa.

## Regra de parada
Falha não comprovada não é sucesso. Um terceiro deployment de Production exige parada imediata e aviso ao responsável.
