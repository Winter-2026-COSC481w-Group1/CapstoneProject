import re
import fitz
from langchain_text_splitters import TokenTextSplitter


def pdf_process_to_chunks(
    file_bytes: bytes, file_hash: str, chunk_size: int = 512, chunk_overlap: int = 64
) -> dict:
    """
    Processes a PDF file into chunks and detects chapters/sections.
    Returns a dictionary containing 'chunks' (list of dicts) and 'sections' (list of dicts).
    """

    doc = fitz.open(stream=file_bytes, filetype="pdf")

    splitter = TokenTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        encoding_name="cl100k_base",
    )

    final_chunks = []
    detected_sections = []
    # this set will track content across the WHOLE document
    global_seen_content = set()
    
    current_section = "Introduction"
    
    # Common patterns for chapters and sections
    # e.g., "Chapter 1", "Section 1.1", "1. Introduction", "Module 1"
    section_patterns = [
        re.compile(r"^(?:chapter|section|module|unit|part)\s+\d+[:.]?\s*.*", re.IGNORECASE),
        re.compile(r"^\d+\.\d+\s+[A-Z].*"), # 1.1 Section Name (strict on dot)
        re.compile(r"^\d+\s+[A-Z]{2,}\s*.*"),    # 1 INTRODUCTION (all caps)
    ]

    for page_num, page in enumerate(doc):
        raw_text = page.get_text("text")

        # split page into lines/paragraphs
        lines = raw_text.split("\n")
        unique_page_lines = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check if this line looks like a new section header
            is_section_header = False
            # Heuristic: headers are usually short and DON'T end in question marks or colons
            if 5 < len(line) < 100 and not line.endswith('?') and not line.endswith(':'):
                for pattern in section_patterns:
                    if pattern.match(line):
                        # Extra check: avoid matching common list item patterns that aren't headers
                        # e.g., "1. some text" (lowercase) or just very generic sentences
                        if re.match(r"^\d+\.\s+[a-z]", line):
                            continue

                        current_section = line
                        is_section_header = True
                        if current_section not in [s["title"] for s in detected_sections]:
                            detected_sections.append({
                                "title": current_section,
                                "page_number": page_num + 1
                            })
                        break

            # create a 'fingerprint' by removing all spaces
            fingerprint = re.sub(r"\s+", "", line).lower()

            # global Filter
            if fingerprint not in global_seen_content:
                unique_page_lines.append(line)
                global_seen_content.add(fingerprint)

        clean_text = " ".join(unique_page_lines)

        # one last pass to ensure no weird unicode characters remain
        clean_text = re.sub(r"\s+", " ", clean_text).strip()

        # split and store
        chunks = splitter.split_text(clean_text)
        for chunk in chunks:
            final_chunks.append(
                {
                    "text": chunk,
                    "file_hash": file_hash,
                    "page_number": page_num + 1,
                    "section": current_section
                }
            )

    doc.close()
    
    # If no sections were detected, provide a default
    if not detected_sections:
        detected_sections.append({"title": "Full Document", "page_number": 1})
        
    return {
        "chunks": final_chunks,
        "sections": detected_sections
    }
