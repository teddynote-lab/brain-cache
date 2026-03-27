---
title: "여러분은 AI Service에 대해 얼마나 알고 계신가요?"
description: "RAG에서 AI Agent로 빠르게 전환되는 시점에서, 실무자는 LLM·RAG·Agent의 본질적 개념을 정확히 이해해야 한다. Gen.AI 서비스는 기술·BM·아키텍처 관점에서 다층적으로 분류되며, 기존 서비스 대비 복잡도가 높다. 효과적인 서비스 구축을 위해서는 서"
slug: 여러분은-ai-service에-대해-얼마나-알고-계신가요
date: 2026-02-21
authors: [jaehun]
tags:
  - ai-agent
  - reference
source_url: "/b594b169cb8883978a5381b22759da81#17d4b169cb8883789d3f0137ac0a2c21"
---


# 여러분은 AI Service에 대해 얼마나 알고 계신가요?

## TL;DR
> RAG에서 AI Agent로 빠르게 전환되는 시점에서, 실무자는 LLM·RAG·Agent의 본질적 개념을 정확히 이해해야 한다. Gen.AI 서비스는 기술·BM·아키텍처 관점에서 다층적으로 분류되며, 기존 서비스 대비 복잡도가 높다. 효과적인 서비스 구축을 위해서는 서비스를 명확히 정의하고, Product·Data·RAG 팀이 각자의 전문성을 기반으로 역할을 분업화해야 한다.

## Key Takeaways
- **기술 트렌드 이해**: RAG는 이미 정착되었으나 Agent 중심으로 빠르게 전환 중이며, 실무자는 각 기술의 본질적 차이와 적용 시점을 명확히 구분해야 한다.
- **서비스 분류 체계**: Gen.AI 서비스는 기술 관점(Content-Centric, Conversational, Automation 등 6가지)과 BM 관점(B2B/B2C × SaaS/IaaS/PaaS)으로 분류 가능하며, 자사 서비스의 위치를 파악하는 것이 전략 수립의 출발점이다.
- **4-Layer 아키텍처**: Gen.AI 서비스는 Application, Platform, Model, Infrastructure 4개 레이어로 구성되며, 기존 서비스 대비 복잡성이 높아 레이어별 역할 정의가 중요하다.
- **전문성 기반 분업**: Product(개발·운영), Data(파이프라인), RAG(기술 연구·적용) 팀이 각자의 전문 영역에 집중하는 것이 스타트업 환경에서도 효율적이다.
- **문제 진단 역량**: 표면적 기술 적용보다 개념 이해가 선행되어야 실전에서 신속정확한 문제 진단과 대응이 가능하다.

## 상세 내용

### AI Service 이해의 중요성

AI 기술의 발전 속도는 가속화되고 있다. RAG(Retrieval Augmented Generation)는 이미 많은 실무자에게 익숙한 개념이 되었지만, 투입 리소스 대비 성능 향상에 대한 고도화는 여전히 진행 중이다. 그럼에도 불구하고 업계는 AI Agent를 향해 빠르게 움직이고 있다.

이러한 빠른 전환 과정에서 실무자들이 간과하기 쉬운 점이 있다. LLM, RAG, Agent의 본질적 개념과 특징에 대한 깊이 있는 이해 없이 서비스 구축에만 집중하는 경우가 많다는 것이다. 이는 문제 상황에서 신속정확한 대처를 어렵게 만들고, 심각한 경우 명확한 문제 진단조차 불가능하게 만든다.

본 문서는 실무자가 마주하는 AI Service의 개괄적 특징과 명확히 알아야 할 본질적 개념을 정리하여, 실전에서 활용 가능한 참고 자료를 제공하고자 한다.

### Gen.AI Service의 분류 체계

#### 기술 관점에서의 분류

현존하는 생성형 AI 서비스는 기술적 특성에 따라 6가지 유형으로 구분할 수 있다:

| 구분 | 설명 | 대표 서비스 |
|------|------|------------|
| **Content-Centric** | 텍스트·이미지·영상·음성 등 콘텐츠를 생성·편집·변환 | Midjourney, ElevenLabs |
| **Conversational** | 자연어 기반 대화를 통한 질의응답, 상담, 업무 지원 | ChatGPT, Perplexity AI |
| **Automation** | 반복적·규칙적 업무를 AI 기반으로 자동 수행 | UiPath AI Center |
| **Platform** | AI 모델·API·개발환경 등을 제공하는 인프라형 서비스 | AWS Bedrock |
| **Insight Driven** | 데이터 분석을 통한 예측, 의사결정 지원, 인사이트 도출 | Palantir AIP |
| **Hybrid** | 앞선 특징들이 적절히 혼합된 복합형 서비스 | Microsoft 365 Copilot, n8n, Dify |

자사 서비스가 어느 유형에 속하는지, 혹은 여러 유형의 특성을 조합하고 있는지 파악하는 것이 서비스 전략 수립의 첫 단계다.

#### 비즈니스 모델 관점에서의 분류

Gen.AI 서비스는 타겟 고객과 제공 형태에 따라 다음과 같이 분류할 수 있다:

|  | **SaaS** | **IaaS** | **PaaS** |
|---|----------|----------|----------|
| **B2B** | 기업용 AI 업무자동화 SaaS<br>(예: DeepL Pro) | GPU 클라우드, AI 서버 인프라 제공<br>(예: AWS EC2 GPU) | AI 모델 API, 개발 플랫폼 제공<br>(예: Anthropic API) |
| **B2C** | 개인용 생성형 AI 구독 서비스<br>(예: Duolingo Max, Canva AI) | 직접 소비자 대상 인프라 제공은 제한적<br>(예: Runpod) | 크리에이터용 AI 개발툴, 노코드 AI 제작 플랫폼<br>(예: Zapier AI) |

이 분류를 통해 자사 서비스의 수익 모델과 경쟁 구도를 명확히 이해할 수 있다.

#### 아키텍처 관점: 4-Layer 구조

Gen.AI 서비스는 BM과 특성이 다양하더라도, 기본적으로 4개의 레이어로 구성된 아키텍처를 따른다:

