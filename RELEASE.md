# Release Process & Environment Map

Documento operativo: come si releasea, dove vive cosa, come si rolla indietro.
Aggiorna **questa pagina** ogni volta che la procedura cambia — è il riferimento
da consultare al volo prima di ogni deploy non banale.

## 🗺️ Ambiente map

| Componente | Prod | Staging |
|---|---|---|
| **Website** | `rescuemanager.eu` (Vercel, branch `main`) | `staging.rescuemanager.eu` (Vercel, branch `staging`) |
| **Supabase** | `ienzdgrqalltvkdkuamp.supabase.co` | TBD (richiede Supabase Pro + branching) |
| **Mobile (Expo)** | EAS channel `production` | EAS channel `preview` |
| **Desktop (Electron)** | Auto-update da `https://rescuemanager.eu/api/app-update` | Build manuale |
| **SDI-WS** | `sdi-ws.rescuemanager.eu` (VPS PM2 :3008) | `sdi-ws-test.rescuemanager.eu` (PM2 :3007) |
| **OAuth** | `oauth.rescuemanager.eu` (VPS PM2) | `staging-oauth-proxy-server` PM2 |

## 🌿 Branch model

```
main          ─── (prod, deploy automatico, branch protected)
  ↑ merge tramite PR review
staging       ─── (testing, deploy automatico a staging.rescuemanager.eu)
  ↑ merge libero
feat/*        ─── (feature branches, PR target = staging)
```

## ⚙️ CI/CD pipeline

| Trigger | Workflow | Cosa fa |
|---|---|---|
| PR aperta verso `main` o `staging` | `.github/workflows/ci-verify.yml` | Type check + Next.js build. Blocca merge se rotto |
| Push a `main` (modifica `supabase/migrations/**`) | `.github/workflows/migrate-prod.yml` | `supabase db push --linked` su prod Supabase |
| Push a `main` (qualunque cambio) | Vercel auto-deploy | Build + deploy su `rescuemanager.eu` |
| Push a `staging` | Vercel auto-deploy | Build + deploy su `staging.rescuemanager.eu` |
| EAS Build trigger | `eas build --profile production` | Build mobile iOS/Android |

## 🚀 Release procedure (standard)

1. **Sviluppo**: crea branch `feat/qualcosa` da `staging`
2. **PR**: apri PR `feat/qualcosa` → `staging`
3. **CI verde**: workflow ci-verify deve passare
4. **Merge a staging**: Vercel deploya su `staging.rescuemanager.eu`
5. **Test su staging**: verifica feature, esegui smoke test
6. **Promote a prod**: apri PR `staging` → `main`
7. **CI verde + review**: minimo 1 reviewer (quando avrai team), CI verde
8. **Merge a main**:
   - Vercel auto-deploy su prod
   - GitHub Action `migrate-prod.yml` applica migrations Supabase (se ce ne sono)
9. **Smoke test prod**: 5-10 min dopo deploy, verifica endpoint critici
10. **Aggiorna `CHANGELOG.md`** con la riga della release

## 🔥 Rollback procedure

### Web (Vercel)
1. Dashboard Vercel → Deployments → trova il deploy precedente OK
2. Click "⋯" → **Promote to Production**
3. ~30s, prod torna al codice precedente

### Database (Supabase)
**Postgres non ha rollback automatico**. Per "undo":
1. Crea una **nuova migration** che inverte la precedente:
   - DROP COLUMN se aggiunta
   - DROP TABLE se creata
   - ALTER COLUMN se modificata
2. Push branch + merge a main → workflow applica
3. **Sempre** scrivere migration "additive" quando possibile (ADD COLUMN, mai DROP) per evitare rollback distruttivi

### Mobile (EAS)
1. `eas update --channel production --message "Rollback to v1.2.3"` pesca da una build precedente
2. OTA update istantaneo a tutti gli utenti

### Desktop (Electron)
1. Su Vercel: ripristina `latest-mac.yml` / `latest.yml` precedenti in `/api/app-update`
2. electron-updater scarica al prossimo check (default 1h dopo avvio)

## 🛑 Maintenance window (manuale)

Per deploy rischiosi (es. migration di tabelle critiche):
1. Annuncia su status page (UptimeRobot maintenance)
2. Flippa `system_config.maintenance_mode = true` (TODO: implementare flag)
3. Frontend mostra banner "Manutenzione in corso, ritorniamo alle HH:MM"
4. Applica deploy + migration
5. Smoke test
6. Flippa `maintenance_mode = false`
7. Annuncia fine maintenance

## 🔐 Secrets richiesti

### GitHub Actions (Settings → Secrets and variables → Actions)
- `SUPABASE_ACCESS_TOKEN`: Personal Access Token (genera su [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens))
- `SUPABASE_DB_PASSWORD`: password DB del progetto prod
- `SUPABASE_PROJECT_ID`: `ienzdgrqalltvkdkuamp`

### Vercel (Settings → Environment Variables)
Per **Production**:
- `NEXT_PUBLIC_SUPABASE_URL`: `https://ienzdgrqalltvkdkuamp.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (dal dashboard Supabase)
- `SUPABASE_SERVICE_ROLE_KEY`: (dashboard, SERVER-ONLY)
- `PAIRING_JWT_SECRET`: 32+ bytes random (`openssl rand -base64 32`)
- `STAFF_JWT_SECRET`: 32+ bytes random
- ...altri (vedi `.env.example`)

Per **Preview** (`staging.rescuemanager.eu`): stesso set, con valori puntati al Supabase staging quando esisterà.

## 📝 Stato attuale & TODO

Aggiornato 2026-05-25:

- ✅ Branch `main` (prod) e `staging` esistono su remote
- ✅ Vercel auto-deploy da `main`
- ✅ Migrations Supabase versionate in `supabase/migrations/`
- ✅ GitHub Actions: `ci-verify.yml` + `migrate-prod.yml`
- ❌ **`staging` branch va aggiornato da main** (è old)
- ❌ **Branch protection su `main`**: aggiungere required reviews + CI green (GitHub → Settings → Branches → Add rule)
- ❌ **Supabase Pro + branching**: serve upgrade per DB staging automatico
- ❌ **Vercel preview env vars**: settare le var per il deploy staging
- ❌ **GitHub secrets** per migration runner: vedi sopra
- ❌ **Status page**: UptimeRobot configurazione (discussa, da setupare)
- ❌ **Maintenance flag** in DB + banner frontend
- ❌ **Feature flags**: GrowthBook o tabella custom (futuro)
- ❌ **CI per RescueMobile e desktop-app**: ancora manuale

## 🎯 Roadmap suggerita

### Fase 1 (ora) — Foundation
- [x] Workflow CI verify + migration runner (questo PR)
- [ ] Settare i 3 GitHub secrets
- [ ] Branch protection su `main` (almeno: required CI green, no force push)
- [ ] Aggiornare branch `staging` da main

### Fase 2 — Staging completo
- [ ] Upgrade Supabase a Pro ($25/mese)
- [ ] Abilitare Supabase branching (gratis con Pro)
- [ ] Vercel: env vars per preview/staging puntate a Supabase branch
- [ ] Migration workflow per staging branch

### Fase 3 — Mobile + Desktop
- [ ] GitHub Action per RescueMobile: `eas build` + `eas update` automatico
- [ ] GitHub Action per desktop: build firmato + upload R2 + update yml

### Fase 4 — Nice-to-have
- [ ] Feature flags (GrowthBook)
- [ ] Sentry su tutti i progetti
- [ ] Maintenance flag + banner
- [ ] CHANGELOG.md auto-generato (release-please o conventional-changelog)
