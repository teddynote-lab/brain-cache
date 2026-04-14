---
title: "Multi Vector and Dataset Geometry"
description: "Multi-vector retrieval 알고리즘(PLAID, MUVERA)은 특정 유사도 함수(MaxSim)와 특정 데이터 기하학(multi-kernel anisotropic, moderate variance)에 최적화되어 있으며, 이 조건이 벗어나면 성능 보장이 무"
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
> Multi-vector retrieval 알고리즘(PLAID, MUVERA)은 특정 유사도 함수(MaxSim)와 특정 데이터 기하학(multi-kernel anisotropic, moderate variance)에 최적화되어 있으며, 이 조건이 벗어나면 성능 보장이 무너진다. 본 글은 유사도 함수(MaxSim, SumSim, Top-K Sum)와 데이터 기하학(Isotropic, Anisotropic, Multi-Kernel) 두 축으로 multi-vector retrieval 문제를 분류하는 프레임워크를 제시한다. 특히 SumSim은 mean-pooled MIPS로 단순화할 수 있고, ColPali는 per-token HNSW + 이진화로 효율적 처리가 가능하다는 실용적 해결책을 제시하며, 모델 학습 단계에서 variance/isotropy 정규화를 통해 인덱싱 친화적 기하학을 유도할 수 있음을 보인다.

## Key Takeaways
- **알고리즘 선택 전 데이터 기하학 분석이 필수**: PLAID는 moderate intra-document variance에서만 효과적이고, MUVERA는 isotropic 데이터에 최적화되어 있어, 자신의 데이터가 어떤 기하학적 체제(Isotropic/Anisotropic/Multi-Kernel)에 속하는지 먼저 파악해야 한다.
- **SumSim은 특수 인프라 불필요**: 내적의 bilinearity 성질로 인해 SumSim(∑∑⟨q_i, p_j⟩)은 mean-pooled 벡터 간 MIPS(⟨q̄, p̄⟩)와 수학적으로 동치이므로, 표준 HNSW 인덱스로 충분하다.
- **ColPali의 고정 토큰 수는 기회**: 1030개 고정 patch를 per-token HNSW로 인덱싱하고 이진 임베딩(32x 압축)을 사용하면 ~94% recall을 유지하면서 대규모 처리가 가능하다.
- **학습 단계에서 기하학 제어 가능**: Variance 정규화 손실이나 isotropy 유도 기법을 통해 모델 학습 시 인덱싱 친화적인 임베딩 분포를 설계할 수 있으며, 이는 PoBE(Position-aware Binary Embedding) 같은 최적화 기법에 직접 활용 가능하다.
- **Contrastive learning이 multi-kernel 분포를 만든다**: InfoNCE 손실의 온도 파라미터와 hard negative mining이 결합되어 equi-angular cluster와 방향성 stretching을 동시에 발생시켜, 실제 multi-vector 임베딩이 multi-kernel anisotropic 분포를 갖게 된다.

## 상세 내용

### Multi-Vector Retrieval의 두 축: 유사도 함수와 데이터 기하학

기존 multi-vector retrieval 논의는 ColBERT의 MaxSim을 중심으로 전개되어 왔지만, 이는 훨씬 넓은 문제 공간의 특수 케이스에 불과하다. Multi-vector retrieval 문제를 제대로 이해하려면 두 개의 독립적인 축을 고려해야 한다.

**첫 번째 축: Set-to-Set Similarity Function**

표준 retrieval이 point-to-point MIPS를 사용한다면, multi-vector retrieval은 **집합 대 집합** 유사도로 일반화된다. 각 엔티티는 임베딩 집합 Q = {q₁, ..., qₘ}, P = {p₁, ..., pₙ}으로 표현되며, 주요 유사도 함수는 다음과 같다:

