# theme-contrast

Compare two sets of design tokens and check text and background colors against WCAG AA and AAA contrast thresholds. You can paste tokens or load JSON and CSS files; the comparison runs locally in your browser.

## Run locally

Requires Node.js 20.19 or later.

```sh
npm install
npm run dev
```

Run `npm test` for the parsing and contrast tests, or `npm run build` to create the static app in `dist/`.

The tool reads 3- and 6-digit hex colors and opaque `rgb()`/`rgba()` values. Transparent colors and other CSS expressions are skipped.
