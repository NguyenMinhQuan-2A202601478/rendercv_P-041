"""Request and response models for the RenderCV Web Editor API.

Why:
    Guardrails ("trust no one"): every request body is validated by a
    pydantic model before it reaches the `rendercv` core pipeline.
"""

from typing import Any

import pydantic

MAX_DOCUMENT_BYTES = 512 * 1024


class CvDocumentsRequest(pydantic.BaseModel):
    """The four YAML documents submitted by the editor's four tabs.

    Why:
        The web editor mirrors the CV, Design, Locale, and Settings tabs
        1:1 with the four YAML documents the core's overlay mechanism
        expects (`build_rendercv_dictionary_and_model`).
    """

    model_config = pydantic.ConfigDict(extra="forbid")

    cv_yaml: str = pydantic.Field(description="The `cv:` YAML document.")
    design_yaml: str = pydantic.Field(
        default="", description="The `design:` YAML document, or empty."
    )
    locale_yaml: str = pydantic.Field(
        default="", description="The `locale:` YAML document, or empty."
    )
    settings_yaml: str = pydantic.Field(
        default="", description="The `settings:` YAML document, or empty."
    )


class ValidationErrorItem(pydantic.BaseModel):
    """One structured validation error with a YAML source location.

    Why:
        Mirrors `rendercv.exception.RenderCVValidationError` so the frontend
        can jump to the exact tab and line that caused the error.
    """

    location: str | None = pydantic.Field(
        description="Dotted schema path (e.g. `cv.sections.education.0.degree`)."
    )
    message: str = pydantic.Field(description="Human-readable error message.")
    yaml_source: str = pydantic.Field(
        description="Which document the error came from (cv/design/locale/settings)."
    )
    yaml_line: int | None = pydantic.Field(
        description="1-indexed line number in the source YAML document, if known."
    )


class ValidationErrorResponse(pydantic.BaseModel):
    """Response body for a failed validation or render request."""

    errors: list[ValidationErrorItem]


class ValidResponse(pydantic.BaseModel):
    """Response body for a successful validation request."""

    valid: bool = True


class InternalErrorResponse(pydantic.BaseModel):
    """Opaque response body for unexpected server errors.

    Why:
        Guardrails ("never leak stack traces"): only an opaque id is
        returned to the client; full details go to the server log.
    """

    error_id: str = pydantic.Field(
        description="Opaque id to correlate with server logs."
    )
    message: str = "An unexpected error occurred. Please try again."


class ThemeInfo(pydantic.BaseModel):
    """One built-in theme's name and default design options."""

    name: str
    design_defaults: dict[str, Any]
