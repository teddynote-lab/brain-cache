---
title: "Multi Vector and Dataset Geometry"
description: "Multi-vector retrieval 알고리즘 선택은 **유사도 함수(MaxSim/SumSim/Top-K Sum)**와 **데이터 기하학(Isotropic/Anisotropic/Multi-Kernel)** 두 축에 의해 결정된다. PLAID는 moderate variance + MaxSim 조합에, MUVERA는 isotropic 데이터에 최적화되어 있"
slug: multi-vector-and-dataset-geometry
date: 2026-03-23
authors: [hank]
tags:
  - retrieval
  - insight
  - reference
source_url: "https://sam-herman.github.io/blogs/multivector-and-dataset-geometry.html"
---

# Multi Vector and Dataset Geometry

## TL;DR

> Multi-vector retrieval 알고리즘 선택은 **유사도 함수(MaxSim/SumSim/Top-K Sum)**와 **데이터 기하학(Isotropic/Anisotropic/Multi-Kernel)** 두 축에 의해 결정된다. PLAID는 moderate variance + MaxSim 조합에, MUVERA는 isotropic 데이터에 최적화되어 있으며 이 조건을 벗어나면 성능이 급격히 저하된다. 흥미롭게도 SumSim은 mean-pooling으로 단일 벡터 MIPS로 환원 가능하며, ColPali는 per-token HNSW + 이진화로 32배 압축하면서도 94% recall을 유지할 수 있다. 임베딩 모델 학습 시 variance/isotropy 정규화를 통해 인덱싱 친화적 기하학을 설계할 수 있다는 점이 핵심이다.

## Key Takeaways

- **알고리즘 선택 전 데이터 기하학 분석이 필수**: PLAID/MUVERA 도입 전에 intra-document variance와 anisotropy 정도를 정량화하라. 잘못된 조합은 centroid pruning 붕괴나 recall 저하를 초래한다.
- **SumSim은 특수 인프라가 불필요**: 내적의 bilinearity를 활용하면 mean-pooled 단일 벡터 MIPS로 환원되어 표준 HNSW/DiskANN으로 처리 가능하다.
- **ColPali의 고정 cardinality는 게임 체인저**: 1030개 고정 패치는 per-token HNSW + 이진화(32x 압축)로 효율적 처리가 가능하며, ~94% recall을 유지한다.
- **Contrastive learning이 기하학을 결정**: InfoNCE 손실의 온도 파라미터와 hard negative mining이 multi-kernel anisotropic 분포를 생성하며, 이것이 인덱싱 효율성에 직접 영향을 미친다.
- **모델 설계와 인덱싱은 독립적이지 않음**: 학습 단계에서 variance/isotropy 정규화를 통해 PLAID나 MUVERA에 최적화된 임베딩 분포를 유도할 수 있다. 이는 PoBE(Preference-Optimized Binary Embedding) 같은 접근에 직접 활용 가능하다.

## 상세 내용

### Multi-Vector Retrieval의 두 가지 핵심 축

전통적인 retrieval은 point-to-point MIPS(Maximum Inner Product Search)로 해결되지만, multi-vector retrieval은 본질적으로 **집합 대 집합(set-to-set)** 유사도 문제다. 각 문서와 쿼리는 단일 벡터가 아닌 임베딩 집합으로 표현된다: Q = {q₁, ..., qₘ}, P = {p₁, ..., pₙ}.

이 문제 공간은 두 개의 독립적인 축으로 분류할 수 있다:

1. **유사도 함수(Similarity Function)**: 두 집합 간 유사도를 계산하는 방법
2. **데이터 기하학(Dataset Geometry)**: 임베딩 공간 내 분포의 통계적 구조

대부분의 기존 논의는 MaxSim + ColBERT 스타일 분포라는 단일 조합에 집중되어 있으며, 이는 전체 문제 공간의 일부에 불과하다.

### 유사도 함수의 분류 체계

**MaxSim (Chamfer Similarity)**

