import fitz
from langchain_text_splitters import TokenTextSplitter


def pdf_process_to_chunks(
    file_bytes: bytes, file_hash: str, chunk_size: int = 1000, chunk_overlap: int = 100
) -> list[dict]:
    """
    1. Opens the PDF from bytes using PyMuPDF.
    2. Extracts text page-by-page to keep track of page numbers.
    3. Uses RecursiveCharacterTextSplitter to break text into chunks.
    4. Returns a list of dictionaries containing text, hash, and page_label.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")

    splitter = TokenTextSplitter(
        chunk_size=800,  # Optimized for Free Tier TPM (Tokens Per Minute)
        chunk_overlap=80,  # 10% overlap
        encoding_name="cl100k_base",
    )

    final_chunks = []

    for page_num, page in enumerate(doc):
        page_text = page.get_text("text")

        chunks = splitter.split_text(page_text)

        for chunk in chunks:
            final_chunks.append(
                {
                    "text": chunk,
                    "metadata": {
                        "file_hash": file_hash,
                        "page_number": page_num + 1,
                    },
                }
            )

    doc.close()
    return final_chunks
