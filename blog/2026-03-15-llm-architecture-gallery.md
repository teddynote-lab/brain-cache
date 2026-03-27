---
title: "LLM Architecture Gallery"
description: "Sebastian Raschka가 운영하는 LLM Architecture Gallery는 GPT-2부터 최신 Frontier 모델까지 주요 LLM들의 아키텍처를 시각화하여 비교할 수 있는 참고 자료입니다. 각 모델의 파라미터 규모, 컨텍스트 길이, 어텐션 메커니즘, 디"
slug: llm-architecture-gallery
date: 2026-03-15
authors: [jaehun]
tags:
  - llm
  - architecture
  - reference
source_url: "https://sebastianraschka.com/llm-architecture-gallery/"
---


# LLM Architecture Gallery

## TL;DR
> Sebastian Raschka가 운영하는 LLM Architecture Gallery는 GPT-2부터 최신 Frontier 모델까지 주요 LLM들의 아키텍처를 시각화하여 비교할 수 있는 참고 자료입니다. 각 모델의 파라미터 규모, 컨텍스트 길이, 어텐션 메커니즘, 디코더 타입 등 핵심 사양을 한눈에 파악할 수 있으며, GPT-2의 기본 Dense 구조부터 DeepSeek V3의 MoE, xLSTM 등 다양한 아키텍처 진화를 추적할 수 있습니다. AI Research Engineer가 문제 상황에 맞는 적절한 모델 선택과 아키텍처 설계 인사이트를 얻을 수 있는 실무 레퍼런스입니다.

## Key Takeaways
- **아키텍처 진화 추적**: GPT-2(1.5B, MHA)부터 최신 Frontier 모델(DeepSeek V3 671B, Llama 4 400B 등)까지 디코더 구조, 어텐션 메커니즘(MHA → GQA → MoE), 정규화 기법의 변화를 체계적으로 비교 가능
- **스케일별 설계 패턴**: 소형(1B-8B), 중형(24B-32B), 대형(120B-400B), 초대형(671B-1T) 파라미터 범위별로 서로 다른 아키텍처 선택(Dense vs MoE, Attention 전략)을 확인할 수 있어 프로젝트 요구사항에 맞는 모델 선택 기준 제공
- **기술적 디테일 확인**: 각 모델의 config.json, 라이선스, 컨텍스트 길이, 포지셔널 임베딩 방식(Absolute → RoPE), Key detail 등 실무 구현에 필요한 정보를 팩트시트로 제공
- **다양한 혁신 사례**: xLSTM(7B)처럼 Transformer 외 아키텍처, Linear Attention을 활용한 Kimi 시리즈, MoE 최적화를 보여주는 Qwen3/DeepSeek 계열 등 실험적 접근법 학습 가능
- **지속적 업데이트**: 2026년 3월까지 업데이트되며(최신 Mistral Large 3 673B, GLM-5 744B 등 포함) 물리적 포스터로도 제공되어 팀 학습 및 레퍼런스용으로 활용 가능

## 상세 내용

### LLM Architecture Gallery 소개

