import os
import json
import time
import hashlib
from typing import Optional, Dict, Any
from config import REDIS_URL

# In-memory runtime cache for microsecond duplicate request caching
_LOCAL_CACHE: Dict[str, Dict[str, Any]] = {}
_LOCAL_CACHE_EXPIRY: Dict[str, float] = {}

# Async Redis client instance (initialized lazily)
_redis_client = None
_last_redis_fail_time = 0


def compute_file_hash(file_bytes: bytes) -> str:
    """Computes SHA-256 digital fingerprint of the document bytes."""
    return hashlib.sha256(file_bytes).hexdigest()


async def get_redis():
    """Lazily connect to Upstash Cloud Redis with robust timeout and automatic recovery."""
    global _redis_client, _last_redis_fail_time
    if _redis_client is not None:
        return _redis_client

    # Cooldown of 5 seconds between reconnection attempts if previous attempt failed
    now = time.time()
    if now - _last_redis_fail_time < 5.0:
        return None

    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(REDIS_URL, socket_connect_timeout=4.0, socket_timeout=4.0, decode_responses=True)
        await client.ping()
        _redis_client = client
        print(f"[OCR Cache] Connected to Upstash Redis successfully ({REDIS_URL.split('@')[-1]}).")
        return _redis_client
    except Exception as e:
        _last_redis_fail_time = now
        print(f"[OCR Cache Warning] Upstash Redis connection note: {e}")
        return None


async def get_cached_document_extraction(file_hash: str) -> Optional[Dict[str, Any]]:
    """
    Checks Upstash Redis (and fast RAM) for an existing document extraction.
    Returns parsed dictionary if found and fresh, else None.
    """
    now = time.time()

    # 1. Check in-memory runtime cache first (microsecond)
    if file_hash in _LOCAL_CACHE:
        expiry = _LOCAL_CACHE_EXPIRY.get(file_hash, 0)
        if expiry > now:
            return _LOCAL_CACHE[file_hash]
        else:
            _LOCAL_CACHE.pop(file_hash, None)
            _LOCAL_CACHE_EXPIRY.pop(file_hash, None)

    # 2. Check Upstash Cloud Redis
    redis = await get_redis()
    if redis:
        try:
            cached_json = await redis.get(f"ocr:doc:{file_hash}")
            if cached_json:
                data = json.loads(cached_json)
                _LOCAL_CACHE[file_hash] = data
                _LOCAL_CACHE_EXPIRY[file_hash] = now + 3600
                return data
        except Exception as e:
            print(f"[OCR Cache Read Warning] {e}")

    return None


async def set_cached_document_extraction(file_hash: str, data: Dict[str, Any], ttl_seconds: int = 2592000) -> None:
    """
    Saves document extraction directly to Upstash Cloud Redis (default 30 days TTL).
    """
    now = time.time()
    # 1. Update in-memory runtime cache
    _LOCAL_CACHE[file_hash] = data
    _LOCAL_CACHE_EXPIRY[file_hash] = now + min(ttl_seconds, 86400 * 30)

    # 2. Update Upstash Cloud Redis
    redis = await get_redis()
    if redis:
        try:
            await redis.set(f"ocr:doc:{file_hash}", json.dumps(data), ex=ttl_seconds)
            print(f"[OCR Cache] Successfully saved key 'ocr:doc:{file_hash[:12]}...' to Upstash Cloud Redis.")
        except Exception as e:
            print(f"[OCR Cache Write Warning] {e}")
    else:
        print(f"[OCR Cache Warning] Redis not reachable; could not save key 'ocr:doc:{file_hash[:12]}...' to Upstash.")
