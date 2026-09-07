import sys
from pathlib import Path

# main.py etc. are flat modules (no package __init__.py), so make sure
# ai-service/ itself is importable regardless of where pytest is invoked from.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