Sebastian Raschka 박사가 운영하는 [LLM Architecture Gallery](https://sebastianraschka.com/llm-architecture-gallery/)는 현대 대규모 언어모델들의 아키텍처를 체계적으로 정리한 시각적 참고 자료입니다. 이 갤러리는 그의 주요 아티클인 "The Big LLM Architecture Comparison", "From GPT-2 to gpt-oss", "From DeepSeek V3 to V3.2", "A Dream of Spring for Open-Weight LLMs" 등에서 다룬 아키텍처 다이어그램과 팩트시트를 한 곳에 모아놓은 것입니다.

Provider LLM(Frontier 급 모델)을 주로 사용하는 실무 환경에서도 각 모델의 내부 아키텍처를 이해하면 LLM 기반 문제에 더 유연하고 전략적으로 접근할 수 있습니다. 예를 들어 레이턴시가 중요한 상황에서는 Dense 모델을, 대규모 처리에는 MoE 구조를 선택하는 등의 의사결정이 가능해집니다.

### 베이스라인: GPT-2부터 시작하기

갤러리는 **GPT-2 XL (1.5B)** 을 Late-2019 dense baseline으로 포함하여, Transformer 디코더 스택이 GPT-2 이후 얼마나 변화했는지 비교할 수 있는 기준점을 제공합니다.

**GPT-2 XL 주요 사양:**
- **Scale**: 1.5B 파라미터
- **Context**: 1,024 토큰
- **Decoder type**: Dense
- **Attention**: MHA(Multi-Head Attention) with learned absolute positional embeddings
- **Key detail**: Dropout, GELU, LayerNorm을 사용한 클래식 GPT-2 레시피

이 기본 구조를 이해하면 이후 모델들이 어떤 방향으로 최적화되었는지(GQA 도입, RoPE 사용, Pre-norm 전환 등) 명확히 파악할 수 있습니다.

### 주요 모델 아키텍처 비교

#### Llama 계열의 진화

**Llama 3 (8B)**는 GPT-2 대비 진화된 Reference dense stack을 보여줍니다:
- **Attention**: GQA(Grouped Query Attention) with RoPE
- **Context**: 8,192 토큰 (GPT-2의 8배)
- **Key detail**: Pre-norm 구조로 학습 안정성 향상
- **License**: Llama 3 Community License

**Llama 3.2 (1B)**는 소형 모델 카테고리에서 Qwen 등과 비교되는 벤치마크를 제공하며, **Llama 4 Maverick (400B)**는 초대규모 모델의 최신 사례를 보여줍니다.

#### MoE 아키텍처: DeepSeek & Qwen

**DeepSeek V3 (671B)** 와 **V3.2**는 Mixture-of-Experts 구조를 활용한 효율적인 초대규모 모델의 대표 사례입니다:
- 전체 671B 파라미터를 가지면서도 실제 활성화되는 파라미터는 일부만 사용
- DeepSeek R1 (671B)는 Reasoning 능력을 강화한 변형

**Qwen3 계열**은 다양한 스케일에서 MoE를 적용:
- **Qwen3 (235B-A22B)**: 235B 총 파라미터, 22B 활성 파라미터
- **Qwen3 Next (80B-A3B)**: 더욱 aggressive한 sparsity
- **Qwen3 (32B), (8B), (4B)**: Dense 구조로 다양한 규모 지원

#### 극소형 모델: SmolLM & Nanbeige

**SmolLM3 (3B)** 와 **Gemma 3 (270M)** 같은 소형 모델들은 Edge 디바이스나 리소스 제약 환경에서 중요합니다. **Nanbeige 4.1 (3B)** 와 **Tiny Aya (3.35B)** 는 특정 언어나 도메인에 특화된 경량 옵션을 제공합니다.

#### 실험적 아키텍처: xLSTM

**xLSTM (7B)** 은 Transformer가 아닌 LSTM 기반 접근법으로, 장기 의존성 처리와 메모리 효율성에서 다른 관점을 제시합니다. 이는 Attention 메커니즘의 대안을 탐구하는 연구자들에게 중요한 레퍼런스가 됩니다.

#### 초대규모 모델들

1T(1조) 파라미터급 모델들도 포함되어 있습니다:
- **Kimi K2 (1T)**, **K2.5 (1T)**: Linear Attention 활용
- **Ling 2.5 (1T)**: 중국어 특화
- **GLM-5 (744B)**: 최신 초대규모 모델

이들은 주로 MoE 구조를 통해 실제 inference 비용을 관리하며, 각기 다른 최적화 전략을 보여줍니다.

### 핵심 기술 요소 비교

#### Attention 메커니즘 진화
1. **MHA** (Multi-Head Attention): GPT-2 시대 표준
2. **GQA** (Grouped Query Attention): Llama 3, OLMo 등에서 KV cache 효율화
3. **MoE**: DeepSeek, Qwen, Mistral Large 등에서 조건부 계산
4. **Linear Attention**: Kimi 시리즈에서 긴 컨텍스트 처리 최적화

#### 포지셔널 임베딩
- **Learned Absolute**: GPT-2
- **RoPE** (Rotary Position Embedding): 대부분의 현대 모델 표준

#### 정규화 전략
- **Post-norm**: 초기 Transformer
- **Pre-norm**: Llama, OLMo 등 현대 모델의 표준 (학습 안정성)

### 실무 활용 방법

1. **모델 선택 기준 수립**: 프로젝트의 레이턴시, 처리량, 메모리 제약에 따라 Dense(작은 규모, 예측 가능한 성능) vs MoE(큰 규모, 효율적 처리) 선택
2. **아키텍처 벤치마킹**: 유사 규모 모델들(예: 7B-8B Dense 그룹)의 설계 차이점 비교로 최적화 아이디어 도출
3. **라이선스 확인**: 각 팩트시트의 License 정보로 상업적 사용 가능 여부 즉시 파악
4. **구현 레퍼런스**: config.json 링크와 Tech report로 재현 가능한 구현 세부사항 확인
5. **팀 교육 자료**: Redbubble 포스터(Medium 사이즈: 26.9 x 23.4 inches 권장)를 활용한 오프라인 학습 환경 구축

### 지속적인 업데이트

갤러리는 2026년 3월 20일까지 업데이트되었으며, 새로운 모델이 출시될 때마다 지속적으로 추가됩니다. 부정확한 팩트시트나 링크 오류는 [Architecture Gallery issue tracker](https://github.com/rasbt/LLMs-from-scratch/issues)를 통해 제보할 수 있습니다.

최근 추가된 모델 예시:
- Mistral Large 3 (673B)
- GLM-4.7 (355B)
- Nemotron 3 Super (120B-A12B)
- Arcee AI Trinity Large (400B)
- Sarvam (30B, 105B)

### 학습 커뮤니티와 지속적 성장

Sebastian Raschka는 이 갤러리 외에도 "LLMs From Scratch" 코스, AI Newsletter, Reasoning Models 분석 등을 통해 LLM 생태계의 최신 지식을 공유하고 있습니다. LLM 아키텍처는 계속 진화하고 있으며, Frontier 모델을 사용하는 엔지니어도 내부 동작 원리를 이해함으로써 더 나은 프롬프트 엔지니어링, 파인튜닝 전략, 배포 최적화를 수행할 수 있습니다.

"다같이 평생 공부합시다"라는 원본 문서의 메시지처럼, 이 갤러리는 AI Research Engineer가 지속적으로 최신 아키텍처 트렌드를 따라가고 더 넓은 시각에서 LLM 기반 문제에 유연하게 대응할 수 있도록 돕는 살아있는 레퍼런스입니다.

## References
- [LLM Architecture Gallery - Sebastian Raschka](https://sebastianraschka.com/llm-architecture-gallery/)
- [Architecture Gallery Issue Tracker](https://github.com/rasbt/LLMs-from-scratch/issues)
- [LLM Architecture Gallery Poster - Redbubble](https://www.redbubble.com/)
- [Sebastian Raschka's Blog](https://sebastianraschka.com/blog)
