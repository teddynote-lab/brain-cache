---
title: "메모랜덤 flow에 사용된 문서영역별 Clustering 성능평가"
description: "GS Caltex 메모랜덤-연구노트 매칭 프로젝트에서 PyMuPDF 기반 파서, Titan Embed V2 임베딩, ChromaDB 벡터 검색, Claude Sonnet 4.5 LLM 판정을 결합한 파이프라인을 구축했습니다. 137개 연구노트 중 82.5%가 메모랜덤과"
slug: 메모랜덤-flow에-사용된-문서영역별-clustering-성능평가
date: 2025-12-29
authors: [mason]
tags:
  - rag
source_url: "https://www.ibm.com/kr-ko/think/topics/knn"
---

# 메모랜덤 flow에 사용된 문서영역별 Clustering 성능평가

## TL;DR
> GS Caltex 메모랜덤-연구노트 매칭 프로젝트에서 PyMuPDF 기반 파서, Titan Embed V2 임베딩, ChromaDB 벡터 검색, Claude Sonnet 4.5 LLM 판정을 결합한 파이프라인을 구축했습니다. 137개 연구노트 중 82.5%가 메모랜덤과 매칭되었으며, Label Propagation 알고리즘이 BCubed F1 0.763으로 최고 성능을 기록했습니다. 단일 클러스터로 수렴하는 경향이 강해 의미 기반보다 서사 구조 기반 접근이 더 효과적임을 확인했습니다.

## Key Takeaways

- **LLM 기반 매칭 판정의 보수적 설계**: 벡터 유사도만으로는 부족한 정확도를 Claude Sonnet 4.5의 명시적 판정(표 데이터 유무, 섹션 타입 필터링)으로 보완하여 82.5% 매칭률 달성. Temperature=0.0으로 일관성 확보가 핵심.

- **클러스터링 알고리즘 선택은 데이터 특성에 의존적**: Label Propagation(F1 0.763)이 평균적으로 우수하나, 단일 주제 데이터(ELN3)는 Connected Components로 완벽 매칭(F1 1.0), 복잡한 다중 주제(ELN5)는 HDBSCAN이 유리(F1 0.812). 사전 데이터 분석 필수.

- **HDBSCAN 과분할 문제와 파라미터 민감도**: `min_cluster_size` 5 이상에서 평균 37개 클러스터 생성으로 recall 급락. 최적값은 2~3 + `min_samples=3` 조합으로 F1 0.736 달성. 정성 피드백과 정량 평가 일치.

- **단일 클러스터 수렴 현상의 근본 원인**: 연구노트 간 임베딩 유사도가 높아 GraphCommunity 알고리즘에서 평균 1.1~1.9개 클러스터만 생성. 의미 기반 분할보다 서사 구조(시간순, 실험 단계) 기반 청킹이 더 효과적.

- **BCubed F1 메트릭의 실무 적용성**: Precision/Recall 균형 평가로 과분할(precision 하락)과 과소분할(recall 하락) 동시 탐지 가능. 클러스터 수와 F1을 함께 모니터링하여 알고리즘 선택 가이드 제공.

## 상세 내용

### 배경: 연구노트-메모랜덤 자동 매칭 시스템 구축

GS Caltex 프로젝트는 PDF 형태의 연구노트(ELN)와 메모랜덤을 자동으로 매칭하여 연구 결과를 체계화하는 시스템 개발을 목표로 했습니다. 기존 수작업 매칭은 시간이 많이 소요되고 일관성이 부족했으며, 메모랜덤의 목차 구조를 활용하여 관련 연구노트를 자동으로 클러스터링하는 솔루션이 필요했습니다.

핵심 과제는 두 가지였습니다:
1. **정확한 정답셋 생성**: 벡터 유사도만으로는 부정확한 매칭이 많아 LLM 판정 단계 추가
2. **효과적인 클러스터링**: 메모랜덤 목차별로 연구노트를 의미있게 그룹화

### 아키텍처 설계: 파싱 → 임베딩 → 벡터 검색 → LLM 판정

**1단계: 문서 파싱 및 청킹**

메모랜덤과 연구노트는 서로 다른 파싱 전략을 적용했습니다:

