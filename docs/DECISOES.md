# Decisões — Magia Glass

## 2026-10-02 — Deploy automático desabilitado
A branch de correção usa `git.deploymentEnabled` com Production somente na `main`. A finalidade é impedir Preview/Production automáticos durante a construção e reservar a publicação para o merge controlado.

## 2026-10-02 — Fonte pública de domínio
A URL pública usa `NEXT_PUBLIC_SITE_URL`, com fallback para a URL de Production conhecida. URLs de preview não são usadas em canonical, sitemap ou compartilhamento.

## 2026-10-02 — Compatibilidade de mídia
O runtime deve aceitar tanto `data:image/*` legado quanto URLs HTTPS até a migração autorizada para Blob.

## 2026-10-02 — Renderização
A decisão entre SSR/ISR e plano B será tomada somente após comparação visual em 375×812 e 1440×900. O visual aprovado é a fonte de verdade.