**MaxSim (Chamfer Similarity)**
```
sim(Q, P) = (1/|Q|) ∑ᵢ max_j ⟨qᵢ, pⱼ⟩
```
- ColBERT의 표준 함수
- 각 쿼리 토큰에 대해 가장 잘 매칭되는 문서 토큰을 찾아 합산
- 비대칭적이며 fine-grained token alignment를 허용

**SumSim (All-Pairs)**
```
sim(Q, P) = ∑ᵢ ∑ⱼ ⟨qᵢ, pⱼ⟩
```
- 모든 쌍의 유사도를 합산
- Cross-modal matching, group recommendation 등에 사용

**Top-K Sum**
```
sim(Q, P) = (1/|Q|) ∑ᵢ ∑ⱼ∈Top-k(qᵢ,P) ⟨qᵢ, pⱼ⟩
```
- 각 쿼리 토큰에 대해 상위 k개 문서 유사도를 합산
- MaxSim(k=1)과 SumSim(k=|P|)의 일반화

**두 번째 축: Dataset Geometry**

임베딩 분포의 통계적 구조는 알고리즘 성능에 결정적 영향을 미친다:

| 체제 | 특성 | 예시 |
|------|------|------|
| **Gaussian Isotropic** | 모든 방향에서 균일한 분산 (Σ = σ²I) | 이론적 벤치마크 |
| **Gaussian Anisotropic** | 방향별 분산 상이 (Σ ≠ σ²I) | PCA 후 압축된 임베딩 |
| **Multi-Kernel Anisotropic** | 여러 클러스터 + 각 클러스터 내 방향성 | ColBERTv2, Jina-ColBERT |

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/b5fbd24d-5616-437a-8898-591f694d3ee6/geometry-comparison.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4666Z2KLP2L%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T063525Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIAPyhitEjtnIpS42DGZk01lztfPPFYOwT1Pi8IxwxmMKAiEAlYyAhfOK2xFU7CqTBjB8tbulAqC67Iy%2FjEOBDeZ1rdYqiAQIp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDNwFFssKjd9GgBrOnircA2vHjwwbEoTzqBqdeTx3bNSsffKzHp9nOv72xan%2B1%2F%2B5gRIGBYBu2w6%2FaSFFnoWgRsymo6rdZYBqG98hAsp9JcvLzRH%2BVVnS0ficIhhFiRKlpJBdmkRiwcTbV3N%2FCZQY1tt5Ckoe1SWkod1lHzLKl6jaM75cehySuHHHX7gvzk2c3AflPIdLOrqoCzdMqWxcAmXq9TxWYKB%2BTw3sGv%2BzovbqKDQvfwHGx0bSOqigQh1Az9vwzEVOeolwPubyj3R1SiaGhr%2FjMcVfUyIMYqtLZznf5krljeSiiBiUNPd1YesA3GTMEM5hKk%2FcZCN%2F69MzWx5%2BwlhMLc8z84uGa7W6ND%2FdrQGL3bBHB%2B52Ew3X%2Bxv%2BU8J36eccr4Le0ZUH1jMCQw5uOFgVGePuYzCrjrsdghuT00o4rlIbbaVl0aEjb1UqekWFt0w%2B3CCHLTfXbzK%2BeCtOP2VgnUmEJDzUVMZEsLP%2B5ReEkQrCJ8oT0GqxLA2tUDp26eGvg%2FTboCtpn%2B0CqPxn4g%2F4rCL8nEG%2BBi%2FahMd1YYhbDys8oQopAKZhji4h%2BB3LAhduXR9m512d5s9kOWDr%2FfUrv5sau896AQqAtKFPi7zkeO9RIlF61rFXI5qiJpMh%2BXHW%2BuziO3NLMLv9jc4GOqUBwC0W7vh6DgIgPcpmK8rymsxsKyHcVgHWXMbbqA5Rcy5d4WD4umAOy7rj0373%2B9S2ZqaLH9HDqXhuYoRd%2BCS%2BQoSsrWHvmC%2FDIATVGSxp%2B%2FXMYbp853DOdFf8%2Fg%2BoktKCSgbj2VegmGukM%2FpcrYxSyK1lerAJOXVtn1TnmICCVvjI1gmMRGAHcYCtlwwQZUJkqFI2ljZQPP36QN%2Bvqry5L8aPIACm&X-Amz-Signature=6e9ed4847c20f55158edc4df7694337f671a43242cdd6ee53a493acedff74911&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

