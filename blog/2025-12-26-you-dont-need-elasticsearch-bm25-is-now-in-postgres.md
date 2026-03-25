---
title: "You don’t need Elasticsearch : BM25 is now in Postgres"
description: "Postgres의 기본 전문 검색(Full-Text Search)은 키워드 반복 남용, 문서 길이 편향, 희귀 단어 처리 실패 등의 문제로 실무에서 한계가 있었습니다. 이를 해결하기 위해 Elasticsearch를 추가하는 것이 일반적이었지만, 이제 `pg_textse"
slug: you-dont-need-elasticsearch-bm25-is-now-in-postgres
date: 2025-12-26
authors: [braincrew]
tags:
  - retrieval
  - architecture
  - reference
source_url: "https://www.tigerdata.com/blog/you-dont-need-elasticsearch-bm25-is-now-in-postgres"
---


# You don’t need Elasticsearch : BM25 is now in Postgres

## TL;DR
> Postgres의 기본 전문 검색(Full-Text Search)은 키워드 반복 남용, 문서 길이 편향, 희귀 단어 처리 실패 등의 문제로 실무에서 한계가 있었습니다. 이를 해결하기 위해 Elasticsearch를 추가하는 것이 일반적이었지만, 이제 `pg_textsearch` 확장을 통해 BM25 알고리즘을 Postgres에서 직접 사용할 수 있습니다. BM25는 TF 포화(Term Frequency Saturation), IDF(Inverse Document Frequency), 문서 길이 정규화를 통해 검색 품질을 대폭 개선하며, pgvector와 결합한 하이브리드 검색으로 RAG 파이프라인과 AI 에이전트의 검색 성능을 향상시킬 수 있습니다.

## Key Takeaways
- **인프라 단순화**: BM25를 Postgres에서 직접 사용하면 Elasticsearch 같은 별도 검색 클러스터, 데이터 동기화 파이프라인, 추가 운영 부담 없이 검색 품질을 크게 개선할 수 있습니다.
- **BM25의 핵심 개선사항**: TF Saturation(키워드 반복 스팸 방지), IDF(희귀 단어 가중치 증가), Length Normalization(짧고 집중된 문서 우대)으로 Postgres 기본 검색의 4가지 주요 문제를 해결합니다.
- **하이브리드 검색의 필요성**: RAG와 AI 에이전트는 정확한 키워드 매칭(BM25)과 의미적 유사성(Vector Search)을 모두 필요로 하며, Reciprocal Rank Fusion으로 두 방식을 결합할 수 있습니다.
- **실무 적용 간편성**: `CREATE EXTENSION pg_textsearch`와 `CREATE INDEX USING bm25` 만으로 즉시 적용 가능하며, 기존 pgvector와 함께 사용하면 한 쿼리로 하이브리드 검색을 구현할 수 있습니다.
- **99%의 사용 사례에 충분**: 페타바이트급 로그 수집이 아닌 일반적인 애플리케이션 검색(문서, 제품 카탈로그, 지원 티켓 등)에는 Postgres + BM25 + Vector 조합이 충분하며 운영 복잡도를 크게 낮춥니다.

## 상세 내용

### Postgres 검색의 현실과 복잡성의 덫

Postgres는 Stripe, Instagram, Spotify를 비롯한 수백만 개발자의 표준 데이터베이스입니다. 검색 기능 역시 모든 앱에 필수적입니다—제품 카탈로그, 문서, 사용자 콘텐츠, 지원 티켓, 그리고 최근에는 답변 생성 전에 관련 문서를 찾아야 하는 AI 에이전트와 RAG 파이프라인까지.

개발자들은 자연스럽게 Postgres로 검색을 구현하려 하지만 곧 한계에 부딪힙니다. 그러면 다음 단계는? Elasticsearch, Algolia, Typesense 같은 전문 검색 시스템 도입입니다.

그 순간부터:
- 별도 클러스터를 운영하고 24/7 가동 상태를 유지해야 합니다
- Postgres와 검색 시스템 간 데이터 동기화 파이프라인을 구축해야 합니다
- 검색 결과가 오래되거나 누락된 이유를 디버깅해야 합니다
- On-call 대응 시스템 목록에 또 하나가 추가됩니다
- 매달 수천 달러를 매니지드 서비스에 지불하거나, 운영 전문가를 고용해야 합니다

