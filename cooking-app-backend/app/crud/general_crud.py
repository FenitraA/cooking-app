
from sqlalchemy import ColumnElement, and_, case, func, literal, or_


def smart_search(
    column: ColumnElement,
    search: str,
    *,
    fuzzy_threshold: float = 0.15,
) -> tuple[ColumnElement, ColumnElement]:
    """
    Build a smart text search expression and its relevance ranking.

    Supports:
        - Exact matching
        - Case-insensitive matching
        - Accent-insensitive matching
        - Partial matching
        - Word-order-independent matching
        - Fuzzy matching using PostgreSQL pg_trgm

    Args:
        column: SQLAlchemy column to search.
        search: User-provided search string.
        fuzzy_threshold: Minimum trigram similarity (0.0 to 1.0).

    Returns:
        A tuple containing:
            - SQLAlchemy WHERE expression.
            - SQLAlchemy relevance ranking expression.
    """

    search = " ".join(search.split())

    if not search:
        raise ValueError("Search string cannot be empty.")

    # Normalize database values and search terms.
    normalized_column = func.lower(func.unaccent(column))
    normalized_search = func.lower(func.unaccent(literal(search)))

    # Exact match.
    exact_match = normalized_column == normalized_search

    # Partial match.
    partial_match = normalized_column.ilike(f"%{search}%")

    # Search each word independently, regardless of order.
    words = search.split()

    word_matches = and_(
        *[
            normalized_column.ilike(f"%{word}%")
            for word in words
        ]
    )

    # Fuzzy matching.
    similarity = func.similarity(
        normalized_column,
        normalized_search,
    )

    fuzzy_match = similarity >= fuzzy_threshold

    # Combine search conditions.
    search_filter = or_(
        exact_match,
        partial_match,
        word_matches,
        fuzzy_match,
    )

    # Relevance ranking.
    ranking = case(
        (exact_match, 100),
        (normalized_column.ilike(f"{search}%"), 90),
        (partial_match, 80),
        (word_matches, 70),
        else_=60 + similarity * 10,
    )

    return search_filter, ranking
