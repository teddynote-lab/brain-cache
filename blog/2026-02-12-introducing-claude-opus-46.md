---
title: "Introducing Claude Opus 4.6"
description: "Anthropic이 2026년 2월 5일 발표한 Claude Opus 4.6은 코딩 능력을 대폭 강화한 최상위 모델입니다. Opus급 최초로 1M 토큰 컨텍스트 윈도우를 지원하며, 컨텍스트 부패 문제를 크게 개선했습니다(MRCR v2에서 76% 달성). Terminal"
slug: introducing-claude-opus-46
date: 2026-02-12
authors: [sungyeon]
tags:
  - llm
  - reference
source_url: "https://www.anthropic.com/news/claude-opus-4-6?utm_source=ai-report.kdnuggets.com&utm_medium=newsletter&utm_campaign=claude-vs-openai"
---


# Introducing Claude Opus 4.6

## TL;DR
> Anthropic이 2026년 2월 5일 발표한 Claude Opus 4.6은 코딩 능력을 대폭 강화한 최상위 모델입니다. Opus급 최초로 1M 토큰 컨텍스트 윈도우를 지원하며, 컨텍스트 부패 문제를 크게 개선했습니다(MRCR v2에서 76% 달성). Terminal-Bench 2.0, Humanity's Last Exam, GDPval-AA 등 주요 벤치마크에서 업계 최고 성능을 기록했으며, GPT-5.2 대비 약 144 Elo 포인트 우위를 보입니다. Adaptive Thinking, Context Compaction, Agent Teams 등 새로운 플랫폼 기능을 제공하면서도 기존과 동일한 가격($5/$25 per million tokens)을 유지합니다.

## Key Takeaways
- **장기 에이전틱 작업에 최적화**: 더 신중한 계획 수립, 대규모 코드베이스 안정 작동, 자체 코드 리뷰 및 디버깅 능력으로 실제 프로덕션 환경에서 활용 가능
- **1M 토큰 컨텍스트 윈도우**: Opus급 최초 지원으로 컨텍스트 부패 문제 해결(Sonnet 4.5 대비 4배 이상 개선), Context Compaction 베타로 무한 대화 세션 가능
- **실무 지식 작업 압도적 우위**: GDPval-AA에서 GPT-5.2보다 144 Elo 포인트 높아 금융, 법률 등 전문 도메인 작업에서 70% 승률
- **세밀한 추론 제어**: Adaptive Thinking으로 자동 사고 확장, Effort 제어(low/medium/high/max)로 지능-속도-비용 트레이드오프 조절 가능
- **엔터프라이즈 통합 강화**: Excel/PowerPoint 네이티브 통합, Agent Teams 병렬 협업, US-only 추론 옵션으로 기업 워크플로우에 즉시 적용 가능

## 상세 내용

### 모델 개요 및 핵심 개선사항

Claude Opus 4.6은 Anthropic이 2026년 2월 5일 발표한 최신 최상위 모델로, 이전 세대 대비 **코딩 능력의 질적 도약**이 가장 두드러진 특징입니다. 단순히 코드를 생성하는 수준을 넘어, 더욱 신중하게 계획을 수립하고, 에이전틱 작업을 장시간 유지하며, 대규모 코드베이스에서 안정적으로 작동합니다. 특히 자체 코드 리뷰와 디버깅 기능을 통해 스스로 실수를 포착하고 수정하는 능력은 실제 프로덕션 환경에서의 신뢰도를 크게 높입니다.

**1M 토큰 컨텍스트 윈도우**(베타)는 Opus급 모델로는 최초로 적용된 기능입니다. 긴 문맥에서 발생하는 "컨텍스트 부패(context rot)" 문제—모델이 긴 입력의 중간 부분을 제대로 처리하지 못하는 현상—가 극적으로 개선되었습니다. MRCR v2 벤치마크에서 Sonnet 4.5가 18.5%를 기록한 반면, Opus 4.6은 76%를 달성하여 약 4배 이상의 성능 향상을 보였습니다.

### 벤치마크 성능: 업계 최고 수준 입증

Opus 4.6은 다양한 벤치마크에서 업계 최고 성능을 입증했습니다:

**Terminal-Bench 2.0** (에이전틱 코딩): 전체 모델 중 최고 점수를 기록했습니다. 이는 실제 터미널 환경에서 복잡한 코딩 작업을 자율적으로 수행하는 능력을 측정하는 평가입니다.

**Humanity's Last Exam** (복합 추론): 다학제적 복잡 추론을 요구하는 이 테스트에서 프론티어 모델 중 1위를 차지했습니다.

**GDPval-AA** (실무 지식 작업): 금융, 법률 등 전문 도메인의 경제적 가치가 있는 지식 작업을 평가하는 벤치마크에서, GPT-5.2 대비 약 144 Elo 포인트, 전작 Opus 4.5 대비 190 포인트 앞섰습니다. 이는 GPT-5.2와의 직접 대결에서 약 70% 확률로 승리한다는 의미입니다.

**BrowseComp** (온라인 정보 탐색): 찾기 어려운 온라인 정보를 탐색하고 활용하는 능력에서 업계 최고를 기록했습니다.

