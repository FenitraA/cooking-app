from decimal import Decimal

from app.services.general_service import format_currency

EXPECTED_MONTHS = {
    1: "Janoary",
    2: "Febroary",
    3: "Martsa",
    4: "Aprily",
    5: "Mey",
    6: "Jona",
    7: "Jolay",
    8: "Aogositra",
    9: "Septambra",
    10: "Oktobra",
    11: "Novambra",
    12: "Desambra",
    13: "Invalid month number",
}


def test_format_currency():
    amount = Decimal("1000.198215")
    formatted_amount = format_currency(amount=amount, symbol="Euros", decimal_places=3)

    assert formatted_amount == "1,000.198 Euros"