ColBERT의 표준 접근법으로, 각 쿼리 토큰에 대해 가장 잘 매칭되는 문서 토큰을 찾아 합산한다:

```
sim_MaxSim(Q, P) = Σᵢ max_j ⟨qᵢ, pⱼ⟩
```

- **비대칭적**: 쿼리 토큰에 대해서만 합산 (문서→쿼리 방향은 고려하지 않음)
- **Fine-grained alignment**: 각 쿼리 토큰이 독립적으로 최적 매칭을 찾음
- **Winner-takes-all 특성**: 각 쿼리 토큰에 대해 단 하나의 문서 토큰만 기여

**SumSim (All-Pairs)**

모든 가능한 쿼리-문서 토큰 쌍의 유사도를 합산한다:

```
sim_SumSim(Q, P) = Σᵢ Σⱼ ⟨qᵢ, pⱼ⟩
```

- **대칭적**: 모든 토큰이 동등하게 기여
- **Cross-modal matching, group recommendation** 등에 사용
- PLAID의 pruning 전략과 근본적으로 비호환

**Top-K Sum**

각 쿼리 토큰에 대해 상위 k개 문서 토큰의 유사도를 합산:

```
sim_TopK(Q, P) = Σᵢ Σ(j∈TopK) ⟨qᵢ, pⱼ⟩
```

- MaxSim (k=1)과 SumSim (k=|P|) 사이의 중간 지대
- k 증가 시 PLAID의 centroid pruning 효율성 감소

**Symmetric Chamfer**

양방향 MaxSim의 평균:

```
sim_SymChamfer(Q, P) = 1/2 [sim_MaxSim(Q, P) + sim_MaxSim(P, Q)]
```

저자의 핵심 지적: 현재 multi-vector retrieval 담론은 MaxSim을 문제 자체와 동일시하고 있으며, 다른 유사도 함수들은 체계적으로 무시되고 있다.

### Dataset Geometry: 세 가지 기하학적 체제

임베딩 분포의 통계적 구조는 인덱싱 알고리즘의 성능을 근본적으로 결정한다.

**Gaussian Isotropic**

모든 방향에서 균일한 분산을 가진 분포:

```
v ~ N(μ, σ²I)
```

- 이론적 분석에서 자주 가정되지만 실제로는 드묾
- 랜덤 하이퍼플레인 기반 LSH가 이론적 보장을 제공하는 체제

**Gaussian Anisotropic**

방향에 따라 분산이 다른 분포:

```
v ~ N(μ, Σ), Σ ≠ σ²I
```

- 특정 방향(주성분)으로 데이터가 "늘어난" 형태
- SimHash 같은 각도 기반 해싱에 문제 발생

**Multi-Kernel Anisotropic**

여러 Gaussian 클러스터의 혼합, 각 클러스터가 비등방적:

```
v ~ Σₖ πₖ · N(μₖ, Σₖ)
```

- **실제 학습된 임베딩의 현실적 분포**
- ColBERTv2, ColPali 등이 이 체제에 속함
- Contrastive learning의 자연스러운 결과물

![](/img/blog/multi-vector-and-dataset-geometry/img-00-bf78cf325d.png)

*세 가지 기하학적 체제의 비교. 실제 multi-vector 임베딩은 Multi-Kernel Anisotropic 체제에 해당한다.*

### Contrastive Training이 만드는 기하학

ColBERT의 InfoNCE 손실 함수는 특정 기하학적 구조를 유도한다:

**온도 파라미터 τ의 역할**

```
L_InfoNCE = -log [exp(⟨q, p⁺⟩/τ) / Σᵢ exp(⟨q, pᵢ⟩/τ)]
```

- τ는 클러스터 tightness를 제어하는 파라미터
- 낮은 τ → 더 촘촘한 클러스터 (equi-angular 형태)
- 높은 τ → 더 넓게 퍼진 분포

**Hard Negative Mining의 영향**

의미적으로 유사하지만 관련 없는 문서(hard negatives)를 명시적으로 구분하도록 학습하면:

