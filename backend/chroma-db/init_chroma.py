# DEPRECATED — kept only for git history.
#
# ChromaDB initialization now happens inside ai-service/rag.py using the
# current `chromadb.PersistentClient(path=...)` API (the old
# `chromadb.Client(Settings(persist_directory=...))` call in this file
# no longer works on modern chromadb releases).
