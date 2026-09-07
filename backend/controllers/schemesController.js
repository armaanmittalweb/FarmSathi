const schemes = require("../data/schemes.json");

/**
 * GET /api/schemes?lang=en|hi|pa
 * Serves the curated government-schemes dataset directly (no external API
 * exists for this — see ROADMAP.md phase 5). The same dataset is embedded
 * into the RAG knowledge base by ai-service/seed_knowledge.py so the
 * chatbot can answer free-form scheme questions too.
 */
exports.listSchemes = (req, res) => {
  const lang = req.query.lang || "en";
  const localized = schemes.map((s) => ({
    id: s.id,
    category: s.category,
    name: s.name[lang] || s.name.en,
    summary: s.summary[lang] || s.summary.en,
    eligibility: s.eligibility,
    how_to_apply: s.how_to_apply,
    official_link: s.official_link,
  }));
  res.json(localized);
};
