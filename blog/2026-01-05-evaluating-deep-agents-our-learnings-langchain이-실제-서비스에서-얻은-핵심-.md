---
title: "Evaluating Deep Agents: Our Learnings (LangChain이 실제 서비스에서 얻은 핵심 인사이트)"
description: "LangChain이 4개의 Deep Agent 애플리케이션을 실제 배포하며 얻은 평가 인사이트를 공유합니다. Deep Agent는 전통적인 LLM 평가와 달리 각 테스트 케이스마다 고유한 성공 기준이 필요하며, single-step/full-turn/multi-turn"
slug: evaluating-deep-agents-our-learnings-langchain이-실제-서비스에서-얻은-핵심-
date: 2026-01-05
authors: [sungyeon]
tags:
  - llm
  - reference
source_url: "https://blog.langchain.com/evaluating-deep-agents-our-learnings/"
---


# Evaluating Deep Agents: Our Learnings (LangChain이 실제 서비스에서 얻은 핵심 인사이트)

## TL;DR
> LangChain이 4개의 Deep Agent 애플리케이션을 실제 배포하며 얻은 평가 인사이트를 공유합니다. Deep Agent는 전통적인 LLM 평가와 달리 각 테스트 케이스마다 고유한 성공 기준이 필요하며, single-step/full-turn/multi-turn 등 다양한 실행 방식으로 agent의 의사결정, 최종 상태, 사용자 상호작용을 검증해야 합니다. 재현 가능한 테스트 환경 구축이 핵심이며, 단순히 최종 응답뿐만 아니라 trajectory(도구 호출 시퀀스)와 중간 상태까지 평가해야 production-ready agent를 만들 수 있습니다.

## Key Takeaways
- **맞춤형 평가 로직 필수**: 전통적인 LLM 평가와 달리 Deep Agent는 각 데이터 포인트마다 고유한 성공 기준(trajectory, state, final response)을 검증하는 bespoke 테스트 코드가 필요합니다.
- **계층적 테스트 전략**: Single-step으로 특정 시나리오의 의사결정 검증, full-turn으로 종료 상태 확인, multi-turn으로 실제 사용자 인터랙션 시뮬레이션 등 목적에 맞는 실행 방식을 선택해야 합니다.
- **Trajectory 검증의 중요성**: 최종 응답뿐만 아니라 agent가 어떤 도구를 어떤 순서로 호출했는지, 어떤 인자를 전달했는지를 검증하는 것이 agent의 신뢰성 확보에 필수적입니다.
- **재현 가능한 환경 구축**: Deep Agent는 외부 시스템과 상호작용하므로, 일관된 테스트 결과를 위해 clean, reproducible test environment가 필수입니다.
- **실전 배포 경험 기반 인사이트**: DeepAgents CLI, LangSmith Assist, Personal Email Assistant, Agent Builder 등 4개의 실제 서비스 배포 과정에서 검증된 평가 패턴입니다.

## 상세 내용

### Deep Agent 평가의 실전 컨텍스트

LangChain은 최근 한 달간 Deep Agents harness 기반으로 4개의 실제 애플리케이션을 배포했습니다:

- **DeepAgents CLI**: 코딩 에이전트
- **LangSmith Assist**: LangSmith 내 다양한 작업을 지원하는 in-app 에이전트
- **Personal Email Assistant**: 각 사용자와의 상호작용을 학습하는 이메일 어시스턴트
- **Agent Builder**: 메타 deep agent로 구동되는 노코드 에이전트 빌딩 플랫폼

이러한 실제 서비스 배포 과정에서 각 애플리케이션마다 평가 체계를 구축하며 얻은 핵심 패턴들을 정리한 것이 이번 포스트의 내용입니다.

### 평가 용어 정리

Deep Agent 평가를 논의하기 전에 핵심 용어를 명확히 정의할 필요가 있습니다.

**Agent 실행 방식:**
- **Single step**: Agent 루프를 단 한 번의 턴으로 제한하여, 다음에 취할 액션만 결정하도록 합니다
- **Full turn**: 단일 입력에 대해 agent를 완전히 실행합니다. 여러 번의 tool-calling 반복을 포함할 수 있습니다
- **Multiple turns**: Agent를 여러 번 완전히 실행합니다. 주로 agent와 사용자 간의 여러 번의 상호작용을 시뮬레이션하는 데 사용됩니다

**테스트 대상:**
- **Trajectory**: Agent가 호출한 도구의 시퀀스와 생성한 구체적인 도구 인자
- **Final response**: Agent가 사용자에게 반환한 최종 응답
- **Other state**: Agent가 실행 중에 생성한 다른 값들(예: 파일, 기타 artifacts)

### #1: 각 데이터 포인트마다 맞춤형 테스트 로직 필요

전통적인 LLM 평가는 단순합니다:
1. 예제 데이터셋 구축
2. 평가자(evaluator) 작성
3. 데이터셋에 대해 애플리케이션을 실행하여 출력 생성 후 평가자로 점수 산출

모든 데이터 포인트가 동일하게 처리됩니다. 동일한 애플리케이션 로직을 거쳐 동일한 평가자로 채점됩니다.

**Deep Agent는 이 가정을 깨뜨립니다.** 최종 메시지 이상을 테스트해야 하며, "성공 기준"은 각 데이터 포인트에 더 구체적이고, agent의 trajectory와 state에 대한 특정 assertion을 포함할 수 있습니다.

**구체적 예시:**
캘린더 일정 관리 deep agent가 사용자 선호도를 기억하는 기능을 가지고 있다고 가정합니다. 사용자가 "오전 9시 전에는 절대 회의를 잡지 마세요"라고 요청합니다.

