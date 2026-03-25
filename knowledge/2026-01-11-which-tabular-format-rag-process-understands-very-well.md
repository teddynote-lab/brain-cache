---
title: "Which tabular format RAG Process understands very well?"
description: "RAG 파이프라인에서 테이블 데이터의 포맷이 검색 성능에 미치는 영향을 실험한 결과, Markdown Key-Value 형식이 가장 높은 Recall을 보였으며, TOON 포맷은 토큰 효율성 측면에서 가장 우수했습니다. AIHub의 표 정보 질의응답 데이터 50개를 7"
slug: which-tabular-format-rag-process-understands-very-well
date: 2026-01-11
authors: [braincrew]
tags:
  - data
source_url: "https://www.ncloud-forums.com/topic/594/"
---

# Which tabular format RAG Process understands very well?

## TL;DR
> RAG 파이프라인에서 테이블 데이터의 포맷이 검색 성능에 미치는 영향을 실험한 결과, Markdown Key-Value 형식이 가장 높은 Recall을 보였으며, TOON 포맷은 토큰 효율성 측면에서 가장 우수했습니다. AIHub의 표 정보 질의응답 데이터 50개를 7가지 포맷으로 변환하여 비교한 결과, 포맷 선택은 성능과 비용 간의 트레이드오프 관계에 있음을 확인했습니다.

## Key Takeaways
- **포맷 선택은 사용 사례에 따라 달라져야 함**: 높은 정확도가 필요한 경우 Markdown-KV, 비용 효율이 중요한 경우 TOON 포맷을 선택하는 것이 합리적입니다.
- **토큰 효율과 검색 성능은 별개**: TOON은 평균 토큰 수를 크게 줄이지만, 이것이 항상 높은 Recall로 이어지지는 않습니다. Embedding 모델의 학습 데이터와 포맷 간의 친화성이 중요합니다.
- **소규모 실험으로도 유의미한 인사이트 도출 가능**: 50개 샘플로도 포맷 간 상대적 성능 차이를 파악할 수 있으며, 이를 바탕으로 프로덕션 환경에서의 포맷 선택 방향을 설정할 수 있습니다.
- **평가 파이프라인 구축의 중요성**: LLM을 활용한 QA 생성 → Retrieval 평가의 자동화된 파이프라인은 다양한 실험을 빠르게 반복할 수 있게 해줍니다.
- **Generation 단계까지 고려해야 완전한 평가**: Retrieval 성능만으로는 최종 사용자 경험을 대변하기 어려우며, 실제 답변 생성 품질까지 평가해야 합니다.

## 상세 내용

### 배경: 테이블 데이터와 RAG의 만남

RAG(Retrieval-Augmented Generation) 시스템에서 테이블 데이터는 구조화된 정보를 담고 있어 높은 가치를 지니지만, 동시에 처리하기 까다로운 대상입니다. HTML 테이블, Markdown, JSON, CSV 등 다양한 포맷이 존재하며, 각 포맷은 정보 밀도, 토큰 소비량, LLM의 이해도 측면에서 상이한 특성을 보입니다.

최근 TOON(Token-Oriented Object Notation) 포맷이 등장하면서, 동일한 정보를 더 적은 토큰으로 표현하면서도 LLM이 이해하기 쉬운 구조를 제공한다는 주장이 제기되었습니다. 그러나 실제 RAG 환경에서 어떤 포맷이 최적인지에 대한 실증적 연구는 부족한 상황이었습니다.

### 문제 상황: 포맷 선택의 딜레마

프로덕션 RAG 시스템을 구축할 때, 다음과 같은 질문에 직면합니다:

1. **토큰 효율성과 검색 성능 중 무엇을 우선할 것인가?**
2. **Embedding 모델이 특정 포맷을 더 잘 이해하는가?**
3. **포맷 변환의 추가 비용 대비 성능 개선이 합리적인가?**

이러한 질문에 답하기 위해 체계적인 실험을 설계했습니다.

### 실험 설계

#### 데이터 준비

AIHub의 "표 정보 질의응답 데이터"를 활용했습니다. 이 데이터는:
- 총 100만 건의 QA 쌍 포함
- 건축, 공공행정, 과학기술 등 10개 카테고리
- 다양한 테이블 복잡도 (행 수, 헤더 depth 등)

전체 16,000개 테이블 중 50개를 무작위 샘플링하여 Target Data로 선정했습니다.

#### 평가용 QA 생성

각 테이블에 대해 GPT-4.1을 활용하여 질문-답변 쌍을 자동 생성했습니다:

```python
# 의사 코드
def generate_qa_pairs(table_chunk):
    # Step 1: 테이블 기반 질문 생성
    question = gpt4_generate_question(table_chunk)
    
    # Step 2: 테이블 + 질문 기반 답변 생성
    answer = gpt4_generate_answer(table_chunk, question)
    
    return question, answer
```

