---
title: "The Big LLM Architecture Comparison"
description: "DeepSeek V3는 2024년 말 등장한 이래 LLM 아키텍처의 새로운 방향을 제시했습니다. 7년 전 원조 GPT 이후 구조적으로는 크게 변하지 않았지만, Multi-Head Latent Attention(MLA)과 Mixture-of-Experts(MoE) 같은 "
slug: the-big-llm-architecture-comparison
date: 2026-01-05
authors: [braincrew]
tags:
  - llm
  - architecture
  - reference
source_url: "https://magazine.sebastianraschka.com/p/the-big-llm-architecture-comparison"
---


# The Big LLM Architecture Comparison

## TL;DR
> DeepSeek V3는 2024년 말 등장한 이래 LLM 아키텍처의 새로운 방향을 제시했습니다. 7년 전 원조 GPT 이후 구조적으로는 크게 변하지 않았지만, Multi-Head Latent Attention(MLA)과 Mixture-of-Experts(MoE) 같은 효율성 중심의 혁신이 주목받고 있습니다. 단순한 성능 향상보다는 계산 효율성과 확장성을 개선하는 아키텍처 설계가 2025년 LLM 개발의 핵심 트렌드입니다. 이 글은 최신 오픈 모델들의 구조적 발전을 비교 분석하여, AI Research Engineer가 알아야 할 아키텍처 변화의 실체를 살펴봅니다.

## Key Takeaways
- **점진적 개선이 주류**: GPT-2(2019)부터 Llama 4, DeepSeek V3(2024-2025)까지 기본 트랜스포머 구조는 유사하며, 주요 변화는 RoPE, Grouped-Query Attention, SwiGLU 등 효율성 개선에 집중
- **계산 효율성이 핵심 차별화 요소**: DeepSeek V3의 Multi-Head Latent Attention(MLA)과 MoE 구조는 추론 시 KV 캐시 메모리를 줄이고, 활성화되는 파라미터를 제한하여 효율성 극대화
- **벤치마크보다 구조 이해가 중요**: 데이터셋, 학습 기법, 하이퍼파라미터가 공개되지 않는 경우가 많아 성능 비교는 어렵지만, 아키텍처 자체의 설계 철학을 이해하는 것이 실무 적용에 더 유용
- **멀티모달은 별도 논의 필요**: 최신 모델들의 멀티모달 기능은 텍스트 능력과 분리하여 평가해야 하며, 이 글은 텍스트 아키텍처에 집중
- **오픈 모델 중심의 생태계**: 2025년 현재 DeepSeek, Llama, GLM 등 주요 오픈 모델들의 아키텍처 공개가 활발하며, 이들의 설계 선택을 비교하는 것이 실무 인사이트 획득에 유리

## 상세 내용

### 2025년 LLM 아키텍처의 현주소

원조 GPT 아키텍처가 개발된 지 7년이 지났습니다. GPT-2(2019)를 돌아보고 DeepSeek V3, Llama 4(2024-2025)를 전망하면, 이들이 구조적으로 여전히 매우 유사하다는 점에 놀랄 수 있습니다. 

물론 변화는 있었습니다:
- **Positional Embeddings**: 절대 위치 인코딩에서 Rotational Positional Embedding(RoPE)로 진화
- **Attention 메커니즘**: Multi-Head Attention이 Grouped-Query Attention으로 대체
- **활성화 함수**: GELU 대신 더 효율적인 SwiGLU 채택

하지만 이러한 개선들은 근본적인 혁신일까요, 아니면 동일한 아키텍처 기반을 세련되게 다듬은 것일까요?

LLM 간 비교는 본질적으로 어렵습니다. 데이터셋, 학습 기법, 하이퍼파라미터가 크게 다르고 제대로 문서화되지 않는 경우가 많기 때문입니다. 그럼에도 불구하고 아키텍처 구조 자체의 변화를 살펴보는 것은 2025년 LLM 개발자들이 어떤 방향으로 나아가고 있는지 이해하는 데 큰 가치가 있습니다.

이 글에서는 벤치마크 성능이나 학습 알고리즘보다는, 현재 주요 오픈 모델들을 정의하는 아키텍처 발전에 집중합니다. (참고로 멀티모달 LLM은 별도로 다룬 바 있으며, 이번 글에서는 최신 모델들의 텍스트 능력에 초점을 맞추고 멀티모달 논의는 다음 기회로 미룹니다.)

### DeepSeek V3/R1: 효율성 중심의 아키텍처 혁신

