# Site — Faculdade Batista Logos

Redesign do site da Faculdade Batista Logos. É um **site estático**: só HTML, CSS e JavaScript
dentro dos próprios arquivos, sem build, sem dependências e sem back-end.

## Estrutura

| Arquivo / pasta        | O que é |
|------------------------|---------|
| `home.html`            | Página inicial nova (tema azul-marinho) |
| `sobre-nos.html`       | Página "Sobre Nós" (tema azul-marinho) |
| `home2.html`           | Página inicial — variação "Edição Vinho" |
| `sobre-nos2.html`      | "Sobre Nós" — variação "Edição Vinho" |
| `design-system.html`   | Referência visual de componentes do site atual |
| `index.html`           | Cópia offline do site atual (faculdadebatistalogos.edu.br), usada como referência |
| `assets/`              | Imagens, fontes, CSS e JS usados pelas páginas |
| `backup/`              | Versões antigas de páginas |

As páginas se linkam entre si (`home.html` ↔ `sobre-nos.html`, `home2.html` ↔ `sobre-nos2.html`).
As fontes (Cinzel e Raleway) vêm do Google Fonts, então é preciso internet para vê-las corretamente.

## Rodar localmente

Não há nada para instalar. Escolha **uma** das opções abaixo, a partir da pasta do projeto:

**Opção 1 — abrir direto no navegador**

Dê dois cliques em `home.html`. Funciona para as páginas novas.

**Opção 2 — servidor local com Python** (recomendado)

```bash
python -m http.server 8000
```

**Opção 3 — servidor local com Node**

```bash
npx serve .
```

**Opção 4 — VS Code**

Instale a extensão *Live Server*, clique com o botão direito em `home.html` → *Open with Live Server*.
Ela recarrega a página automaticamente a cada alteração.

Depois acesse:

- http://localhost:8000/home.html — versão azul-marinho
- http://localhost:8000/home2.html — versão vinho
- http://localhost:8000/sobre-nos.html

(Com `npx serve`, a porta padrão é `3000`.)

## Publicar

Como é tudo estático, basta enviar os arquivos para qualquer hospedagem de sites estáticos.
Envie os `.html` que serão publicados **junto com a pasta `assets/`**, mantendo a mesma estrutura.

> **Atenção:** o servidor abre `index.html` quando alguém acessa a raiz do domínio, e hoje
> o `index.html` é a cópia do site **antigo**. Antes de publicar, decida qual versão será a
> página inicial — por exemplo, renomeie `home.html` para `index.html` e troque os links
> `href="home.html"` em `sobre-nos.html` por `href="index.html"` (ou `href="/"`).

### GitHub Pages

O repositório já está no GitHub (`matheus-lopes-santos/logos-site`).

1. Faça o push para a branch `master`.
2. No GitHub, vá em **Settings → Pages**.
3. Em *Source*, escolha **Deploy from a branch**, branch `master`, pasta `/ (root)`, e salve.
4. Em alguns minutos o site fica disponível em
   `https://matheus-lopes-santos.github.io/logos-site/home.html`.

Para usar o domínio próprio, preencha *Custom domain* na mesma tela e configure o DNS
conforme a [documentação do GitHub Pages](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site).

### Netlify ou Vercel

- **Netlify:** acesse app.netlify.com/drop e arraste a pasta do projeto, ou conecte o repositório
  (sem comando de build; diretório de publicação: `.`).
- **Vercel:** importe o repositório, framework preset **Other**, sem comando de build.

### Hospedagem tradicional (cPanel / FTP)

Envie os arquivos `.html` e a pasta `assets/` para a pasta pública do servidor
(normalmente `public_html/` ou `www/`) usando o gerenciador de arquivos ou um cliente FTP como o FileZilla.

## Editando

- Cada página tem o CSS dentro de uma tag `<style>` no próprio arquivo. As cores ficam em
  variáveis no `:root` (`--navy`, `--gold`, `--cream`…) — é assim que as versões azul e vinho diferem.
- Novas imagens vão em `assets/` e são referenciadas com caminho relativo (`assets/nome.png`).
- Ao alterar algo comum (menu, rodapé), lembre de replicar nas outras páginas, pois não há
  templates compartilhados.