이 중 25개를 최종 Evaluation Data로 선정했습니다.

#### 7가지 테이블 포맷

다음 포맷들을 비교했습니다:

1. **HTML**: 표준 `<table>` 태그 구조
2. **Markdown**: 파이프(`|`)로 구분된 형식
3. **Markdown-KV**: 각 행을 Key-Value 쌍으로 표현
4. **TOON**: 탭형 구조로 압축된 포맷
5. **JSON**: 표준 JSON 배열 구조
6. **Plain Text**: 자연어 형태로 풀어쓴 형식
7. **CSV-like**: 쉼표로 구분된 단순 형식

#### 포맷 변환 예시

원본 HTML 테이블:
```html
<table>
  <tr><td>바탕의 종류</td><td>도장 종류</td><td>공법</td></tr>
  <tr><td>목재면</td><td>1종</td><td>부분 퍼티 처리</td></tr>
  <tr><td>철재면</td><td>2종</td><td>금속바탕 처리용 프라이머</td></tr>
</table>
```

**Markdown-KV 변환**:
```markdown
## 바탕 만들기의 도장 방법

**항목 1:**
- 바탕의 종류: 목재면
- 도장 종류: 1종
- 공법: 부분 퍼티 처리

**항목 2:**
- 바탕의 종류: 철재면
- 도장 종류: 2종
- 공법: 금속바탕 처리용 프라이머
```

**TOON 변환**:
```
바탕 만들기의 도장 방법[2]{바탕의 종류, 도장 종류, 공법}:
목재면, 1종, 부분 퍼티 처리
철재면, 2종, 금속바탕 처리용 프라이머
```

### 실험 방법론

#### Embedding 및 저장

Qwen/Qwen3-Embedding-8B 모델을 사용하여 각 포맷별로 임베딩을 생성하고, 별도의 Chroma collection에 저장했습니다. 이 모델을 선택한 이유는:
- 다국어 지원 (한국어 포함)
- 8B 파라미터로 높은 성능
- 문서 검색에 최적화된 학습

#### 평가 지표

1. **Recall@K**: Top-K 검색 결과에 정답 문서가 포함되는 비율
   - K=1, 2, 3에 대해 측정
2. **Average Token Count**: 각 포맷의 평균 토큰 수
   - 비용 효율성의 대리 지표

```python
def evaluate_retrieval(collection, queries, ground_truth, k=3):
    recalls = []
    for query, gt_doc_id in zip(queries, ground_truth):
        results = collection.query(query, n_results=k)
        retrieved_ids = [r['id'] for r in results]
        recall = 1 if gt_doc_id in retrieved_ids else 0
        recalls.append(recall)
    return sum(recalls) / len(recalls)
```

### 실험 결과 분석

#### Recall 성능

실험 결과, Markdown-KV 포맷이 가장 높은 Recall을 기록했습니다:

- **Markdown-KV**: Recall@3 기준 약 85%
- **HTML**: 약 78%
- **TOON**: 약 72%
- **Plain Text**: 약 68%
- **JSON**: 약 65%

**왜 Markdown-KV가 우수했는가?**

1. **명시적 Key-Value 구조**: "바탕의 종류: 목재면"과 같은 형식은 Embedding 모델이 의미론적 관계를 파악하기 쉽게 만듭니다.
2. **자연어 친화성**: Qwen 모델의 학습 데이터에 Markdown 형식이 많이 포함되어 있을 가능성이 높습니다.
3. **정보 밀도**: 각 항목이 독립적으로 표현되어 부분 매칭에 유리합니다.

#### 토큰 효율성

TOON 포맷이 기대대로 가장 효율적이었습니다:

- **TOON**: 평균 약 120 토큰 (기준)
- **Markdown-KV**: 평균 약 210 토큰 (+75%)
- **HTML**: 평균 약 180 토큰 (+50%)
- **JSON**: 평균 약 195 토큰 (+62%)

**토큰 효율성의 실제 의미**

50개 테이블 기준으로 계산하면:
- TOON: 6,000 토큰
- Markdown-KV: 10,500 토큰

월 100만 테이블을 처리하는 서비스라면:
- 토큰 차이: 90,000,000 토큰/월
- 비용 차이 (OpenAI 가격 기준 $0.0001/1K 토큰): $9/월

규모가 커질수록 이 차이는 유의미해집니다.

### 의사결정 프레임워크: 어떤 포맷을 선택할 것인가?

실험 결과를 바탕으로 다음과 같은 의사결정 트리를 제안합니다:

```
질문 1: 검색 정확도가 최우선인가?
└─ Yes → Markdown-KV 선택
└─ No  → 질문 2로

질문 2: 대용량 처리 (>100K 테이블/일)인가?
└─ Yes → TOON 선택
└─ No  → 질문 3으로

질문 3: 기존 시스템이 특정 포맷을 사용 중인가?
└─ Yes → 기존 포맷 유지 (변환 비용 고려)
└─ No  → HTML 또는 Markdown 선택 (범용성)
```

### 한계점 및 추가 고려사항

#### 1. 실험 규모의 한계

50개 샘플은 트렌드를 파악하기에는 충분하지만, 통계적 유의성을 확보하기에는 부족합니다. 특히:
- Recall@5 이상에서는 차이가 수렴할 가능성
- 특정 도메인(예: 금융 표)에서는 다른 결과가 나올 수 있음

#### 2. Embedding 모델 의존성

Qwen3-Embedding-8B는 우수한 성능을 보이지만, 이는 결과에 편향을 줄 수 있습니다. OpenAI의 text-embedding-3-large나 Cohere의 embed-multilingual-v3.0으로 실험하면 다른 포맷이 우세할 수 있습니다.

#### 3. Generation 단계 미평가

Retrieval 성능만으로는 불충분합니다. 실제 RAG 시스템에서는:
- LLM이 retrieved context를 얼마나 잘 이해하는가?
- 최종 답변의 품질은?

이를 평가하기 위해서는 추가 실험이 필요합니다:

```python
def evaluate_end_to_end(query, retrieved_chunks, ground_truth_answer):
    # LLM에 retrieved chunks를 전달하여 답변 생성
    generated_answer = llm_generate(query, retrieved_chunks)
    
    # 답변 품질 평가 (ROUGE, BERTScore 등)
    score = evaluate_answer_quality(generated_answer, ground_truth_answer)
    return score
```

### 향후 연구 방향

#### 1. 대규모 벤치마크

- 1,000개 이상의 테이블로 실험 확장
- 다양한 카테고리별 성능 비교
- 테이블 복잡도(행/열 수, nested structure)에 따른 포맷 성능 변화 분석

#### 2. 하이브리드 접근

여러 포맷을 동시에 활용하는 전략:

```python
def hybrid_retrieval(query):
    # TOON으로 1차 검색 (효율성)
    toon_candidates = toon_collection.query(query, n_results=10)
    
    # Markdown-KV로 재순위화 (정확성)
    refined_results = rerank_with_markdown_kv(toon_candidates)
    return refined_results
```

#### 3. 포맷별 최적화

각 포맷에 특화된 Retrieval 전략:
- TOON: 구조 인식 검색
- Markdown-KV: Key 기반 필터링 + Value 검색
- JSON: 스키마 활용 쿼리 확장

#### 4. 도메인 특화 실험

- 금융 표: 숫자와 단위가 중요
- 법률 표: 계층 구조와 참조가 중요
- 과학 표: 수식과 기호가 중요

각 도메인에서 최적 포맷이 다를 수 있습니다.

### 실무 적용 가이드

#### Step 1: 요구사항 분석

```python
requirements = {
    "accuracy_priority": "high",  # high/medium/low
    "volume": "100K tables/day",
    "budget": "tight",
    "latency_requirement": "<2s",
    "existing_format": "HTML"
}
```

#### Step 2: 파일럿 실험

작은 규모로 3-4개 포맷을 비교:

```python
# 실험 설정
formats_to_test = ["markdown_kv", "toon", "html"]
sample_size = 100

# 평가 실행
results = {}
for fmt in formats_to_test:
    results[fmt] = {
        "recall": evaluate_recall(fmt, sample_size),
        "avg_tokens": calculate_avg_tokens(fmt, sample_size),
        "conversion_cost": estimate_conversion_cost(fmt)
    }

# 최적 선택
best_format = select_best(results, requirements)
```

#### Step 3: 프로덕션 롤아웃

1. **A/B 테스팅**: 기존 포맷과 신규 포맷을 동시 운영
2. **모니터링**: 실제 사용자 쿼리에서의 성능 추적
3. **점진적 전환**: 성능이 검증되면 단계적으로 확대

## References

- [NAVER Cloud - JSON vs TOON: LLM 입력 포맷 비교](https://www.ncloud-forums.com/topic/594/)
  - TOON 포맷의 토큰 효율성과 LLM 성능에 대한 벤치마크
- [TOON GitHub Repository](https://github.com/toon-format/toon/tree/main)
  - TOON 포맷 스펙 및 변환 도구
- [AIHub - 표 정보 질의응답 데이터](https://aihub.or.kr/aihubdata/data/view.do?currMenu=115&topMenu=100&aihubDataSe=data&dataSetSn=71565)
  - 실험에 사용된 데이터셋
- [ChromaDB Documentation](https://docs.trychroma.com/)
  - Vector store 구현 참고
- [Qwen Embedding Models](https://huggingface.co/Qwen)
  - 실험에 사용된 임베딩 모델
