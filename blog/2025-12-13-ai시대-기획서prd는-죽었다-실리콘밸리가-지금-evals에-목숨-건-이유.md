---
title: "AI시대 기획서(PRD)는 죽었다. 실리콘밸리가 지금 "
description: "실리콘밸리 AI 프로덕트 개발의 핵심이 "
slug: ai시대-기획서prd는-죽었다-실리콘밸리가-지금-evals에-목숨-건-이유
date: 2025-12-13
authors: [braincrew]
tags:
  - evaluation
  - reference
source_url: "https://eopla.net/magazines/36939&utm_source=lkd_organic&utm_medium=hiddenbook_evals&utm_campaign=eopla_article"
---


# AI시대 기획서(PRD)는 죽었다. 실리콘밸리가 지금 "Evals"에 목숨 건 이유

## TL;DR
> 실리콘밸리 AI 프로덕트 개발의 핵심이 "어떤 모델을 쓸까"에서 "성능을 어떻게 측정할까"로 전환되고 있습니다. 평가 시스템(Evals)은 단순한 QA가 아니라 AI 애플리케이션의 데이터 분석이자 새로운 기획서(PRD)입니다. 로그를 직접 분석하는 '노가다'부터 시작해 LLM-as-a-Judge로 자동화하면, 회귀 방지, 비용 절감, 신뢰성 확보라는 세 마리 토끼를 잡을 수 있습니다. 완벽한 평가 지표보다 중요한 것은 "어제보다 나아졌는지" 확인하는 반복 가능한 시스템을 구축하는 것입니다.

## Key Takeaways
- **"Vibe Check"의 시대는 끝났다**: 프롬프트 수정 시 발생하는 회귀(Regression) 현상을 방지하려면 체계적인 평가 시스템이 필수적이며, 이는 AI 제품의 핵심 경쟁력(Moat)이 됩니다.
- **로그 분석이 혁신의 출발점**: 거창한 MLOps 툴보다 50~100개의 실제 대화 로그를 직접 읽고 패턴을 찾는 '오픈 코딩' 방식이 가장 빠르고 효과적인 인사이트를 제공합니다.
- **LLM-as-a-Judge는 이진 분류로 설계하라**: "품질을 1~5점으로 평가"하는 모호한 지시 대신, "경쟁사 언급 포함 여부(True/False)" 같은 명확한 이진 질문이 신뢰할 수 있는 자동 평가를 가능하게 합니다.
- **Evals는 새로운 PRD다**: 에이전트 기반 복잡한 워크플로우에서는 각 단계의 의도 검증이 필수이며, 테스트 케이스 자체가 제품 요구사항 정의서 역할을 대신합니다.
- **평가 기준이 있으면 비용을 절감할 수 있다**: 고성능 모델(GPT-4o) 대신 저비용 모델(GPT-4o-mini, Llama 3)로 동일한 품질을 달성할 수 있는지 객관적으로 테스트하여 운영 비용을 획기적으로 낮출 수 있습니다.

## 상세 내용

### AI 프로덕트 품질 보장의 패러다임 전환

최근 실리콘밸리에서 AI 프로덕트를 만드는 팀들 사이에서 기류가 바뀌고 있습니다. 작년까지만 해도 "어떤 파운데이션 모델(GPT-4o, Claude 3.5 Sonnet)을 쓸까?"가 논의의 핵심이었다면, 지금은 **"내 AI가 헛소리를 안 한다는 걸 어떻게 보장할 것인가?"**로 주제가 옮겨갔습니다.

