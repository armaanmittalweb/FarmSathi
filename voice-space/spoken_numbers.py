"""
Numbers spelled out for MMS-TTS, whose vocabularies have (almost) no digits: without this,
"₹6,000" or "55%" would be silently skipped. Indian numbering (hazaar, lakh, crore) in all three
languages, decimals digit by digit, % and ₹ as words, and "1.5-2" as a range.
"""
import re

ONES = {
    "en": "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(),
    "hi": (
        "शून्य एक दो तीन चार पाँच छह सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस बीस "
        "इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस उनतीस तीस इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस चालीस "
        "इकतालीस बयालीस तैंतालीस चवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास पचास इक्यावन बावन तिरपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ साठ "
        "इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उन्यासी अस्सी "
        "इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे इक्यानबे बानबे तिरानबे चौरानबे पंचानबे छियानबे सत्तानबे अट्ठानबे निन्यानबे"
    ).split(),
    "pa": (
        "ਸਿਫ਼ਰ ਇੱਕ ਦੋ ਤਿੰਨ ਚਾਰ ਪੰਜ ਛੇ ਸੱਤ ਅੱਠ ਨੌਂ ਦਸ ਗਿਆਰਾਂ ਬਾਰਾਂ ਤੇਰਾਂ ਚੌਦਾਂ ਪੰਦਰਾਂ ਸੋਲਾਂ ਸਤਾਰਾਂ ਅਠਾਰਾਂ ਉੱਨੀ ਵੀਹ "
        "ਇੱਕੀ ਬਾਈ ਤੇਈ ਚੌਵੀ ਪੱਚੀ ਛੱਬੀ ਸਤਾਈ ਅਠਾਈ ਉਣੱਤੀ ਤੀਹ ਇਕੱਤੀ ਬੱਤੀ ਤੇਤੀ ਚੌਂਤੀ ਪੈਂਤੀ ਛੱਤੀ ਸੈਂਤੀ ਅਠੱਤੀ ਉਣਤਾਲੀ ਚਾਲੀ "
        "ਇਕਤਾਲੀ ਬਿਆਲੀ ਤਰਤਾਲੀ ਚੁਤਾਲੀ ਪੰਜਤਾਲੀ ਛਿਆਲੀ ਸੰਤਾਲੀ ਅਠਤਾਲੀ ਉਣੰਜਾ ਪੰਜਾਹ ਇਕਵੰਜਾ ਬਵੰਜਾ ਤਰਵੰਜਾ ਚਰਵੰਜਾ ਪਚਵੰਜਾ ਛਪੰਜਾ ਸਤਵੰਜਾ ਅਠਵੰਜਾ ਉਣਾਹਠ ਸੱਠ "
        "ਇਕਾਹਠ ਬਾਹਠ ਤਰੇਹਠ ਚੌਂਹਠ ਪੈਂਹਠ ਛਿਆਹਠ ਸਤਾਹਠ ਅਠਾਹਠ ਉਣੱਤਰ ਸੱਤਰ ਇਕਹੱਤਰ ਬਹੱਤਰ ਤਿਹੱਤਰ ਚੌਹੱਤਰ ਪਚੱਤਰ ਛਿਹੱਤਰ ਸਤੱਤਰ ਅਠੱਤਰ ਉਣਾਸੀ ਅੱਸੀ "
        "ਇਕਾਸੀ ਬਿਆਸੀ ਤਰਾਸੀ ਚੌਰਾਸੀ ਪਚਾਸੀ ਛਿਆਸੀ ਸਤਾਸੀ ਅਠਾਸੀ ਉਣਾਨਵੇਂ ਨੱਬੇ ਇਕਾਨਵੇਂ ਬਿਆਨਵੇਂ ਤਰਾਨਵੇਂ ਚੁਰਾਨਵੇਂ ਪਚਾਨਵੇਂ ਛਿਆਨਵੇਂ ਸਤਾਨਵੇਂ ਅਠਾਨਵੇਂ ਨੜਿੰਨਵੇਂ"
    ).split(),
}
TENS_EN = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
assert len(ONES["hi"]) == 100 and len(ONES["pa"]) == 100

WORDS = {
    #       hundred   thousand   lakh    crore    point      percent      rupees    to
    "en": ("hundred", "thousand", "lakh", "crore", "point", "percent", "rupees", "to"),
    "hi": ("सौ", "हज़ार", "लाख", "करोड़", "दशमलव", "प्रतिशत", "रुपये", "से"),
    "pa": ("ਸੌ", "ਹਜ਼ਾਰ", "ਲੱਖ", "ਕਰੋੜ", "ਦਸ਼ਮਲਵ", "ਪ੍ਰਤੀਸ਼ਤ", "ਰੁਪਏ", "ਤੋਂ"),
}


def _below_100(n: int, lang: str) -> str:
    if lang != "en" or n < 20:
        return ONES[lang][n]
    tens, ones = divmod(n, 10)
    return TENS_EN[tens] + (" " + ONES["en"][ones] if ones else "")


def spell(n: int, lang: str) -> str:
    """A whole number in words, Indian style (12,50,000 = twelve lakh fifty thousand)."""
    if n < 100:
        return _below_100(n, lang)
    hundred, thousand, lakh, crore = WORDS[lang][:4]
    parts = []
    for size, word in ((10**7, crore), (10**5, lakh), (10**3, thousand), (100, hundred)):
        if n >= size:
            count, n = divmod(n, size)
            parts.append(f"{spell(count, lang)} {word}")
    if n:
        parts.append(_below_100(n, lang))
    return " ".join(parts)


_NATIVE_DIGITS = str.maketrans("०१२३४५६७८९੦੧੨੩੪੫੬੭੮੯", "01234567890123456789")
_RANGE = re.compile(r"(\d)\s*[-–]\s*(?=[₹\d])")
_SCALE = r"lakhs|lakh|crores|crore|thousand|लाख|करोड़|हज़ार|हजार|ਲੱਖ|ਕਰੋੜ|ਹਜ਼ਾਰ|ਹਜਾਰ"
_NUMBER = re.compile(r"(₹\s*)?(\d[\d,]*)(?:\.(\d+))?(\s*%)?(\s+(?:" + _SCALE + r")(?!\w))?")


def spell_numbers(text: str, lang: str) -> str:
    """Replaces every number in `text` with words in `lang`."""
    words = WORDS[lang]
    text = _RANGE.sub(lambda m: f"{m.group(1)} {words[7]} ", text.translate(_NATIVE_DIGITS))

    def one(m: re.Match) -> str:
        whole = int(m.group(2).replace(",", "")) if m.group(2).replace(",", "") else 0
        if whole >= 10**12:  # a phone number or an id: read digit by digit
            out = " ".join(ONES[lang][int(d)] for d in m.group(2) if d.isdigit())
        else:
            out = spell(whole, lang)
        if m.group(3):
            out += f" {words[4]} " + " ".join(ONES[lang][int(d)] for d in m.group(3))
        if m.group(4):
            out += f" {words[5]}"
        if m.group(5):  # "₹3 lakh": the scale word comes before "rupees"
            out += " " + m.group(5).strip()
        if m.group(1):
            out += f" {words[6]}"
        return f" {out} "

    return re.sub(r"\s+([,.;:!?।])", lambda m: m.group(1), re.sub(r"\s+", " ", _NUMBER.sub(one, text))).strip()
