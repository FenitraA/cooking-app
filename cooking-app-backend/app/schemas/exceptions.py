class RefreshTokenNotFound(Exception):
    """Raised when the RefreshToken does not have a corresponding database equivalent."""
    
class RefreshTokenInvalid(Exception):
    """Raised when the RefreshToken is invalid or expired."""
    
class RefreshTokenRevoked(Exception):
    """Raised when the RefreshToken is revoked."""
    
class NotEnoughStock(Exception):
    def __init__(self, ingredient_name,ingredient_unit, missing_quantity=None):
        self.ingredient_name = ingredient_name
        self.missing_quantity = missing_quantity

        message = (
            f"Pas assez de stock pour {ingredient_name},"
            f"Quantité manquante: {missing_quantity} {ingredient_unit}"
        )
        super().__init__(message)
        
class IngredientStockHouseholdMismatchError(Exception):
    """Raised when one or more stocks do not belong to the expected household."""
    pass