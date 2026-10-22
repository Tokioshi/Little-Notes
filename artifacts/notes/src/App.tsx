import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArchiveX,
    Check,
    FilePenLine,
    LockKeyhole,
    Pin,
    Plus,
    Search,
    Sparkles,
    StickyNote,
    X,
} from "lucide-react";

type Note = {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    pinned: boolean;
};

type Filter = "all" | "pinned";
const STORAGE_KEY = "little-notes.v1";

function readNotes(): Note[] {
    try {
        const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        if (!Array.isArray(value)) return [];
        return value.filter((item): item is Note =>
            Boolean(
                item &&
                typeof item.id === "string" &&
                typeof item.title === "string" &&
                typeof item.content === "string" &&
                typeof item.createdAt === "string" &&
                typeof item.updatedAt === "string" &&
                typeof item.pinned === "boolean",
            ),
        );
    } catch {
        return [];
    }
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Just now";
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        return `Today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function makeId() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function App() {
    const [notes, setNotes] = useState<Note[]>(readNotes);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const saveTimer = useRef<number | undefined>(undefined);

    const activeNote = notes.find((note) => note.id === activeId) ?? null;
    const visibleNotes = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return notes
            .filter((note) => filter === "all" || note.pinned)
            .filter(
                (note) =>
                    !normalizedQuery ||
                    note.title.toLowerCase().includes(normalizedQuery) ||
                    note.content.toLowerCase().includes(normalizedQuery),
            )
            .sort(
                (a, b) =>
                    Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt),
            );
    }, [filter, notes, query]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
            setSaveState("saving");
            window.clearTimeout(saveTimer.current);
            saveTimer.current = window.setTimeout(() => setSaveState("saved"), 350);
        } catch {
            setSaveState("saved");
        }
        return () => window.clearTimeout(saveTimer.current);
    }, [notes]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                searchRef.current?.focus();
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
                event.preventDefault();
                createNote();
            }
            if (event.key === "Escape") {
                setConfirmDelete(false);
                if (document.activeElement === searchRef.current) searchRef.current?.blur();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    });

    function createNote() {
        const now = new Date().toISOString();
        const note: Note = {
            id: makeId(),
            title: "",
            content: "",
            createdAt: now,
            updatedAt: now,
            pinned: false,
        };
        setNotes((current) => [note, ...current]);
        setActiveId(note.id);
        setFilter("all");
        setQuery("");
        setConfirmDelete(false);
    }

    function returnToHome() {
        setActiveId(null);
        setQuery("");
        setFilter("all");
        setConfirmDelete(false);
    }

    function updateNote(changes: Partial<Pick<Note, "title" | "content" | "pinned">>) {
        if (!activeId) return;
        const updatedAt = new Date().toISOString();
        setNotes((current) =>
            current.map((note) =>
                note.id === activeId ? { ...note, ...changes, updatedAt } : note,
            ),
        );
    }

    function deleteActive() {
        if (!activeNote) return;
        const remaining = notes.filter((note) => note.id !== activeNote.id);
        setNotes(remaining);
        const next = [...remaining].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
        setActiveId(next?.id ?? null);
        setConfirmDelete(false);
    }

    const wordCount = activeNote
        ? activeNote.content.trim()
            ? activeNote.content.trim().split(/\s+/).length
            : 0
        : 0;

    return (
        <main className="app-shell" data-testid="app-shell">
            <header className="topbar">
                <button
                    className="brand"
                    type="button"
                    onClick={returnToHome}
                    aria-label="Go to home"
                    data-testid="brand-little-notes"
                >
                    <span className="brand-mark">
                        <StickyNote size={19} strokeWidth={1.8} />
                    </span>
                    <span className="brand-name">Little Notes</span>
                </button>
                <div className="privacy-note" data-testid="status-local-storage">
                    <span className="privacy-dot" />
                    <LockKeyhole size={13} strokeWidth={1.8} />
                    <span>Private by design · saved on this device</span>
                </div>
            </header>

            <div className="workspace">
                <aside className="notes-panel" aria-label="Your notes">
                    <div className="panel-heading">
                        <div>
                            <div className="eyebrow">A little space for</div>
                            <h1 className="panel-title">Your thoughts</h1>
                        </div>
                        <button
                            className="new-button"
                            type="button"
                            onClick={createNote}
                            data-testid="button-new-note"
                        >
                            <Plus size={16} strokeWidth={2.3} />
                            <span>New note</span>
                        </button>
                    </div>

                    <label className="search-box">
                        <Search size={16} />
                        <input
                            ref={searchRef}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Find a thought..."
                            aria-label="Search notes"
                            data-testid="input-search-notes"
                        />
                        {query ? (
                            <button
                                className="icon-button"
                                type="button"
                                aria-label="Clear search"
                                onClick={() => setQuery("")}
                                data-testid="button-clear-search"
                            >
                                <X size={14} />
                            </button>
                        ) : (
                            <span className="search-hint">⌘ K</span>
                        )}
                    </label>

                    <div className="filter-row" role="tablist" aria-label="Note filter">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={filter === "all"}
                            className={`filter-button ${filter === "all" ? "active" : ""}`}
                            onClick={() => setFilter("all")}
                            data-testid="filter-all-notes"
                        >
                            All notes <span>{notes.length}</span>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={filter === "pinned"}
                            className={`filter-button ${filter === "pinned" ? "active" : ""}`}
                            onClick={() => setFilter("pinned")}
                            data-testid="filter-pinned-notes"
                        >
                            Pinned <span>{notes.filter((note) => note.pinned).length}</span>
                        </button>
                    </div>

                    <div className="note-list" data-testid="list-notes">
                        {visibleNotes.map((note) => (
                            <button
                                key={note.id}
                                type="button"
                                className={`note-row ${activeId === note.id ? "selected" : ""}`}
                                onClick={() => {
                                    setActiveId(note.id);
                                    setConfirmDelete(false);
                                }}
                                aria-current={activeId === note.id ? "true" : undefined}
                                data-testid={`note-item-${note.id}`}
                            >
                                <span className="note-row-top">
                                    <span
                                        className="note-row-title"
                                        data-testid={`note-title-${note.id}`}
                                    >
                                        {note.title.trim() || "Untitled note"}
                                    </span>
                                    {note.pinned && (
                                        <Pin
                                            className="pin-mini"
                                            size={13}
                                            fill="currentColor"
                                            data-testid={`note-pinned-${note.id}`}
                                        />
                                    )}
                                </span>
                                <span className="note-row-preview">
                                    {note.content.trim() || "A new thought, waiting to happen."}
                                </span>
                                <span className="note-row-meta">
                                    <span>{formatDate(note.updatedAt)}</span>
                                    <span>
                                        {note.content.trim()
                                            ? `${note.content.trim().split(/\s+/).length} words`
                                            : "Empty"}
                                    </span>
                                </span>
                            </button>
                        ))}
                        {visibleNotes.length === 0 && (
                            <div className="empty-list" data-testid="empty-note-list">
                                {query ? (
                                    <>
                                        No notes match “{query}”.
                                        <br />
                                        Try another search.
                                    </>
                                ) : filter === "pinned" ? (
                                    <>
                                        Nothing pinned just yet.
                                        <br />
                                        Pin a note to keep it close.
                                    </>
                                ) : (
                                    <>
                                        Your note list is clear.
                                        <br />
                                        Start with one small thought.
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="notes-count" data-testid="text-notes-count">
                        {notes.length === 1
                            ? "1 thought tucked away"
                            : `${notes.length} thoughts tucked away`}
                    </div>
                </aside>

                <section className="editor-wrap" aria-label="Note editor">
                    {activeNote ? (
                        <>
                            <div className="editor-topline">
                                <div
                                    className="save-status"
                                    role="status"
                                    aria-live="polite"
                                    data-testid="status-save"
                                >
                                    {saveState === "saving" ? (
                                        <Sparkles size={14} />
                                    ) : (
                                        <Check size={14} />
                                    )}
                                    <span>
                                        {saveState === "saving"
                                            ? "Saving locally…"
                                            : "All changes saved"}
                                    </span>
                                </div>
                                <div className="editor-actions">
                                    <button
                                        className={`icon-button ${activeNote.pinned ? "is-pinned" : ""}`}
                                        type="button"
                                        onClick={() => updateNote({ pinned: !activeNote.pinned })}
                                        aria-label={activeNote.pinned ? "Unpin note" : "Pin note"}
                                        title={activeNote.pinned ? "Unpin note" : "Pin note"}
                                        data-testid="button-toggle-pin"
                                    >
                                        <Pin
                                            size={17}
                                            fill={activeNote.pinned ? "currentColor" : "none"}
                                        />
                                    </button>
                                    <button
                                        className="icon-button danger"
                                        type="button"
                                        onClick={() => setConfirmDelete(true)}
                                        aria-label="Delete note"
                                        title="Delete note"
                                        data-testid="button-delete-note"
                                    >
                                        <ArchiveX size={17} />
                                    </button>
                                </div>
                            </div>
                            <div className="editor-form" key={activeNote.id}>
                                <input
                                    className="editor-title"
                                    value={activeNote.title}
                                    onChange={(event) => updateNote({ title: event.target.value })}
                                    placeholder="A title for this thought"
                                    aria-label="Note title"
                                    data-testid="input-note-title"
                                />
                                <div className="editor-meta" data-testid="text-note-updated">
                                    <span>Edited {formatDate(activeNote.updatedAt)}</span>
                                    <span className="meta-separator" />
                                    <span>
                                        {wordCount} {wordCount === 1 ? "word" : "words"}
                                    </span>
                                    {activeNote.pinned && (
                                        <>
                                            <span className="meta-separator" />
                                            <span>Pinned</span>
                                        </>
                                    )}
                                </div>
                                <textarea
                                    className="editor-content"
                                    value={activeNote.content}
                                    onChange={(event) =>
                                        updateNote({ content: event.target.value })
                                    }
                                    placeholder="Let the thought land.&#10;&#10;No folders, no fuss. Just a quiet place to put it down."
                                    aria-label="Note content"
                                    data-testid="input-note-content"
                                />
                                <div className="editor-footer">
                                    {confirmDelete ? (
                                        <div
                                            className="delete-confirm"
                                            role="alert"
                                            data-testid="confirm-delete-note"
                                        >
                                            <span>Delete this note for good?</span>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDelete(false)}
                                                data-testid="button-cancel-delete"
                                            >
                                                Keep it
                                            </button>
                                            <button
                                                type="button"
                                                className="confirm-delete"
                                                onClick={deleteActive}
                                                data-testid="button-confirm-delete"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ) : (
                                        <span data-testid="text-local-save-hint">
                                            Only on this device. No account, no cloud.
                                        </span>
                                    )}
                                    <span data-testid="text-character-count">
                                        {activeNote.content.length} characters
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-editor" data-testid="empty-editor">
                            <div className="empty-art">
                                <FilePenLine size={46} strokeWidth={1.3} />
                            </div>
                            <div className="eyebrow">A fresh page</div>
                            <h2>
                                {notes.length ? "Pick up a thought" : "Make room for a thought"}
                            </h2>
                            <p>
                                {notes.length
                                    ? "Choose a note from your list, or start another one whenever you are ready."
                                    : "The small things worth remembering deserve a place to land. Start with anything on your mind."}
                            </p>
                            <button
                                className="new-button"
                                type="button"
                                onClick={createNote}
                                data-testid="button-create-first-note"
                            >
                                <Plus size={16} />
                                Write your first note
                            </button>
                            <div className="empty-privacy">
                                <LockKeyhole size={13} /> Private, local, and yours.
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default App;