```
L_hard = -log [exp(⟨q, p⁺⟩/τ) / (exp(⟨q, p⁺⟩/τ) + λ·Σ exp(⟨q, p⁻_hard⟩/τ))]
```

- 클러스터 간 경계 방향으로 **방향성 늘어남(directional stretching)** 발생
- Within-kernel 공분산이 비구형(non-spherical)이 됨
- 결과적으로 multi-kernel anisotropic 분포 생성

**핵심 통찰**: 하나의 금융 문서 내에서도 토큰들은 여러 의미적 역할(전문 용어, 기능어, 맥락 수식어)을 수행하며, 각각이 임베딩 공간의 다른 영역(다른 커널)에 매핑된다.

### 기하학 정량화 지표

**Intra-document variance (문서 내 분산)**

```
σ²_intra(d) = 1/|P_d| Σᵢ ‖pᵢ - μ_d‖²
μ_d = 1/|P_d| Σᵢ pᵢ
```

- 높은 variance: 토큰들이 여러 의미 영역에 분산
- PLAID의 centroid pruning 효율성에 직접 영향

**Residual magnitude (잔차 크기)**

centroid 할당 후 잔차:

```
r_i = p_i - c_assigned(i)
```

- 큰 잔차: 양자화 시 재구성 노이즈 증가
- PLAID Stage 3의 신뢰도에 영향

![](/img/blog/multi-vector-and-dataset-geometry/img-01-a6d071b8ea.svg)

*문서별 intra-document variance 분포. ColPali 같은 vision 모델은 텍스트 모델보다 훨씬 높은 분산을 보인다.*

### PLAID의 기하학적 한계

PLAID는 3단계 파이프라인으로 작동한다:

1. **Centroid Pruning**: 쿼리 토큰과 관련 없는 centroid 제거
2. **Document Filtering**: 관련 centroid만 포함한 문서로 후보 축소
3. **Verification**: 압축된 표현으로 정확한 MaxSim 계산

**Centroid Pruning의 선택성 붕괴**

문서 d가 활성화하는 고유 centroid 수:

```
n_d = |{c_i : ∃p ∈ P_d, c_i = argmin_c ‖p - c‖}|
```

PLAID의 선택성(제거되는 문서 비율):

```
selectivity = 1 - (n_d · n_query) / (C · N_docs)
```

- **높은 σ²_intra** (예: ColPali) → n_d가 크게 증가
- C = 65,536인 경우, n_d가 수천 개로 증가하면 pruning이 거의 아무것도 제거하지 못함
- 결과: 거의 모든 문서가 Stage 2로 진입 → 계산 비용 급증

**SumSim에서의 PLAID 붕괴**

MaxSim의 "winner-takes-all" 특성:
- 각 쿼리 토큰에 대해 단 하나의 문서 토큰만 승리
- 비매칭 centroid는 max 연산에서 무시됨

SumSim의 "all-contribute" 특성:
- 모든 문서 토큰이 모든 쿼리 토큰에 기여
- Centroid pruning의 상한 기반 제거가 무의미해짐

PLAID Stage 2의 pruning 로직:

```
if max_i ⟨q_i, c_k⟩ < θ → centroid c_k 제거
```

이는 MaxSim에서만 유효하며, SumSim에서는:

```
contribution(c_k) = Σᵢ Σ(p∈cluster_k) ⟨qᵢ, p⟩
```

단일 쿼리 토큰과의 최대 유사도로 전체 기여를 상한할 수 없음.

**Quantization 품질과 Residual Magnitude**

ColBERTv2는 centroid ID + 2-bit 양자화 잔차로 압축:

```
재구성 오차: ‖p_i - (c_i + r_q)‖
MaxSim 근사 오차: |MaxSim_true - MaxSim_approx| ≤ Σᵢ ‖ε_i‖
```

MaxSim에서는 이것이 유효하지만, large residual을 가진 anisotropic 데이터에서는 2-bit 양자화가 significant noise를 도입한다.

