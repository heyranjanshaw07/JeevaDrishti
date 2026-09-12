# test_llm_keys.py
import json

KEY_FILE = "key.json"

# --------------------
# Load keys
# --------------------
with open(KEY_FILE, "r") as f:
    keys = json.load(f)

OPENAI_KEY = keys.get("openai")
GEMINI_KEY = keys.get("gemini")
ANTHROPIC_KEY = keys.get("anthropic")

# --------------------
# OpenAI test
# --------------------
def test_openai():
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_KEY)
    client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "ping"}],
        max_tokens=100,
    )
    print("✅ OpenAI key works")

# --------------------
# Gemini test
# --------------------
def test_gemini():
    from google import genai
    client = genai.Client(api_key=GEMINI_KEY)
    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Say 'Gemini OK'",
        )
        print("✅ Gemini key works:", resp.text)
    except Exception as e:
        print("❌ Gemini failed:", type(e).__name__, e)

# --------------------
# Anthropic test
# --------------------
def test_anthropic():
    from anthropic import Anthropic
    client = Anthropic(api_key=ANTHROPIC_KEY)
    client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=100,
        messages=[{"role": "user", "content": "ping"}],
    )
    print("✅ Anthropic key works")

# --------------------
# Run all tests
# --------------------
for name, fn in [
    ("OpenAI", test_openai),
    ("Gemini", test_gemini),
    ("Anthropic", test_anthropic),
]:
    try:
        fn()
    except Exception as e:
        print(f"❌ {name} failed → {type(e).__name__}: {e}")

