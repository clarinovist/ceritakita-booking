# Using `.agent/skills` with GitHub Copilot (VS Code)

## Quick answer
- Folder `.agent/skills` is **not** a native GitHub Copilot “skills” feature.
- Copilot **won’t automatically** discover/run those skills like a plugin.
- But Copilot **can use them as playbooks** if you explicitly tell it to read them (and repo instructions help make that consistent).

This repo now includes `.github/copilot-instructions.md` which tells Copilot to treat `.agent/skills/**/SKILL.md` as reusable playbooks.

## How to use (recommended prompts)

### 1) Use a specific skill by name
Paste in Copilot Chat:

- "Pakai skill `seo-audit`: baca `.agent/skills/seo-audit/SKILL.md`, lalu audit SEO untuk halaman `app/page.tsx` dan berikan rekomendasi prioritas + perubahan kode yang diperlukan."

- "Pakai skill `analytics-tracking`: baca `.agent/skills/analytics-tracking/SKILL.md`, lalu sarankan event tracking untuk flow booking dan titik implementasinya."

### 2) Ask Copilot to choose the skill
- "Pilih skill paling relevan dari `.agent/skills` (lihat trigger di frontmatter), lalu jalankan untuk kasus: (jelaskan kasusnya)."

### 3) Combine skills (when needed)
- "Mulai dari `seo-audit`, lalu jika perlu lanjutkan dengan `schema-markup` untuk rekomendasi structured data."

## Tips
- Kalau Copilot “melewatkan” skill, ulangi dengan instruksi eksplisit: “baca file ini dulu”.
- Untuk hasil yang stabil, sebutkan *scope* (folder/page mana) dan *output* yang kamu mau (checklist, PR-style changes, dsb).

## Advanced: true "skills" inside Copilot
Kalau yang kamu maksud adalah skill yang bisa dipanggil seperti command/tool (mis. `/seo-audit`), itu biasanya butuh:
- VS Code extension (Chat Participant) atau
- Copilot Extension / tool integration (mis. via MCP server)

Kalau kamu mau, sebutkan target UX-nya (mis. ingin slash command, ingin tombol, atau ingin auto-run pipeline) — nanti aku bisa bantu pilih pendekatan dan scaffold implementasinya.
