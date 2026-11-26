# pastrami.nyc

Pastrami and New York: where to eat it, how it got here, how to make it at home, and a stacking game. Static site: plain HTML and vanilla JS modules, no build step, no backend. Fonts come from Google Fonts. The game keeps your best score in localStorage.

| Path | What |
|---|---|
| `/` | Deli guide (filter by borough), history timeline, home-pastrami recipe with a cure/rub calculator |
| `/stack/` | *Pile it high*: drop swinging slices of pastrami on rye; overhang gets trimmed, perfect drops grow the slice back |

## Layout

```
site/
  index.html        home page (markup + styles)
  js/data.js        delis, cure and rub tables, calculator math (no DOM)
  js/home.js        renders the deli cards, filters and calculator
  stack/index.html  game page
  stack/logic.js    drop/trim/perfect rules, verdicts (no DOM)
  stack/game.js     canvas, input, animation
deploy/
  Dockerfile        nginx:alpine serving site/
  nginx.conf        inner nginx: CSP, caching, /healthz
  edge-pastrami.conf  host nginx server block for pastrami.nyc
test/               node --test, no dependencies
```

## Editing content

Delis live in `site/js/data.js`. Add a review to any deli with a `take` field and it shows on that deli's card:

```js
take: { score: '9/10', text: 'Juicy, peppery, worth the line.' },
```

Locations were last checked November 2026.

## Develop

```sh
npm test          # Node 22+
npm run serve     # http://localhost:8080
```

## Deploy

Push to `main`. CI runs the tests, then sends a `repository_dispatch` to `FrenchCommando/pi-deploy`; its runner on the Pi pulls `/home/frenchcommando/pastrami-nyc`, runs `docker compose build && up -d`, and checks `pastrami.nyc` answers 200. The container publishes `127.0.0.1:3030`; the host nginx (`deploy/edge-pastrami.conf`) terminates TLS and proxies to it.

Manual fallback on the Pi:

```sh
cd ~/pastrami-nyc && git pull && docker compose up -d --build
```
