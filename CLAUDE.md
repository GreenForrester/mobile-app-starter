<!-- skills-kit:start -->
## Skills and agents for this project

Use only the skills, agents and commands in this project's `.claude/` folder.
- If this repo is not configured for Matt Pocock's engineering skills yet (issue tracker, triage labels, docs layout), suggest running /setup-matt-pocock-skills first.
- At the start of every session, load the `using-superpowers` skill before responding.
- For UI work, use the `ui-ux-pro-max` skill; run its search script from the project root.
- Skills may name other skills with a kit prefix (`superpowers:<name>`). Treat that as the project skill `<name>`; if it is not installed here, carry on without it.

Skills: brainstorming, codebase-design, design-system, domain-modeling, executing-plans, finishing-a-development-branch, git-guardrails-claude-code, grill-with-docs, handoff, improve-codebase-architecture, receiving-code-review, requesting-code-review, setup-matt-pocock-skills, setup-pre-commit, subagent-driven-development, systematic-debugging, test-driven-development, ui-ux-pro-max, using-git-worktrees, using-superpowers, verification-before-completion, writing-plans
(Maintained by skills.ps1. Use "skills add/remove" rather than editing this block.)
<!-- skills-kit:end -->

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
