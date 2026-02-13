import re
import fitz
from langchain_text_splitters import TokenTextSplitter
import tiktoken


def pdf_process_to_chunks(
    file_bytes: bytes, file_hash: str, chunk_size: int = 512, chunk_overlap: int = 64
) -> list[dict]:

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    encoding = tiktoken.get_encoding("cl100k_base")

    splitter = TokenTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        encoding_name="cl100k_base",
    )

    final_chunks = []
    # this set will track content across the WHOLE document
    global_seen_content = set()

    for page_num, page in enumerate(doc):
        raw_text = page.get_text("text")
        raw_token_count = len(encoding.encode(raw_text))

        # split page into lines/paragraphs
        lines = raw_text.split("\n")
        unique_page_lines = []

        for line in lines:
            if not line:
                continue

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
                }
            )

    doc.close()
    return final_chunks