**생명과학 분야**: 계산 생물학, 구조 생물학, 유기화학 등에서 Opus 4.5 대비 거의 2배의 성능 향상을 보였습니다.

**사이버보안**: 노르웨이 중앙은행 투자관리국(NBIM) 테스트에서 40건의 조사 중 38건에서 Opus 4.5를 블라인드 비교로 이겼습니다.

### 개발자를 위한 새로운 API 기능

**Adaptive Thinking**은 모델이 문맥을 분석하여 확장 사고(extended thinking)를 사용할지 자동으로 판단하는 기능입니다. 간단한 질문에는 빠르게 응답하고, 복잡한 문제에는 깊이 사고하여 효율성과 품질을 동시에 최적화합니다.

**Effort 제어**는 4단계(low / medium / high(기본) / max)로 모델의 지능, 속도, 비용 간 트레이드오프를 세밀하게 조절할 수 있게 합니다. 간단한 작업에는 low를 사용해 비용을 절감하고, 중요한 작업에는 max를 설정해 최대 성능을 끌어낼 수 있습니다.

**Context Compaction**(베타)은 긴 대화에서 게임 체인저입니다. 오래된 컨텍스트를 자동으로 요약하여, 컨텍스트 윈도우 한계에 부딪히지 않고 장기 작업을 수행할 수 있습니다. 이는 며칠에 걸친 프로젝트나 수백 번의 대화가 필요한 복잡한 작업에서 특히 유용합니다.

**128k 출력 토큰**: 대규모 코드베이스나 긴 문서를 한 번에 생성할 수 있어, 여러 번에 걸쳐 출력을 이어붙이는 번거로움이 사라집니다.

**US-only 추론**: 미국 내 데이터 처리가 규제로 요구되는 경우, 1.1배 가격으로 미국 내에서만 추론을 실행하는 옵션을 제공합니다.

### Claude Code: Agent Teams 도입

**Agent Teams**(리서치 프리뷰)는 여러 에이전트를 병렬로 가동하여 팀처럼 협업하게 하는 기능입니다. 대규모 코드베이스 리뷰처럼 독립적이고 읽기 중심인 작업을 여러 에이전트가 동시에 수행하면, 단일 에이전트보다 훨씬 빠르게 작업을 완료할 수 있습니다.

### 오피스 통합: Excel과 PowerPoint

**Claude in Excel**은 장기 실행 작업, 비정형 데이터 자동 구조화, 멀티 스텝 변경 한 번에 처리 등의 성능이 크게 개선되었습니다. 복잡한 데이터 분석과 변환 작업을 자연어로 지시하면 Claude가 자동으로 수행합니다.

**Claude in PowerPoint**(리서치 프리뷰)는 기존 레이아웃, 폰트, 슬라이드 마스터를 읽어 브랜드 가이드라인에 맞는 프레젠테이션을 생성합니다. Max, Team, Enterprise 플랜에서 사용 가능하며, 실무에서 프레젠테이션 제작 시간을 획기적으로 단축할 수 있습니다.

### 안전성: 업계 최고 수준 유지

Opus 4.6은 전작 Opus 4.5(발표 당시 업계 최고 수준)와 동등하거나 그 이상의 안전 프로필을 보입니다. 기만, 아첨, 사용자 착각 강화, 오용 협력 등의 비정렬 행동(misaligned behavior) 비율이 낮으며, **과잉 거부(over-refusal) 비율은 최근 Claude 모델 중 최저**입니다. 이는 모델이 안전하면서도 불필요하게 요청을 거부하지 않아 실용성이 높다는 의미입니다.

사이버보안 능력이 강화됨에 따라, Anthropic은 6개의 새로운 사이버보안 프로브(probe)를 개발하여 악용 가능성을 탐지하고 있습니다. 동시에 오픈소스 취약점 발견 및 패치 같은 방어적 활용도 가속화하고 있습니다.

### 가격 정책

기존과 동일하게 입력 $5, 출력 $25 (백만 토큰당)를 유지합니다. 200k 토큰을 초과하는 경우 프리미엄 가격($10/$37.50)이 적용됩니다. 성능이 대폭 향상되었음에도 가격을 동결한 것은 주목할 만합니다.

### 얼리 액세스 파트너 반응

Notion, GitHub, Replit, Cursor, Shopify, Figma, Harvey(법률), Rakuten 등 20개 파트너가 얼리 액세스 프로그램에 참여했습니다. 이들이 공통적으로 강조한 것은:
- 복잡한 작업의 자율 수행 능력
- 장기 작업 지속력
- 대규모 코드베이스 탐색 능력
- 이전 모델이 실패했던 곳에서의 성공

특히 Harvey는 법률 도메인에서, Replit과 Cursor는 코딩 워크플로우에서 실질적인 생산성 향상을 보고했습니다.

## References
- [Introducing Claude Opus 4.6 - Anthropic](https://www.anthropic.com/news/claude-opus-4-6?utm_source=ai-report.kdnuggets.com&utm_medium=newsletter&utm_campaign=claude-vs-openai)
- [Claude API Pricing](https://www.anthropic.com/pricing)
- [Claude Code Documentation](https://www.anthropic.com/claude-code)
