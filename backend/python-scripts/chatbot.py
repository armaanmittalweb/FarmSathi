# DEPRECATED — kept only for git history.
#
# This spawn-per-request script has been replaced by the persistent
# FastAPI inference service in `ai-service/` (see ai-service/llm.py and
# ai-service/rag.py). The Node backend now calls that service over HTTP
# instead of shelling out to Python on every chat message.
#
# See ROADMAP.md, section 0 and 4, for the rationale.
