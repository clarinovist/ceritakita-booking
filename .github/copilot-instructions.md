# Copilot repo instructions (ceritakita-booking)

## Goal
This repo contains a library of “skills” under `.agent/skills/`. Treat each skill as an operational playbook.

When the user asks for help that matches a skill (SEO, CRO, analytics, marketing, UX, copywriting, etc.), Copilot should:

1. Identify the best-matching skill by checking the YAML frontmatter `description` triggers.
2. Read the corresponding `.agent/skills/<skill-name>/SKILL.md`.
3. Follow that skill’s workflow and output style.
4. If the skill references other `.agent/**` context files, read them first when they exist.

## How to apply skills
- Prefer using an explicit skill if the user names one (e.g. “pakai skill seo-audit”).
- If the user does not name a skill, propose 1–3 likely skills and ask which one to use, unless it’s obvious.
- Do not invent new steps that contradict the skill.
- If the skill is high-level (marketing/strategy), produce a structured plan and clear next actions.
- If the task needs code changes, stay consistent with existing patterns in this repo (Next.js app router, API routes under `api/`, shared libs under `lib/`).

## Skill index (examples)
- SEO audit: `.agent/skills/seo-audit/SKILL.md`
- Schema markup: `.agent/skills/schema-markup/SKILL.md`
- Analytics tracking: `.agent/skills/analytics-tracking/SKILL.md`
- Error handling patterns: `.agent/skills/error-handling-patterns/SKILL.md`
- UX webapp: `.agent/skills/ux-webapp/SKILL.md`

## Output expectations
- Be concise and actionable.
- Use checklists when a skill suggests it.
- If assumptions are required, list them and ask targeted questions.
