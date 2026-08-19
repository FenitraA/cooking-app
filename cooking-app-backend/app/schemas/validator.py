def reject_empty_string(v: str | None) -> str | None:
    if v is not None and not v.strip():
        raise ValueError("must not be empty or whitespace")
    return v