![](/img/blog/multi-vector-and-dataset-geometry/img-02-9f27c38d72.svg)

*Residual magnitude 분포. 큰 잔차는 양자화 노이즈를 증가시켜 PLAID의 정확도를 저하시킨다.*

### MUVERA의 기하학적 한계

MUVERA는 SimHash 기반 파티셔닝으로 multi-vector 집합을 고정 차원 벡터(FDE)로 변환한다.

**SimHash와 Anisotropy의 불협화음**

b개의 랜덤 하이퍼플레인 {h₁, ..., h_b}를 사용. Isotropic 데이터에서 충돌 확률:

```
P_collision(u, v) = 1 - θ_uv/π
```

이는 각도만으로 결정되며, 균일 분포에서 이론적 보장이 성립한다.

그러나 **Anisotropic 데이터**에서는:

```
Σ = [σ₁² 0; 0 σ₂²], σ₁² >> σ₂²
```

주축(high variance 방향) u에 수직인 랜덤 하이퍼플레인이:
- ℓ₂ 거리에서 가까운 두 벡터를 다른 버킷으로 분리
- 유효 각도 θ_eff > θ_uv

![](/img/blog/multi-vector-and-dataset-geometry/img-03-d738da0c97.svg)

*Anisotropic 클러스터에서 SimHash의 문제. 주축에 수직인 하이퍼플레인이 가까운 이웃을 분리한다.*

**Over-Partitioning 문제**

올바른 충돌 확률:

```
P_collision^(b) = (1 - θ_eff/π)^b
```

b에 대해 지수적으로 감소하여, 큰 b (fine-grained FDE)는 nearest neighbor 쌍을 다른 파티션으로 분리할 확률이 높아진다.

**트레이드오프 딜레마**:
- **작은 b**: coarse FDE → 낮은 discrimination, 많은 false positive
- **큰 b**: fine-grained FDE → nearest neighbor 분리, recall 저하

Multi-kernel anisotropic 공간에서 elongated within-kernel 분포는 SimHash의 이론적 보장을 무효화한다.

### 실용적 해결책 #1: SumSim은 Mean-Pooling으로 충분하다

내적의 **bilinearity (쌍선형성)**를 활용한 핵심 증명:

```
sim_SumSim(Q, P) = Σᵢ Σⱼ ⟨qᵢ, pⱼ⟩
                 = Σᵢ Σⱼ qᵢᵀpⱼ
                 = (Σᵢ qᵢ)ᵀ (Σⱼ pⱼ)
                 = |Q| · |P| · ⟨μ_Q, μ_P⟩
```

여기서 μ_Q = (1/|Q|)Σᵢ qᵢ, μ_P = (1/|P|)Σⱼ pⱼ

![](/img/blog/multi-vector-and-dataset-geometry/img-04-e63d5f100e.svg)

*SumSim이 mean-pooled 벡터 간 단일 내적으로 환원되는 과정.*

**실무 함의**:
- SumSim 기반 retrieval (aggregate affinity, group recommendation, cross-modal matching)
- Mean-pooled representation을 **오프라인 계산**
- 표준 ANN 시스템으로 인덱싱: **HNSW, DiskANN, ScaNN**
- PLAID도, MUVERA도, 커스텀 인프라도 불필요

**코드 예시**:

```python
# Multi-vector 대신 단일 벡터로 변환
doc_embedding_pooled = doc_embeddings.mean(dim=0)
query_embedding_pooled = query_embeddings.mean(dim=0)

# 표준 HNSW 인덱스 사용
index = hnswlib.Index(space='ip', dim=embedding_dim)
index.add_items(doc_embeddings_pooled)
results = index.knn_query(query_embedding_pooled, k=10)

# 필요 시 full multi-vector로 re-rank
for doc_id in results:
    exact_score = compute_sumsim(query_embeddings, doc_embeddings[doc_id])
```

### 실용적 해결책 #2: ColPali의 고정 Cardinality 활용

