"""SQLAlchemy ORM models for the RenderCV Web Editor's baseline schema.

Why:
    Per the `schema-design` skill: a CV's content is four YAML text
    documents (`cv`, `design`, `locale`, `settings`) stored as-is — the
    pydantic models in `rendercv.schema` own that structure, so it is never
    decomposed into relational columns here. Columns exist only for what
    the database must query or enforce: ids, ownership, names, timestamps,
    and hashes.

    Types are restricted to Integer / String / Text / DateTime so the same
    models work unmodified against SQLite (dev) and Postgres (prod); no
    dialect-specific column types are used without a decision record in
    docs/decisions/ (guardrail: "no engine-specific features").

    Timestamps are naive UTC `datetime` values assigned in Python (see
    `utc_now` in `repository.py`), not `server_default=func.now()` --
    SQLite's `CURRENT_TIMESTAMP` and Postgres's `now()` differ in
    precision and timezone-awareness, and the conditional-update
    concurrency check in `repository.update_cv_conditional` compares
    `updated_at` values byte-for-byte, so both writer and reader must
    agree on exactly how that value is produced.
"""

from datetime import datetime

from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Declarative base shared by every table; also alembic's autogenerate target."""


class User(Base):
    """An anonymous device-session identity (auth model option A).

    Why:
        No email/password/OAuth in this phase -- a signed HTTPOnly session
        cookie (owned by the Phase 4b API layer) carries an opaque
        `session_token` that identifies this row. `id` is the stable
        integer users, cvs, and preferences reference internally.

    Seam for later auth (do not add yet -- no decision record for it):
        When email/OAuth login is added, add nullable
        `auth_provider: Mapped[str | None]` and
        `auth_provider_id: Mapped[str | None]` columns here (plus a unique
        constraint on `(auth_provider, auth_provider_id)`) in their own
        migration. `session_token` keeps working so an anonymous session
        can be "claimed" by a real account without losing its CVs.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_token: Mapped[str] = mapped_column(
        String(128), unique=True, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(nullable=False)

    cvs: Mapped[list["Cv"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    preferences: Mapped[list["Preference"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )


class Cv(Base):
    """One CV: four YAML documents plus the metadata the app must query on.

    Why:
        `updated_at` doubles as the optimistic-concurrency token for
        autosave (`repository.update_cv_conditional`): a write only
        succeeds if it still matches the value the client last saw.
        `content_hash` lets the render cache and the client detect
        identical content without diffing four text blobs.
    """

    __tablename__ = "cvs"
    __table_args__ = (
        # Access pattern: "list my CVs, most recently updated first"
        # (GET /api/cvs). A plain ascending composite index is walked
        # backwards for the DESC scan on both SQLite and Postgres, so no
        # dialect-specific descending-index syntax is needed.
        Index("ix_cvs_user_id_updated_at", "user_id", "updated_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cv_yaml: Mapped[str] = mapped_column(Text, nullable=False, default="")
    design_yaml: Mapped[str] = mapped_column(Text, nullable=False, default="")
    locale_yaml: Mapped[str] = mapped_column(Text, nullable=False, default="")
    settings_yaml: Mapped[str] = mapped_column(Text, nullable=False, default="")
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)

    user: Mapped["User"] = relationship(back_populates="cvs")
    versions: Mapped[list["CvVersion"]] = relationship(
        back_populates="cv", cascade="all, delete-orphan", passive_deletes=True
    )


class CvVersion(Base):
    """An append-only autosave snapshot of a CV's four documents.

    Why:
        Powers undo history across sessions (Phase 4 plan). Rows are never
        updated, only inserted and pruned by `repository.prune_versions`;
        `ON DELETE CASCADE` on `cv_id` means deleting a `Cv` deletes its
        version history in the same statement, never as a second
        application-level step.
    """

    __tablename__ = "cv_versions"
    __table_args__ = (
        # Access pattern: "list versions of this CV, newest first" (undo
        # history) and "find the oldest versions beyond the keep-count"
        # (prune_versions). Same backwards-scan rationale as cvs' index.
        Index("ix_cv_versions_cv_id_created_at", "cv_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cv_id: Mapped[int] = mapped_column(
        ForeignKey("cvs.id", ondelete="CASCADE"), nullable=False
    )
    cv_yaml: Mapped[str] = mapped_column(Text, nullable=False, default="")
    design_yaml: Mapped[str] = mapped_column(Text, nullable=False, default="")
    locale_yaml: Mapped[str] = mapped_column(Text, nullable=False, default="")
    settings_yaml: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(nullable=False)

    cv: Mapped["Cv"] = relationship(back_populates="versions")


class Preference(Base):
    """One UI-state key/value pair for a user (yaml mode, zoom, sidebar...).

    Why:
        Composite primary key `(user_id, key)` is both the uniqueness
        constraint and the lookup index -- one row per key, upserted by
        `repository.set_preference`.
    """

    __tablename__ = "preferences"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    key: Mapped[str] = mapped_column(String(128), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)

    user: Mapped["User"] = relationship(back_populates="preferences")