**Contrastive Learning이 Multi-Kernel 분포를 만드는 메커니즘**

ColBERT의 InfoNCE 손실 함수가 multi-kernel anisotropic 분포를 생성하는 과정:

```
L = -log(exp(sim(q,p⁺)/τ) / (exp(sim(q,p⁺)/τ) + ∑exp(sim(q,p⁻)/τ)))
```

- **온도 τ**: 클러스터 tightness 파라미터 — equi-angular cluster 형성
- **Hard negative mining**: 의미적으로 유사하지만 관련 없는 문서를 표면화 → 방향성 stretching → 비구형 within-kernel 공분산 생성

예를 들어 금융 파생상품 문서 내에서도 토큰들은 여러 의미적 역할(금융 용어, 기능어, 맥락 수식어)을 수행하며, 각각 임베딩 공간의 다른 영역(다른 커널)에 매핑된다.

**기하학 정량화 지표**

실제 데이터의 기하학을 측정하는 두 가지 핵심 지표:

**Intra-document variance** — 문서 내 토큰들의 분산:
```
σ²ᵢₙₜᵣₐ = (1/|D|) ∑_d Var({pⱼ : pⱼ ∈ d})
```

**Residual magnitude** — centroid 할당 후 잔차 크기:
```
r_res = ‖v - c_nearest‖₂
```

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/68a78cfa-6f97-41a3-9e63-b467494a8a6f/intra-doc-variance.svg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4666Z2KLP2L%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T063525Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIAPyhitEjtnIpS42DGZk01lztfPPFYOwT1Pi8IxwxmMKAiEAlYyAhfOK2xFU7CqTBjB8tbulAqC67Iy%2FjEOBDeZ1rdYqiAQIp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDNwFFssKjd9GgBrOnircA2vHjwwbEoTzqBqdeTx3bNSsffKzHp9nOv72xan%2B1%2F%2B5gRIGBYBu2w6%2FaSFFnoWgRsymo6rdZYBqG98hAsp9JcvLzRH%2BVVnS0ficIhhFiRKlpJBdmkRiwcTbV3N%2FCZQY1tt5Ckoe1SWkod1lHzLKl6jaM75cehySuHHHX7gvzk2c3AflPIdLOrqoCzdMqWxcAmXq9TxWYKB%2BTw3sGv%2BzovbqKDQvfwHGx0bSOqigQh1Az9vwzEVOeolwPubyj3R1SiaGhr%2FjMcVfUyIMYqtLZznf5krljeSiiBiUNPd1YesA3GTMEM5hKk%2FcZCN%2F69MzWx5%2BwlhMLc8z84uGa7W6ND%2FdrQGL3bBHB%2B52Ew3X%2Bxv%2BU8J36eccr4Le0ZUH1jMCQw5uOFgVGePuYzCrjrsdghuT00o4rlIbbaVl0aEjb1UqekWFt0w%2B3CCHLTfXbzK%2BeCtOP2VgnUmEJDzUVMZEsLP%2B5ReEkQrCJ8oT0GqxLA2tUDp26eGvg%2FTboCtpn%2B0CqPxn4g%2F4rCL8nEG%2BBi%2FahMd1YYhbDys8oQopAKZhji4h%2BB3LAhduXR9m512d5s9kOWDr%2FfUrv5sau896AQqAtKFPi7zkeO9RIlF61rFXI5qiJpMh%2BXHW%2BuziO3NLMLv9jc4GOqUBwC0W7vh6DgIgPcpmK8rymsxsKyHcVgHWXMbbqA5Rcy5d4WD4umAOy7rj0373%2B9S2ZqaLH9HDqXhuYoRd%2BCS%2BQoSsrWHvmC%2FDIATVGSxp%2B%2FXMYbp853DOdFf8%2Fg%2BoktKCSgbj2VegmGukM%2FpcrYxSyK1lerAJOXVtn1TnmICCVvjI1gmMRGAHcYCtlwwQZUJkqFI2ljZQPP36QN%2Bvqry5L8aPIACm&X-Amz-Signature=207925e3be7b1571943237d18ee999a85489f6e4a8b0710b1cb8bcfc16298a3e&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### PLAID의 기하학적 한계 분석