```python
# 메모랜덤: 폰트 크기 기반 목차 추출
class MemorandumNaiveParser:
    def extract_toc(self, page):
        if font_size >= 13.5:
            return "대제목"  # "1. 목적"
        elif font_size >= 11.5:
            return "소제목"  # "2.1. 균주"
        else:
            return "본문"

# 연구노트: 키워드 기반 섹션 분류
SECTION_KEYWORDS = {
    "실험개요": ["실험개요", "실험 개요"],
    "실험방법": ["실험방법", "실험 방법"],
    "실험결과": ["실험결과", "Task Results"],
    "결론": ["결론", "고찰", "결과 및 토의"],
}
```

**의사결정 포인트**: PyMuPDF를 선택한 이유는 로컬 처리 가능, 빠른 속도, 폰트 메타데이터 추출 지원 때문입니다. Upstage Document Parse API도 테스트했으나, 대부분의 문서에서 PyMuPDF와 유사한 품질을 보여 비용 효율적인 로컬 처리를 선택했습니다.

**2단계: 임베딩 및 벡터 저장**

```python
# Amazon Titan Embed Text V2 설정
embedding_config = {
    "model_id": "amazon.titan-embed-text-v2:0",
    "dimensions": 1024,
    "normalize": True,  # L2 정규화로 코사인 유사도 계산
    "max_tokens": 8192,
    "safety_margin": 0.85  # 실제 최대: 6,553 토큰
}

# ChromaDB 디스크 기반 저장
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.create_collection(
    name="memorandum_eln",
    metadata={"hnsw:space": "cosine"}
)
```

**의사결정 포인트**: Titan V2를 선택한 이유는 AWS Bedrock 통합 용이성과 8K 토큰 컨텍스트 길이입니다. 메모랜덤 청크가 평균 500 토큰으로 긴 편이라 OpenAI의 512 토큰 제약은 부적합했습니다.

**3단계: 벡터 검색 + LLM 판정**

```python
# Top-K=5 벡터 검색
results = collection.query(
    query_embeddings=[eln_embedding],
    n_results=5,
    where={"session_id": session_id}
)

# Claude Sonnet 4.5 매칭 판정
prompt = f"""
다음 연구노트와 메모랜덤 청크가 같은 실험을 다루는지 판단하세요.

[판정 기준]
- True: 표(Table)에 구체적 실험 데이터(OD, 수율, 농도 등) 있음
- False: 결론/목적/향후 계획 섹션
- False: 판단 어려움 (보수적 판정)

[연구노트]
{eln_content}

[메모랜덤 청크]
{memorandum_chunk}

JSON 형식으로 응답: {{"match": true/false, "confidence": "high/medium/low"}}
"""

response = bedrock.invoke_model(
    modelId="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "temperature": 0.0,  # 일관성 최대화
        "messages": [{"role": "user", "content": prompt}]
    })
)
```

**의사결정 포인트**: 벡터 유사도만 사용했을 때 "실험 방법" 섹션과 "실험 결과" 섹션이 오매칭되는 문제가 빈번했습니다. LLM을 추가하여 **표 데이터 유무**를 명시적으로 확인하도록 설계한 결과, precision이 크게 향상되었습니다. Temperature=0.0은 반복 실행 시 일관된 판정을 보장하기 위한 설정입니다.

### 정답셋 생성 결과: 137개 노트 중 82.5% 매칭

4개 데이터셋(ELN1, 3, 4, 5)에서 총 270개 매칭 쌍을 생성했습니다:

| 데이터셋 | 주제 | 매칭률 | 평균 매칭/노트 | 평균 거리 |
|---------|------|--------|---------------|----------|
| ELN1 | 3-HP 발효 | 86.5% | 2.1개 | 0.763 |
| ELN3 | 일반 연구 | 100.0% | 2.5개 | 0.699 |
| ELN4 | CO2 Polyol | 68.8% | 2.5개 | 0.732 |
| ELN5 | Pilot 촉매 공정 | 90.0% | 2.5개 | 0.733 |

**주목할 점**:
- **평균 거리 0.699~0.763**: 코사인 거리 기준으로 상당히 가까운 편이나, 절대값으로는 명확한 경계 설정이 어려움 → LLM 판정 필요성 입증
- **ELN3 100% 매칭**: 단일 주제로 집중된 데이터셋은 벡터 유사도가 높고 LLM 판정도 명확
- **ELN4 68.8% 매칭**: 다양한 실험 방법론이 혼재되어 낮은 매칭률

### 클러스터링 성능 평가: BCubed F1 메트릭

