"""Pydantic schemas for analyze endpoint."""

from pydantic import BaseModel


class PdaSchema(BaseModel):
    """Previous day area data."""

    yesterday_high: float
    yesterday_low: float
    yesterday_close: float


class ChecklistItemSchema(BaseModel):
    """A single checklist item result."""

    passed: bool
    detail: str
    grade: float | None = None
    rsi: float | None = None


class ChecklistSchema(BaseModel):
    """Full checklist of analysis items."""

    setup_grade: ChecklistItemSchema
    liquidity_sweep: ChecklistItemSchema
    htf_pda_delivery: ChecklistItemSchema
    momentum: ChecklistItemSchema
    dvg_ifvg: ChecklistItemSchema
    clear_targets: ChecklistItemSchema
    smt_w_es: ChecklistItemSchema
    bias_align: ChecklistItemSchema


class TargetSchema(BaseModel):
    """A single price target level."""

    level: int
    price: float


class TargetsSchema(BaseModel):
    """Calculated price targets."""

    clear_targets: bool
    direction: str
    entry: float | None = None
    targets: list[TargetSchema]


class RetracementSchema(BaseModel):
    """Fibonacci retracement data."""

    fib_level: float
    current_retrace: float
    hit_level: bool


class AnalyzeResponse(BaseModel):
    """Full analysis response for a symbol."""

    symbol: str
    pda: PdaSchema
    checklist: ChecklistSchema
    targets: TargetsSchema
    retracement: RetracementSchema
    direction: str