PLAID는 ColBERTv2를 위해 설계된 3단계 파이프라인이다:
1. **Centroid Pruning**: 쿼리 토큰과 가까운 centroid만 유지
2. **Document Filtering**: 활성 centroid를 포함하는 문서만 선택
3. **MaxSim Scoring**: 압축된 표현으로 최종 점수 계산

**Intra-Document Variance가 높을 때의 선택성 붕괴**

PLAID의 문서 선택성은 각 문서가 활성화하는 고유 centroid 수에 의존한다:
```
선택성 = (n_query × n_d) / (C × N)
```
- n_d: 문서 d의 토큰들이 할당된 고유 centroid 수
- C: codebook 크기
- n_query: 쿼리의 고유 centroid 수

σ²ᵢₙₜᵣₐ가 높으면 (예: ColPali의 복잡한 문서 페이지) → n_d 크게 증가 → centroid pruning이 거의 아무것도 제거하지 못함.

**ColPali 실험 결과**: 1030 patch를 가진 PDF 페이지에서 PLAID는 후보 문서의 95% 이상을 유지하여 실질적 pruning 효과가 사라졌다.

**Residual Magnitude와 Quantization 품질**

ColBERTv2의 압축: centroid ID + 양자화된 잔차 r_q. MaxSim 근사 오차의 상한:
```
|MaxSim(Q,P) - MaxSim_approx(Q,P)| ≤ m · max(‖r_q - r‖₂)
```

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/1f83e12d-c234-449b-b921-b694785652dc/residual-magnitude.svg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4666Z2KLP2L%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T063526Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIAPyhitEjtnIpS42DGZk01lztfPPFYOwT1Pi8IxwxmMKAiEAlYyAhfOK2xFU7CqTBjB8tbulAqC67Iy%2FjEOBDeZ1rdYqiAQIp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDNwFFssKjd9GgBrOnircA2vHjwwbEoTzqBqdeTx3bNSsffKzHp9nOv72xan%2B1%2F%2B5gRIGBYBu2w6%2FaSFFnoWgRsymo6rdZYBqG98hAsp9JcvLzRH%2BVVnS0ficIhhFiRKlpJBdmkRiwcTbV3N%2FCZQY1tt5Ckoe1SWkod1lHzLKl6jaM75cehySuHHHX7gvzk2c3AflPIdLOrqoCzdMqWxcAmXq9TxWYKB%2BTw3sGv%2BzovbqKDQvfwHGx0bSOqigQh1Az9vwzEVOeolwPubyj3R1SiaGhr%2FjMcVfUyIMYqtLZznf5krljeSiiBiUNPd1YesA3GTMEM5hKk%2FcZCN%2F69MzWx5%2BwlhMLc8z84uGa7W6ND%2FdrQGL3bBHB%2B52Ew3X%2Bxv%2BU8J36eccr4Le0ZUH1jMCQw5uOFgVGePuYzCrjrsdghuT00o4rlIbbaVl0aEjb1UqekWFt0w%2B3CCHLTfXbzK%2BeCtOP2VgnUmEJDzUVMZEsLP%2B5ReEkQrCJ8oT0GqxLA2tUDp26eGvg%2FTboCtpn%2B0CqPxn4g%2F4rCL8nEG%2BBi%2FahMd1YYhbDys8oQopAKZhji4h%2BB3LAhduXR9m512d5s9kOWDr%2FfUrv5sau896AQqAtKFPi7zkeO9RIlF61rFXI5qiJpMh%2BXHW%2BuziO3NLMLv9jc4GOqUBwC0W7vh6DgIgPcpmK8rymsxsKyHcVgHWXMbbqA5Rcy5d4WD4umAOy7rj0373%2B9S2ZqaLH9HDqXhuYoRd%2BCS%2BQoSsrWHvmC%2FDIATVGSxp%2B%2FXMYbp853DOdFf8%2Fg%2BoktKCSgbj2VegmGukM%2FpcrYxSyK1lerAJOXVtn1TnmICCVvjI1gmMRGAHcYCtlwwQZUJkqFI2ljZQPP36QN%2Bvqry5L8aPIACm&X-Amz-Signature=47fe25af9ef16c14ec92c76c46fdb94b5821448b9d268973d18a838ce5f2853e&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

