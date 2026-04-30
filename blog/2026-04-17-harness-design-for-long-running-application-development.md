---
title: "Harness design for long-running application development"
description: "Anthropic이 공개한 \"하네스 엔지니어링\"은 AI 모델을 감싸는 운영 구조 설계를 의미한다. 장시간 코딩 작업에서 AI는 컨텍스트가 길어지면 조급해지고(context anxiety), 자기 평가에 실패하는 문제를 보인다. 이를 해결하기 위해 GAN에서 영감을 받아 Planner/Generator/Evaluator 3인 체제를 구축하고, 컨텍스트 리셋과"
slug: harness-design-for-long-running-application-development
date: 2026-04-17
authors: [sung]
tags:
  - ai-agent
  - vibe-coding
  - reference
source_url: "https://www.anthropic.com/engineering/harness-design-long-running-apps"
---

# Harness design for long-running application development

## TL;DR
> Anthropic이 공개한 "하네스 엔지니어링"은 AI 모델을 감싸는 운영 구조 설계를 의미한다. 장시간 코딩 작업에서 AI는 컨텍스트가 길어지면 조급해지고(context anxiety), 자기 평가에 실패하는 문제를 보인다. 이를 해결하기 위해 GAN에서 영감을 받아 Planner/Generator/Evaluator 3인 체제를 구축하고, 컨텍스트 리셋과 역할 분리를 통해 다시간 자율 개발 작업의 성능을 획기적으로 개선했다.

## Key Takeaways
- **프롬프트 ≠ 하네스**: 프롬프트는 "무엇을 말하느냐"지만, 하네스는 "어떤 구조 안에서 실행하느냐"를 설계하는 것으로 성능에 결정적 영향을 미친다
- **컨텍스트 불안 해결**: 긴 작업을 청크로 분해하고 컨텍스트를 주기적으로 리셋(교대 근무)하면 AI가 끝까지 일관성 있게 작업을 완수한다
- **Generator/Evaluator 분리**: GAN처럼 생성자와 평가자를 분리하면 자기 평가의 편향을 제거할 수 있고, 평가자에게 명확한 기준을 주는 것이 자기비판 프롬프트보다 훨씬 효과적이다
- **관찰 기반 개발**: 추측이 아닌 실제 모델 로그 관찰을 통해 실패 패턴을 발견하고 개선해야 한다
- **모델 진화와 하네스 재검토**: 새 모델이 나올 때마다 하네스를 재평가해야 하며, 불필요한 구조는 오히려 오버헤드가 된다

## 상세 내용

### 하네스 엔지니어링이란 무엇인가

**하네스(Harness)**는 AI 모델을 감싸는 운영 구조를 의미한다. 많은 개발자들이 프롬프트 엔지니어링에 집중하지만, 실제로는:

- **프롬프트** = AI에게 **뭘 말하느냐** (what to say)
- **하네스** = AI를 **어떤 구조 안에서 돌리느냐** (how to orchestrate)

Anthropic의 Prithvi Rajasekaran은 두 가지 연결된 문제를 해결하는 과정에서 하네스 설계의 중요성을 발견했다: 고품질 프론트엔드 디자인 생성과 인간 개입 없는 완전 자율 애플리케이션 개발이다.

### AI를 그냥 시키면 생기는 2가지 핵심 문제

#### 문제 1: 컨텍스트 불안 (Context Anxiety)

대화가 길어지면 AI 모델이 컨텍스트 윈도우 한계에 근접했다고 판단하고 조급해진다. 100페이지 보고서를 요청하면 60페이지 정도에서 "이제 마무리해야겠다"며 대충 끝내버리는 현상이다. 

이는 단순히 컨텍스트 길이 문제가 아니라, 모델이 자신의 한계를 '믿는' 지점에서 발생하는 행동 변화다. 복잡한 작업일수록 일관성을 잃고 작업이 궤도를 벗어나는(go off the rails) 경향이 나타난다.

#### 문제 2: 자기 평가 실패 (Self-Evaluation Failure)

"네가 만든 거 평가해봐"라고 요청하면 모델은 거의 항상 "완벽합니다!"라고 답한다. 자기 답안을 자기가 채점하면 후하게 점수를 주는 것과 같은 원리다. 

특히 주관적 판단이 필요한 디자인 작업에서 이 문제는 더욱 심각하다. "이 디자인이 좋은가?"라는 질문을 구체적이고 채점 가능한 기준으로 변환하는 것 자체가 도전 과제였다.

