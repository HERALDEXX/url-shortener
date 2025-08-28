# Contributing

Thanks for your interest in contributing! Please follow these guidelines to keep the workflow consistent and easy to maintain.

## Branching

```bash
git checkout -b dev/type/name
````

* **type** = feature type (e.g., `feature`, `fix`, `chore`, `docs`, `hotfix`, etc)
* **name** = short description in kebab-case (e.g., `login-auth`, `analytics-dashboard`, etc)

### Examples

* `dev/feature/analytics-dashboard`
* `dev/fix/login-error`
* `dev/docs/api-readme`

> **Note:** The `main` branch is protected and should only receive merges from `dev` once changes are stable and reviewed.

## Development Workflow

1. Fork the repository
2. Follow the [**`setup steps`**](README.md/#quick-start) in README.md to set up your environment
3. Create a branch as shown [above](#branching)
4. Make changes and test locally

   ```bash
   python manage.py test
   ```
5. Commit with a clear message (Conventional Commits style preferred).
   See [Conventional Commits](https://www.conventionalcommits.org) for details.
   **Example:**

   ```bash
   git commit -m "feat(analytics): add dashboard charts"
   ```
6. Push your branch and open a Pull Request against [`dev`](https://github.com/HERALDEXX/url-shortener/tree/dev) branch

## Pull Request Guidelines

* Ensure tests pass before submission
* Update documentation if needed
* Keep PRs focused and small when possible
* Use descriptive titles (e.g., `feat: implement link analytics`)
* Reference related issues in the PR description
* Use **Draft PRs** for work-in-progress contributions

## Support

For questions or issues, open an [issue](https://github.com/HERALDEXX/url-shortener/issues).