**MaxSim에서는 유효**: max 연산으로 인해 비매칭 centroid는 승리하지 못하지만, 큰 잔차는 2-bit 양자화에서 재구성 노이즈를 증가시켜 Stage 3의 신뢰도를 저하시킨다.

**SumSim/Top-K Sum에서의 선택성 붕괴**

PLAID의 Stage 2 pruning은 MaxSim의 "winner takes all" 특성에 의존한다:
- **SumSim에서**: 모든 문서 토큰이 모든 쿼리 토큰에 기여 — centroid 기반 pruning 무효
- **Top-K Sum에서**: k 증가 시 기여 상한이 완화되어 pruning 이점 소멸

**PLAID 결론**: MaxSim scoring + multi-kernel anisotropic data + moderate intra-document variance + small residuals에 목적 설계됨. 어느 조건이든 실패하면 효율성이 저하된다.

### MUVERA의 기하학적 한계 분석

MUVERA는 SimHash 파티셔닝을 통해 multi-vector 집합을 고정 차원 벡터(FDE)로 변환하여 표준 단일 벡터 MIPS를 가능하게 한다.

**SimHash와 Anisotropy 문제**

b개의 랜덤 하이퍼플레인 {h₁, ..., hᵦ}을 사용. 두 벡터가 같은 파티션에 할당될 확률:
```
P(동일 파티션) = (1 - θ/π)^b
```

**Isotropic 데이터**: 랜덤 하이퍼플레인이 우수한 파티셔닝 전략
**Anisotropic 데이터**: 높은 분산 방향 u를 가진 공분산에서 ℓ₂ 거리가 가까운 두 벡터도 각도 분리가 커질 수 있음.

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/8a72f81d-477b-4469-90c1-e468d8b1d279/muvera-anisotropy.svg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4666Z2KLP2L%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T063526Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIAPyhitEjtnIpS42DGZk01lztfPPFYOwT1Pi8IxwxmMKAiEAlYyAhfOK2xFU7CqTBjB8tbulAqC67Iy%2FjEOBDeZ1rdYqiAQIp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDNwFFssKjd9GgBrOnircA2vHjwwbEoTzqBqdeTx3bNSsffKzHp9nOv72xan%2B1%2F%2B5gRIGBYBu2w6%2FaSFFnoWgRsymo6rdZYBqG98hAsp9JcvLzRH%2BVVnS0ficIhhFiRKlpJBdmkRiwcTbV3N%2FCZQY1tt5Ckoe1SWkod1lHzLKl6jaM75cehySuHHHX7gvzk2c3AflPIdLOrqoCzdMqWxcAmXq9TxWYKB%2BTw3sGv%2BzovbqKDQvfwHGx0bSOqigQh1Az9vwzEVOeolwPubyj3R1SiaGhr%2FjMcVfUyIMYqtLZznf5krljeSiiBiUNPd1YesA3GTMEM5hKk%2FcZCN%2F69MzWx5%2BwlhMLc8z84uGa7W6ND%
