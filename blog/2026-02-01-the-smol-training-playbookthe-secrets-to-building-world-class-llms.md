---
title: "The Smol Training Playbook:The Secrets to Building World-Class LLMs"
description: "Hugging Face가 공개한 400페이지 분량의 "
slug: the-smol-training-playbookthe-secrets-to-building-world-class-llms
date: 2026-02-01
authors: [sungyeon]
tags:
  - llm
  - reference
source_url: "https://www.linkedin.com/posts/dasol-kang-103a24217_%ED%97%88%EA%B9%85%ED%8E%98%EC%9D%B4%EC%8A%A4%EC%97%90%EC%84%9C-%EA%B3%B5%EA%B0%9C%ED%95%9C-smollm3%EC%9D%98-%ED%9B%88%EB%A0%A8-%EA%B3%BC%EC%A0%95%EC%9D%84-%EB%8B%B4%EC%9D%80-%EC%9B%8C%EB%93%9C-400%ED%8E%98%EC%9D%B4%EC%A7%80-ugcPost-7416382348100816897-q5b0?utm_medium=ios_app&rcm=ACoAADUFG24Bb3EOFIjRQ9eq__bxLKBZ22WbkuM&utm_source=social_share_send&utm_campaign=copy_link"
---


# The Smol Training Playbook:The Secrets to Building World-Class LLMs

## TL;DR
> Hugging Face가 공개한 400페이지 분량의 "The Smol Training Playbook"은 SmolLM3 훈련 과정을 통해 LLM 사전학습의 A-Z를 다룬 실무 가이드입니다. 아키텍처 설계, 데이터 큐레이션, 하이퍼파라미터 튜닝부터 GPU 클러스터 인프라 구축까지 전 과정을 포괄하며, 1T 토큰 훈련 후 재시작한 경험 등 실제 실패 사례와 디버깅 노하우를 솔직하게 공유합니다. 단순한 이론서가 아닌, 프로덕션 레벨의 LLM 훈련에 필요한 실전 지식을 체계적으로 정리한 필독서입니다.

## Key Takeaways
- **실패로부터 배우기**: 소규모 ablation 실험의 성공이 대규모 학습에서는 적용되지 않을 수 있으며, 1조 토큰 훈련 후에도 처음부터 재시작이 필요할 수 있다는 실전 경험 공유
- **모델 목적 우선**: "많은 훈련 프로젝트가 실패하는 이유는 잘못된 하이퍼파라미터나 버그가 아니라, 아무도 필요로 하지 않는 모델을 훈련하기로 결정했기 때문" - 사전학습 시작 전 명확한 목표 설정이 핵심
- **작은 변경도 검증 필수**: 겉보기에 무해한 라이브러리 업그레이드나 2줄짜리 코드 수정도 대규모 학습에서 예상치 못한 영향을 미칠 수 있어 철저한 테스트가 필요
- **다목적 균형 잡기**: 영어 성능, 다국어 지원, 수학, 코드 등 서로 경쟁하는 목표들 간의 trade-off를 실전에서 어떻게 조율하는지에 대한 구체적 사례 제공
- **인프라와 알고리즘의 통합 이해**: GPU 메모리 계층, NVLink, PCIe 등 하드웨어 개념과 병렬화 전략, 통신 최적화 등 소프트웨어 기법을 하나로 연결하여 이해하는 것이 대규모 학습 성공의 열쇠

## 상세 내용

### 프로젝트 개요: 실전 LLM 훈련의 종합 가이드

Hugging Face가 공개한 "The Smol Training Playbook"은 SmolLM3 모델의 실제 훈련 과정을 담은 400페이지 분량의 comprehensive 가이드입니다. 이 문서는 단순히 이론적 개념을 나열하는 것이 아니라, 실제 프로덕션 환경에서 마주친 문제들과 그 해결 과정을 솔직하게 공유한다는 점에서 큰 가치를 지닙니다.

