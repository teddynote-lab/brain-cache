---
title: "SEISMIC: Learned Sparse Retrieval을 위한 효율적 역색인 구조"
description: "SIGIR 2024 논문 리뷰 — LSR 벡터의 Concentration of Importance를 활용하여 기존 대비 100배 이상 빠른 근사 검색을 달성하는 SEISMIC 알고리즘"
slug: seismic-efficient-inverted-indexes-for-approximate-retrieval-over-lsr
date: 2026-03-27
authors: [sungyeon]
tags:
  - retrieval
  - seminar
---

# SEISMIC: Learned Sparse Retrieval을 위한 효율적 역색인 구조

> **논문**: Bruch et al., *"Efficient Inverted Indexes for Approximate Retrieval over Learned Sparse Representations"*, SIGIR 2024 ([arXiv:2404.18812](https://arxiv.org/abs/2404.18812))

## TL;DR

> Splade 같은 Learned Sparse Representation(LSR) 모델은 해석 가능한 희소 벡터를 생성하지만, 기존 역색인(WAND/MaxScore)으로는 쿼리당 약 100ms가 걸려 실시간 서비스가 어렵습니다. SEISMIC은 LSR 벡터의 "소수 좌표에 L1 mass가 집중되는 현상"을 발견하고, 이를 활용한 Static Pruning + Geometric Blocking + Summary Vector 기반의 새로운 인덱스 구조를 제안하여, 95% 정확도에서 **303μs**(기존 대비 100\~330배 빠름)의 검색 속도를 달성합니다.

<!-- truncate -->

## 배경: LSR의 등장과 역색인의 한계

### Information Retrieval 파이프라인

First-stage Retrieval은 수백만\~수십억 문서에서 관련 후보를 밀리초 내에 추출하는 단계입니다. 이후 Cross-encoder 등의 Re-ranker가 정밀하게 재순위화합니다.

### Dense vs Sparse Retrieval

| 구분 | Dense (DPR, ColBERT) | Sparse (BM25, Splade) |
|------|---------------------|----------------------|
| 벡터 차원 | 768차원 실수 벡터 | 30,000차원 희소 벡터 |
| 인덱스 | HNSW, IVF 등 ANN | 역색인 (Inverted Index) |
| 장점 | 의미적 매칭 | 해석 가능성 |

**Learned Sparse Retrieval (LSR)** 은 두 장점을 결합합니다. BERT 기반 모델이 희소 벡터를 출력하되, 원래 쿼리에 없던 단어("paris" 등)도 활성화하여 어휘 불일치 문제를 해결합니다.

### 기존 역색인의 문제

BM25에서 잘 작동하는 Dynamic Pruning(WAND/MaxScore)이 LSR에서 실패하는 이유:

- **쿼리 길이**: BM25는 2\~5 단어, Splade는 약 43개 non-zero 좌표
- **리스트 분포**: Zipfian이 아닌 비교적 균일한 분포
- **가중치**: 정수가 아닌 실수값

결과적으로 최적화된 역색인 엔진(Pisa)에서도 Splade 검색에 쿼리당 약 100ms가 소요됩니다.

## 핵심 관찰: Concentration of Importance

논문의 핵심 발견은 LSR 벡터에서 **L1 mass가 소수의 좌표에 집중**된다는 것입니다.

- **쿼리**: 상위 10개 좌표 → 전체 L1 mass의 약 75%
- **문서**: 상위 50개 좌표 → 전체 L1 mass의 약 75%

이 성질을 **alpha-mass subvector**(L1 mass의 alpha 비율을 담는 최소 좌표 집합)로 정의하며, 양쪽에서 상위 좌표만 사용해도 inner product의 90\~98%가 보존됩니다.

이 관찰에서 세 가지 설계 원칙이 도출됩니다:

1. **Static Pruning** — 각 리스트에서 가중치 높은 문서만 유지
2. **Summary Vectors** — 블록의 상위 좌표만으로 빠른 상한 추정
3. **Query Truncation** — 쿼리의 상위 좌표만 순회

## SEISMIC 알고리즘

**S**pilled clustering of inverted lists with **E**fficient **I**ndexing and **S**ummaries for **M**aximum **I**nner product searc**C**h

Inverted Index(후보 문서 빠른 결정)와 Forward Index(정확한 IP 계산)를 결합한 구조입니다.

### Step 1: Static Pruning

각 posting list에서 가중치 기준 **상위 λ개 문서만 유지** (MS MARCO 기준 λ=6,000). Concentration of Importance에 의해 높은 가중치 문서가 IP에 가장 많이 기여하므로 정확도 손실이 미미합니다.

### Step 2: Geometric Blocking

Pruning 후 남은 각 리스트를 **β개 블록으로 K-Means 클러스터링** (β=400). 벡터가 유사한 문서끼리 묶어, Summary 벡터의 상한이 더 tight해집니다. 1-pass Shallow K-Means로 빠르게 수행합니다.

### Step 3: Summary Vectors

각 블록에서 좌표별 최대값을 취한 뒤, **alpha-mass subvector(상위 40% L1 mass)만 유지**하고 **8-bit scalar quantization**으로 메모리를 4배 절감합니다. 이 Summary는 conservative(상한)하므로 안전한 pruning이 가능합니다.

### Query Processing

1. 쿼리의 상위 `query_cut`개 좌표 선택
2. 각 좌표의 inverted list에서 블록 순회
3. Summary와 쿼리의 IP가 현재 top-k heap 최솟값 × `heap_factor`보다 크면 블록 방문
4. Forward Index에서 정확한 IP 계산 → heap 업데이트

`query_cut`과 `heap_factor` 두 파라미터로 동일 인덱스에서 다양한 정확도-속도 트레이드오프를 탐색할 수 있습니다.

## 실험 결과

### Accuracy vs Latency (MS MARCO, Splade)

| 방법 | 95% Accuracy 기준 Latency | SEISMIC 대비 |
|------|--------------------------|-------------|
| **SEISMIC** | **303 μs** | **1x** |
| PyAnn | 1,016 μs | 3.4x 느림 |
| GrassRMA (BigANN 2023 우승) | 1,271 μs | 4.2x 느림 |
| SparseIvf | 10,254 μs | 34x 느림 |
| Ioqp | 31,843 μs | 105x 느림 |
| Pisa (정확 검색) | 100,325 μs | 331x 느림 |

### Index Size & Build Time

| 방법 | 빌드 시간 | 인덱스 크기 |
|------|----------|------------|
| **SEISMIC** | **5분** | **2,500 MiB** |
| PyAnn | 45분 | - |
| GrassRMA | 120분 | 4,100 MiB |

## 직접 실험: 핵심 포인트

MS MARCO Splade 데이터셋으로 직접 실험한 결과:

- **Concentration of Importance 확인**: 쿼리 상위 10개 좌표 → 약 75% L1 mass (논문과 일치)
- **Sub-millisecond Latency**: 95% recall에서 약 300μs 달성
- **하이퍼파라미터 분석**: `query_cut` 증가 시 recall이 빠르게 수렴, `heap_factor`는 pruning 강도를 세밀하게 조절
- **MRR@10**: ground truth 대비 95% 이상의 검색 품질 유지

> 실험 코드: [seismic-experiment.ipynb](https://github.com/TusKANNy/seismic)

## 시사점

- Splade 등 LSR 모델의 **실시간 서비스 가능성**을 열었음
- E-Splade 같은 효율성을 위한 정확도 타협이 더 이상 불필요
- 기존 역색인 인프라 위에 구축 가능 (Rust 오픈소스 공개)
- Dense Retrieval의 ANN 인덱스(HNSW 등)에 대한 **Sparse 진영의 경쟁력 있는 대안**

## References

- Bruch et al., "Efficient Inverted Indexes for Approximate Retrieval over Learned Sparse Representations", SIGIR 2024
- [GitHub: TusKANNy/seismic](https://github.com/TusKANNy/seismic)
- [arXiv:2404.18812](https://arxiv.org/abs/2404.18812)
