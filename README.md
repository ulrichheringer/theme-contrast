# theme-contrast

Importe dois conjuntos de tokens em JSON ou propriedades CSS, veja o que mudou e calcule o contraste entre uma cor de texto e um fundo. Inclui os limites AA e AAA da WCAG para texto normal e grande.

## Executar

Requer Node.js 20.19 ou superior. Execute **npm install** e depois **npm run dev**. Cole tokens ou carregue arquivos JSON/CSS. **npm test** roda os testes de parsing e contraste; **npm run build** gera dist/.

São aceitos hex de 3 ou 6 dígitos e rgb()/rgba() opaco. Tokens com transparência e outras expressões CSS são ignorados.
