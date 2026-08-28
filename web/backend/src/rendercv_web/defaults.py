"""Default CV documents seeded for a brand-new CV.

Why:
    Mirrors `web/frontend/src/lib/stores/documents.ts`'s
    `createDefaultDocuments()` exactly, so `POST /api/cvs` creates a CV that
    renders identically to the placeholder session the frontend already
    shows before anything is saved (docs/plans/active/cv-editor-web-app.md,
    Phase 4). There is no shared source of truth across the Python/
    TypeScript boundary -- keep these two definitions in sync by hand if
    either changes.
"""

DEFAULT_CV_YAML = "cv:\n  name: John Doe\n  sections: {}\n"
DEFAULT_DESIGN_YAML = ""
DEFAULT_LOCALE_YAML = ""
DEFAULT_SETTINGS_YAML = "settings:\n  pdf_title: NAME - CV\n"
DEFAULT_CV_NAME = "Untitled CV"
