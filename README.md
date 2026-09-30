# CV — site pessoal + backoffice

Site/CV bilíngue (PT/EN) com backoffice privado, formulário de contacto que não expõe o teu email e gerador de PDF por contexto (Geral, IT, …).

- **Site público:** `/pt` e `/en` (a raiz `/` redireciona pela língua do browser)
- **Backoffice:** `/admin` (não há link público para lá)
- **Stack:** Next.js 15 · Neon Postgres · Vercel Blob (foto) · Resend (email) · react-pdf

## O que fica onde (privacidade)

| Dado | Onde aparece |
|---|---|
| Perfil, experiência, formação, etc. | Site público + PDF |
| Itens marcados “Esconder no site público” | Só no PDF |
| Email, telefone, morada, data de nascimento, nacionalidade, autorização de trabalho (**Dados privados**) | **Só** nos PDFs gerados no backoffice — ficam num registo separado que o site público nunca lê |
| Mensagens do formulário | O teu email (via Resend) + backoffice › Mensagens |

O visitante nunca vê o teu email: o formulário envia para `/api/contact`, que manda o email a partir do servidor, com `Reply-To` do visitante. Proteções: honeypot, tempo mínimo de preenchimento, verificação de origem e limite de 3 mensagens / 10 min por IP (o IP só é guardado como hash).

## Correr localmente

Precisas de Node 20+ (recomendado 22). Sem base de dados, os dados ficam em `.data/*.json` e as fotos em `public/uploads/`.

```bash
npm install
npm run hash-password -- "a-tua-password-forte"   # copia o resultado para ADMIN_PASSWORD_HASH
npm run gen-secret                                # copia o resultado para AUTH_SECRET
cp .env.example .env.local                        # e preenche as duas variáveis acima
npm run dev
```


## Publicar na Vercel

1. Cria um repositório no GitHub (privado serve) e faz push desta pasta.
2. Na Vercel: **Add New › Project** e importa o repositório.
3. No projeto: **Storage › Create › Neon (Postgres)** e liga-o ao projeto → cria `DATABASE_URL` sozinho.
4. **Storage › Create › Blob** e liga-o → cria `BLOB_READ_WRITE_TOKEN` sozinho.
5. **Settings › Environment Variables**, adiciona:
   - `ADMIN_PASSWORD_HASH` — de `npm run hash-password -- "…"` (usa uma password nova e forte)
   - `AUTH_SECRET` — de `npm run gen-secret`
   - `RESEND_API_KEY` — cria conta em resend.com › API Keys
   - `CONTACT_TO_EMAIL` — o email onde queres receber as mensagens
   - `CONTACT_FROM_EMAIL` — `CV <onboarding@resend.dev>` enquanto não verificares um domínio no Resend (nesse modo o Resend só entrega ao email da tua conta Resend, que é exatamente o que queres)
   - `NEXT_PUBLIC_SITE_URL` — ex.: `https://o-teu-projeto.vercel.app`
6. **Redeploy**. Na primeira execução as tabelas são criadas e preenchidas com o conteúdo inicial do teu CV.
7. Entra em `/admin`, completa os **Dados privados** (email/telefone para o PDF), carrega a foto e revê os textos.

## Backoffice

- **Perfil** — nome, título, resumo, localização pública, disponibilidade, interesses, links (LinkedIn/GitHub) e foto.
- **Experiência / Formação / Certificações profissionais / Cursos e certificados / Projetos / Prémios / Competências / Línguas** — listas com ordenação (↑ ↓), duplicar, esconder no site e escolher em que PDFs entra.
- **Contextos de PDF** — cada contexto é uma versão do CV: que secções inclui, que dados privados mostra, se leva foto, e opcionalmente um título/resumo diferentes.
- **Gerar PDF** — escolhe contexto + língua → pré-visualizar ou descarregar.
- **Mensagens** — o que chegou pelo formulário.
- **Exportar backup** — descarrega tudo em JSON.

Formato dos textos longos: linhas começadas por `- ` viram lista; `**texto**` fica a negrito. Tags com tradução: `Bases de dados|Databases`.

Todas as alterações guardadas regeneram o site público na hora.

## Segurança

- Password guardada só como hash scrypt; sessão em cookie `httpOnly`, `secure`, `SameSite=Strict`, válida 12 h.
- Máx. 5 tentativas de login por 15 min por IP.
- Cada página, server action e rota do backoffice valida a sessão no servidor (o middleware é só a primeira barreira).
- Upload de foto: só JPG/PNG até 4 MB, validado pela assinatura real do ficheiro.
- Headers: CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; `/admin` e `/api` com `noindex`.
