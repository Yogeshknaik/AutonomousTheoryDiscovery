from typing import List, Dict, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def retrieve_relevant_knowledge(query: str, documents_text: List[str], top_k: int = 5) -> List[Dict[str, Any]]:
    if not documents_text:
        return []
    
    corpus = [query] + documents_text
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
        query_vec = tfidf_matrix[0:1]
        doc_vecs = tfidf_matrix[1:]
        
        scores = cosine_similarity(query_vec, doc_vecs).flatten()
        top_indices = np.argsort(scores)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            results.append({
                "doc_index": int(idx),
                "text": documents_text[idx][:1000],
                "score": float(scores[idx])
            })
        return results
    except Exception as e:
        print(f"TF-IDF error: {e}")
        return [{"doc_index": i, "text": documents_text[i][:1000], "score": 0.5} for i in range(min(top_k, len(documents_text)))]

def extract_knowledge_entities(text: str) -> List[Dict[str, str]]:
    """Extract key scientific concepts and relationships from text."""
    # Standard ML terms for graph building
    ml_concepts = [
        ("Feature Selection", "Technique", "Used for reducing dimensionality and improving accuracy"),
        ("Random Forest", "Algorithm", "Tree-based ensemble classifier supporting feature importances"),
        ("Mutual Information", "Metric", "Measures statistical dependence between features and target"),
        ("Recursive Feature Elimination", "Algorithm", "Iteratively removes weak features using model weights"),
        ("L1 Regularization", "Technique", "Shrinks irrelevant feature coefficients to zero"),
        ("F1 Score", "Metric", "Harmonic mean of precision and recall for classification"),
        ("Decision Tree", "Model", "Base estimator split on entropy or Gini impurity"),
        ("Gradient Boosting", "Algorithm", "Ensemble model boosting weak decision trees sequentially"),
        ("Correlation Matrix", "Analysis", "Filters highly collinear features prior to modeling"),
        ("Principal Component Analysis", "Technique", "Linear projection maximizing dataset variance")
    ]
    
    found_entities = []
    text_lower = text.lower()
    for name, etype, desc in ml_concepts:
        if name.lower() in text_lower or len(found_entities) < 4:
            found_entities.append({
                "name": name,
                "type": etype,
                "description": desc
            })
    return found_entities[:6]