**BCubed F1 선택 이유**:
- **Precision**: 같은 클러스터에 속한 아이템 중 실제로 같은 카테고리인 비율 → 과분할 패널티
- **Recall**: 같은 카테고리에 속한 아이템 중 같은 클러스터에 할당된 비율 → 과소분할 패널티
- **F1-Score**: Precision과 Recall의 조화평균으로 균형 평가

```python
def bcubed_precision(item_i, cluster_assignments, ground_truth):
    """아이템 i에 대한 BCubed Precision"""
    cluster_i = cluster_assignments[item_i]
    category_i = ground_truth[item_i]
    
    # 같은 클러스터에 속한 아이템들
    same_cluster = [j for j, c in enumerate(cluster_assignments) if c == cluster_i]
    
    # 그 중 실제로 같은 카테고리인 아이템들
    correct = [j for j in same_cluster if ground_truth[j] == category_i]
    
    return len(correct) / len(same_cluster)

# 전체 BCubed F1 계산
precision = np.mean([bcubed_precision(i, clusters, labels) for i in range(n)])
recall = np.mean([bcubed_recall(i, clusters, labels) for i in range(n)])
f1 = 2 * precision * recall / (precision + recall)
```

### 알고리즘별 성능 비교: Label Propagation 우승

**전체 평균 성능**:

| 알고리즘 | 평균 F1 | 평균 클러스터 수 | 특징 |
|---------|---------|-----------------|------|
| Label Propagation | **0.763** | 1.9 | 안정적, 단순 구조 |
| Connected Components | 0.733 | 1.1 | 최소 클러스터 생성 |
| Louvain | 0.689 | 3.1 | 세분화 경향 |
| HDBSCAN | 0.614 | 8.8 | 과분할 심각 |

**Label Propagation이 우수한 이유**:
1. **그래프 기반 전파**: 이웃 노드 라벨 중 다수결로 자신의 라벨 업데이트
2. **자연스러운 경계 형성**: 유사도가 높은 영역은 하나의 라벨로 수렴
3. **적절한 클러스터 수**: 평균 1.9개로 과분할/과소분할 균형

```python
# Label Propagation 작동 원리
def label_propagation(graph, max_iter=100):
    # 초기: 모든 노드에 고유 라벨
    labels = {node: i for i, node in enumerate(graph.nodes())}
    
    for _ in range(max_iter):
        for node in graph.nodes():
            # 이웃 라벨 중 가장 많은 것 선택
            neighbor_labels = [labels[n] for n in graph.neighbors(node)]
            labels[node] = max(set(neighbor_labels), key=neighbor_labels.count)
    
    return labels
```

**데이터셋별 최적 알고리즘**:

| 데이터셋 | 최적 알고리즘 | F1 | 이유 |
|---------|-------------|-----|------|
| ELN3 | CC/LP | 1.000 | 단일 주제로 명확한 경계 |
| ELN4 | Louvain | 0.952 | 다양한 실험 방법론, 세분화 필요 |
| ELN5 | HDBSCAN | 0.812 | 복잡한 pilot 공정, 노이즈 존재 |
| ELN1 | CC/LP | 0.597 | 3-HP 발효 단계별 구분 어려움 |

### HDBSCAN 과분할 문제와 해결책

**문제 상황**:
- `min_cluster_size=5`에서 ELN1에 평균 37개 클러스터 생성 (실제 목차 5개)
- 단일 연구노트가 여러 클러스터로 분할되어 recall 급락 (F1 0.15~0.27)

**파라미터 튜닝 결과**:

```python
# 최적 조합: (min_cluster_size=2~3, min_samples=3)
best_config = {
    "min_cluster_size": 3,  # 최소 클러스터 크기
    "min_samples": 3,       # 핵심 포인트 판정 기준
    "metric": "euclidean",
    "cluster_selection_method": "eom"  # Excess of Mass
}

# 성능 개선
# Before (5, 1): F1 0.540, 평균 16.5개 클러스터
# After  (3, 3): F1 0.736, 평균 5.3개 클러스터
```

**의사결정 포인트**: `min_cluster_size`를 낮추면 과분할 완화되나, 너무 낮으면 노이즈를 클러스터로 인식. `min_samples=3`으로 핵심 포인트 판정을 엄격히 하여 균형 확보.

### GraphCommunity 파라미터 영향 분석

**k_neighbors 영향**:

| k | LP F1 | Louvain F1 | CC F1 | 경향 |
|---|-------|-----------|-------|------|
| 5 | 0.765 | 0.753 | 0.812 | k 증가 시 성능 저하 |
| 10 | 0.733 | 0.754 | 0.707 | - |
| 15 | 0.779 | 0.759 | 0.687 | - |
| 20 | 0.734 | 0.718 | 0.687 | - |

