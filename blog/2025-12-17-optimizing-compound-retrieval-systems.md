---
title: "Optimizing Compound Retrieval Systems"
description: "Compound Retrieval Systems는 여러 검색 방법을 결합하여 성능을 향상시키는 시스템이지만, 각 구성 요소의 최적 조합을 찾는 것은 복잡한 문제입니다. 본 논문은 compound retrieval의 성능을 체계적으로 최적화하는 방법론을 제시하며, spa"
slug: optimizing-compound-retrieval-systems
date: 2025-12-17
authors: [jaehun]
tags:
  - retrieval
  - paper-review
source_url: "https://arxiv.org/pdf/2504.12063"
---


# Optimizing Compound Retrieval Systems

## TL;DR
> Compound Retrieval Systems는 여러 검색 방법을 결합하여 성능을 향상시키는 시스템이지만, 각 구성 요소의 최적 조합을 찾는 것은 복잡한 문제입니다. 본 논문은 compound retrieval의 성능을 체계적으로 최적화하는 방법론을 제시하며, sparse retrieval, dense retrieval, reranking 등 다양한 구성 요소 간의 상호작용을 분석합니다. 실험 결과, 단순히 더 많은 구성 요소를 추가하는 것이 아니라 적절한 조합과 파라미터 튜닝이 성능 향상의 핵심임을 보여줍니다.

## Key Takeaways
- **구성 요소의 다양성보다 최적 조합이 중요**: 더 많은 retrieval 방법을 추가한다고 해서 반드시 성능이 향상되는 것은 아니며, 각 구성 요소 간의 시너지를 고려한 선택이 필수적입니다.
- **Reranking의 전략적 활용**: Reranking 모델의 위치와 적용 범위가 전체 시스템 성능에 큰 영향을 미치므로, computational budget과 latency 요구사항에 따라 신중히 설계해야 합니다.
- **체계적인 하이퍼파라미터 최적화**: Retrieval pipeline의 각 단계별 파라미터(top-k, fusion weights 등)를 독립적이 아닌 상호의존적으로 튜닝해야 최적 성능을 달성할 수 있습니다.
- **도메인별 맞춤 설계 필요**: 데이터셋과 쿼리 특성에 따라 최적의 compound retrieval 구성이 크게 달라지므로, 범용 솔루션보다는 도메인 특화 최적화가 효과적입니다.
- **비용-성능 트레이드오프 분석**: 성능 향상의 한계 비용(marginal cost)을 정량적으로 측정하여, 프로덕션 환경에서 실용적인 시스템을 구축할 수 있습니다.

## 상세 내용

### Compound Retrieval Systems의 개요

현대의 정보 검색 시스템은 단일 검색 방법에 의존하지 않고, 여러 retrieval 기법을 조합하는 compound 접근법을 채택하고 있습니다. 전통적인 sparse retrieval(BM25 등), neural dense retrieval(bi-encoder 기반), 그리고 cross-encoder를 활용한 reranking을 결합함으로써 각 방법의 장점을 극대화하고 단점을 보완할 수 있습니다.

그러나 이러한 시스템의 설계 공간은 방대합니다. 어떤 구성 요소를 선택할지, 각 단계에서 몇 개의 문서를 유지할지, 결과를 어떻게 융합할지 등 수많은 결정 사항이 존재하며, 이들의 조합은 기하급수적으로 증가합니다.

### 최적화 프레임워크

본 논문에서 제시하는 최적화 프레임워크는 다음과 같은 핵심 요소들을 고려합니다:

**1. 구성 요소 선택 (Component Selection)**

Compound retrieval system의 첫 번째 단계는 사용할 retrieval 방법들을 선택하는 것입니다. 주요 옵션은:
- Sparse retrievers (BM25, SPLADE 등)
- Dense retrievers (DPR, Contriever, ColBERT 등)
- Rerankers (Cross-encoder, monoBERT 등)

각 구성 요소는 서로 다른 특성을 가지며, 일부는 lexical matching에 강하고, 다른 일부는 semantic similarity 포착에 우수합니다. 핵심은 이들 간의 complementarity(상보성)를 최대화하는 것입니다.

**2. 파이프라인 구조 설계**

검색 파이프라인의 구조는 성능과 효율성에 직접적인 영향을 미칩니다:
- **Sequential cascading**: 첫 단계에서 대량의 문서를 필터링하고, 이후 단계에서 정밀하게 재정렬
- **Parallel fusion**: 여러 retriever를 독립적으로 실행하고 결과를 융합
- **Hybrid approaches**: 위 두 방식의 조합

**3. 하이퍼파라미터 튜닝**