물론 1%는 이런 복잡성이 필요합니다. 페타바이트급 로그 수집을 위한 Elasticsearch, 실시간 분석을 위한 Clickhouse, Google과 OpenAI의 맞춤형 인프라. 하지만 나머지 99%는 이런 복잡성이 필요 없습니다. 이미 사용 중인 데이터베이스에서 더 나은 검색만 있으면 됩니다.

[데모 앱](https://pgtextsearchdemo.vercel.app/)에서 Native Search, BM25, Vector Search, Hybrid Search를 직접 비교해볼 수 있습니다.

### Postgres Native Search의 4가지 핵심 문제

검색의 주요 목표는 주어진 쿼리에 대해 가장 관련성 높고 유용한 결과를 반환하는 것입니다. 간단해 보이지만, 실제로는 전혀 그렇지 않습니다.

구체적인 예시를 위해 다음과 같은 문서들이 있다고 가정해봅시다:

```
📄 Database Connection Pooling Guide
   "Database connection pooling improves application performance. 
   A pool maintains reusable connections. Configure pool size based on workload."

📄 PostgreSQL Authentication Setup  
   "Set up PostgreSQL database authentication methods. 
   Configure pg_hba.conf for password, certificate, and LDAP authentication."

📄 Generic Blog Post (스팸)
   "Database database database. Learn about database. Database is important. 
   Database database database. More database info."

📄 EXPLAIN ANALYZE Quick Tip (15 단어)
   "Use EXPLAIN ANALYZE to find slow PostgreSQL queries. 
   Shows execution plan and actual timing."

📄 Complete PostgreSQL Query Tuning Guide (80 단어)
   "This comprehensive PostgreSQL guide covers query tuning. PostgreSQL query 
   performance depends on proper use of EXPLAIN and EXPLAIN ANALYZE..."
```

#### Problem 1: 키워드 스터핑이 승리한다

"**database**"를 검색하면, Native Postgres는 키워드 개수로 순위를 매깁니다. "database"를 12번 반복한 스팸 문서가 1위를 차지하고, 실제 유용한 가이드는 하위에 랭크됩니다.

![Problem 1](https://www.tigerdata.com/_next/image?url=https%3A%2F%2Ftimescale.ghost.io%2Fblog%2Fcontent%2Fimages%2F2025%2F12%2Fproblem1-new.png&w=3840&q=100)

#### Problem 2: 흔한 단어가 지배한다

"**database authentication**"을 검색하면, "database"는 10개 이상의 문서에 등장하고, "authentication"은 단 1개에만 등장합니다. 어떤 단어가 실제로 찾고자 하는 내용을 식별할까요?

Native Postgres는 두 단어를 동등하게 취급합니다. BM25는 "authentication"이 진짜 시그널임을 압니다.

![Problem 2](https://www.tigerdata.com/_next/image?url=https%3A%2F%2Ftimescale.ghost.io%2Fblog%2Fcontent%2Fimages%2F2025%2F12%2Fproblem2-new.png&w=3840&q=100)

#### Problem 3: 긴 문서가 승리한다

"**EXPLAIN ANALYZE**"를 검색하면, 80단어 가이드는 8번 언급하고, 15단어 팁은 2번 언급합니다. Native는 긴 문서를 더 높게 랭크합니다.

하지만 짧은 팁은 *전체가* EXPLAIN ANALYZE에 관한 것입니다. 이것이 최고의 결과입니다.

![Problem 3](https://www.tigerdata.com/_next/image?url=https%3A%2F%2Ftimescale.ghost.io%2Fblog%2Fcontent%2Fimages%2F2025%2F12%2Fproblem3-new.png&w=3840&q=100)

#### Problem 4: All-or-Nothing 매칭

"**database connection pooling**"을 검색하면, Native는 Boolean AND를 사용합니다. 세 단어가 **모두** 있는 문서만 매치됩니다. 15개 중 2개만 결과로 나옵니다.

`OR`로 바꾸면? 13개 결과가 나오지만, 많은 문서가 동일한 점수를 갖습니다. 어떤 것이 실제로 관련 있는지 알 방법이 없습니다.

![Problem 4](https://www.tigerdata.com/_next/image?url=https%3A%2F%2Ftimescale.ghost.io%2Fblog%2Fcontent%2Fimages%2F2025%2F12%2Fproblem4-new.png&w=3840&q=100)

### 해결책: BM25 알고리즘

좋은 소식은 검색 업계가 이미 1990년대에 이 문제를 해결했다는 것입니다. 단지 Postgres에 추가되지 않았을 뿐입니다. 그것이 바로 [BM25](https://en.wikipedia.org/wiki/Okapi_BM25)(Best Matching 25)입니다.

BM25는 Elasticsearch, Solr, Lucene 등 거의 모든 프로덕션 검색 시스템을 구동하며, 위의 문제들을 정확히 해결합니다:

**Term Frequency Saturation (TF 포화)** - 단어를 12번 언급한다고 해서 문서가 12배 더 관련성 있는 것은 아닙니다. 몇 번 언급 후에는 추가 반복이 거의 도움이 되지 않습니다. 스팸이 패배합니다.

**Inverse Document Frequency (IDF)** - 희귀한 단어가 더 중요합니다. "Database"는 어디에나 있으므로 노이즈입니다. "Authentication"은 한 번만 등장하므로 시그널입니다. BM25는 이에 따라 가중치를 부여합니다.

**Length Normalization (길이 정규화)** - 쿼리에 집중된 15단어 팁이 지나가듯 언급한 80단어 문서를 이깁니다. BM25는 문서 길이를 조정합니다.

**Ranked Retrieval (순위 기반 검색)** - 모든 문서가 의미 있는 관련성 점수를 받으며, 단순히 "매치" 또는 "매치 안 됨"이 아닙니다. 부분 매치도 나타나지만 낮은 순위로 표시됩니다.

![BM25 Venn Diagram](https://www.tigerdata.com/_next/image?url=https%3A%2F%2Ftimescale.ghost.io%2Fblog%2Fcontent%2Fimages%2F2025%2F12%2Fbm25-venn-diagram.png&w=3840&q=100)

이것이 Google이 처음부터 작동한 방식입니다. 검색의 기본 요건입니다.

### Postgres에서 BM25 사용하기

[pg_textsearch](https://github.com/timescale/pg_textsearch)는 BM25를 Postgres에 도입합니다:

```sql
CREATE EXTENSION pg_textsearch;
CREATE INDEX ON articles USING bm25(content);

SELECT * FROM articles 
ORDER BY content <@> to_bm25query('database performance')
LIMIT 10;
```

#### BM25 수식의 이해

BM25 점수는 다음과 같이 계산됩니다:

```
score(D,Q) = Σ IDF(qi) · [f(qi,D) · (k1+1)] / [f(qi,D) + k1·(1-b + b·|D|/avgdl)]
```

여기서:
- `f(qi,D)`: 문서 D에서 키워드 qi가 등장하는 횟수
- `|D|`: 문서 D의 길이(단어 수)
- `avgdl`: 컬렉션의 평균 문서 길이
- `k1`: TF 포화를 제어하는 파라미터 (일반적으로 1.2~2.0)
- `b`: 길이 정규화를 제어하는 파라미터 (0~1, 일반적으로 0.75)

### AI 에이전트와 RAG를 위한 하이브리드 검색

AI 에이전트와 RAG 파이프라인도 검색이 필요합니다. 그리고 BM25만으로는 해결할 수 없는 문제가 있습니다.

사용자가 "why is my database slow?"라고 물으면, "query optimization"이나 "index tuning"과 직접적인 키워드 매치가 없습니다. BM25는 아무것도 찾지 못합니다. 에이전트가 실패합니다.

Vector Search는 의미를 이해합니다. "slow database"가 "performance optimization"과 관련되어 있다는 것을 압니다. 하지만 벡터는 반대 문제가 있습니다: 너무 퍼지(fuzzy)합니다. 에러 코드 PG-1234를 검색하면 벡터는 일반적인 에러 문서를 반환하지, 정확한 에러 코드가 있는 문서를 반환하지 않습니다.

해결책: 둘 다 사용하는 것입니다.

**Query: `error PG-1234`**
- BM25 finds: 정확한 코드가 있는 문서
- Vectors find: 일반적인 에러 문서
- Hybrid finds: 정확한 코드 문서 ✓

**Query: `why is my database slow`**
- BM25 finds: 없음 (키워드 매치 없음)
- Vectors find: 성능 최적화 문서
- Hybrid finds: 성능 문서 ✓

**Query: `fix connection timeout`**
- BM25 finds: 타임아웃 설정 문서
- Vectors find: 트러블슈팅 가이드
- Hybrid finds: 둘 다, 관련성 순으로 정렬 ✓

이것이 모든 주요 AI 검색 시스템이 하이브리드 검색을 사용하는 이유입니다.

- LangChain의 [EnsembleRetriever](https://python.langchain.com/docs/how_to/ensemble_retriever/)는 Reciprocal Rank Fusion을 사용하여 BM25와 벡터를 결합합니다
- [Cohere Rerank](https://docs.cohere.com/docs/reranking-best-practices)는 BM25를 첫 번째 단계 리트리버로 권장합니다
- Pinecone은 sparse와 dense 벡터를 결합하는 [하이브리드 검색](https://docs.pinecone.io/guides/data/understanding-hybrid-search)을 추가했습니다

### Postgres에서 하이브리드 검색 구현하기

[pgvector](https://github.com/pgvector/pgvector)와 함께 Postgres에서도 가능합니다:

```sql
-- Reciprocal Rank Fusion을 사용한 하이브리드 검색
WITH bm25 AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY content <@> to_bm25query($1)) as rank
  FROM docs LIMIT 20
),
vector AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> $2) as rank
  FROM docs LIMIT 20
)
SELECT id, 1.0/(60+bm25.rank) + 1.0/(60+vector.rank) as score
FROM bm25 FULL JOIN vector USING (id)
ORDER BY score DESC LIMIT 10;
```

키워드 + 의미. 하나의 데이터베이스에서.

![Hybrid Search](https://www.tigerdata.com/_next/image?url=https%3A%2F%2Ftimescale.ghost.io%2Fblog%2Fcontent%2Fimages%2F2025%2F12%2Fhybrid-search.png&w=3840&q=100)

### 핵심 요점

대부분의 애플리케이션은 별도의 검색 인프라가 필요하지 않습니다. BM25와 벡터 검색을 Postgres에서 직접 사용하면:

- **운영 복잡도 감소**: 별도 클러스터, 동기화 파이프라인, 추가 모니터링 없음
- **일관성 보장**: 단일 트랜잭션 내에서 데이터와 검색 인덱스 업데이트
- **비용 절감**: 수천 달러의 매니지드 검색 서비스 비용 제거
- **개발 속도 향상**: 이미 익숙한 Postgres SQL로 검색 구현
- **RAG 최적화**: BM25의 정확성과 벡터의 의미 이해를 결합

물론 페타바이트급 로그 검색이나 밀리초 단위 레이턴시가 필요한 대규모 검색 서비스는 전문 솔루션이 필요합니다. 하지만 99%의 사용 사례—일반적인 앱의 문서 검색, 제품 카탈로그, 지원 티켓, RAG 파이프라인—에는 Postgres + pg_textsearch + pgvector가 충분하며, 훨씬 단순합니다.

## References
- [You Don't Need Elasticsearch: BM25 is Now in Postgres - Tiger Data Blog](https://www.tigerdata.com/blog/you-dont-need-elasticsearch-bm25-is-now-in-postgres)
- [BM25 Search Demo - Tiger Data](https://pgtextsearchdemo.vercel.app/)
- [Okapi BM25 - Wikipedia](https://en.wikipedia.org/wiki/Okapi_BM25)
- [pg_textsearch - GitHub Repository](https://github.com/timescale/pg_textsearch)
- [pgvector - GitHub Repository](https://github.com/pgvector/pgvector)
- [LangChain Ensemble Retriever Documentation](https://python.langchain.com/docs/how_to/ensemble_retriever/)
- [Cohere Rerank Best Practices](https://docs.cohere.com/docs/reranking-best-practices)
- [Pinecone Hybrid Search Guide](https://docs.pinecone.io/guides/data/understanding-hybrid-search)
