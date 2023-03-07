# @onerepo/plugin-docgen

## 0.1.1

### Patch Changes

- Ensure all dist files are included recursively in published packages. [#133](https://github.com/paularmstrong/onerepo/pull/133) ([@paularmstrong](https://github.com/paularmstrong))

- Updated dependencies [[`8b9265f`](https://github.com/paularmstrong/onerepo/commit/8b9265fedc1cb6f9bd3d62e5d8af71e40ba4bb51), [`a57a69d`](https://github.com/paularmstrong/onerepo/commit/a57a69d7813bd2f965b0f00af366204637b6f81e)]:
  - @onerepo/subprocess@0.1.0
  - @onerepo/file@0.0.2
  - @onerepo/git@0.0.2

## 0.1.0

### Minor Changes

- Add `--heading-level` for markdown start heading level [`6d6d557`](https://github.com/paularmstrong/onerepo/commit/6d6d5572e085f6150652e13088a9e48be54cc220) ([@paularmstrong](https://github.com/paularmstrong))

### Patch Changes

- Fixes `commandDir` globbing to respect the `exclude` directive when parsing commands. [#72](https://github.com/paularmstrong/onerepo/pull/72) ([@paularmstrong](https://github.com/paularmstrong))

- When an option includes `choices`, list them in place of the `type` for options and positionals. [#72](https://github.com/paularmstrong/onerepo/pull/72) ([@paularmstrong](https://github.com/paularmstrong))

- Fix building/exporting as faux-esm. oneRepo still requires you to register a runtime requires interpreter like `esbuild-register` until such a time as yargs and others fully support ESM across all APIs. [#79](https://github.com/paularmstrong/onerepo/pull/79) ([@paularmstrong](https://github.com/paularmstrong))

- Build docgen bin to CJS, not ESM. [#108](https://github.com/paularmstrong/onerepo/pull/108) ([@paularmstrong](https://github.com/paularmstrong))

- Ensure git operations are run in dry mode [#117](https://github.com/paularmstrong/onerepo/pull/117) ([@paularmstrong](https://github.com/paularmstrong))

- Updated dependencies [[`6665501`](https://github.com/paularmstrong/onerepo/commit/66655015d6285b754a69fa9e453d81506de883f0), [`04c28b2`](https://github.com/paularmstrong/onerepo/commit/04c28b21b90a2f3306ecb2daacb81f59cadc9bdc), [`0a3bb03`](https://github.com/paularmstrong/onerepo/commit/0a3bb03d0e33b2ac9505d43d9a2f0b87443e88f1), [`65a63cf`](https://github.com/paularmstrong/onerepo/commit/65a63cf5783df271a569d1e62258e389c723b56b)]:
  - @onerepo/subprocess@0.0.1
  - @onerepo/git@0.0.1
  - @onerepo/file@0.0.1