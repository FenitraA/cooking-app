from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.schemas.validator import reject_empty_string


class AppUserData(BaseModel):
    username: Annotated[
        str,
        StringConstraints(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_.-]+$"),
    ] = Field(example="john_doe")
    password: Annotated[str, StringConstraints(min_length=8, max_length=128)] = Field(
        example="123"
    )
    ref_household_id: str = Field(description="FK to household.id")

    _reject_empty = field_validator("username", "password", "ref_household_id")(
        reject_empty_string
    )


class AppUserRead(BaseModel):
    id: str
    username: str

    model_config = ConfigDict(from_attributes=True)


class AppUserLogin(BaseModel):
    username: str
    password: str

    _reject_empty = field_validator("username", "password")(reject_empty_string)


class AppUserUsernameChange(BaseModel):
    id: str
    new_username: str

    _reject_empty = field_validator("id", "new_username")(reject_empty_string)


class AppUserPasswordChange(BaseModel):
    id: str
    old_password: str
    new_password: str

    _reject_empty = field_validator("id", "old_password", "new_password")(
        reject_empty_string
    )
    
class AppUserPasswordReset(BaseModel):
    username: str
    new_password: str

    _reject_empty = field_validator("username", "new_password")(
        reject_empty_string
    )
