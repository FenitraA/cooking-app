from datetime import datetime
from pydantic import BaseModel, Field, field_validator

from app.schemas.validator import reject_empty_string


class RoleData(BaseModel):
    role_name: str = Field(max_length=64)
    description: str = Field(max_length=128)
    
    ref_parent_role_id: str | None = Field(default=None, max_length=64)
    
    @field_validator("ref_parent_role_id", mode="before")
    def empty_string_to_none(cls, v):
        return None if v == "" else v

    _reject_empty = field_validator("role_name", "description")(reject_empty_string)

class RoleCreate(RoleData):
    """Schema used to create an Role."""
    pass


class RoleBase(RoleData):
    id: str
    created_at: datetime
    updated_at: datetime | None
    state: int

    class Config:
        from_attributes = True