**의사결정**: `k=5`를 기본값으로 선택. k가 클수록 약한 연결까지 포함하여 단일 클러스터로 수렴하는 경향 강화.

**유사도 메트릭 비교**:

```python
# Euclidean vs Cosine
# Euclidean: 평균 F1 0.731
# Cosine:    평균 F1 0.718

# 의사결정: Euclidean 선택
# 이유: Titan V2는 이미 L2 정규화 적용하여 방향성보다 거리가 유의미
```

### 핵심 인사이트: 단일 클러스터 수렴 현상

**발견 사항**:
- CC/LP 알고리즘에서 평균 클러스터 수 1.1~1.9개
- ELN3 전체가 하나의 클러스터로 수렴했으나 F1=1.0 (정답도 단일 클러스터)

**원인 분석**:
1. **높은 임베딩 유사도**: 연구노트 간 평균 코사인 거리 0.7대로 근접
2. **공통 도메인 용어**: "발효", "OD", "수율" 등 반복 출현
3. **서사 구조의 부재**: 시간순/실험 단계 정보가 임베딩에 미반영

**실무 적용 제안**:
```python
# 개선 방향 1: 메타데이터 통합
chunk_metadata = {
    "content": text,
    "date": extract_date(text),
    "experiment_phase": classify_phase(text),  # "준비", "진행", "분석"
    "section_type": section_type
}

# 개선 방향 2: 하이브리드 임베딩
hybrid_embedding = concatenate([
    semantic_embedding,  # Titan V2
    temporal_embedding,  # 날짜 정보
    structural_embedding  # 섹션 타입
])
```

### 실무 적용 가이드

**1. 데이터 특성 파악 후 알고리즘 선택**:

```python
def select_algorithm(data_characteristics):
    if data_characteristics["topic_diversity"] == "single":
        return "connected_components"  # F1 1.0 기대
    
    elif data_characteristics["cluster_boundaries"] == "clear":
        return "louvain"  # F1 0.95+ 기대
    
    elif data_characteristics["noise_level"] == "high":
        return {
            "algorithm": "hdbscan",
            "params": {"min_cluster_size": 3, "min_samples": 3}
        }
    
    else:
        return "label_propagation"  # 범용적으로 안정적
```

**2. BCubed F1과 클러스터 수 동시 모니터링**:

```python
# 과분할 탐지
if avg_clusters > expected_clusters * 2 and f1 < 0.7:
    print("과분할 의심: min_cluster_size 증가 필요")

# 과소분할 탐지
if avg_clusters < expected_clusters * 0.5 and f1 < 0.7:
    print("과소분할 의심: k_neighbors 감소 또는 algorithm 변경")
```

**3. LLM 판정 프롬프트 엔지니어링**:

```python
# 핵심: 명시적 기준 + 보수적 판정
prompt_template = """
[판정 기준] (우선순위 순)
1. 표(Table) 데이터 존재 여부
2. 정량적 수치 (농도, 수율, 온도 등) 존재 여부
3. 섹션 타입 (결론/계획은 제외)

[보수적 판정 원칙]
- 애매한 경우 False 반환
- 추론 과정을 reasoning 필드에 기록
"""
```

## References

- [BCubed Precision and Recall](https://en.wikipedia.org/wiki/Cluster_analysis#External_evaluation) - 클러스터링 외부 평가 메트릭
- [K-Nearest Neighbors Algorithm | IBM](https://www.ibm.com/kr-ko/think/topics/knn) - KNN 기반 그래프 구성 원리
- [Amazon Titan Embeddings Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html) - Titan Embed Text V2 사양
- [ChromaDB Documentation](https://docs.trychroma.com/) - 벡터 데이터베이스 구현
- [Label Propagation Algorithm](https://scikit-learn.org/stable/modules/generated/sklearn.semi_supervised.LabelPropagation.html) - scikit-learn 구현 예시
- [HDBSCAN Documentation](https://hdbscan.readthedocs.io/en/latest/parameter_selection.html) - 파라미터 선택 가이드
- [Louvain Community Detection](https://python-louvain.readthedocs.io/) - Modularity 기반 클러스터링
- [Claude Sonnet 4.5 on AWS Bedrock](https://aws.amazon.com/bedrock/claude/) - LLM 추론 API
