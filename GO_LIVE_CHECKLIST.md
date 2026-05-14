# 🚀 Postly — Checklist Go-Live

Tout ce que **toi** tu dois faire avant d'envoyer le premier email à un prospect.

Tout le code est déjà déployé et fonctionnel (commit `4c7d54a`). Il manque uniquement de la **configuration externe** que je ne peux pas faire à ta place.

Compte ~45 minutes total. Vas-y dans l'ordre.

---

## 🔴 BLOQUEURS — sans ces 4 actions, personne ne peut payer

### 1. Appliquer la migration DB AGENCY sur Supabase (3 min)

1. Va sur https://supabase.com/dashboard → ton projet Postly
2. Menu de gauche : **SQL Editor** → **New query**
3. Ouvre le fichier `prisma/SUPABASE_SETUP.sql` dans ton repo, **copie tout son contenu**
4. Colle dans l'éditeur Supabase → clique **Run**
5. Vérifie qu'il n'y a pas d'erreur rouge (warnings ok). À la fin tu dois voir 3 migrations listées et 3 tables (Team, Client, ApiKey) à 0.

✅ Une fois fait, les pages `/settings/team`, `/clients`, `/settings/api-keys` fonctionnent.

---

### 2. Créer les produits Stripe + ajouter Price IDs sur Vercel (15 min)

1. Va sur https://dashboard.stripe.com/products → **Add product**
2. Crée 4 produits avec ces prix exacts (ou ce que tu veux) :
   - **Postly Pro Mensuel** — Récurrent — `29 EUR / mois`
   - **Postly Pro Annuel** — Récurrent — `204 EUR / an` (= 17 €/mois affiché)
   - **Postly Agence Mensuel** — Récurrent — `79 EUR / mois`
   - **Postly Agence Annuel** — Récurrent — `564 EUR / an` (= 47 €/mois affiché)
3. Pour chaque produit, copie le **Price ID** (format `price_xxxxx...`)
4. Va sur **Developers → Webhooks** → **Add endpoint** :
   - URL : `https://www.getpostly.space/api/webhooks/stripe`
   - Events à écouter : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copie le **Signing secret** (format `whsec_xxxxx...`)
5. Sur Vercel → Settings → Environment Variables, ajoute les 5 variables suivantes (Production + Preview + Development) :

```
STRIPE_SECRET_KEY=sk_live_...          # mode LIVE pour vendre vraiment
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...        # depuis l'étape webhook ci-dessus
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_AGENCY_MONTHLY_PRICE_ID=price_...
STRIPE_AGENCY_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

6. **Redeploy** sur Vercel (Deployments → ... → Redeploy)

✅ Vérification : connecte-toi à `/pricing`, clique "S'abonner Pro" → Stripe checkout s'ouvre sans erreur.

---

### 3. Whitelister les redirect URIs OAuth (10 min)

#### Google Cloud Console (sign-in Google + YouTube)
1. https://console.cloud.google.com/apis/credentials
2. Edit ton OAuth 2.0 Client ID
3. Section "URI de redirection autorisés" → ajoute **les 2** :
   ```
   https://www.getpostly.space/api/auth/callback/google
   https://www.getpostly.space/api/auth/youtube/callback
   ```
4. Origines JavaScript : `https://www.getpostly.space`
5. Save (attend 5 min de propagation Google)

#### GitHub OAuth App (sign-in GitHub)
1. https://github.com/settings/developers → ton OAuth App
2. **Authorization callback URL** : `https://www.getpostly.space/api/auth/callback/github`

#### Meta (Facebook + Instagram)
1. https://developers.facebook.com/apps → ton app
2. Produits → Facebook Login → Settings → Valid OAuth Redirect URIs :
   ```
   https://www.getpostly.space/api/auth/facebook/callback
   https://www.getpostly.space/api/auth/instagram/callback
   ```

#### Meta (Threads — app séparée si applicable)
1. Threads API → Redirect callback URIs : `https://www.getpostly.space/api/auth/threads/callback`

#### Twitter / X
1. https://developer.twitter.com/en/portal/projects → ton app → User authentication settings
2. Callback URI : `https://www.getpostly.space/api/auth/twitter/callback`

#### TikTok Developer Portal
1. https://developers.tiktok.com → ton app → Redirect URI : `https://www.getpostly.space/api/auth/tiktok/callback`

✅ Vérification : `/login` → clic "Continuer avec Google" → redirige vers Google → revient sur Postly sans erreur.

---

### 4. Configurer Resend pour les emails (5 min)