각 단계별로 최적화해야 할 주요 파라미터들:
- **Top-k values**: 각 retrieval 단계에서 유지할 문서 수
- **Fusion weights**: 여러 retriever의 결과를 결합할 때 각각에 부여할 가중치
- **Reranking depth**: Reranker가 처리할 후보 문서의 수

이러한 파라미터들은 서로 독립적이지 않으며, 한 파라미터의 최적값이 다른 파라미터의 설정에 따라 변할 수 있습니다.

### 실험 결과 및 인사이트

논문에서 수행한 광범위한 실험은 여러 중요한 발견을 제공합니다:

**성능 포화 현상 (Performance Saturation)**

일정 수준 이상으로 구성 요소를 추가하거나 파라미터를 증가시켜도 성능 향상이 미미해지는 지점이 존재합니다. 예를 들어, reranking depth를 100에서 1000으로 늘려도 성능 개선이 1% 미만인 경우가 많았습니다. 이는 프로덕션 환경에서 computational budget을 효율적으로 할당하는 데 중요한 시사점을 제공합니다.

**Retriever 다양성의 중요성**

단순히 많은 retriever를 사용하는 것보다, 서로 다른 특성을 가진 retriever를 조합하는 것이 더 효과적입니다. Lexical과 semantic retrieval을 결합하면 각각을 독립적으로 사용할 때보다 상당한 성능 향상을 보이지만, 유사한 특성의 dense retriever를 여러 개 추가하는 것은 제한적인 이득만을 제공합니다.

**Reranking의 전략적 배치**

Reranking 모델을 언제, 어디에 배치하느냐가 시스템 전체의 효율성을 결정합니다. 초기 단계에 너무 일찍 reranking을 적용하면 computational cost가 급증하고, 너무 늦게 적용하면 이미 관련 문서들이 필터링된 후일 수 있습니다. 실험 결과, 중간 규모(top-100~500)의 후보 집합에 reranking을 적용하는 것이 가장 효과적이었습니다.

### 최적화 알고리즘

논문은 compound retrieval system을 최적화하기 위한 체계적인 접근법을 제안합니다:

**1. Grid Search with Early Stopping**

모든 가능한 조합을 탐색하는 것은 비현실적이므로, 중요한 파라미터에 집중한 coarse-to-fine grid search를 수행합니다. 성능 개선이 정체되면 해당 방향의 탐색을 중단하여 효율성을 높입니다.

**2. Bayesian Optimization**

파라미터 공간이 연속적이거나 상호작용이 복잡한 경우, Bayesian optimization을 활용하여 적은 iteration으로 최적점에 근접할 수 있습니다.

**3. Multi-objective Optimization**

실무에서는 성능뿐만 아니라 latency, computational cost, memory usage 등 여러 목표를 동시에 고려해야 합니다. Pareto frontier를 활용하여 trade-off를 명확히 하고, 요구사항에 맞는 설정을 선택할 수 있습니다.

### 실무 적용 가이드라인

**도메인 특화 최적화**

일반적인 benchmark(MS MARCO, Natural Questions 등)에서 우수한 성능을 보인 설정이 특정 도메인(법률, 의료, 기술 문서 등)에서는 최적이 아닐 수 있습니다. 따라서:
- 타겟 도메인의 대표적인 쿼리 셋으로 validation을 수행
- 도메인 특화 retriever fine-tuning 고려
- 쿼리 길이, 문서 길이 등 데이터 특성에 맞춰 파라미터 조정

**점진적 개선 전략**

기존 시스템을 한 번에 교체하기보다는:
1. 현재 시스템을 baseline으로 설정하고 성능 측정
2. 가장 큰 bottleneck 식별 (낮은 recall, 부정확한 ranking 등)
3. 해당 문제를 해결할 구성 요소를 우선적으로 추가/개선
4. A/B 테스트를 통해 실제 사용자 만족도 검증

**모니터링 및 지속적 최적화**

프로덕션 환경에서는:
- 쿼리 분포의 변화 모니터링
- 구성 요소별 latency 및 성능 기여도 추적
- 정기적인 재최적화 스케줄 수립

### 한계점 및 향후 연구 방향

논문은 다음과 같은 한계점을 인정하고 향후 연구 방향을 제시합니다:

- **동적 최적화**: 현재 프레임워크는 정적 설정을 가정하지만, 쿼리 특성에 따라 동적으로 파이프라인을 조정하는 방법 연구 필요
- **자동화**: 최적화 과정의 자동화 수준을 높여 전문 지식 없이도 효과적인 시스템 구축 가능하도록 개선
- **신규 구성 요소 통합**: GPT-4 등 LLM 기반 reranking, generative retrieval 등 새로운 기법들을 프레임워크에 통합하는 방법 탐구

## References

- [Optimizing Compound Retrieval Systems (arXiv:2504.12063)](https://arxiv.org/pdf/2504.12063)
