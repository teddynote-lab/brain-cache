---
title: "DSPy를 사용한 LLM 최적화: AI 시스템 구축, 최적화 및 평가를 위한 단계별 가이드"
description: "DSPy는 프롬프트 엔지니어링을 프로그래밍으로 전환하는 Stanford NLP의 프레임워크입니다. 수동 프롬프트 작성 대신 Python 코드로 LM의 동작을 정의하고, BootstrapFewShot, MIPRO 등의 옵티마이저를 통해 프롬프트와 가중치를 자동으로 최적화"
slug: dspy를-사용한-llm-최적화-ai-시스템-구축-최적화-및-평가를-위한-단계벼
date: 2026-01-14
authors: [sungyeon]
tags:
  - optimizer
  - reference
source_url: "https://blog.kbanknow.com/106"
---


# DSPy를 사용한 LLM 최적화: AI 시스템 구축, 최적화 및 평가를 위한 단계별 가이드

## TL;DR
> DSPy는 프롬프트 엔지니어링을 프로그래밍으로 전환하는 Stanford NLP의 프레임워크입니다. 수동 프롬프트 작성 대신 Python 코드로 LM의 동작을 정의하고, BootstrapFewShot, MIPRO 등의 옵티마이저를 통해 프롬프트와 가중치를 자동으로 최적화합니다. 모듈과 시그니처를 조합해 AI 파이프라인을 구축하고, 메트릭 기반으로 평가하여 반복 개선할 수 있어 RAG, 에이전트, 복잡한 추론 시스템 구축에 적합합니다.

## Key Takeaways
- **프롬프트를 코드로 관리**: 문자열 기반 프롬프팅 대신 `dspy.Signature`와 `dspy.Module`로 AI 동작을 선언적으로 정의하여 유지보수성과 재사용성 향상
- **자동 최적화**: BootstrapFewShot, MIPRO, BootstrapFinetune 등의 옵티마이저가 메트릭을 기준으로 프롬프트와 few-shot 예제를 자동으로 튜닝
- **메트릭 중심 평가**: 커스텀 메트릭을 정의하여 정량적으로 성능을 측정하고, 옵티마이저가 이를 기반으로 개선 방향 결정
- **모듈화 아키텍처**: ChainOfThought, ReAct 등 사전 구축된 모듈과 어댑터를 조합하여 복잡한 멀티스텝 파이프라인 구축 가능
- **프로덕션 지원**: 캐싱, 스트리밍, async, 옵저버빌리티 등 실전 배포에 필요한 기능 제공 및 MCP 통합 지원

## 상세 내용

### DSPy란 무엇인가

DSPy(Declarative Self-improving Language Programs, in Python)는 Stanford NLP에서 개발한 LM(Language Model) 프로그래밍 프레임워크입니다. 전통적인 프롬프트 엔지니어링의 한계를 극복하기 위해, 프롬프트를 문자열로 작성하는 대신 Python 코드로 LM의 동작을 정의하고 자동으로 최적화할 수 있도록 설계되었습니다.

기존 LLM 애플리케이션 개발에서는 모델을 변경하거나 파이프라인이 복잡해질 때마다 프롬프트를 수동으로 재작성해야 했습니다. DSPy는 이러한 반복 작업을 프로그래밍 추상화와 자동 최적화를 통해 해결합니다.