ColPali는 ColBERT와 근본적으로 다른 특성을 가진다:
- **ColBERT**: 텍스트 길이에 따라 가변적인 토큰 수 (50~500+)
- **ColPali**: 페이지당 **정확히 1030개** 임베딩 (1024 image patches + 6 instruction tokens)

이 고정 cardinality는 완전히 다른 최적화 전략을 가능하게 한다.

**Vespa의 Per-Token Nearest Neighbor 접근**

```
Phase 0 (Pre-filtering):
  각 쿼리 토큰 qᵢ에 대해:
    - 이진화 임베딩으로 Hamming 거리 계산
    - k₀개 nearest page-patch 검색
    - 해당 페이지들의 union 생성

Phase 1 (Approximate MaxSim):
  생존 페이지들을 inverted Hamming distance로 스코어링
  상위 k₁개 유지

Phase 2 (Exact MaxSim):
  상위 k₁개를 full-precision float MaxSim으로 re-rank
```

![](/img/blog/multi-vector-and-dataset-geometry/img-05-886caca040.svg)

*Vespa 스타일 ColPali 검색 워크플로우. 이진화 + per-token HNSW + 단계적 reranking.*

**저장 비용 비교** (10억 페이지 기준):

| 구성 | 페이지당 저장량 | 총 저장량 | Phase 0 Recall |
|------|----------------|-----------|----------------|
| ColPali float32 | 526 KB | ~526 TB | 100% |
| ColPali bfloat16 | 263 KB | ~263 TB | ~99% |
| **ColPali binarized** | **16.5 KB** | **~16.5 TB** | **~94%** |
| Centroid index (k=30) | 7.7 KB | ~7.7 TB | variable |

**32배 압축 + 최소 recall 손실**이 핵심이다.

**이진화 구현**:

```python
def binarize_embeddings(embeddings):
    """각 차원을 평균 기준으로 이진화"""
    threshold = embeddings.mean(dim=-1, keepdim=True)
    binary = (embeddings > threshold).to(torch.uint8)
    # 128 dim → 16 bytes
    return torch.packbits(binary, dim=-1)

def hamming_distance(binary1, binary2):
    """Hamming 거리 계산"""
    xor = binary1 ^ binary2
    return torch.popcnt(xor).sum()

# Per-token HNSW 인덱스
per_token_index = [
    hnswlib.Index(space='hamming', dim=16)  # 16 bytes
    for _ in range(1030)  # 각 패치 위치별 인덱스
]

# Phase 0: Per-token nearest neighbor
candidate_pages = set()
for query_token in query_embeddings:
    binary_query = binarize_embeddings(query_token)
    for token_idx, index in enumerate(per_token_index):
        nearest = index.knn_query(binary_query, k=100)
        candidate_pages.update(nearest)

# Phase 1: Approximate MaxSim with binary
# Phase 2: Exact MaxSim with float32
```

### 의사결정 프레임워크

| 유사도 함수 | 데이터 기하학 | 권장 접근법 | 핵심 고려사항 |
|------------|-------------|-----------|-------------|
| **SumSim** | Any | Mean-pool → 표준 HNSW | Multi-vector 인프라 완전 불필요 |
| **MaxSim** | Multi-kernel, moderate σ²_intra | PLAID | MS MARCO 스케일에서 검증됨 |
| **MaxSim** | Multi-kernel, high σ²_intra | PLAID + large codebook | Stage-2 selectivity 실증 검증 필요 |
| **MaxSim** | Any | MUVERA + re-rank | Recall 검증 필수, b 신중 조정 |
| **Top-K Sum** | Multi-kernel | 커스텀 파이프라인 | PLAID pruning 직접 적용 불가 |
| **MaxSim (ColPali)** | High variance, fixed cardinality | Per-token HNSW + 이진화 | 32x 압축, ~94% recall |
| **MaxSim (소규모)** | <10M 문서 | Brute-force float MaxSim | 특수 인프라 불필요 |

**실무 체크리스트**:

1. **데이터 기하학 먼저 분석**:
   ```python
   # Intra-document variance 측정
   for doc in corpus:
       embeddings = model.encode(doc)
       variance = embeddings.var(dim=0).mean()
       print(f"σ²_intra = {variance:.4f}")
   
   # Anisotropy 측정 (주성분 분산 비율)
   pca = PCA()
   pca.fit(all_embeddings)
   explained_variance_ratio = pca.explained_variance_ratio_
   anisotropy = explained_variance_ratio[0] / explained_variance_ratio[-1]
   ```

2. **유사도 함수 확인**: MaxSim이 정말 필요한가? SumSim으로 충분하지 않은가?

3. **스케일 고려**: 10M 문서 미만이면 brute-force도 실용적

4. **고정 cardinality 여부**: ColPali 같은 경우 per-token 접근 고려

### Embedding Model 설계 시사점

저자의 가장 중요한 통찰: **학습 단계에서 인덱싱 친화적 기하학을 유도할 수 있다**.

**Intra-document Variance 정규화 (PLAID 최적화)**

```python
def variance_regularization_loss(embeddings, target_variance):
    """문서 내 분산을 목표값으로 정규화"""
    doc_variance = embeddings.var(dim=0).mean()
    return (doc_variance - target_variance) ** 2

# 전체 손실에 추가
total_loss = info_nce_loss + λ_var * variance_reg_loss
```

σ²_target을 codebook 크기에서 좋은 PLAID selectivity를 보이는 값으로 설정하면, **인덱싱 효율성을 모델에 내재화**할 수 있다.

**Within-kernel Isotropy 정규화 (MUVERA 최적화)**

```python
def isotropy_regularization_loss(embeddings, cluster_assignments):
    """각 클러스터 내에서 등방성 유도"""
    loss = 0
    for cluster_id in unique(cluster_assignments):
        cluster_embeds = embeddings[cluster_assignments == cluster_id]
        cov_matrix = torch.cov(cluster_embeds.T)
        eigenvalues = torch.linalg.eigvalsh(cov_matrix)
        # 고유값 분산 최소화 → 구형 클러스터
        loss += eigenvalues.var()
    return loss
```

더 둥근 클러스터 형태를 유도하여 랜덤 하이퍼플레인 파티셔닝과의 호환성 향상.

**PoBE(Preference-Optimized Binary Embedding)에의 적용**:

```python
class GeometryAwareBinaryEmbedding(nn.Module):
    def forward(self, x):
        # 표준 임베딩
        embeddings = self.encoder(x)
        
        # Variance 정규화 (PLAID용)
        var_loss = variance_reg(embeddings, target=0.15)
        
        # Isotropy 정규화 (이진화 친화적)
        iso_loss = isotropy_reg(embeddings, self.clusters)
        
        # 이진화
        binary_embeds = torch.sign(embeddings - embeddings.mean())
        
        return binary_embeds, var_loss + iso_loss
```

**핵심 메시지**: 임베딩 모델 설계와 인덱싱 인프라는 독립적 선택이 아니다. 모델이 학습하는 기하학이 인덱스 성능을 직접 결정하며, 그 기하학에 대한 제어는 일반적으로 인식되는 것보다 훨씬 크다.

### 열린 연구 질문

**Geometry-Aware Hashing**

랜덤 하이퍼플레인 대신 실제 공분산 구조 기반 파티셔닝:
- k-means LSH: 주성분 방향으로 파티션
- Learned hashing: 데이터 분포를 직접 학습

**Visual Retrieval의 적절한 유사도 함수**

ColPali가 MaxSim을 사용하는 것은 ColBERT로부터의 관성일 수 있음:
- 이미지 패치 간 유사도에는 다른 aggregation이 더 적절할 수 있음
- Spatial pooling, attention-weighted sum 등의 대안 탐구 필요

**모델 스케일에 따른 기하학 변화**

더 큰 모델이 더 isotropic한 임베딩을 생성하는가?
- 표현력 증가가 clustering 구조를 어떻게 변화시키는가?
- 인덱싱 친화도와