한국어 번역본이 제공되어 국내 AI Research Engineer들이 보다 쉽게 접근할 수 있으며, 논문이나 블로그에 파편화되어 있던 지식들을 하나의 일관된 플레이북으로 통합한 것이 특징입니다.

### 사전학습 전략 수립: 시작하기 전 고려사항

#### 처음부터 학습이 필요한지 판단하기

문서는 가장 근본적인 질문부터 시작합니다: "정말 처음부터 사전학습이 필요한가?" 많은 프로젝트가 실패하는 이유는 기술적 역량의 부족이 아니라 잘못된 방향 설정에 있다는 통찰을 제공합니다. 

핵심은 **명확한 목표 설정**입니다. 기존 모델로 해결할 수 없는 specific한 요구사항이 무엇인지, 그것이 막대한 컴퓨팅 리소스 투자를 정당화할 만큼 중요한지를 먼저 검토해야 합니다.

#### 학습 프레임워크와 평가 방법론

적절한 학습 프레임워크 선택과 신뢰할 수 있는 평가 방법 설정은 프로젝트의 기초입니다. 체크포인트 관리, 모니터링, 평가 자동화 등 프로덕션 레벨의 운영 노하우가 초기 단계부터 필요합니다.

### 모델 아키텍처 설계: 기술 선택의 기준

#### Attention 메커니즘 비교

문서는 다양한 어텐션 메커니즘을 상세히 다룹니다:
- **MHA (Multi-Head Attention)**: 전통적 방식
- **GQA (Grouped Query Attention)**: 메모리 효율성과 성능의 균형
- **MQA (Multi-Query Attention)**: 추론 속도 최적화
- **MLA (Multi-Latent Attention)**: 최신 기법

각 방식의 trade-off를 이해하고, 모델의 목표(inference speed vs. 성능)에 따라 적절히 선택하는 것이 중요합니다.

#### Position Encoding과 기타 기법들

- **RoPE vs. NoPE**: Positional encoding 전략
- **IntraDoc Masking**: 문서 내 효율적 학습
- **SWA (Sliding Window Attention)**: 긴 컨텍스트 처리
- **MoE 및 하이브리드 모델**: 확장성과 효율성

#### 토크나이저 선택

토크나이저는 모델 성능에 직접적인 영향을 미치지만 종종 간과되는 요소입니다. 언어별 효율성, vocab size, 코드와 수식 처리 능력 등을 종합적으로 고려해야 합니다.

### 옵티마이저와 하이퍼파라미터 튜닝

학습률(learning rate), 배치 크기(batch size), 옵티마이저 선택은 학습 안정성과 최종 성능을 좌우합니다. 문서는 이러한 하이퍼파라미터 선택의 구체적 기준과 SmolLM3에서 실제로 적용한 값들을 제공합니다.

**작은 변경의 큰 영향**: 단 두 줄의 코드 수정이나 라이브러리 버전 업그레이드도 대규모 학습에서는 예상치 못한 결과를 초래할 수 있으므로, 모든 변경사항에 대한 철저한 테스트가 필수적입니다.

### 데이터 전략: 큐레이션과 혼합

#### 스케일링 법칙의 이해

데이터와 모델 크기의 관계를 규정하는 스케일링 법칙의 역사와 실전 적용 사례를 학습할 수 있습니다.

#### 데이터셋 큐레이션

효과적인 데이터 혼합(data mixture)은 모델 성능의 핵심입니다. SmolLM3는 다음 목표들 간의 균형을 맞춰야 했습니다:
- 강력한 영어 성능 유지
- 다국어 지원 확대
- 수학적 추론 능력
- 코드 생성 및 이해

이들은 서로 경쟁 관계에 있어, 하나를 강화하면 다른 영역이 약화될 수 있습니다. 문서는 이러한 trade-off를 어떻게 조율했는지 구체적으로 보여줍니다.

