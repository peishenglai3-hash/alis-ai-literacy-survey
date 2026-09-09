"""Run the native archive builder with a precomputed redaction manifest.

The wrapper keeps the original builder's source-order logic intact while making
the front-matter counts agree with the body scan. It is intentionally separate
so the first generated script remains an auditable snapshot of the initial run.
"""

from __future__ import annotations

from collections import Counter

import build_alis_native_archive as builder


def add_front_matter_with_counts(doc, paragraphs, counts, _redactions, source_hash):
    redactions: Counter[str] = Counter()
    for paragraph in paragraphs:
        builder.redact(paragraph.text, redactions)
    return builder.add_front_matter(doc, paragraphs, counts, redactions, source_hash)


builder.add_front_matter = add_front_matter_with_counts


if __name__ == "__main__":
    builder.main()