1. Inscris-toi sur https://resend.com (gratuit jusqu'à 3000 emails/mois)
2. Vérifie un domaine (idéal `postly.app` ou `getpostly.space`) OU utilise le sandbox `onboarding@resend.dev` pour tester d'abord
3. **API Keys** → Create API Key → copie la clé
4. Sur Vercel → Environment Variables :
   ```
   RESEND_API_KEY=re_...
   RESEND_FROM=Postly <noreply@ton-domaine-verifie.com>
   ```
5. Redeploy

✅ Vérification : crée un compte test → tu dois recevoir l'email de bienvenue.

---

## 🟡 IMPORTANT — sans ces 2 actions tu opères à l'aveugle

### 5. Sentry — monitoring d'erreurs (5 min)

1. Inscris-toi sur https://sentry.io (gratuit jusqu'à 5k events/mois)
2. Create new project → Platform : **Next.js**
3. Copie le DSN (format `https://xxx@xxx.ingest.sentry.io/xxx`)
4. Sur Vercel → Environment Variables :
   ```
   SENTRY_DSN=https://...
   ```
5. Redeploy

✅ Pas besoin d'installer le SDK : le code déjà déployé poste les erreurs via fetch quand `SENTRY_DSN` est défini.
✅ Test : visite `/api/health` → le dashboard Sentry est silencieux. Casse une route → tu vois l'erreur dans Sentry.

---

### 6. Vérifier les backups Supabase (1 min)

1. Supabase dashboard → ton projet → **Database** → **Backups**
2. Vérifie que **Point-in-Time Recovery** ou **daily backups** sont activés (selon plan Supabase)
3. Si t'es sur plan gratuit Supabase, **upgrade au Pro à 25$/mois minimum dès le 1er client payant** — Free a des limites strictes et pas de PITR.

---

## 🟢 OPTIONNEL — pour aller plus loin (à faire après tes 10 premiers clients)

### 7. Tester TikTok + YouTube publishing en vrai (1h)
Aucun test live n'a été fait. Crée un compte test :
1. Crée un compte de pub social
2. Connecte via `/settings`
3. Tente une publication via `/compose`
4. Si crash → me dire les logs Sentry, je débuggue

### 8. Uptime monitoring externe (5 min)
Ajoute https://www.getpostly.space/api/health à :
- https://betterstack.com (gratuit, alerte par email/SMS)
- ou https://uptimerobot.com (gratuit)

### 9. Set up Cron de publication (déjà fait, mais à vérifier)
Le cron Vercel pour publier les posts planifiés doit être actif. Va sur :
- Vercel → ton projet → Settings → Cron Jobs
- Tu devrais voir `POST /api/cron/publish-scheduled` cadencé (toutes les 5-15 min idéalement)
- Si rien : ajoute via `vercel.json` (déjà présent dans le repo, à vérifier)

### 10. Nettoyer les vieux backups locaux
Sur ton disque tu as encore :
- `~/postly_backup/`, `~/Postly-backup/`, `~/postlyy/`, `~/postly.zip`
- Tu peux tout supprimer une fois sûr que `postly_new` marche en prod.

---

## ✅ Checklist visuelle finale

Avant le premier prospect, vérifie en cochant :

- [ ] `/api/health` retourne `{ ok: true, db: "up" }`
- [ ] Inscription email/password fonctionne + email welcome reçu
- [ ] Sign-in Google fonctionne (pas de redirect_uri_mismatch)
- [ ] `/pricing` → clic "S'abonner Pro" → Stripe checkout s'ouvre
- [ ] Paiement test (utilise carte test `4242 4242 4242 4242`) → redirige vers `/billing/success?plan=pro`
- [ ] Page success affiche "Bienvenue sur Postly Pro" + features
- [ ] Dashboard charge sans erreur
- [ ] `/analytics` en compte FREE → cards Pro lockées
- [ ] `/settings/data` → bouton "Exporter mes données" télécharge un JSON
- [ ] Connexion d'au moins **un** réseau social (Twitter le plus simple à débugger)
- [ ] Création d'un post → publié sur ce réseau réellement
- [ ] Email de paiement reçu après le checkout test

Si **TOUT** ça marche → tu peux envoyer ton premier email de prospection.

---

## 🆘 Si quelque chose casse

1. Va sur **Sentry** → regarde l'erreur la plus récente
2. Va sur **Vercel** → Deployments → ton dernier deploy → Logs
3. Va sur **Supabase** → Database → SQL Editor → `SELECT * FROM "_prisma_migrations" ORDER BY started_at DESC;` (vérifie que les 3 migrations sont là)
4. M'écris ici avec le message d'erreur exact, je débuggue
