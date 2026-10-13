import json
from typing import List, Dict, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.llm_service import call_llm

def retrieve_relevant_knowledge(query: str, documents_text: List[str], top_k: int = 5) -> List[Dict[str, Any]]:
    if not documents_text:
        return []
    corpus = [query] + documents_text
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(corpus)
    except ValueError:
        return []
    scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    top_indices = np.argsort(scores)[::-1][:top_k]
    return [
        {"doc_index": int(idx), "text": documents_text[idx][:1000], "score": float(scores[idx])}
        for idx in top_indices
    ]

def extract_knowledge_graph(text: str) -> Dict[str, List[Dict[str, str]]]:
    """Ask the LLM for entities and relations stated in the text. Returns empty lists if the LLM gives no parseable output."""
    empty = {"entities": [], "relations": []}
    if not text or not text.strip():
        return empty
    system_prompt = "You extract scientific knowledge graphs. Return ONLY a valid JSON object."
    prompt = f"""
From the text below, extract the key scientific entities (methods, metrics, datasets, variables, models, phenomena) and the relations explicitly stated or directly implied between them.
Use only information present in the text. Do not add outside knowledge.

Return ONLY this JSON object:
{{
  "entities": [{{"name": "...", "type": "...", "description": "..."}}],
  "relations": [{{"source": "entity name", "target": "entity name", "relation": "short verb phrase"}}]
}}

Text:
{text[:6000]}
"""
    raw = call_llm(prompt, system_prompt)
    if not raw:
        return empty
    cleaned = raw.strip()
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start == -1 or end <= start:
        return empty
    try:
        data = json.loads(cleaned[start:end + 1])
    except json.JSONDecodeError:
        return empty
    entities = [e for e in data.get("entities", []) if isinstance(e, dict) and e.get("name")]
    names = {e["name"] for e in entities}
    relations = [
        r for r in data.get("relations", [])
        if isinstance(r, dict) and r.get("source") in names and r.get("target") in names and r.get("relation")
    ]
    return {"entities": entities[:20], "relations": relations[:40]}