2025년 1월 출시된 DeepSeek R1은 큰 반향을 일으켰습니다. DeepSeek R1은 2024년 12월 소개된 DeepSeek V3 아키텍처를 기반으로 한 추론(reasoning) 모델입니다. 비록 2024년에 출시되었지만, DeepSeek V3가 널리 주목받고 채택된 것은 2025년 DeepSeek R1 출시 이후이므로 포함하는 것이 합리적입니다.

DeepSeek V3에서 도입된 두 가지 핵심 아키텍처 기법은 계산 효율성을 크게 개선했으며, 다른 많은 LLM과 차별화됩니다:

#### 1.1 Multi-Head Latent Attention (MLA)

Multi-Head Latent Attention은 기존 Multi-Head Attention의 메모리 효율성 문제를 해결하기 위해 설계되었습니다. 전통적인 어텐션 메커니즘에서는 각 헤드가 독립적인 Key와 Value를 유지해야 하므로, 긴 시퀀스 처리 시 KV 캐시가 메모리 병목이 됩니다.

MLA는 저차원 latent 표현을 활용하여 이 문제를 완화합니다:
- 각 헤드의 Key/Value를 공유 가능한 압축된 표현으로 변환
- 추론 시 KV 캐시 메모리 요구량 대폭 감소
- 긴 컨텍스트 처리 능력 향상

이는 특히 실시간 추론이나 리소스 제약 환경에서 중요한 개선입니다.

#### 1.2 Mixture-of-Experts (MoE)

DeepSeek V3는 MoE 구조를 활용하여 모델 파라미터를 확장하면서도 실제 연산량은 제한합니다:
- 각 토큰은 전체 전문가(experts) 중 일부만 활성화
- 전체 파라미터는 크지만 활성 파라미터는 상대적으로 작음
- 학습과 추론 모두에서 효율성 향상

MoE는 2025년 현재 대규모 LLM의 표준 기법으로 자리잡았으며, 특히 오픈 소스 생태계에서 널리 채택되고 있습니다.

### 다른 주요 아키텍처 동향

이 글에서는 DeepSeek V3 외에도 GLM-5, Llama 4를 포함한 여러 최신 아키텍처들을 비교 분석합니다. 각 모델은 다음과 같은 특징을 가집니다:

- **공통점**: 트랜스포머 기본 구조 유지, RoPE 채택, 효율적 어텐션 메커니즘 사용
- **차이점**: MoE 구현 방식, 레이어 정규화 위치, FFN 설계, 특정 최적화 기법

모든 모델이 근본적으로 다른 패러다임을 제시하기보다는, 검증된 구조 위에서 특정 측면(효율성, 확장성, 특정 태스크 성능)을 개선하는 방향으로 발전하고 있습니다.

### 실무 적용을 위한 고려사항

AI Research Engineer로서 이러한 아키텍처 비교에서 얻어야 할 인사이트는:

1. **벤치마크만으로는 부족**: 공개된 성능 수치보다 아키텍처 설계 철학을 이해하고, 자신의 유스케이스에 맞는 트레이드오프 판단이 중요
2. **효율성이 새로운 경쟁력**: 단순 모델 크기보다 메모리 효율성, 추론 속도, 활성 파라미터 비율 같은 지표가 실무 배포의 핵심
3. **점진적 개선의 누적 효과**: 각각의 기법(RoPE, GQA, SwiGLU, MLA 등)은 작은 개선처럼 보이지만, 결합하면 상당한 성능 향상
4. **오픈 소스 생태계 활용**: 주요 아키텍처들이 오픈되면서 실험과 커스터마이징이 용이해졌으며, 이를 활용한 도메인 특화 모델 개발 가능

### 결론

2025년 LLM 아키텍처는 혁명보다는 진화의 시기입니다. 트랜스포머라는 강력한 기반 위에서, 계산 효율성과 확장성을 극대화하는 세밀한 엔지니어링이 핵심입니다. DeepSeek V3의 MLA와 MoE는 이러한 트렌드를 대표하며, 앞으로도 유사한 방향의 개선이 계속될 것으로 예상됩니다.

실무에서는 최신 아키텍처의 벤치마크 순위보다, 각 설계 선택이 가져오는 실제 효과를 이해하고 자신의 문제에 적용하는 능력이 더욱 중요해질 것입니다.

## References
- [The Big LLM Architecture Comparison - Sebastian Raschka](https://magazine.sebastianraschka.com/p/the-big-llm-architecture-comparison)
- [Understanding Reasoning LLMs - Sebastian Raschka](https://magazine.sebastianraschka.com/p/understanding-reasoning-llms)
