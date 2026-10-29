

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

<!-- skills-kit:start -->
## Skills and agents for this project

Use only the skills, agents and commands in this project's `.claude/` folder.
- Graphify is set up here: run `/graphify .` to build or refresh the project's knowledge graph, then use it to explore the code.
- If this repo is not configured for Matt Pocock's engineering skills yet (issue tracker, triage labels, docs layout), suggest running /setup-matt-pocock-skills first.
- At the start of every session, load the `using-superpowers` skill before responding.
- For UI work, use the `ui-ux-pro-max` skill; run its search script from the project root.
- Skills may name other skills with a kit prefix (`superpowers:<name>`). Treat that as the project skill `<name>`; if it is not installed here, carry on without it.

Kits installed with their own installer: graphify
Skills: brainstorming, codebase-design, design-system, domain-modeling, executing-plans, finishing-a-development-branch, git-guardrails-claude-code, grill-with-docs, handoff, improve-codebase-architecture, receiving-code-review, requesting-code-review, setup-matt-pocock-skills, setup-pre-commit, subagent-driven-development, systematic-debugging, test-driven-development, ui-ux-pro-max, using-git-worktrees, using-superpowers, verification-before-completion, writing-plans
(Maintained by skills.ps1. Use "skills add/remove" rather than editing this block.)
<!-- skills-kit:end -->