![**[Figure 01]** Gen.AI Service 4-Layer](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/e650e475-f3b0-49ea-bfaa-1976b15a6ee2/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663WHJAUSL%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T064858Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQCw1WTyliKrZmiN1EReJ5%2FXDlOxVK2Pk4rnukS1o%2FNZtAIgTp6GX84QASHlpq148qH%2FJsQtiZJhGtwwVV1t%2BXdcxl0qiAQIp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDHMlSLU4QpecPo0OyircA9duyTAkPpo1W63NaHJkZfN4ZB8RS%2BHzJRykgP7E6ITl3Z1%2BfBSSb1dEMgy3TZiiZA4H7m2w77eWM1DMKDoLYiszAYtKelAZOlHZ86Ag1kaXa%2BvAJ09K7Cu7KLnB6F79FatSU71X24rb%2BVeczUDCxYhO9JoUnOyBbIWsUytphHbbyE356SWl2Bzo1ORgireR6uOPulnIU9Rbav37XiQUNQF1205SCFev7cQ7ynk%2FIeqqFaVvlZZJqmDGja9Y5N7%2FGwjtIaihfUSEgAksUAf1UvjzeaYYlqP%2Fvlt3NO2GNWBszrMWKwQUruH69b2ftL8TyxncA7Jgn1RfHzBeho8ndYFioTTpHGBKIqDEnqkYRelCu9rZAfPc2MKYaU1Jf1o6N%2FzrHuAfBHKJtBlIA%2BvVMmZwd78caPsPPndZ685kh0GZUfEGmFZWApclAH%2BalZeb2caVb3oe62eeSQl1x9bItZrUCaWqgVsBOSYHRCpsrE0m%2FmIM1SUvq2lhzbEGB2D9lBjaDe7OLaJYa%2BjpTJ1Z3D0HGEy0MPY20M3xifuFhP5k%2FBesl%2B3i%2FahLGkuUzoMf2hVTaM3u%2BW7GmcsKNcKlTzatW8AzYtguWl43yuCpI144Q6y3OLiNAuowtS%2BlMN%2F9jc4GOqUB2DRoNKGXNWuE6i8KgQLdVYKBbNRbla31SkMftG1IFYpL%2BHY4nlXFArglYLWpvUuqTpLIKU0ESNQyre8mBFuxeuDtE7rRXnSXyu3QLOLX9vGOUoU1QTxyVOzBydBngyQ7UQrLGWRV56OxKA%2BpMVvLtcf3yvUUi29P58Yr6JldM8xvDmpiglXcKpBvzTdlhN5Wrpg7sv6HzZYd6rf6Sg0aWmISPLJU&X-Amz-Signature=93e6b49ef8dfcaf03b820cbb742d587d7b2e5df3a4a236a57e98b2f483bd2ab1&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

**1. Application Layer**
- 실제 고객과 직접 접점을 형성하는 레이어
- 서비스의 접근 형태(B2B, B2C), UI/UX, 사용자 경험을 담당
- 고객의 요구사항이 시스템으로 전달되는 진입점

**2. Platform Layer**
- 비즈니스 로직과 AI 기능을 연결하는 중간 레이어
- API 게이트웨이, 오케스트레이션, 워크플로우 관리 등을 담당
- RAG, Agent와 같은 AI 기능이 실제로 구현되는 영역

**3. Model Layer**
- LLM, Embedding 모델 등 AI 모델이 위치하는 레이어
- 모델 선택, 파인튜닝, 프롬프트 엔지니어링이 이루어지는 영역
- 서비스의 AI 성능을 직접 결정하는 핵심 레이어

**4. Infrastructure Layer**
- GPU, 스토리지, 네트워크 등 물리적·클라우드 인프라
- 모델 서빙, 스케일링, 모니터링을 지원
- 비용과 성능의 트레이드오프가 결정되는 레이어

Gen.AI 서비스는 이 4개 레이어가 유기적으로 연결되어야 하며, 기존 서비스 대비 복잡성이 높다. 각 레이어의 역할을 명확히 이해하고 레이어 간 인터페이스를 잘 설계하는 것이 중요하다.

### 실무자의 역할 분담

회사가 올바른 방향성을 가지고 시너지를 극대화하려면, 각 팀의 실무자가 전문성을 기반으로 명확한 역할을 수행해야 한다. 다음은 효과적인 역할 분담의 예시다:

**Product Team**
- 서비스 기능의 직접 개발
- 배포된 서비스의 전반적인 유지보수, 운영, 대응
- 고객 피드백 수렴 및 기능 개선

**Data Team**
- 서비스 기능에 필요한 데이터 수급 및 전처리
- 데이터 레이크, 파이프라인 등 전반적인 데이터 인프라 운용/관리
- 데이터 품질 관리 및 거버넌스

**RAG Team**
- RAG/Agent에 대한 지엽적인 기술 연구
- 연구 결과를 바탕으로 한 서비스 적용 및 반영
- 프롬프트 엔지니어링, 모델 최적화 등 AI 성능 개선

물론 스타트업 환경에서는 인력 규모의 제약으로 인해 역할의 경계가 모호할 수 있다. 하지만 LLM, RAG, Agent는 기존 방식과 다른 특성을 가지고 있기 때문에, 모든 팀원이 표면적인 부분만 다루기보다는 각 팀이 강점을 가진 영역에 집중하여 전문성을 높이는 것이 장기적으로 효과적이다.

### 서비스 정의의 중요성

모든 논의의 출발점은 "만들고 운용하고자 하는 서비스의 명확한 정의"다. 서비스의 기술적 분류, BM, 아키텍처, 타겟 고객을 명확히 정의하지 않으면 팀 간 협업이 비효율적이고 방향성이 흐려진다.

서비스 정의가 명확해지면:
- 각 팀이 집중해야 할 우선순위가 분명해진다
- 레이어별 책임 영역이 구분되어 병목 지점 파악이 쉬워진다
- 기술 선택과 투자 결정이 데이터 기반으로 이루어진다
- 문제 발생 시 근본 원인 분석과 빠른 대응이 가능하다

## References
- 원본 문서: 여러분은 AI Service에 대해 얼마나 알고 계신가요?
