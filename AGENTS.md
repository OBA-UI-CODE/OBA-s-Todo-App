# AI Engineering Guide

## Product intent

Build a calm, fast personal productivity workspace. Tasks, notes, and focus sessions must feel like parts of one product rather than unrelated demos.

## Design rules

- Use the tokens in `styles.css`; do not introduce one-off colours or spacing values in components.
- Preserve clear hierarchy, visible focus states, keyboard access, and readable contrast.
- Every feature must work at 360px, 768px, and 1280px widths.
- Empty, loading, error, completed, and disabled states must be deliberate.
- Avoid copying another product's branding, copy, or exact layout.

## Engineering rules

- Keep domain logic in `src/core.js` and browser rendering in `src/app.js`.
- Treat localStorage as untrusted input and normalize parsed values.
- Use semantic HTML and native controls before custom interaction patterns.
- Do not add a dependency when the platform can solve the requirement cleanly.
- Never commit secrets, credentials, generated coverage, or local environment files.

## Validation rules

- Run `npm test` before every commit.
- Run `npm run check` after changing JavaScript.
- Add tests for every new domain rule, including malformed persisted data.
- Manually verify task creation, completion, deletion, filters, notes, theme, and the focus timer.
- A task is complete only when the working tree contains no accidental generated files.

