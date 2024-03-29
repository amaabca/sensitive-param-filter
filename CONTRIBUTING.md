## Contributing to Sensitive Param Filter

Please follow the appropriate template when opening an issue or pull request:

- [PR Template](.github/PULL_REQUEST_TEMPLATE.md)
- [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)

Understand that it may take several days for your contribution to be reviewed (in particular if you open it on a weekend).

### Contributing Code

1. Fork our repo using the **Fork** button [here](https://github.com/amaabca/sensitive-param-filter).
2. Clone your fork: `git clone git@github.com:your_username/sensitive-param-filter.git`
3. Run `npm install` to install development dependencies
4. Make your changes and push them to your fork
5. Open a pull request [here](https://github.com/amaabca/sensitive-param-filter/compare)

#### Scripts

- `npm install` installs development dependencies
- `npm run test` runs the test suite using [jest](https://github.com/facebook/jest)
- `npm run lint` ensures your code matches our standards via [eslint](https://github.com/eslint/eslint)

#### Publishing

`sensitive-param-filter` is published to both `GitHub Packages` and `npm`. Ensure you are authenticated with both:

- [GitHub Packages](https://help.github.com/en/packages/using-github-packages-with-your-projects-ecosystem/configuring-npm-for-use-with-github-packages#authenticating-to-github-packages)
- [npm](https://docs.npmjs.com/cli/adduser.html)

Use `npm run release` (ensure `master` is checked out) to publish new versions.