### 대규모 학습과 디버깅: 실패로부터 배우기

#### 1T 토큰 후 재시작 결정

가장 인상적인 부분은 1조 토큰 훈련 후 처음부터 다시 시작한 경험입니다. 소규모 ablation 실험에서는 유망했던 접근법이 대규모에서 효과적이지 않았던 이유와, 이를 조기에 발견하지 못한 원인을 분석합니다.

**실무 교훈**: 소규모 실험 결과를 과신하지 말고, 스케일업 과정에서 발생할 수 있는 emergent behavior를 항상 염두에 두어야 합니다.

#### SmolLM3 처리량 감소 문제

실제 학습 중 마주친 처리량(throughput) 감소 문제와 그 디버깅 과정을 상세히 다룹니다. 이러한 production issue 해결 경험은 논문에서는 찾아보기 어려운 귀중한 지식입니다.

### Post-Training: 모델을 실용적으로 만들기

#### 2025년의 포스트 트레이닝 전략

- **SFT (Supervised Fine-Tuning)**: 베이스라인 설정
- **DPO (Direct Preference Optimization)**: 인간 선호도 학습
- **GRPO**: 수학 성능 개선에 실제 적용

#### RL 적용 시점과 방법

강화학습(RL)을 언제, 어떻게 적용해야 하는지에 대한 practical guideline을 제공합니다. GRPO를 활용한 SmolLM3의 수학 성능 개선 사례는 구체적인 참고 자료가 됩니다.

### 인프라 구축: 하드웨어와 소프트웨어의 통합

#### GPU 클러스터 이해

실제 GPU 클러스터가 어떻게 작동하는지, CPU/GPU/노드/스토리지 간 통신 패턴이 무엇인지를 깊이 있게 다룹니다.

#### 하드웨어 계층 구조

- **GPU 메모리 계층**: HBM, L2 cache, register
- **NVLink**: GPU 간 고속 interconnect
- **PCIe**: CPU-GPU 통신
- **네트워크 토폴로지**: 노드 간 통신 최적화

#### 병렬화 전략

대규모 학습을 가능하게 하는 다양한 병렬화 기법들:
- Data Parallelism
- Tensor Parallelism  
- Pipeline Parallelism
- 하이브리드 접근법

#### 성능 병목 현상 해결

실제 인프라에서 발생하는 병목 지점을 식별하고 해결하는 방법론을 제시합니다. GPU 레이아웃, 통신 패턴 최적화 등 실무적 고민이 담겨 있습니다.

### 이 문서가 특별한 이유

1. **전체적 관점**: 아키텍처부터 인프라까지 사전학습의 전 과정을 하나로 연결
2. **솔직한 실패 공유**: 성공 사례뿐 아니라 실패와 재시작의 과정을 투명하게 공개
3. **실무 중심**: 논문에서 찾기 어려운 production-level 노하우와 디버깅 경험
4. **체계적 구성**: 파편화된 지식을 일관된 플레이북으로 통합

### 누구에게 추천하는가

- LLM 사전학습을 체계적으로 이해하고 싶은 엔지니어
- 대규모 훈련 프로젝트를 계획 중인 팀
- 하이퍼파라미터 튜닝과 아키텍처 선택 기준을 찾는 연구자
- GPU 클러스터 인프라 구축에 관심 있는 엔지니어
- 이론과 실무 사이의 간극을 메우고 싶은 모든 AI 실무자

## References
- [한국어 번역본 - WikiDocs](https://wikidocs.net/318788)
- [원문 - Hugging Face Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook)
- [SmolLM3 GitHub Repository](https://github.com/huggingface/smollm)
- [원본 LinkedIn 포스트 by Dasol Kang](https://www.linkedin.com/posts/dasol-kang-103a24217_허깅페이스에서-공개한-smollm3의-훈련-과정을-담은-워드-400페이지-ugcPost-7416382348100816897-q5b0)
