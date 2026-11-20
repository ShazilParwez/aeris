"""User, Family, and Lifestyle Profile schemas."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class SensitivityLevel(str, Enum):
    GENERAL_ADULT = "general_adult"
    CHILD = "child"
    OLDER_ADULT = "older_adult"
    RESPIRATORY_SENSITIVE = "respiratory_sensitive"
    CARDIO_SENSITIVE = "cardio_sensitive"


class TransportMode(str, Enum):
    PRIVATE_CAR = "private_car"
    PUBLIC_BUS = "public_bus"
    METRO_TRAIN = "metro_train"
    CYCLING = "cycling"
    WALKING = "walking"
    WORK_FROM_HOME = "work_from_home"


class CookingEnergy(str, Enum):
    GAS = "gas_stove"
    INDUCTION = "electric_induction"
    BIOMASS = "traditional_biomass"
    MIXED = "mixed"


class FamilyMember(BaseModel):
    id: str
    name: str
    role: str
    sensitivity: SensitivityLevel = SensitivityLevel.GENERAL_ADULT


class LifestyleProfile(BaseModel):
    family_members: List[FamilyMember] = Field(default_factory=list)
    primary_transport: TransportMode = TransportMode.PUBLIC_BUS
    commute_distance_km: float = 12.0
    commute_time_window: str = "08:30"
    preferred_exercise_time: str = "07:00"
    cooking_energy: CookingEnergy = CookingEnergy.GAS
    has_kitchen_exhaust: bool = True
    has_air_purifier: bool = False
    purifier_cadre_room: Optional[str] = None
    ventilation_habit: str = "morning_open"  # morning_open, afternoon_brief, sealed
    sustainability_priority: str = "balanced"  # balanced, max_emissions_reduction, max_health_protection
