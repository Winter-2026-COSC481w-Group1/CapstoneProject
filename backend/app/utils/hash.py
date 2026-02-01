import hashlib


def generate_file_hash(file_bytes: bytes):
    """Generates a SHA-256 hash for a given file's byte content"""
    sha256_hash = hashlib.sha256()
    sha256_hash.update(file_bytes)
    return sha256_hash.hexdigest()