이 경우 우리는 캘린더 agent가 자체 메모리를 업데이트했는지, 그리고 나중에 일정을 잡을 때 이 선호도를 실제로 적용하는지 확인해야 합니다. 이는 단순히 최종 메시지를 확인하는 것 이상입니다.

**LangSmith에서의 구현:**
LangSmith에서는 Python 코드를 직접 작성하여 각 example에 대한 맞춤형 평가 로직을 구현할 수 있습니다. 이를 통해 trajectory 검증, state 확인, 조건부 검증 등 복잡한 평가 시나리오를 처리할 수 있습니다.

### #2: Single-step 실행으로 의사결정 검증 (토큰 절약 효과도)

Single-step 실행은 특정 시나리오에서 agent의 의사결정을 검증하는 데 매우 유용합니다. Agent 루프를 단 한 번의 턴으로 제한하여 다음에 어떤 도구를 호출할지만 확인합니다.

**장점:**
- **빠른 검증**: Agent가 특정 상황에서 올바른 도구를 선택하는지 빠르게 확인
- **토큰 절약**: 전체 agent를 실행하지 않으므로 API 호출 비용 절감
- **디버깅 용이**: 특정 의사결정 지점에 집중하여 문제 파악이 쉬움

**사용 사례:**
예를 들어, 코딩 agent가 "파일을 읽어야 하는 상황"에서 올바르게 `read_file` 도구를 선택하는지, "코드를 실행해야 하는 상황"에서 `execute_code` 도구를 선택하는지 등을 검증할 때 유용합니다.

### #3: Full-turn 실행으로 최종 상태 검증

Full-turn 실행은 agent의 "종료 상태(end state)"에 대한 assertion을 테스트하는 데 적합합니다. 단일 입력에 대해 agent를 완전히 실행하되, 중간 과정보다는 최종 결과에 집중합니다.

**검증 대상:**
- Agent가 올바른 최종 응답을 생성했는가?
- 필요한 파일이나 artifact가 생성되었는가?
- 내부 상태(예: 메모리, 데이터베이스)가 올바르게 업데이트되었는가?

**Single-step과의 차이:**
Single-step이 "다음 액션의 적절성"을 검증한다면, full-turn은 "작업의 완결성"을 검증합니다. 실제 사용자 시나리오에서는 대부분 full-turn 실행이 발생하므로, 이를 테스트하는 것이 중요합니다.

### #4: Multi-turn으로 실제 사용자 인터랙션 시뮬레이션

Multi-turn 실행은 agent와 사용자 간의 여러 번의 상호작용을 시뮬레이션합니다. 가장 현실적인 테스트 방식이지만, "on rails"를 유지하는 것이 중요합니다.

**On rails 유지의 중요성:**
Multi-turn 테스트는 쉽게 제어 불가능해질 수 있습니다. Agent의 응답이 예상과 다르면 이후 턴들이 의미 없어질 수 있습니다. 따라서:
- 각 턴마다 명확한 검증 포인트 설정
- 예상치 못한 agent 행동에 대한 대응 로직
- 테스트 시나리오의 범위를 적절히 제한

**활용 사례:**
- 이메일 어시스턴트: 사용자가 여러 번의 요청을 통해 이메일 초안을 다듬는 과정
- 코딩 agent: 코드 작성 → 검토 → 수정의 반복적인 과정
- 상담 agent: 정보 수집 → 제안 → 피드백 → 재제안의 대화 흐름

### #5: 환경 설정의 중요성

Deep Agent는 외부 시스템과 상호작용하기 때문에 clean하고 reproducible한 테스트 환경이 필수입니다.

**환경 설정 고려사항:**
- **격리(Isolation)**: 각 테스트가 서로 영향을 주지 않도록 독립적인 환경 제공
- **재현성(Reproducibility)**: 같은 입력에 대해 일관된 결과를 보장
- **초기화(Setup/Teardown)**: 테스트 전 깨끗한 상태로 초기화, 테스트 후 정리

**실전 예시:**
- 파일 시스템을 사용하는 코딩 agent: 각 테스트마다 임시 디렉토리 생성 및 정리
- 데이터베이스를 사용하는 agent: 트랜잭션 롤백 또는 테스트용 DB 인스턴스 사용
- API를 호출하는 agent: 모킹(mocking) 또는 샌드박스 환경 활용

LangSmith는 이러한 환경 설정을 테스트 스위트 수준에서 관리할 수 있는 기능을 제공하여, 각 평가 실행마다 일관된 환경을 보장합니다.

### 실전 적용 팁

LangChain이 4개의 실제 서비스를 배포하며 얻은 추가 인사이트:

1. **점진적 복잡도 증가**: Single-step → Full-turn → Multi-turn 순서로 테스트를 구축하면 디버깅이 쉬워집니다
2. **핵심 시나리오부터**: 가장 빈번하게 발생하는 사용자 시나리오부터 테스트 케이스를 작성
3. **실패 케이스 수집**: 프로덕션에서 발생한 실패 사례를 테스트 케이스로 추가
4. **성능과 품질의 균형**: 모든 테스트를 full-turn으로 실행하면 비용이 높으므로, single-step으로 커버 가능한 부분은 단순화
5. **지속적 개선**: Agent가 발전함에 따라 평가 기준도 함께 진화시켜야 합니다

## References
- [Evaluating Deep Agents: Our Learnings - LangChain Blog](https://blog.langchain.com/evaluating-deep-agents-our-learnings/)