[Lenny's Podcast에 출연한 머신러닝 엔지니어 하멜 후세인(Hamel Husain)과 슈레야 샨카(Shreya Shankar)의 대담](https://www.youtube.com/watch?v=BsWxPI9UM4c)은 이 지점에서 매우 중요한 시사점을 던집니다. 그들은 AI 제품 개발의 성패가 모델의 성능 그 자체가 아니라, 그 성능을 측정하는 **'평가 시스템(Evaluations, Evals)'**의 유무에 달려 있다고 강조합니다.

단순히 몇 번 써보고 "느낌 좋은데?(Vibe Check)"라며 배포하던 낭만의 시대는 끝났습니다. 이제는 **집요한 평가(Evaluation)가 곧 제품의 해자(Moat)가 되는 시대**입니다.

### "감(Vibe)"에 의존하는 개발의 치명적 함정

생성형 AI 서비스를 기획하고 개발하다 보면 치명적인 착각에 빠지기 쉽습니다. 프롬프트를 몇 번 수정하고, 테스트 케이스 10개 정도를 돌려본 뒤 답변이 그럴듯하면 "개발 완료"를 외치는 것이죠.

하지만 라이브 환경은 다릅니다. 사용자는 우리가 상상하지 못한 엣지 케이스(Edge Case)를 끊임없이 던집니다. 이때 개발팀이 직면하는 가장 큰 문제는 **'수정의 딜레마'**입니다. **사용자 불만을 해결하기 위해 프롬프트를 수정했더니, 기존에 잘 동작하던 기능이 망가지는 '회귀(Regression)' 현상이 발생**합니다.

시스템적인 평가 기준이 없다면, 우리는 AI가 더 똑똑해진 건지 멍청해진 건지 알 방법이 없습니다. **Evals는 단순한 QA 테스트가 아닙니다. AI 애플리케이션에 대한 '데이터 분석' 그 자체입니다.**

![](https://eopla.net/file_path_host?token=1ZSAikYs5H2YYmJoj39cAqKrGFNB6pnkdQ6rFQMQcBXH8Nr%2FcVMjEWAzV4mYHlCI1ooE939B9Pwa6ZodyTruLN%2FVbCTnmKjWZhWkr3hfd6Ey--%2BZ3cEuHhdgGnVyB%2F--4V642PPCAqyDW6JqxIq6qw%3D%3D)

### 로그를 직접 읽는 '노가다'가 혁신의 시작

많은 팀이 자동화된 MLOps 툴이나 거창한 대시보드부터 도입하려 합니다. 하지만 가장 빠르고 확실한 방법은 **원시 데이터(Raw Data)를 직접 눈으로 확인하는 것**입니다.

#### Step 1: 오픈 코딩 (Open Coding)

우선 AI와 사용자가 나눈 대화 로그(Trace)를 무작위로 50~100개 정도 읽어보세요. 그리고 이상한 부분이 보일 때마다 직관적인 메모를 남깁니다.

- "답변이 너무 장황함"
- "경쟁사 제품을 추천함 (Hallucination)"
- "JSON 포맷이 깨짐"

거창한 분류 체계는 필요 없습니다. 일단 눈에 띄는 문제들을 날것 그대로 적는 것이 중요합니다.

#### Step 2: 패턴의 범주화 (Categorization)

100개 정도의 로그만 봐도 문제의 패턴이 보이기 시작합니다. 이제 LLM을 활용해 앞서 남긴 메모들을 그룹화합니다. '부정확한 정보', '톤앤매너 위반', '포맷 오류' 등으로 유형을 묶고, 피벗 테이블(Pivot Table)을 돌려보세요.

여기서 중요한 건 **'우선순위'**입니다. 모든 문제를 다 고칠 순 없습니다. 빈도수가 가장 높고, 비즈니스에 치명적인 문제(예: 고객에게 욕설을 하거나, 잘못된 법률 정보를 제공하는 것)를 찾아내야 합니다.

#### Step 3: 자비로운 독재자 (Benevolent Dictator)

이 과정에서 흔히 저지르는 실수가 '민주적인 합의'를 하려는 것입니다. "이 답변이 좋은가?"에 대한 기준은 사람마다 다릅니다. 여러 명이 모여 토론하느라 시간을 낭비하지 마세요.

**도메인 지식이 가장 풍부한 한 명(주로 PM이나 리드 엔지니어)이 기준을 잡고 빠르게 데이터를 라벨링**하는 것이 훨씬 효율적입니다. 초기 단계에서는 속도와 일관성이 완벽함보다 중요합니다.

![](https://eopla.net/file_path_host?token=aG96iSwhtQ2QMrGK0WM2tJ4yRGqUJxRC6lEum2KTYhAo8ymOgqvBgLOYsixp%2Ft0sTGaR7yOx96d8q2TQlrA5Fm%2F1VG5rO%2BNg%2F42bDiV6iNCb--ZRFVsHcoM9d0euHx--yNq2b%2FELhI4u4yVmr4vkjw%3D%3D)

### LLM을 판사로 세우기: 자동화 전략

패턴이 파악되었다면 이제 자동화할 차례입니다. 매번 사람이 로그를 볼 수는 없으니까요. 이때 LLM을 평가자(Judge)로 활용합니다.

여기서 핵심 팁은 **평가 기준을 단순화하는 것**입니다. "이 답변의 품질을 1~5점으로 평가해줘"라는 모호한 지시는 실패할 확률이 높습니다. 대신 **이진 분류(Binary) 질문을 던지세요.**

> "이 답변에 경쟁사 제품에 대한 언급이 포함되었는가? (True/False)"

명확한 기준은 LLM도 잘 판단합니다. 그리고 LLM이 내린 평가가 사람(Human)의 판단과 일치하는지 검증하는 과정을 거치면, 신뢰할 수 있는 자동 평가 파이프라인이 완성됩니다.

![](https://eopla.net/file_path_host?token=HRIej0R4GovNIbEiy5gJ1cox80KgC00T2M2CTmhUm29uZFRV3gqxSdiyOBAX5cZ1ylXjpw7Tpd56hN0moeTAtMJRNCQajXhxGY77nwqoZY%2FN--CYfxMDIky%2FplYcwe--ypym%2BHKnHvYuDPTAPPu5Mg%3D%3D)

### Evals는 '새로운 기획서(New PRD)'다

이러한 평가 체계 구축은 단순히 버그를 잡는 것을 넘어 제품 기획의 패러다임을 바꿉니다.

최근 주목받는 **에이전트(Agentic Workflow) 기반 서비스나 LangGraph 같은 복잡한 구조에서는 각 단계가 의도대로 작동하는지 확인하는 단위 테스트(Unit Test)가 필수적**입니다. 과거 제품 요구사항 정의서(PRD)에 "사용자에게 친절해야 한다"라고 적었다면, 이제는 **"사용자가 모욕적인 언사를 해도 정중하게 거절하는지 판단하는 테스트 케이스"** 자체가 기획서의 역할을 대신합니다.

### 비용 절감의 핵심 무기로서의 Evals

잘 짜인 Evals는 비용 절감의 핵심 무기가 됩니다. 우리는 불안하기 때문에 무조건 성능 좋은 고비용 모델(GPT-4o 등)을 씁니다. 하지만 **우리만의 평가 기준(Eval)이 있다면, 특정 태스크에서 더 저렴한 모델(GPT-4o-mini, Llama 3 등)이 동일한 점수를 내는지 테스트해 볼 수 있습니다.** 

평가를 통과한다면 과감하게 모델을 교체하여 운영 비용을 획기적으로 낮출 수 있습니다. 이는 막연한 불안감이 아닌 데이터 기반의 의사결정을 가능하게 합니다.

![](https://eopla.net/file_path_host?token=G%2FRYK5pGBamQ7beqUrfIPYfIA9XSMAtoD48BPiCLuz7LQiUMlBdquk%2FpSqxRyeEaOTpGG%2Faralh0vqu2JqvsUosL%2F8P00PWi%2BpeeJAf1u1SV--rnH2MBiGfRfRQfjh--2xDi6cZNAgKNuVDu%2BJFOGA%3D%3D)

### 완벽함을 버리고 데이터와 직면하라

많은 팀이 Evals를 "어렵고 복잡한 엔지니어링 과제"로 생각하여 시작조차 하지 못합니다. 하지만 목표는 완벽한 학술적 평가 지표를 만드는 것이 아닙니다. **오늘 우리 제품이 어제보다 나아졌는지 확인하는 것**입니다.

지금 당장 여러분의 AI 제품 로그를 열어 30분만 투자해서 유저들이 어떤 대화를 나누고 있는지, AI가 어디서 헤매고 있는지 눈으로 확인해 보세요. 그 '30분의 노가다'가 수천만 원짜리 툴보다 훨씬 강력한 인사이트를 줄 것입니다.

평가 시스템은 한 번에 완벽하게 구축하는 것이 아니라, 작은 규모로 시작해 점진적으로 확장하는 것입니다. 첫 50개의 로그 분석에서 시작해, 패턴을 발견하고, 이진 분류 기준을 만들고, LLM으로 자동화하고, 사람의 평가와 비교하며 신뢰도를 높여가는 이 반복 가능한 프로세스가 바로 AI 시대의 진정한 제품 개발 방법론입니다.

## References
- [AI시대 기획서(PRD)는 죽었다. 실리콘밸리가 지금 "Evals"에 목숨 건 이유 - 이오플래닛](https://eopla.net/magazines/36939&utm_source=lkd_organic&utm_medium=hiddenbook_evals&utm_campaign=eopla_article)
- [Why AI evals are the hottest new skill for product builders | Hamel Husain & Shreya Shankar - Lenny's Podcast](https://www.youtube.com/watch?v=BsWxPI9UM4c)
