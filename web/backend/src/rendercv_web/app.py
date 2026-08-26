"""FastAPI application exposing the rendercv core as a web service.

Why:
    Phase 0 of the web editor plan: the backend wraps validation and
    rendering from `rendercv` without reimplementing any of it (see
    docs/plans/active/cv-editor-web-app.md, Approach > Phase 0).
"""

import concurrent.futures
import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from .cache import cache_key_for, render_cache
from .core import CvDocuments, render_documents_to_pdf, validate_documents
from .errors import register_exception_handlers
from .models import MAX_DOCUMENT_BYTES, CvDocumentsRequest, ThemeInfo, ValidResponse
from .schema import load_schema
from .themes import list_theme_defaults

logger = logging.getLogger("rendercv_web")

RENDER_TIMEOUT_SECONDS = 30.0

app = FastAPI(title="RenderCV Web Editor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

# Renders run in a bounded thread pool so a slow Typst compile can be given
# a hard timeout (guardrails: "timeouts on all external calls") instead of
# blocking a request indefinitely.
render_executor = concurrent.futures.ThreadPoolExecutor(
    max_workers=4, thread_name_prefix="rendercv-render"
)


def enforce_document_size_cap(request: CvDocumentsRequest) -> None:
    """Reject any single document over the size cap before it reaches the core.

    Why:
        Guardrails ("trust no one"): request bodies are attacker-controlled;
        cap sizes explicitly rather than assuming the client behaves.

    Args:
        request: The four YAML documents from the client.

    Raises:
        HTTPException: 413 if any document exceeds `MAX_DOCUMENT_BYTES`.
    """
    for field_name, value in request.model_dump().items():
        if len(value.encode("utf-8")) > MAX_DOCUMENT_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"`{field_name}` exceeds the {MAX_DOCUMENT_BYTES} byte limit.",
            )


def to_documents(request: CvDocumentsRequest) -> CvDocuments:
    """Convert the validated request model into the core wrapper's document shape.

    Args:
        request: The validated request body.

    Returns:
        Equivalent `CvDocuments` for the core wrapper.
    """
    return CvDocuments(
        cv_yaml=request.cv_yaml,
        design_yaml=request.design_yaml,
        locale_yaml=request.locale_yaml,
        settings_yaml=request.settings_yaml,
    )


@app.post("/api/validate", response_model=ValidResponse)
def validate(request: CvDocumentsRequest) -> ValidResponse:
    """Validate the four CV YAML documents via the core pipeline.

    Args:
        request: The four YAML documents to validate.

    Returns:
        `{valid: true}` if validation succeeds.

    Raises:
        HTTPException: 413 if a document exceeds the size cap.
    """
    enforce_document_size_cap(request)
    validate_documents(to_documents(request))
    return ValidResponse()


@app.post("/api/render")
def render(request: CvDocumentsRequest) -> Response:
    """Render the four CV YAML documents to a PDF via the core pipeline.

    Why:
        Renders are cached by sha256 of the four documents (guardrails:
        "cache renders by (yaml-hash, theme)") so repeated identical
        requests skip Typst compilation entirely.

    Args:
        request: The four YAML documents to render.

    Returns:
        `application/pdf` response body with the compiled PDF bytes.

    Raises:
        HTTPException: 413 if a document exceeds the size cap, 504 if the
            render exceeds the timeout.
    """
    enforce_document_size_cap(request)
    documents = to_documents(request)
    key = cache_key_for(documents)

    cached_pdf = render_cache.get(key)
    if cached_pdf is not None:
        return Response(content=cached_pdf, media_type="application/pdf")

    future = render_executor.submit(render_documents_to_pdf, documents)
    try:
        pdf_bytes = future.result(timeout=RENDER_TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError as e:
        raise HTTPException(status_code=504, detail="Render timed out.") from e

    render_cache.put(key, pdf_bytes)
    return Response(content=pdf_bytes, media_type="application/pdf")


@app.get("/api/schema")
def schema() -> dict[str, Any]:
    """Serve the repository's root JSON Schema for the form generator.

    Returns:
        Parsed JSON Schema document.
    """
    return load_schema()


@app.get("/api/themes", response_model=list[ThemeInfo])
def themes() -> list[ThemeInfo]:
    """List built-in themes with their default design options.

    Returns:
        One entry per built-in theme (name + default design options).
    """
    return list_theme_defaults()
