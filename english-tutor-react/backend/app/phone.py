import re

PHONE_ERROR = "أدخل رقم موبايل سوري صحيح (مثال 0993 000 001)"


def normalize_syrian_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("00963"):
        digits = digits[5:]
    elif digits.startswith("963"):
        digits = digits[3:]
    if digits.startswith("0"):
        digits = digits[1:]
    if len(digits) != 9 or not digits.startswith("9"):
        raise ValueError(PHONE_ERROR)
    return f"+963{digits}"


def display_phone(e164: str | None) -> str:
    if not e164:
        return ""
    digits = re.sub(r"\D", "", e164)
    if digits.startswith("963") and len(digits) == 12:
        local = digits[3:]
        return f"0{local[:3]} {local[3:6]} {local[6:]}"
    return e164
