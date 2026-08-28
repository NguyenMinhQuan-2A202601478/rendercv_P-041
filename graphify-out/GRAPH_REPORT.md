# Graph Report - src  (2026-08-26)

## Corpus Check
- Corpus is ~49,500 words - fits in a single context window. You may not need a graph.

## Summary
- 636 nodes · 1254 edges · 55 communities (46 shown, 9 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 132 edges (avg confidence: 0.59)
- Token cost: 232,872 input · 0 output

## Community Hubs (Navigation)
- HTML & Markdown Output
- Date & Time Span Logic
- CLI Theme Scaffolding
- CV Entry Models
- Locale Model (English)
- Validation Error Reporting
- Locale Translations
- Classic Theme Design Model
- CLI App & Version Check
- Model Builder Pipeline
- Progress Panel UI
- CV Field Serialization
- Typst Package & MD Templates
- Theme Discovery & Validation
- Render Command CLI
- CV & Social Networks
- Section Type Inference
- File Watcher
- Render Settings
- Font Family Options
- Timed Step Utility
- CLI Entry Point
- JSON Schema Generator
- Path Resolution
- CLI Override Dictionary
- Color Conversion
- YAML Scanner (No Alias)
- Username Validation
- Photo Path Handling
- YAML Error Location
- Typst Thumbnail
- HTML & Header Templates
- Numbered Entry Templates
- Error Message Dictionary
- BulletEntry Template
- OneLineEntry Template
- TextEntry Template
- Section Beginning Template
- Section Ending Template
- Ink Theme Config

## God Nodes (most connected - your core abstractions)
1. `BaseModelWithoutExtraKeys` - 42 edges
2. `RenderCVModel` - 35 edges
3. `RenderCVInternalError` - 32 edges
4. `RenderCVUserError` - 28 edges
5. `BaseEntry` - 22 edges
6. `Locale Localization Schema` - 22 edges
7. `render_entry_templates()` - 18 edges
8. `run_rendercv()` - 17 edges
9. `resolve_rendercv_file_path()` - 17 edges
10. `ProgressPanel` - 16 edges

## Surprising Connections (you probably didn't know these)
- `ProgressPanel` --uses--> `RenderCVUserError`  [INFERRED]
  rendercv/cli/render_command/progress_panel.py → rendercv/exception.py
- `ProgressPanel` --uses--> `RenderCVValidationError`  [INFERRED]
  rendercv/cli/render_command/progress_panel.py → rendercv/exception.py
- `cli_command_render()` --uses--> `ProgressPanel`  [INFERRED]
  rendercv/cli/render_command/render_command.py → rendercv/cli/render_command/progress_panel.py
- `run_rendercv()` --uses--> `ProgressPanel`  [INFERRED]
  rendercv/cli/render_command/run_rendercv.py → rendercv/cli/render_command/progress_panel.py
- `timed_step()` --uses--> `ProgressPanel`  [INFERRED]
  rendercv/cli/render_command/run_rendercv.py → rendercv/cli/render_command/progress_panel.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Built-in Design Theme Configurations** — rendercv_schema_models_design_other_themes_ember_ember_theme, rendercv_schema_models_design_other_themes_engineeringclassic_engineeringclassic_theme, rendercv_schema_models_design_other_themes_engineeringresumes_engineeringresumes_theme, rendercv_schema_models_design_other_themes_harvard_harvard_theme, rendercv_schema_models_design_other_themes_ink_ink_theme, rendercv_schema_models_design_other_themes_moderncv_moderncv_theme, rendercv_schema_models_design_other_themes_opal_opal_theme, rendercv_schema_models_design_other_themes_sb2nov_sb2nov_theme [INFERRED 0.95]
- **Markdown/HTML Output Rendering Flow** — rendercv_renderer_templater_templates_markdown_header_j2_template, rendercv_renderer_templater_templates_markdown_sectionbeginning_j2_template, rendercv_renderer_templater_templates_markdown_sectionending_j2_template, rendercv_renderer_templater_templates_markdown_entries_bulletentry_j2_template, rendercv_renderer_templater_templates_markdown_entries_educationentry_j2_template, rendercv_renderer_templater_templates_markdown_entries_experienceentry_j2_template, rendercv_renderer_templater_templates_markdown_entries_normalentry_j2_template, rendercv_renderer_templater_templates_markdown_entries_numberedentry_j2_template, rendercv_renderer_templater_templates_markdown_entries_onelineentry_j2_template, rendercv_renderer_templater_templates_markdown_entries_publicationentry_j2_template, rendercv_renderer_templater_templates_markdown_entries_reversednumberedentry_j2_template, rendercv_renderer_templater_templates_markdown_entries_textentry_j2_template, rendercv_renderer_templater_templates_html_full_template [INFERRED 0.85]
- **Entry Template Placeholder Contract (INSTITUTION/POSITION/DATE placeholders)** — rendercv_renderer_templater_templates_markdown_entries_educationentry_j2_template, rendercv_renderer_templater_templates_markdown_entries_experienceentry_j2_template, rendercv_renderer_templater_templates_markdown_entries_normalentry_j2_template, rendercv_schema_models_design_other_themes_ember_ember_theme, rendercv_schema_models_design_other_themes_sb2nov_sb2nov_theme, rendercv_schema_models_design_other_themes_harvard_harvard_theme [INFERRED 0.75]
- **Locale YAML Files Implement the RenderCV Localization Schema** — rendercv_schema_models_locale_other_locales_arabic_locale, rendercv_schema_models_locale_other_locales_danish_locale, rendercv_schema_models_locale_other_locales_dutch_locale, rendercv_schema_models_locale_other_locales_french_locale, rendercv_schema_models_locale_other_locales_german_locale, rendercv_schema_models_locale_other_locales_hebrew_locale, rendercv_schema_models_locale_other_locales_hindi_locale, rendercv_schema_models_locale_other_locales_hungarian_locale, rendercv_schema_models_locale_other_locales_indonesian_locale, rendercv_schema_models_locale_other_locales_italian_locale, rendercv_schema_models_locale_other_locales_japanese_locale, rendercv_schema_models_locale_other_locales_korean_locale, rendercv_schema_models_locale_other_locales_mandarin_chinese_locale, rendercv_schema_models_locale_other_locales_norwegian_bokm_l_locale, rendercv_schema_models_locale_other_locales_norwegian_nynorsk_locale, rendercv_schema_models_locale_other_locales_persian_locale, rendercv_schema_models_locale_other_locales_portuguese_locale, rendercv_schema_models_locale_other_locales_russian_locale, rendercv_schema_models_locale_other_locales_spanish_locale, rendercv_schema_models_locale_other_locales_turkish_locale, rendercv_schema_models_locale_other_locales_vietnamese_locale [EXTRACTED 1.00]
- **CJK Locales Use Numeric Month Naming and Area-First Degree Phrase** — rendercv_schema_models_locale_other_locales_japanese_locale, rendercv_schema_models_locale_other_locales_korean_locale, rendercv_schema_models_locale_other_locales_mandarin_chinese_locale [INFERRED 0.85]
- **Right-to-Left Script Locales** — rendercv_schema_models_locale_other_locales_arabic_locale, rendercv_schema_models_locale_other_locales_hebrew_locale, rendercv_schema_models_locale_other_locales_persian_locale [INFERRED 0.85]

## Communities (55 total, 9 thin omitted)

### Community 0 - "HTML & Markdown Output"
Cohesion: 0.05
Nodes (67): Compiler, Element, Environment, generate_html(), Path, Generate HTML file from Markdown source with styling. Why: HTML format enables…, generate_markdown(), Path (+59 more)

### Community 1 - "Date & Time Span Logic"
Cohesion: 0.07
Nodes (64): EntryType, Pattern, Internal error indicating a bug in RenderCV logic. Why: Distinguishes…, RenderCVInternalError, build_date_placeholders(), compute_time_span_string(), date_object_to_string(), format_date_range() (+56 more)

### Community 2 - "CLI Theme Scaffolding"
Cohesion: 0.06
Nodes (57): available_locales, available_themes, join, Panel, copy_templates(), make_tree_writable(), Path, Copy built-in template directory to user location for customization. Why: Users… (+49 more)

### Community 3 - "CV Entry Models"
Cohesion: 0.07
Nodes (42): EntryModel, BaseModelWithExtraKeys, Pydantic base model that allows unrecognized fields. Why: Entry models need to…, BaseEntry, Base class for all CV entry types. Why: All entry types share common…, Convert class name to snake_case for template attribute lookup. Why: Template…, BaseEntryWithComplexFields, model_validator (+34 more)

### Community 4 - "Locale Model (English)"
Cohesion: 0.08
Nodes (38): BaseModel, FieldInfo, FieldSpec, EnglishLocale, Phrases, Get ISO 639-1 two-letter language code for locale. Why: Typst's text element…, Get flag emoji for the locale's primary country. Why: Flag emojis are displayed…, Check if language uses right-to-left text direction. Returns: True if language… (+30 more)

### Community 5 - "Validation Error Reporting"
Cohesion: 0.12
Nodes (21): ErrorDetails, format_validation_error_location(), Display validation errors in table format and exit. Why: Pydantic validation…, Format schema/YAML location for validation error table rows. Why: YAML parsing…, Structured validation error with YAML source location for error reporting. Why:…, RenderCVValidationError, CustomPydanticErrorTypes, Validate Typst dimension format with unit. Why: Typst requires dimensions with… (+13 more)

### Community 6 - "Locale Translations"
Cohesion: 0.09
Nodes (24): Locale Localization Schema, DEGREE/AREA Placeholder Phrase Pattern, Arabic Locale, Danish Locale, Dutch Locale, French Locale, German Locale, Hebrew Locale (+16 more)

### Community 7 - "Classic Theme Design Model"
Cohesion: 0.16
Nodes (21): BaseModelWithoutExtraKeys, Pydantic base model that rejects unrecognized fields. Why: Most RenderCV models…, Bold, Colors, Connections, EducationEntryTemplate, Entries, ExperienceEntryTemplate (+13 more)

### Community 8 - "CLI App & Version Check"
Cohesion: 0.13
Nodes (21): callback, cli_command_no_args(), fetch_and_cache_latest_version(), fetch_latest_version_from_pypi(), get_cache_dir(), get_version_cache_file(), Context, help (+13 more)

### Community 9 - "Model Builder Pipeline"
Cohesion: 0.18
Nodes (18): User-facing error carrying multiple structured validation errors. Why: YAML…, RenderCVUserValidationError, ValidationContext, build_rendercv_dictionary(), build_rendercv_dictionary_and_model(), build_rendercv_model_from_commented_map(), BuildRendercvModelArguments, Any (+10 more)

### Community 10 - "Progress Panel UI"
Cohesion: 0.16
Nodes (9): CompletedStep, ProgressPanel, Path, Display error panel and exit with error code. Args: user_error: User-facing…, Clear all completed steps and panel display., Live-updating terminal panel showing CV generation progress with timing.…, Add completed step to progress display. Args: time_took: Execution time in…, Display final success panel and clear state. (+1 more)

### Community 11 - "CV Field Serialization"
Cohesion: 0.12
Nodes (13): EmailStr, field_serializer, ModelWrapValidatorHandler, PhoneNumber, Any, field_validator, HttpUrl, model_validator (+5 more)

### Community 12 - "Typst Package & MD Templates"
Cohesion: 0.18
Nodes (15): Centered Section Title Styles, RTL Language Support, RenderCV Typst Package Changelog, RenderCV Typst Package (@preview/rendercv), Markdown EducationEntry Template, Markdown ExperienceEntry Template, Markdown NormalEntry Template, Markdown PublicationEntry Template (+7 more)

### Community 13 - "Theme Discovery & Validation"
Cohesion: 0.21
Nodes (11): discover_other_themes(), Auto-discover and load theme variant classes from other_themes/ directory. Why:…, ClassicTheme, Any, ValidationInfo, Validate design options for built-in or custom themes with dynamic loading.…, validate_design(), get_input_file_path() (+3 more)

### Community 14 - "Render Command CLI"
Cohesion: 0.17
Nodes (13): cli_command_render(), Argument, command, Context, help, Option, Path, collect_input_file_paths() (+5 more)

### Community 15 - "CV & Social Networks"
Cohesion: 0.23
Nodes (7): CustomConnection, User-defined contact method with custom icon and URL. Why: Built-in social…, Cv, model_validator, Validate generated URL is well-formed. Why: URL generation from username might…, Generate profile URL from network and username. Why: Users provide…, SocialNetwork

### Community 16 - "Section Type Inference"
Cohesion: 0.24
Nodes (9): Transform user's section dict to list of typed section objects. Why: Templates…, BaseRenderCVSection, get_entry_type_name_and_section_model(), get_rendercv_sections(), Any, Infer entry type from entry data and return corresponding section model. Why:…, Validate section entries with automatic type detection and error reporting.…, Transform user's section dictionary into list of typed section objects. Why:… (+1 more)

### Community 17 - "File Watcher"
Cohesion: 0.22
Nodes (7): DirModifiedEvent, FileModifiedEvent, EventHandler, Path, Trigger a callback when a watched file is modified. Args: function: Callback to…, Watch files and re-run function when any is modified. Why: Watch mode lets…, run_function_if_files_change()

### Community 18 - "Render Settings"
Cohesion: 0.28
Nodes (5): RenderCommand, field_validator, model_validator, Remove duplicate keywords from bold list. Why: Users might accidentally list…, Settings

### Community 19 - "Font Family Options"
Cohesion: 0.29
Nodes (5): FontFamilyType, FontFamily, field_validator, Convert string font to FontFamily object with uniform styling. Why: Users can…, Sections

### Community 20 - "Timed Step Utility"
Cohesion: 0.33
Nodes (6): args, kwargs, P, T, Execute function, measure timing, and update progress panel with result. Why:…, timed_step()

### Community 21 - "CLI Entry Point"
Cohesion: 0.40
Nodes (4): entry_point(), Entry point for the RenderCV CLI. Why: Users might install RenderCV with `pip…, Entry point for the RenderCV CLI., `__main__.py` file is the file that gets executed when the RenderCV package…

### Community 22 - "JSON Schema Generator"
Cohesion: 0.40
Nodes (5): generate_json_schema(), generate_json_schema_file(), Path, Generate JSON Schema (Draft-07) from RenderCV Pydantic models. Why: IDEs and…, Generate and save JSON Schema to file. Args: json_schema_path: Target file path…

### Community 23 - "Path Resolution"
Cohesion: 0.40
Nodes (5): Path, ValidationInfo, Convert relative path to absolute path based on input file location. Why: Users…, resolve_relative_path(), serialize_path()

### Community 24 - "CLI Override Dictionary"
Cohesion: 0.47
Nodes (5): apply_overrides_to_dictionary(), T, Navigate nested structure via dotted path and update value. Why: CLI overrides…, Apply multiple CLI overrides to dictionary. Why: Users need to test…, update_value_by_location()

### Community 25 - "Color Conversion"
Cohesion: 0.40
Nodes (3): PydanticColor, Color, Convert color to RGB string for Typst rendering. Why: Typst templates need…

### Community 26 - "YAML Scanner (No Alias)"
Cohesion: 0.40
Nodes (4): Custom Scanner that treats * as a regular character instead of alias syntax.…, Treat * as a plain scalar character instead of alias syntax., ScannerNoAlias, RoundTripScanner

### Community 27 - "Username Validation"
Cohesion: 0.50
Nodes (3): field_validator, ValidationInfo, Validate username format per network's requirements. Why: Different platforms…

### Community 28 - "Photo Path Handling"
Cohesion: 0.50
Nodes (3): model_validator, ValidationInfo, Store input file path in private attribute for path resolution. Why: Photo…

### Community 29 - "YAML Error Location"
Cohesion: 0.50
Nodes (4): get_yaml_error_location(), Extract 1-indexed line/column coordinates from ruamel parser errors. Args:…, YAMLError, YamlLocation

### Community 30 - "Typst Thumbnail"
Cohesion: 1.00
Nodes (3): RenderCV Typst Theme Thumbnail, Sample CV Page (John Doe), Typst Theme PDF Output

## Knowledge Gaps
- **36 isolated node(s):** `Full HTML Page Template`, `Markdown Header Template`, `Markdown Section Beginning Template`, `Markdown Section Ending Template (empty)`, `Markdown BulletEntry Template` (+31 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RenderCVInternalError` connect `Date & Time Span Logic` to `HTML & Markdown Output`, `CLI Theme Scaffolding`, `CV Entry Models`, `Locale Model (English)`, `Validation Error Reporting`, `CV Field Serialization`, `Theme Discovery & Validation`, `CV & Social Networks`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `RenderCVModel` connect `HTML & Markdown Output` to `Date & Time Span Logic`, `CLI Theme Scaffolding`, `Classic Theme Design Model`, `Model Builder Pipeline`, `Theme Discovery & Validation`, `JSON Schema Generator`, `Photo Path Handling`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `RenderCVUserError` connect `CLI Theme Scaffolding` to `HTML & Markdown Output`, `Date & Time Span Logic`, `Locale Model (English)`, `Progress Panel UI`, `Theme Discovery & Validation`, `Render Command CLI`, `CLI Override Dictionary`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `BaseModelWithoutExtraKeys` (e.g. with `Bold` and `ClassicTheme`) actually correct?**
  _`BaseModelWithoutExtraKeys` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `RenderCVModel` (e.g. with `generate_html()` and `generate_markdown()`) actually correct?**
  _`RenderCVModel` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `RenderCVInternalError` (e.g. with `generate_png()` and `read_version_from_typst_toml()`) actually correct?**
  _`RenderCVInternalError` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `RenderCVUserError` (e.g. with `create_init_file_for_theme()` and `cli_command_create_theme()`) actually correct?**
  _`RenderCVUserError` has 13 INFERRED edges - model-reasoned connections that need verification._