![DSPy Overview](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/a6e6c4e6-f855-46ce-837d-720eed4f720d/%E1%84%89%E1%85%B3%E1%84%8F%E1%85%B3%E1%84%85%E1%85%B5%E1%86%AB%E1%84%89%E1%85%A3%E1%86%BA_2026-01-15_00.00.27.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466XKMELABM%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T070356Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIEEAIysQ24TcCGxQxzORN6MEDF7dVu%2B65jB0A1YJIck%2BAiALZqROXdUc2%2FAgIpkfh0de6wJo%2BNw7l1IeQhsvzA4gRSqIBAin%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDYzNzQyMzE4MzgwNSIMLSspYrRslN1Va7ZjKtwDIfvsoRaAerbKcF%2BYFKxZvmjd7WeW5cnEqx9yDsWbzd0hKHtXRDvw36MlSfwjs8%2FnjOEF0G0ge2yRdql%2Fh0gT%2F%2FM%2BMXzlJfC9hAIiNrkJtop5Ub%2BEU0yR2DBumfxPPwUdrxmvJmC41%2BjLI0wk7172cetJ44xd6GlsIbButeSitv3qa5rlQLDByJEiwZqsFHAmqqHLqsfxrknuqGV5pTgIrpmFhLniInGz3MzMghVciyIs3k27lwYZYLvOJrWS%2F75Bho94YO%2F%2BHeaG8vyQuJsSy4sABiXqdedTQiP2o9tU3bK%2FFL97xgBVwUItuDZ9pih8839sqZyhP%2BaAiyRPE9p%2FyKE1glKHzIOWp8Ew6A2iscmtlL0BgejtqJTKT9BPGInGINpnubo8iNj15gaLiDizV9gsC6B3rXNQWLJDBfGPybp3RL1GtzHt%2FPvKbKoF%2BSx9WZuO%2BFChLvwnAFz6tnlReoMkBoLba4dmv0XqwGMk6rI57VulpZFDf14DhqEHEnaGIhXyZVKvgLSWlpcBP71Pswi%2BxXw44OO70F4fX5QY0BbUW0MnuczO7UFGIYf7MVPUf9VNgimH9lIAQJU00b17zo3Xa6aCgGIlKtQAbjmdB9l2XQeA9qnZrm6KKpIwu%2F2NzgY6pgEgViiBMePnN7J75CUX8EvMpr21ZU%2FrCQ4h3OPAzv5DwxojHeZ7jtxqS4BUm5feYmfzRTxS8x9eU9sQXL2zB7UTsCUPqTlFVUEIiEm8uOnG3y%2Fh%2FMy62SZjEKR6IbDqE9L8hOdIR2Qr0HMJ8J8%2FWoip5FFjsB6ugXp3tWudMJJyNTw%2BLAvCsrfkfc6MrxGbWJNSdtyNYtgaUYMMFwOaFkrK5M4AiVRB&X-Amz-Signature=0bffd29fa955653cb149614bf632fa83ad3523578f49a8c794458930302a8d6b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### DSPy의 핵심 구성 요소

#### 1. Modules: AI 동작을 코드로 정의

DSPy의 모듈은 LM 호출을 추상화한 재사용 가능한 컴포넌트입니다. 프롬프트를 직접 작성하는 대신, 입력과 출력의 시그니처(Signature)를 정의하면 DSPy가 자동으로 적절한 프롬프트를 생성합니다.

**주요 내장 모듈**:
- `dspy.ChainOfThought`: 단계별 추론을 수행하는 모듈
- `dspy.ReAct`: 추론과 행동을 반복하는 에이전트 패턴
- `dspy.Predict`: 기본적인 입력-출력 예측 모듈

예시 코드:
```python
import dspy

# Signature 정의: 입력(question) → 출력(answer)
class BasicQA(dspy.Signature):
    """Answer questions with short factoid answers."""
    question = dspy.InputField()
    answer = dspy.OutputField(desc="often between 1 and 5 words")

# Module 생성
generate_answer = dspy.ChainOfThought(BasicQA)
```

#### 2. Optimizers: 프롬프트와 가중치의 자동 튜닝

DSPy의 가장 강력한 기능은 옵티마이저입니다. 메트릭을 기준으로 프롬프트, few-shot 예제, 심지어 LM의 가중치까지 자동으로 최적화합니다.

**주요 옵티마이저**:
- **BootstrapFewShot**: 학습 데이터에서 효과적인 few-shot 예제를 자동 선택
- **BootstrapFewShotWithRandomSearch**: 랜덤 탐색을 추가하여 더 나은 예제 조합 탐색
- **MIPRO**: 프롬프트 인스트럭션과 few-shot 예제를 동시에 최적화하는 고급 기법
- **BootstrapFinetune**: DSPy 파이프라인을 활용해 소형 LM을 파인튜닝

#### 3. Evaluation: 메트릭 기반 성능 측정

DSPy는 사용자 정의 메트릭을 통해 AI 시스템의 성능을 정량적으로 평가할 수 있습니다. 옵티마이저는 이 메트릭을 목표 함수로 사용하여 최적화를 수행합니다.

```python
# 메트릭 정의 예시
def validate_answer(example, pred, trace=None):
    answer_correct = example.answer.lower() == pred.answer.lower()
    return answer_correct
```

### DSPy 시작하기: 단계별 가이드

#### Step 1: 설치 및 환경 설정

```bash
pip install dspy-ai
```

DSPy는 다양한 LM과 Retrieval Model(RM)을 지원합니다. 초기 설정 예시:

```python
import dspy

# Language Model 설정
turbo = dspy.OpenAI(model='gpt-3.5-turbo')

# Retrieval Model 설정 (옵션)
colbertv2_wiki17_abstracts = dspy.ColBERTv2(
    url='http://20.102.90.50:2017/wiki17_abstracts'
)

# 전역 설정
dspy.settings.configure(lm=turbo, rm=colbertv2_wiki17_abstracts)
```

#### Step 2: 데이터셋 준비

DSPy는 HotPotQA 등의 벤치마크 데이터셋을 내장 지원합니다:

```python
from dspy.datasets import HotPotQA

# train_seed로 재현성 보장
dataset = HotPotQA(
    train_seed=1, 
    train_size=20, 
    eval_size=100
)

trainset = dataset.train
devset = dataset.dev
```

#### Step 3: 파이프라인 구축

DSPy 모듈을 조합하여 복잡한 AI 파이프라인을 구성할 수 있습니다:

```python
class RAG(dspy.Module):
    def __init__(self, num_passages=3):
        super().__init__()
        self.retrieve = dspy.Retrieve(k=num_passages)
        self.generate_answer = dspy.ChainOfThought(BasicQA)
    
    def forward(self, question):
        context = self.retrieve(question).passages
        prediction = self.generate_answer(context=context, question=question)
        return dspy.Prediction(context=context, answer=prediction.answer)
```

#### Step 4: 최적화 실행

메트릭을 정의하고 옵티마이저를 실행하여 파이프라인을 개선합니다:

```python
from dspy.teleprompt import BootstrapFewShot

# 메트릭 정의
def validate_context_and_answer(example, pred, trace=None):
    answer_match = example.answer.lower() == pred.answer.lower()
    context_relevant = any(example.answer.lower() in c.lower() 
                          for c in pred.context)
    return answer_match and context_relevant

# 옵티마이저 설정 및 실행
optimizer = BootstrapFewShot(metric=validate_context_and_answer)
optimized_rag = optimizer.compile(RAG(), trainset=trainset)
```

#### Step 5: 평가 및 배포

최적화된 모델을 평가하고 저장합니다:

```python
from dspy.evaluate import Evaluate

# 평가 실행
evaluator = Evaluate(devset=devset, metric=validate_context_and_answer, 
                     num_threads=4, display_progress=True)
score = evaluator(optimized_rag)

# 모델 저장
optimized_rag.save('optimized_rag.json')
```

### 실전 활용 사례

#### Retrieval-Augmented Generation (RAG)

DSPy는 RAG 시스템 구축에 특히 효과적입니다. Retrieval과 Generation을 별도 모듈로 분리하여 각각 최적화할 수 있으며, 멀티홉 추론이 필요한 복잡한 질의응답에도 대응 가능합니다.

#### AI 에이전트 구축

ReAct 패턴을 활용한 에이전트 개발을 지원하며, MCP(Model Context Protocol) 통합을 통해 외부 도구와의 연동도 가능합니다. 메모리 기능을 추가한 대화형 에이전트, 금융 분석 에이전트 등의 실사례가 제공됩니다.

#### Entity Extraction 및 Classification

구조화된 정보 추출 작업에도 DSPy를 활용할 수 있습니다. 시그니처로 출력 스키마를 정의하고, 옵티마이저가 최적의 프롬프트를 찾아내도록 할 수 있습니다.

### 고급 최적화 기법

#### GEPA (Reflective Prompt Evolution)

GEPA(Generalized Evolutionary Prompt Adaptation)는 프롬프트를 반성적으로 진화시키는 실험적 기법입니다. AIME 수학 문제, 기업용 정보 추출, 코드 백도어 분류 등 복잡한 태스크에서 효과를 입증했습니다.

#### RL 기반 최적화

실험적으로 강화학습을 활용한 최적화도 지원하며, 프라이버시 중심 위임(Privacy-Conscious Delegation)이나 멀티홉 리서치 등의 고급 유스케이스에 적용 가능합니다.

### 프로덕션 배포 고려사항

DSPy는 실전 배포를 위한 다양한 기능을 제공합니다:

- **캐싱**: 반복 호출 시 비용 절감
- **스트리밍 및 Async**: 실시간 응답성 개선
- **디버깅 & 옵저버빌리티**: DSPy 옵티마이저 추적 및 모니터링
- **모델 저장/로드**: 최적화된 파이프라인의 버전 관리

### DSPy 에코시스템

DSPy는 활발한 오픈소스 커뮤니티를 보유하고 있으며(GitHub 33.2k+ stars), 지속적으로 새로운 튜토리얼과 사례가 추가되고 있습니다. Audio 처리, 이미지 생성, Code Generation 등 멀티모달 태스크로도 확장되고 있습니다.

### 언제 DSPy를 사용해야 하나

DSPy는 다음과 같은 상황에서 특히 유용합니다:

- 여러 LM 호출이 연결된 복잡한 파이프라인을 구축할 때
- 프롬프트를 체계적으로 관리하고 버전 관리가 필요할 때
- 메트릭 기반으로 자동 최적화하여 수동 튜닝 시간을 줄이고 싶을 때
- 다양한 모델(GPT-4, Claude, 로컬 모델 등)로 실험하며 최적 조합을 찾을 때
- 프로덕션 환경에서 성능과 비용을 지속적으로 개선해야 할 때

반면, 단순한 단일 프롬프트 호출이나 프로토타이핑 초기 단계에서는 오버엔지니어링이 될 수 있습니다.

## References
- [DSPy 공식 사이트](https://dspy.ai/)
- [DSPy GitHub Repository](https://github.com/stanfordnlp/dspy)
- [DSPy를 사용한 LLM 최적화 가이드 - Unite.AI](https://www.unite.ai/ko/optimize-llm-with-dspy-a-step-by-step-guide-to-build-optimize-and-evaluate-ai-systems/)
- [케이뱅크 기술 블로그 - DSPy 소개](https://blog.kbanknow.com/106)