### 해결책: 역할 분리와 컨텍스트 관리

Anthropic 팀은 Generative Adversarial Networks(GAN)에서 영감을 받아 다중 에이전트 구조를 설계했다.

#### 컨텍스트 불안 → Context Reset (교대 근무)

- AI 1번이 30페이지를 작성하고 구조화된 산출물로 인수인계
- AI 2번이 새로운(맑은) 컨텍스트로 다음 30페이지 작성
- 각 AI가 항상 fresh한 상태에서 시작하므로 일관성 유지

실제로 개발자 커뮤니티에서도 "Ralph Wiggum method"처럼 훅이나 스크립트를 사용해 에이전트를 지속적인 반복 사이클에 유지하는 유사한 접근이 수렴하고 있다.

#### 자기 평가 실패 → Generator / Evaluator 분리

- **생성하는 AI**와 **채점하는 AI**를 완전히 분리
- 별도 평가자에게 명확한 평가 기준을 제공하는 것이 자기비판 프롬프트보다 훨씬 쉽고 효과적
- 주관적 판단("이 디자인이 좋은가?")을 구체적이고 채점 가능한 기준으로 분해

### 3인 체제 아키텍처

최종 결과는 다시간 자율 코딩 세션에서 풍부한 풀스택 애플리케이션을 생성하는 3-에이전트 아키텍처다:

| 역할 | 하는 일 | 특징 |
|------|---------|------|
| **Planner** (기획팀장) | 한 줄 프롬프트 → 상세 설계서로 확장 | 전체 작업을 다룰 수 있는(tractable) 청크로 분해 |
| **Generator** (개발자) | 설계서대로 코딩 | 각 청크를 독립적으로 구현 |
| **Evaluator** (QA) | 결과물 직접 테스트 | 불합격 시 구체적 피드백과 함께 반려 |

이 구조는 이전 하네스 작업에서 가져온 두 가지 핵심 교훈을 적용했다:
1. **빌드를 다룰 수 있는 청크로 분해**
2. **세션 간 컨텍스트 전달에 구조화된 산출물(structured artifacts) 사용**

### 실무 적용을 위한 핵심 교훈

#### 1. 모델을 직접 관찰하라

추측으로 문제를 해결하지 말고 실제 모델 로그를 읽어라. Context anxiety나 self-evaluation failure 같은 패턴은 직접 관찰을 통해서만 발견할 수 있다.

#### 2. 복잡한 작업은 분해하고 전문화하라

기획/개발/검수를 명확히 나누면 각 에이전트가 더 집중된 역할을 수행할 수 있다. 이는 단순한 작업 분할이 아니라 각 역할에 최적화된 프롬프트와 평가 기준을 적용할 수 있다는 의미다.

#### 3. 새 모델이 나오면 하네스를 다시 점검하라

모델이 진화하면서 이전에 필요했던 하네스 구조가 불필요해질 수 있다. 제거하지 않으면 오버헤드만 늘어난다. 하네스 설계는 정적인 것이 아니라 모델 성능과 함께 진화해야 한다.

### Vibe Coding과의 연결점

이 접근법은 "vibe coding" 패러다임—AI와의 자연스러운 협업을 통한 개발—과 자연스럽게 연결된다. 단, 단순히 대화형 코딩을 넘어서 **구조화된 협업**을 설계하는 것이다. 

프론트엔드 디자인처럼 주관적 판단이 필요한 영역에서도, 명확한 평가 기준을 가진 Evaluator를 두면 "취향"을 구체적인 기준으로 전환할 수 있다는 점이 특히 주목할 만하다.

### 한계와 향후 방향

이 글에서는 구체적인 성능 수치나 벤치마크 결과가 제시되지 않았지만, Anthropic이 프로덕션 환경에서 실제로 적용하고 있다는 점이 중요하다. 

하네스 엔지니어링은 아직 초기 단계의 실천 영역이지만, 프롬프트 엔지니어링만큼이나—어쩌면 그보다 더—중요한 AI 애플리케이션 개발의 핵심 요소로 자리잡을 가능성이 크다.

## References
- [Harness design for long-running application development - Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Earlier Anthropic harness work on coding agents](https://www.anthropic.com/engineering/harness-design-long-running-apps) (원문 내 참조)
