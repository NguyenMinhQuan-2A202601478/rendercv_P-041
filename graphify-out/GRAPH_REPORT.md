# Graph Report - rendercv_P-041  (2026-08-27)

## Corpus Check
- Large corpus: 1169 files · ~3,840,562 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2043 nodes · 3756 edges · 157 communities (140 shown, 17 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 238 edges (avg confidence: 0.56)
- Token cost: 370,805 input · 0 output

## Community Hubs (Navigation)
- CV API Client (FE)
- Form Ops & Schema Actions (FE)
- Render Pipeline (Core)
- CV CRUD API (BE)
- CV API Tests (BE)
- Theme Scaffolding (Core)
- DB Models (BE)
- DB Repository Tests (BE)
- Form Components (FE)
- FastAPI App & Endpoints (BE)
- YAML Patch Engine (BE)
- CV Entry Models (Core)
- Documents API Tests (BE)
- Design Models (Core)
- Alembic Migrations (BE)
- Schema Snapshot Fixture (FE)
- Schema Snapshot Fixture 2 (FE)
- Locale Model (Core)
- CodeMirror Editor (FE)
- CV Header Models (Core)
- CLI Progress Panel (Core)
- Date Logic (Core)
- Svelte Stores & Time (FE)
- API Error Boundary (BE)
- Entry Templates (Core)
- Backend API Tests (BE)
- Locale Translations (Core)
- Sample Generator (Core)
- rendercv/schema
- lib/preview
- cli/new_command
- rendercv/cli
- web/frontend
- web/frontend
- schema/fixtures
- schema/fixtures
- frontend/e2e
- web/backend
- src/rendercv_web
- entries/bases
- schema/models
- lib/api
- models/cv
- lib/api
- rendercv/schema
- cli/render_command
- renderer/templater
- schema/fixtures
- web/frontend
- lib/preview
- schema/fixtures
- frontend/scripts
- src/rendercv_web
- src/rendercv_web
- src/rendercv_web
- lib/form
- schema/fixtures
- design/other_themes
- web/frontend
- lib/persistence
- lib/editor
- cli/render_command
- schema/fixtures
- schema/fixtures
- renderer/typst_fontawesome
- models/settings
- src/rendercv_web
- lib/form
- schema/fixtures
- schema/fixtures
- schema/fixtures
- models/locale
- schema/fixtures
- schema/fixtures
- schema/fixtures
- schema/fixtures
- schema/fixtures
- src/rendercv_web
- lib/form
- schema/fixtures
- schema/fixtures
- schema/fixtures
- schema/fixtures
- schema/fixtures
- schema/fixtures
- renderer/templater
- schema/fixtures
- schema/fixtures
- schema/fixtures
- schema/fixtures
- rendercv/cli
- markdown/entries
- cv/entries
- schema/fixtures
- schema/fixtures
- schema/fixtures
- src/rendercv_web
- renderer/templater
- rendercv/schema
- migrations/versions
- src/rendercv_web
- web/frontend
- lib/form
- schema/fixtures
- schema/fixtures
- schema/fixtures
- schema/fixtures
- schema/fixtures
- schema/fixtures
- schema/fixtures
- schema/fixtures
- templates/html
- models/cv
- components/form
- schema/fixtures
- schema/fixtures
- schema/fixtures
- schema/fixtures
- renderer/rendercv_typst
- models/design
- lib/assets
- frontend/e2e
- lib/form
- templates/markdown
- rendercv/schema
- web/frontend
- frontend/src
- frontend/static
- web/backend
- markdown/entries
- markdown/entries
- markdown/entries
- markdown/entries
- markdown/entries
- design/other_themes

## God Nodes (most connected - your core abstractions)
1. `BaseModelWithoutExtraKeys` - 42 edges
2. `default` - 37 edges
3. `RenderCVModel` - 35 edges
4. `CvDocuments` - 33 edges
5. `RenderCVInternalError` - 32 edges
6. `default` - 32 edges
7. `RenderCVUserError` - 30 edges
8. `session()` - 24 edges
9. `BaseEntry` - 22 edges
10. `Locale Localization Schema` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Arabic locale (RTL; 'DEGREE في AREA'; Gregorian month names transliterated)` --implements--> `Locale Localization Schema`  [EXTRACTED]
  src/rendercv/schema/models/locale/other_locales/arabic.yaml → schema.json
- `Danish locale ('DEGREE i AREA'; year/years both 'år')` --implements--> `Locale Localization Schema`  [EXTRACTED]
  src/rendercv/schema/models/locale/other_locales/danish.yaml → schema.json
- `Dutch locale ('DEGREE in AREA'; present = 'heden')` --implements--> `Locale Localization Schema`  [EXTRACTED]
  src/rendercv/schema/models/locale/other_locales/dutch.yaml → schema.json
- `French locale ('DEGREE en AREA'; month/months both 'mois')` --implements--> `Locale Localization Schema`  [EXTRACTED]
  src/rendercv/schema/models/locale/other_locales/french.yaml → schema.json
- `German locale ('DEGREE in AREA'; present = 'gegenwärtig')` --implements--> `Locale Localization Schema`  [EXTRACTED]
  src/rendercv/schema/models/locale/other_locales/german.yaml → schema.json

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Built-in other-themes design override catalog** — src_rendercv_schema_models_design_other_themes_ember, src_rendercv_schema_models_design_other_themes_engineeringclassic, src_rendercv_schema_models_design_other_themes_engineeringresumes, src_rendercv_schema_models_design_other_themes_harvard, src_rendercv_schema_models_design_other_themes_ink, src_rendercv_schema_models_design_other_themes_moderncv, src_rendercv_schema_models_design_other_themes_opal, src_rendercv_schema_models_design_other_themes_sb2nov [EXTRACTED 1.00]
- **Markdown entry-type rendering templates** — src_rendercv_renderer_templater_templates_markdown_entries_bulletentry_j2, src_rendercv_renderer_templater_templates_markdown_entries_educationentry_j2, src_rendercv_renderer_templater_templates_markdown_entries_experienceentry_j2, src_rendercv_renderer_templater_templates_markdown_entries_normalentry_j2, src_rendercv_renderer_templater_templates_markdown_entries_numberedentry_j2, src_rendercv_renderer_templater_templates_markdown_entries_onelineentry_j2, src_rendercv_renderer_templater_templates_markdown_entries_publicationentry_j2, src_rendercv_renderer_templater_templates_markdown_entries_reversednumberedentry_j2, src_rendercv_renderer_templater_templates_markdown_entries_textentry_j2 [EXTRACTED 1.00]
- **design.templates-driven education entry rendering** — src_rendercv_renderer_templater_templates_markdown_entries_educationentry_j2, src_rendercv_schema_models_design_other_themes_ember, src_rendercv_schema_models_design_other_themes_engineeringclassic, src_rendercv_schema_models_design_other_themes_engineeringresumes, src_rendercv_schema_models_design_other_themes_harvard, src_rendercv_schema_models_design_other_themes_ink, src_rendercv_schema_models_design_other_themes_moderncv, src_rendercv_schema_models_design_other_themes_opal, src_rendercv_schema_models_design_other_themes_sb2nov [INFERRED 0.75]
- **All 21 other_locales translation files implement the shared Locale Localization Schema (each declares $schema=../../../../../../schema.json and defines the same locale keys: language, last_updated, month/months, year/years, present, phrases.degree_with_area, month_abbreviations, month_names)** — src_rendercv_schema_models_locale_other_locales_arabic_locale, src_rendercv_schema_models_locale_other_locales_danish_locale, src_rendercv_schema_models_locale_other_locales_dutch_locale, src_rendercv_schema_models_locale_other_locales_french_locale, src_rendercv_schema_models_locale_other_locales_german_locale, src_rendercv_schema_models_locale_other_locales_hebrew_locale, src_rendercv_schema_models_locale_other_locales_hindi_locale, src_rendercv_schema_models_locale_other_locales_hungarian_locale, src_rendercv_schema_models_locale_other_locales_indonesian_locale, src_rendercv_schema_models_locale_other_locales_italian_locale, src_rendercv_schema_models_locale_other_locales_japanese_locale, src_rendercv_schema_models_locale_other_locales_korean_locale, src_rendercv_schema_models_locale_other_locales_mandarin_chinese_locale, src_rendercv_schema_models_locale_other_locales_norwegian_bokm_l_locale, src_rendercv_schema_models_locale_other_locales_norwegian_nynorsk_locale, src_rendercv_schema_models_locale_other_locales_persian_locale, src_rendercv_schema_models_locale_other_locales_portuguese_locale, src_rendercv_schema_models_locale_other_locales_russian_locale, src_rendercv_schema_models_locale_other_locales_spanish_locale, src_rendercv_schema_models_locale_other_locales_turkish_locale, src_rendercv_schema_models_locale_other_locales_vietnamese_locale, schema_locale_localization_schema [EXTRACTED 1.00]
- **AREA-first degree phrase group: Hindi, Japanese, Korean, Mandarin Chinese, and Turkish reverse the placeholder order (AREA before DEGREE) in phrases.degree_with_area, unlike the DEGREE-first pattern of the other 16 locales** — src_rendercv_schema_models_locale_other_locales_hindi_locale, src_rendercv_schema_models_locale_other_locales_japanese_locale, src_rendercv_schema_models_locale_other_locales_korean_locale, src_rendercv_schema_models_locale_other_locales_mandarin_chinese_locale, src_rendercv_schema_models_locale_other_locales_turkish_locale [INFERRED 0.85]
- **RTL-script locale group: Arabic, Hebrew, and Persian are written right-to-left, which affects how the Typst renderer must lay out dates and the degree_with_area phrase** — src_rendercv_schema_models_locale_other_locales_arabic_locale, src_rendercv_schema_models_locale_other_locales_hebrew_locale, src_rendercv_schema_models_locale_other_locales_persian_locale [INFERRED 0.85]

## Communities (157 total, 17 thin omitted)

### Community 0 - "CV API Client (FE)"
Cohesion: 0.06
Nodes (64): createCv(), CvDetail, CvDetailPayload, CvDocumentsPayload, CvSummary, CvSummaryPayload, CvVersionSummary, CvVersionSummaryPayload (+56 more)

### Community 1 - "Form Ops & Schema Actions (FE)"
Cohesion: 0.06
Nodes (59): ei(), buildAddEntryOp(), buildAddHighlightOp(), buildAddSectionOp(), buildDeleteEntryOp(), buildDeleteHighlightOp(), buildDeleteSectionOp(), buildMoveEntryOp() (+51 more)

### Community 2 - "Render Pipeline (Core)"
Cohesion: 0.08
Nodes (51): Compiler, Environment, Unpack, Execute complete CV generation pipeline with progress tracking and error…, run_rendercv(), generate_html(), Path, Generate HTML file from Markdown source with styling. Why: HTML format enables… (+43 more)

### Community 3 - "CV CRUD API (BE)"
Cohesion: 0.07
Nodes (53): CvDetail, CvDocumentsPayload, CvSummary, CvVersionSummary, apply_update_result(), create_cv(), cv_documents(), cv_to_detail() (+45 more)

### Community 4 - "CV API Tests (BE)"
Cohesion: 0.09
Nodes (21): client(), create_default_cv(), make_client(), fixture, TestClient, Contract tests for Phase 4b: session identity, `/api/cvs`, `/api/preferences`.…, `GET/POST/PUT/DELETE /api/cvs` happy paths., A CV id belonging to another session must look exactly like 404. (+13 more)

### Community 5 - "Theme Scaffolding (Core)"
Cohesion: 0.08
Nodes (33): ClassicTheme, copy_templates(), make_tree_writable(), Path, Copy built-in template directory to user location for customization. Why: Users…, Add user-write permission to all files and directories in a tree. Why: On…, create_init_file_for_theme(), Path (+25 more)

### Community 6 - "DB Models (BE)"
Cohesion: 0.09
Nodes (41): DeclarativeBase, Base, Cv, CvVersion, Preference, SQLAlchemy ORM models for the RenderCV Web Editor's baseline schema. Why: Per…, An append-only autosave snapshot of a CV's four documents. Why: Powers undo…, One UI-state key/value pair for a user (yaml mode, zoom, sidebar...). Why:… (+33 more)

### Community 7 - "DB Repository Tests (BE)"
Cohesion: 0.07
Nodes (22): fixture, Path, Session, sessionmaker, Tests for the persistence layer: models, repository functions, and the initial…, `update_cv_conditional`: the autosave concurrency guarantee., Two concurrent autosaves: the second to attempt the UPDATE with a now-stale…, `add_version`, `list_versions`, `get_version`, `prune_versions`. (+14 more)

### Community 8 - "Form Components (FE)"
Cohesion: 0.12
Nodes (16): buildDiscriminatorSwitchOp(), buildEnsurePathOps(), buildResetFieldOp(), buildSetFieldOp(), deepMerge(), isPathOverridden(), isPlainObject(), OverrideInfo (+8 more)

### Community 9 - "FastAPI App & Endpoints (BE)"
Cohesion: 0.08
Nodes (37): lifespan(), parse_document(), patch_document(), CvDocuments, FastAPI, post, Response, FastAPI application exposing the rendercv core as a web service. Why: Phase 0… (+29 more)

### Community 10 - "YAML Patch Engine (BE)"
Cohesion: 0.11
Nodes (37): apply_delete(), apply_insert(), apply_move(), apply_patch_ops(), apply_set(), build_document_yaml(), DocumentPatchError, load_yaml_document() (+29 more)

### Community 11 - "CV Entry Models (Core)"
Cohesion: 0.12
Nodes (24): BaseModelWithExtraKeys, Pydantic base model that allows unrecognized fields. Why: Entry models need to…, BaseEntry, Base class for all CV entry types. Why: All entry types share common…, Convert class name to snake_case for template attribute lookup. Why: Template…, BaseEntryWithComplexFields, BaseEntryWithDate, Validate date format while allowing flexible user input. Why: Users enter dates… (+16 more)

### Community 12 - "Documents API Tests (BE)"
Cohesion: 0.08
Nodes (17): client(), fixture, TestClient, Contract tests for the comment-preserving YAML document endpoints. Why: `POST…, The scenario required verbatim: one `set` op, everything else intact., Contract tests for each `POST /api/documents/patch` op type., 400 error-shape contract tests for `POST /api/documents/patch`., 413 size-cap contract test for `POST /api/documents/patch`. (+9 more)

### Community 13 - "Design Models (Core)"
Cohesion: 0.10
Nodes (29): FontFamilyType, PydanticColor, BaseModelWithoutExtraKeys, Pydantic base model that rejects unrecognized fields. Why: Most RenderCV models…, Bold, Colors, Connections, EducationEntryTemplate (+21 more)

### Community 14 - "Alembic Migrations (BE)"
Cohesion: 0.10
Nodes (29): Config, Engine, Run migrations in 'offline' mode. This configures the context with just a URL…, Run migrations in 'online' mode. In this scenario we need to create an Engine…, run_migrations_offline(), run_migrations_online(), Persistence layer for the RenderCV Web Editor (Phase 4a). Why: Isolates…, build_alembic_config() (+21 more)

### Community 15 - "Schema Snapshot Fixture (FE)"
Cohesion: 0.06
Nodes (32): Apr, Aug, Dec, Feb, Jan, Jul, July, Jun (+24 more)

### Community 16 - "Schema Snapshot Fixture 2 (FE)"
Cohesion: 0.06
Nodes (32): April, August, Augustus, December, Februar, Februari, February, Januar (+24 more)

### Community 17 - "Locale Model (Core)"
Cohesion: 0.12
Nodes (30): BaseModel, EnglishLocale, FieldInfo, FieldSpec, discover_other_locales(), Auto-discover and load locale variant classes from other_locales/ directory.…, create_discriminator_field_spec(), create_nested_field_spec() (+22 more)

### Community 18 - "CodeMirror Editor (FE)"
Cohesion: 0.11
Nodes (11): if(), applyDiagnostics(), DocumentEditorRegistry, externalDocUpdate(), isSyncTransaction(), lineDiagnostic(), syncAnnotation, wrapAsLink() (+3 more)

### Community 19 - "CV Header Models (Core)"
Cohesion: 0.09
Nodes (23): EntryModel, CustomConnection, User-defined contact method with custom icon and URL. Why: Built-in social…, Cv, Transform user's section dict to list of typed section objects. Why: Templates…, BaseRenderCVSection, create_section_models(), dictionary_key_to_proper_section_title() (+15 more)

### Community 20 - "CLI Progress Panel (Core)"
Cohesion: 0.09
Nodes (20): args, kwargs, CompletedStep, format_validation_error_location(), ProgressPanel, Path, Display error panel and exit with error code. Args: user_error: User-facing…, Display validation errors in table format and exit. Why: Pydantic validation… (+12 more)

### Community 21 - "Date Logic (Core)"
Cohesion: 0.17
Nodes (25): build_date_placeholders(), compute_time_span_string(), date_object_to_string(), format_date_range(), Date, Locale, Build all date-related template placeholders from a date and locale. Why: Date…, Calculate and format duration between dates with localized units. Why: CV… (+17 more)

### Community 22 - "Svelte Stores & Time (FE)"
Cohesion: 0.12
Nodes (11): formatRelativeTime(), parseServerTimestamp(), UNITS, derivePdfFilename(), extractScalar(), sanitizeFilename(), createDefaultDocuments(), DOCUMENT_LABELS (+3 more)

### Community 23 - "API Error Boundary (BE)"
Cohesion: 0.12
Nodes (25): CvConflictError, Exception, FastAPI, The API's single exception boundary. Why: Guardrails ("Inside code"): one…, Raised when an autosave write loses the optimistic-concurrency check. Why:…, Store the current server-side state to return to the client. Args: current: The…, Convert one core validation error into the API's error shape. Args: error:…, Register the API's single exception boundary on the FastAPI app. Args: app: The… (+17 more)

### Community 24 - "Entry Templates (Core)"
Cohesion: 0.12
Nodes (26): EntryType, format_single_date(), Format single date with locale-aware template or pass through custom strings.…, clean_trailing_parts(), process_authors(), process_date(), process_doi(), process_highlights() (+18 more)

### Community 25 - "Backend API Tests (BE)"
Cohesion: 0.13
Nodes (15): client(), minimal_request(), fixture, TestClient, Contract tests for the RenderCV Web Editor API. Why: Each endpoint…, Contract tests for `POST /api/render`., Contract tests for `GET /api/schema`., Contract tests for `GET /api/themes`. (+7 more)

### Community 26 - "Locale Translations (Core)"
Cohesion: 0.10
Nodes (24): Locale Localization Schema, Arabic locale (RTL; 'DEGREE في AREA'; Gregorian month names transliterated), Danish locale ('DEGREE i AREA'; year/years both 'år'), DEGREE/AREA phrase ordering rationale: each locale's degree_with_area template reorders the DEGREE and AREA placeholders and picks the joining preposition to match natural word order in that language — most European languages keep DEGREE first with a preposition (in/en/em/i/di/в/ngành), while Hindi, Japanese, Korean, Mandarin Chinese, and Turkish place AREA first because the field of study naturally precedes the degree name in those languages, Dutch locale ('DEGREE in AREA'; present = 'heden'), French locale ('DEGREE en AREA'; month/months both 'mois'), German locale ('DEGREE in AREA'; present = 'gegenwärtig'), Hebrew locale (RTL; 'DEGREE בAREA' with prefixed preposition; apostrophe-marked month abbreviations) (+16 more)

### Community 27 - "Sample Generator (Core)"
Cohesion: 0.17
Nodes (23): comment_out_section_sub_fields(), create_sample_cv_file(), create_sample_design_file(), create_sample_locale_file(), create_sample_rendercv_pydantic_model(), create_sample_settings_file(), create_sample_yaml_file(), create_sample_yaml_input_file() (+15 more)

### Community 28 - "rendercv/schema"
Cohesion: 0.15
Nodes (21): User-facing error carrying multiple structured validation errors. Why: YAML…, RenderCVUserValidationError, ValidationContext, build_rendercv_dictionary(), build_rendercv_dictionary_and_model(), build_rendercv_model_from_commented_map(), BuildRendercvModelArguments, get_yaml_error_location() (+13 more)

### Community 29 - "lib/preview"
Cohesion: 0.15
Nodes (16): UpdateCvRequest, RenderResult, ClientRenderEngine, createRenderController(), activate(), clientEngineUsable(), renderNow(), runRender() (+8 more)

### Community 30 - "cli/new_command"
Cohesion: 0.10
Nodes (19): available_locales, available_themes, join, Panel, build_creation_panel(), cli_command_new(), Argument, command (+11 more)

### Community 31 - "rendercv/cli"
Cohesion: 0.13
Nodes (21): callback, cli_command_no_args(), fetch_and_cache_latest_version(), fetch_latest_version_from_pypi(), get_cache_dir(), get_version_cache_file(), Context, help (+13 more)

### Community 32 - "web/frontend"
Cohesion: 0.10
Nodes (21): codemirror, @codemirror/commands, @codemirror/lang-yaml, @codemirror/language, @codemirror/lint, @codemirror/state, @codemirror/view, @lezer/highlight (+13 more)

### Community 33 - "web/frontend"
Cohesion: 0.10
Nodes (21): @playwright/test, svelte-check, @sveltejs/adapter-auto, @sveltejs/kit, @sveltejs/vite-plugin-svelte, tailwindcss, @tailwindcss/vite, typescript (+13 more)

### Community 34 - "schema/fixtures"
Cohesion: 0.21
Nodes (20): properties, $ref, properties, properties, properties, $ref, $ref, $ref (+12 more)

### Community 35 - "schema/fixtures"
Cohesion: 0.11
Nodes (19): fontawesome_icon, placeholder, url, additionalProperties, description, properties, required, title (+11 more)

### Community 36 - "frontend/e2e"
Cohesion: 0.18
Nodes (3): switchToFormMode(), firstPreviewUrl(), gotoReady()

### Community 37 - "web/backend"
Cohesion: 0.11
Nodes (19): docs/plans/active/cv-editor-web-app.md (overall plan), rendercv-web-backend README, FastAPI backend for the RenderCV Web Editor, JSON schema HTTP capability, PDF rendering HTTP capability, rendercv core (editable path dependency), Theme defaults HTTP capability, Validation HTTP capability (+11 more)

### Community 38 - "src/rendercv_web"
Cohesion: 0.15
Nodes (17): Cookie, Depends, decode_cookie(), encode_cookie(), generate_session_token(), get_current_user(), Response, Session (+9 more)

### Community 39 - "entries/bases"
Cohesion: 0.14
Nodes (16): datetime, RuntimeError, Internal error indicating a bug in RenderCV logic. Why: Distinguishes…, RenderCVInternalError, get_date_object(), Date, model_validator, Self (+8 more)

### Community 40 - "schema/models"
Cohesion: 0.12
Nodes (16): Any, ValidationInfo, Validate design options for built-in or custom themes with dynamic loading.…, validate_design(), Path, ValidationInfo, Convert relative path to absolute path based on input file location. Why: Users…, resolve_relative_path() (+8 more)

### Community 41 - "lib/api"
Cohesion: 0.23
Nodes (12): parseCvDocument(), ParseResult, patchCvDocument(), PatchOpError, PatchResult, ValidationError, FormSyncController, FormSyncOptions (+4 more)

### Community 42 - "models/cv"
Cohesion: 0.12
Nodes (13): EmailStr, field_serializer, ModelWrapValidatorHandler, PhoneNumber, Any, field_validator, HttpUrl, model_validator (+5 more)

### Community 43 - "lib/api"
Cohesion: 0.24
Nodes (8): apiFetch(), renderPreview(), docs, ThemeInfo, genericSystemError(), parseValidationErrors(), docs, validateDocuments()

### Community 44 - "rendercv/schema"
Cohesion: 0.21
Nodes (13): ErrorDetails, CustomPydanticErrorTypes, get_coordinates_of_a_key_in_a_yaml_object(), get_inner_yaml_object_from_its_key(), parse_plain_pydantic_error(), parse_validation_errors(), Any, CommentedMap (+5 more)

### Community 45 - "cli/render_command"
Cohesion: 0.16
Nodes (13): parse_override_arguments(), Context, Parse CLI override arguments into dotted-path dictionary. Why: Users need quick…, cli_command_render(), Argument, command, Context, help (+5 more)

### Community 46 - "renderer/templater"
Cohesion: 0.20
Nodes (14): compute_connections(), compute_connections_for_markdown(), compute_connections_for_typst(), Connection, parse_connections(), Format connections with Typst markup, Font Awesome icons, and conditional…, Format connections as Markdown links without icons. Args: rendercv_model: CV…, Route to format-specific connection generator. Args: rendercv_model: CV model… (+6 more)

### Community 47 - "schema/fixtures"
Cohesion: 0.13
Nodes (15): additionalProperties, title, type, anyOf, additionalProperties, title, type, $defs (+7 more)

### Community 48 - "web/frontend"
Cohesion: 0.14
Nodes (13): ./.svelte-kit/tsconfig.json, compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule (+5 more)

### Community 49 - "lib/preview"
Cohesion: 0.21
Nodes (10): ValidateResult, createValidateController(), activate(), runValidate(), scheduleValidate(), DocumentSource, initialState(), ValidateController (+2 more)

### Community 50 - "schema/fixtures"
Cohesion: 0.14
Nodes (14): discriminator, oneOf, BuiltInDesign, mapping, propertyName, classic, ember, engineeringclassic (+6 more)

### Community 51 - "frontend/scripts"
Cohesion: 0.23
Nodes (12): buildWheel(), copyFonts(), copyInto(), copyTypstCompilerWasm(), copyTypstPackages(), FONT_FILES, FRONTEND_ROOT, main() (+4 more)

### Community 52 - "src/rendercv_web"
Cohesion: 0.18
Nodes (11): Any, get, Serve the repository's root JSON Schema for the form generator. Returns: Parsed…, schema(), load_schema(), Any, Path, Serves the repository's root `schema.json` as the form generator's data source.… (+3 more)

### Community 53 - "src/rendercv_web"
Cohesion: 0.24
Nodes (10): In-memory render cache keyed by document hash. Why: Typst compilation is…, blank_to_none(), CvDocuments, Wraps the rendercv core pipeline for the web API. Why: The API must reuse the…, The four YAML documents that make up one CV editor session. Why: Mirrors the…, Treat a whitespace-only overlay document as "not provided". Why: The core's…, Validate the four YAML documents via the core pipeline. Why: Reuses…, Render the four YAML documents to PDF bytes via the core pipeline. Why: Mirrors… (+2 more)

### Community 54 - "src/rendercv_web"
Cohesion: 0.21
Nodes (11): PreferenceUpdateRequest, Request body for `PUT /api/preferences`., get_preferences(), CurrentUser, get, put, SessionDep, UI-state preferences: `GET`/`PUT /api/preferences`. Why: Session-scoped… (+3 more)

### Community 55 - "lib/form"
Cohesion: 0.29
Nodes (10): createFormSync(), activate(), applyOptimistic(), currentCvYaml(), destroy(), flush(), reparse(), scheduleFlush() (+2 more)

### Community 56 - "schema/fixtures"
Cohesion: 0.22
Nodes (11): 2020, 2020-09, 2020-09-24, Fall 2023, Summer 2020, anyOf, default, description (+3 more)

### Community 57 - "design/other_themes"
Cohesion: 0.24
Nodes (11): RenderCV Typst Package Changelog, RTL Text Direction Support, RenderCV Typst Package README, RenderCV Typst Package (@preview/rendercv), typst-fontawesome Library README, fa-icon Typst Function, Engineering Classic Theme Design Overrides, Engineering Resumes Theme Design Overrides (+3 more)

### Community 58 - "web/frontend"
Cohesion: 0.18
Nodes (11): scripts, build, build:wasm-assets, check, check:watch, dev, prepare, preview (+3 more)

### Community 59 - "lib/persistence"
Cohesion: 0.29
Nodes (6): getPreferences(), setPreference(), createPreferenceWriter(), write(), PreferenceWriter, PreferenceWriterOptions

### Community 60 - "lib/editor"
Cohesion: 0.29
Nodes (8): YamlSource, classifyError(), documentKeyForError(), ErrorCategory, groupErrorsByDocument(), isSyntaxError(), YAML_SOURCE_TO_DOCUMENT_KEY, DOCUMENT_KEYS

### Community 61 - "cli/render_command"
Cohesion: 0.22
Nodes (7): DirModifiedEvent, FileModifiedEvent, EventHandler, Path, Trigger a callback when a watched file is modified. Args: function: Callback to…, Watch files and re-run function when any is modified. Why: Watch mode lets…, run_function_if_files_change()

### Community 62 - "schema/fixtures"
Cohesion: 0.20
Nodes (10): ●, Excellent communication skills, Python, JavaScript, C++, enum, examples, title, type, properties (+2 more)

### Community 63 - "schema/fixtures"
Cohesion: 0.20
Nodes (10): 2024, 2024-05, 2024-05-20, present, anyOf, default, description, examples (+2 more)

### Community 64 - "renderer/typst_fontawesome"
Cohesion: 0.29
Nodes (9): fetch_icons(), generate_gallery(), generate_lib(), main(), map_icons(), Generate typst library files for FontAwesome icons. Args: icon_maps: A…, Generate a typst gallery file for FontAwesome icons. Args: icon_maps: A…, Fetch icons from FontAwesome API for a specific version. Args: version: The… (+1 more)

### Community 65 - "models/settings"
Cohesion: 0.27
Nodes (5): RenderCommand, field_validator, model_validator, Remove duplicate keywords from bold list. Why: Users might accidentally list…, Settings

### Community 66 - "src/rendercv_web"
Cohesion: 0.24
Nodes (9): ThemeInfo, List built-in themes with their default design options. Returns: One entry per…, themes(), One built-in theme's name and default design options., ThemeInfo, list_theme_defaults(), ThemeInfo, Theme listing endpoint support: names and per-theme design defaults. Why:… (+1 more)

### Community 67 - "lib/form"
Cohesion: 0.33
Nodes (5): errorsAtPath(), errorsUnderPath(), hasUnclaimedErrors(), collapseOps(), pathKey()

### Community 68 - "schema/fixtures"
Cohesion: 0.22
Nodes (9): BA, BS, MS, PhD, anyOf, default, examples, title (+1 more)

### Community 69 - "schema/fixtures"
Cohesion: 0.22
Nodes (9): https://example.com/photo.jpg, images/profile.png, photo.jpg, anyOf, default, description, examples, title (+1 more)

### Community 70 - "schema/fixtures"
Cohesion: 0.22
Nodes (9): Istanbul, Türkiye, London, UK, New York, NY, Remote, anyOf, default, examples, title (+1 more)

### Community 71 - "models/locale"
Cohesion: 0.22
Nodes (5): EnglishLocale, Phrases, Get ISO 639-1 two-letter language code for locale. Why: Typst's text element…, Get flag emoji for the locale's primary country. Why: Flag emojis are displayed…, Check if language uses right-to-left text direction. Returns: True if language…

### Community 72 - "schema/fixtures"
Cohesion: 0.22
Nodes (9): additionalProperties, properties, title, type, Cv, social_networks, anyOf, default (+1 more)

### Community 73 - "schema/fixtures"
Cohesion: 0.25
Nodes (8): area, institution, EducationEntry, additionalProperties, description, required, title, type

### Community 74 - "schema/fixtures"
Cohesion: 0.25
Nodes (8): Boğaziçi University, Harvard University, MIT, properties, examples, title, type, institution

### Community 75 - "schema/fixtures"
Cohesion: 0.25
Nodes (8): Computer Science, Electrical Engineering, Mechanical Engineering, description, examples, title, type, area

### Community 76 - "schema/fixtures"
Cohesion: 0.25
Nodes (8): Data Scientist, Product Manager, Software Engineer, anyOf, default, examples, title, headline

### Community 77 - "src/rendercv_web"
Cohesion: 0.25
Nodes (5): Thread-safe, size-capped cache of rendered PDF bytes. Why: FastAPI can serve a…, Create an empty cache. Args: max_entries: Maximum number of cached renders to…, Look up a cached render by key. Args: key: Cache key, as produced by…, Store a render, evicting the oldest entry once over capacity. Args: key: Cache…, RenderCache

### Community 78 - "lib/form"
Cohesion: 0.36
Nodes (5): DIMENSION_UNITS, DimensionUnit, ParsedDimension, parseDimension(), serializeDimension()

### Community 79 - "schema/fixtures"
Cohesion: 0.25
Nodes (8): EnglishLocale, additionalProperties, properties, default, description, title, type, month

### Community 80 - "schema/fixtures"
Cohesion: 0.29
Nodes (7): bullet, additionalProperties, description, required, title, type, BulletEntry

### Community 81 - "schema/fixtures"
Cohesion: 0.29
Nodes (7): Completed advanced coursework in machine learning and artificial intelligence., Led a team of 5 engineers to develop innovative solutions., summary, anyOf, default, examples, title

### Community 82 - "schema/fixtures"
Cohesion: 0.29
Nodes (7): Jane Smith, John Doe, anyOf, default, examples, title, name

### Community 84 - "schema/fixtures"
Cohesion: 0.29
Nodes (7): type, items, description, items, title, type, month_names

### Community 85 - "schema/fixtures"
Cohesion: 0.29
Nodes (7): sections, anyOf, default, description, examples, $ref, title

### Community 86 - "renderer/templater"
Cohesion: 0.40
Nodes (5): Pattern, build_keyword_matcher_pattern(), make_keywords_bold(), Build cached regex pattern for matching keywords with longest-first priority.…, Wrap all keyword occurrences in Markdown bold syntax. Why: Users configure…

### Community 87 - "schema/fixtures"
Cohesion: 0.33
Nodes (6): +1-234-567-8900, default, description, examples, title, phone

### Community 88 - "schema/fixtures"
Cohesion: 0.33
Nodes (6): center, left, right, enum, type, Alignment

### Community 89 - "schema/fixtures"
Cohesion: 0.33
Nodes (6): https://johndoe.com, website, default, description, examples, title

### Community 90 - "schema/fixtures"
Cohesion: 0.33
Nodes (6): john.doe@example.com, default, description, examples, title, email

### Community 91 - "rendercv/cli"
Cohesion: 0.40
Nodes (4): entry_point(), Entry point for the RenderCV CLI. Why: Users might install RenderCV with `pip…, Entry point for the RenderCV CLI., `__main__.py` file is the file that gets executed when the RenderCV package…

### Community 92 - "markdown/entries"
Cohesion: 0.33
Nodes (6): Markdown EducationEntry Template, Markdown ExperienceEntry Template, Markdown NormalEntry Template, Markdown PublicationEntry Template, Ember Theme Design Overrides, Opal Theme Design Overrides

### Community 93 - "cv/entries"
Cohesion: 0.40
Nodes (4): model_validator, Self, Prioritize DOI over custom URL when both provided. Why: DOI is canonical,…, Validate generated DOI URL is well-formed. Why: DOI URL generation from DOI…

### Community 94 - "schema/fixtures"
Cohesion: 0.33
Nodes (6): anyOf, default, description, examples, title, custom_connections

### Community 95 - "schema/fixtures"
Cohesion: 0.33
Nodes (6): const, default, description, title, type, language

### Community 96 - "schema/fixtures"
Cohesion: 0.33
Nodes (6): description, maxItems, minItems, title, type, month_abbreviations

### Community 98 - "src/rendercv_web"
Cohesion: 0.50
Nodes (5): delete, delete_cv(), Delete a CV and its version history. Why: Returns `None` rather than a fresh…, delete_cv(), Delete a CV (and, via `ON DELETE CASCADE`, its versions). Args: session: The…

### Community 99 - "renderer/templater"
Cohesion: 0.40
Nodes (5): Element, escape_typst_characters(), Recursively convert XML Element tree to Typst markup string. Why: Python…, Escape Typst special characters while preserving Typst commands and math. Why:…, to_typst_string()

### Community 100 - "rendercv/schema"
Cohesion: 0.40
Nodes (4): RoundTripScanner, Custom Scanner that treats * as a regular character instead of alias syntax.…, Treat * as a plain scalar character instead of alias syntax., ScannerNoAlias

### Community 101 - "migrations/versions"
Cohesion: 0.40
Nodes (4): downgrade(), Create `users`, `cvs`, `preferences`, and `cv_versions`., Drop the four baseline tables, children before parents., upgrade()

### Community 102 - "src/rendercv_web"
Cohesion: 0.40
Nodes (4): RoundTripScanner, Treat `*` as a plain scalar character instead of alias syntax. Why: Mirrors…, Treat `*` as a plain scalar character instead of alias syntax., ScannerNoAlias

### Community 103 - "web/frontend"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 104 - "lib/form"
Cohesion: 0.80
Nodes (3): addEntryLabel(), displaySectionTitle(), singularizeWord()

### Community 105 - "schema/fixtures"
Cohesion: 0.40
Nodes (5): additionalProperties, properties, title, type, DanishLocale

### Community 106 - "schema/fixtures"
Cohesion: 0.40
Nodes (5): DutchLocale, additionalProperties, properties, title, type

### Community 107 - "schema/fixtures"
Cohesion: 0.40
Nodes (5): default, description, title, type, last_updated

### Community 108 - "schema/fixtures"
Cohesion: 0.40
Nodes (5): default, description, title, type, months

### Community 109 - "schema/fixtures"
Cohesion: 0.40
Nodes (5): default, description, title, type, present

### Community 110 - "schema/fixtures"
Cohesion: 0.40
Nodes (5): theme, const, default, title, type

### Community 111 - "schema/fixtures"
Cohesion: 0.40
Nodes (5): year, default, description, title, type

### Community 112 - "schema/fixtures"
Cohesion: 0.40
Nodes (5): years, default, description, title, type

### Community 113 - "templates/html"
Cohesion: 0.50
Nodes (4): HTML Full Page Template, GitHub Markdown CSS (CDN), KaTeX Math Rendering (CDN), Markdown Header Template

### Community 114 - "models/cv"
Cohesion: 0.50
Nodes (3): field_validator, ValidationInfo, Validate username format per network's requirements. Why: Different platforms…

### Community 116 - "schema/fixtures"
Cohesion: 0.50
Nodes (4): properties, description, $ref, phrases

### Community 117 - "schema/fixtures"
Cohesion: 0.50
Nodes (4): EmberTheme, additionalProperties, title, type

### Community 118 - "schema/fixtures"
Cohesion: 0.50
Nodes (4): EngineeringresumesTheme, additionalProperties, title, type

### Community 119 - "schema/fixtures"
Cohesion: 0.50
Nodes (4): start_date, anyOf, default, description

### Community 120 - "renderer/rendercv_typst"
Cohesion: 1.00
Nodes (3): John Doe synthetic sample CV (education, experience sections used as RenderCV demo content), RenderCV PDF output (YAML-to-PDF rendered CV with professional typography), RenderCV sample CV thumbnail (John Doe, classic-style theme preview)

## Ambiguous Edges - Review These
- `Markdown EducationEntry Template` → `Ember Theme Design Overrides`  [AMBIGUOUS]
  src/rendercv/renderer/templater/templates/markdown/entries/EducationEntry.j2.md · relation: shares_data_with

## Knowledge Gaps
- **411 isolated node(s):** `rendercv-web-backend`, `name`, `private`, `version`, `type` (+406 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Markdown EducationEntry Template` and `Ember Theme Design Overrides`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **Why does `$defs` connect `schema/fixtures` to `Form Ops & Schema Actions (FE)`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `properties` connect `schema/fixtures` to `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`, `schema/fixtures`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `Cv` connect `schema/fixtures` to `schema/fixtures`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `BaseModelWithoutExtraKeys` (e.g. with `Bold` and `ClassicTheme`) actually correct?**
  _`BaseModelWithoutExtraKeys` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `RenderCVModel` (e.g. with `generate_html()` and `generate_markdown()`) actually correct?**
  _`RenderCVModel` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `RenderCVInternalError` (e.g. with `generate_png()` and `read_version_from_typst_toml()`) actually correct?**
  _`RenderCVInternalError` has 17 INFERRED edges - model-reasoned connections that need verification._