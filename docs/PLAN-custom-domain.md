# PLAN: Custom Domain nghost.ness.com.br

## Objetivo
Mapear `nghost.ness.com.br` para o serviço Cloud Run `nghost` rodando em `southamerica-east1`.

## Contexto

| Item | Valor |
|------|-------|
| **Cloud Run Service** | `nghost` |
| **Project ID** | `nghost-gabi` |
| **Region** | `southamerica-east1` |
| **Current URL** | `https://nghost-563447386199.southamerica-east1.run.app` |
| **Target Domain** | `nghost.ness.com.br` |

---

## Fase 1: Domain Mapping no Cloud Run

### 1.1 Criar o mapeamento
```bash
gcloud run domain-mappings create \
  --service=nghost \
  --domain=nghost.ness.com.br \
  --region=southamerica-east1 \
  --project=nghost-gabi
```

### 1.2 Obter registros DNS necessários
```bash
gcloud run domain-mappings describe \
  --domain=nghost.ness.com.br \
  --region=southamerica-east1 \
  --project=nghost-gabi
```

O GCP vai retornar um registro **CNAME** apontando para `ghs.googlehosted.com.`

---

## Fase 2: Configuração DNS

Criar registro no provedor DNS de `ness.com.br`:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| CNAME | `nghost` | `ghs.googlehosted.com.` | 300 |

> [!IMPORTANT]
> Se o domínio raiz já tiver um CNAME conflitante ou estiver atrás do Cloudflare com proxy ativo, pode ser necessário pausar o proxy (DNS Only) até o certificado SSL provisionar.

---

## Fase 3: SSL / TLS

- O Cloud Run provisiona **automaticamente** um certificado SSL gerenciado pelo Google
- Pode levar de **5 a 30 minutos** para o certificado ficar ativo
- Verificar status:

```bash
gcloud run domain-mappings describe \
  --domain=nghost.ness.com.br \
  --region=southamerica-east1 \
  --project=nghost-gabi \
  --format="value(status.conditions)"
```

---

## Fase 4: Atualização do Firebase Auth

Adicionar `nghost.ness.com.br` como domínio autorizado no Firebase Console:

1. [Firebase Console → Authentication → Settings → Authorized Domains](https://console.firebase.google.com/project/nghost-gabi/authentication/settings)
2. Adicionar `nghost.ness.com.br`

> [!CAUTION]
> Sem isso, o login (Google Sign-In) vai falhar com `auth/unauthorized-domain`.

---

## Fase 5: Atualização do Next.js (se necessário)

- Verificar `next.config.js` → `images.remotePatterns` se usar imagens externas
- Atualizar `og:url` em `layout.tsx` se existir URL hardcoded

---

## Verificação

- [ ] `curl -sI https://nghost.ness.com.br` retorna `HTTP/2 200`
- [ ] Certificado SSL é válido (`openssl s_client -connect nghost.ness.com.br:443`)
- [ ] Login Google funciona no novo domínio
- [ ] Todas as rotas (`/`, `/app`, `/auth/signin`) funcionam
