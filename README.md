# NEON HOST — Painel de desbloqueio PS4

Dashboard pessoal de desbloqueio para PlayStation 4, construído sobre a
cadeia de exploit **Afterglow** (suporte a firmware **12.00 até 14.02**).

> Uso pessoal no próprio console. Este projeto não é afiliado à Sony,
> Microsoft ou aos desenvolvedores originais. Respeite as licenças abaixo.

## Créditos e licenças

| Componente | Autor | Licença |
|---|---|---|
| **Afterglow** (WebKit + kernel exploit) | well0nez & m0zz | AGPL-3.0 (`LICENSE`) |
| **raw13g host** (base do jb.js) | raw13g | `LICENSE-raw13g` |
| **GoldHEN** | SiSTRo e equipe | distribuído com permissão dos autores |
| **PS4-HEN** | equipe HEN | — |
| Dashboard NEON HOST | este repositório | AGPL-3.0 (derivado) |

Os arquivos do motor (`jb.js`, `afterglow.js`, `core.js`, `mem.js`,
`int64.js`, `ps4_offsets.js`, `*.bin`) **não foram modificados** — vêm
integros do repositório oficial [`well0nez/afterglow-web`](https://github.com/well0nez/afterglow-web).

## Estrutura

```
index.html      ← dashboard (a página inicial; o guard do jb.js exige este nome)
dashboard.css   ← visual neon (temas: Neon, Rubi, Brasil)
dashboard.js    ← detecção de firmware, tema, cache, botão INICIAR
jb.html/jb.js   ← página de execução + host da cadeia (motor Afterglow)
afterglow.js    ← o exploit em si
core.js, mem.js, int64.js, ps4_offsets.js ← primitivas e offsets
goldhen.bin, hen.bin, patchset-*.bin      ← payloads e patches por firmware
cache.appcache  ← manifesto offline (gerado por make-manifest.sh)
serve.sh        ← servidor local para teste
```

## Como usar no PS4

1. Abra o site no navegador do PS4 (veja "Publicar" abaixo).
2. Na primeira visita os arquivos são baixados para o **cache offline**
   (fica escrito embaixo do botão). Depois funciona sem internet.
3. Escolha o payload (**GoldHEN** recomendado) e clique em
   **▶ INICIAR DESBLOQUEIO**.
4. Aguarde a cadeia rodar. Se pedir, escolha "restart" quando o GoldHEN
   pedir.
5. **Importante:** o desbloqueio é **semi-tethered** — a cada reinício
   completo do console é preciso rodar de novo (modo de espera mantém).

### Testar no computador

```sh
./serve.sh                 # http://localhost:8000
# ou
python3 -m http.server 8000
```

O dashboard funciona no PC (mostra o aviso "não é PS4"); o exploit em si
só roda no navegador do console.

## Publicar grátis no GitHub Pages

1. Crie um repositório no GitHub (ex.: `neon-host`).
2. Envie todos os arquivos deste diretório:

   ```sh
   git init
   git add .
   git commit -m "NEON HOST"
   git branch -M main
   git remote add origin https://github.com/SEU-USER/neon-host.git
   git push -u origin main
   ```

3. No GitHub: **Settings → Pages → Build and deployment → Source:
   Deploy from a branch → main → / (root) → Save**.
4. Em ~1 minuto o site fica em:
   `https://SEU-USER.github.io/neon-host/`
5. Abra essa URL no navegador do PS4. Pronto!

> Dica: depois de mudar qualquer arquivo, rode `./make-manifest.sh` e
> commite o `cache.appcache` atualizado — sem isso o PS4 continua com a
> versão antiga em cache.

## Personalizar

- **Nome/cores:** edite `index.html` (texto) e `dashboard.css` (temas).
- **Firmware suportado:** lista `SUPPORTED` em `dashboard.js` e em `jb.js`.
- **Auto-iniciar:** opção no dashboard (guardada em localStorage).

## Limites declarados

- O motor Afterglow é experimental: pode falhar em uma tentativa — tente
  novamente (reinicie o navegador do PS4 se travar).
- Este dashboard foi montado a partir do código público; o autor não
  realiza testes físicos em console a cada alteração.
- Não use na PSN com o console desbloqueado (risco de banimento).
