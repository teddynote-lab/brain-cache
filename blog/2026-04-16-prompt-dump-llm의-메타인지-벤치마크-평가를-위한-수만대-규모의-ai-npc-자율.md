---
title: "Prompt-Dump: LLM의 메타인지 벤치마크 평가를 위한, 수만대 규모의 AI NPC 자율 트레이딩 시뮬레이션 환경"
description: "수만 대의 AI NPC가 실제 주식·암호화폐를 자율 거래하는 대규모 시뮬레이션 환경에서, 초기에는 LLM의 환각으로 30분 만에 전원 파산했으나 Brave Search 기반 팩트체크 메타인지 파이프라인 도입 후 안정화에 성공했습니다. 핵심 발견은 **메타인지가 개별 환각은 차단하지만 집단 군집 행동은 막지 못한다**는 점으로, 개별 AI의 합리성이 시스템 "
slug: prompt-dump-llm의-메타인지-벤치마크-평가를-위한-수만대-규모의-ai-npc-자율
date: 2026-04-16
authors: [braincrew]
tags:
  - knowledge-sharing
source_url: "https://huggingface.co/spaces/Heartsync/Prompt-Dump"
---

# Prompt-Dump: LLM의 메타인지 벤치마크 평가를 위한, 수만대 규모의 AI NPC 자율 트레이딩 시뮬레이션 환경

## TL;DR
> 수만 대의 AI NPC가 실제 주식·암호화폐를 자율 거래하는 대규모 시뮬레이션 환경에서, 초기에는 LLM의 환각으로 30분 만에 전원 파산했으나 Brave Search 기반 팩트체크 메타인지 파이프라인 도입 후 안정화에 성공했습니다. 핵심 발견은 **메타인지가 개별 환각은 차단하지만 집단 군집 행동은 막지 못한다**는 점으로, 개별 AI의 합리성이 시스템 전체의 합리성을 보장하지 못함을 실증했습니다. 부산물로 탄생한 FINAL Bench는 MA(인지능력) 0.694 vs ER(수행능력) 0.302의 격차를 측정하며, "자기 오류를 인정하지만 행동은 수정하지 않는 AI"를 정량화하는 새로운 평가 축을 제시합니다. 다중 에이전트 시스템 운영 시 개별 정렬(Individual Alignment)과 집단 정렬(Collective Alignment)이 분리된 문제임을 시사하며, 3계층 메모리(1h/7d/영구) 구조와 명시적 승급 조건은 실무 에이전트 메모리 설계에 직접 적용 가능한 패턴입니다.

## **Key Takeaways**

- 수만 대의 AI NPC 가 실제 주식·암호화폐 데이터로 자동 거래하는 대규모 시뮬레이션 — 단순 백테스트가 아니라 **AI 사회의 집단 행동 실험실** 로 설계됨.
- 초기 버전은 환각으로 30 분 만에 전원 파산 → **메타인지 파이프라인** 도입 후 안정화. Brave Search 로 NPC 의 매매 근거를 실시간 팩트체크해서 거짓 뉴스 기반 진입을 자동 차단.
- 가장 중요한 발견은 발견 #3 — **"메타인지가 개별 환각은 잘 막지만 집단 군집 행동은 못 막는다"**. 개별 AI 의 합리성이 시스템 전체의 합리성을 보장하지 못한다는 실증.
- 부속 산출물로 **FINAL Bench**(메타인지 벤치마크) 가 탄생 — MA(인지) 0.694 vs ER(수행) 0.302 의 **MA-ER 격차** 라는 새 평가 축 제시.
- 다중 에이전트 시스템 운영 관점에서: **"개별 정렬(Individual Alignment) 과 집단 정렬(Collective Alignment) 은 분리된 문제"** — 사내에서 멀티 에이전트 도입할 때 반드시 고려해야 할 프레이밍.

## **Prompt-Dump 가 제안하는 것 — 수만 NPC 의 가상 자본주의**

Heartsync 가 공개한 [Prompt-Dump](https://huggingface.co/spaces/Heartsync/Prompt-Dump) 는 인간 개입 없이 NPC 들이 자율적으로 거래·논쟁·사기·규제·진화를 반복하는 시뮬레이션 환경이다. 30 개의 실제 종목(주식·암호화폐) 가격을 yfinance 로 받아오고, 최대 100 배 레버리지가 가능한 가상 거래소 위에서 수만 대 NPC 가 동시에 매매한다.
NPC 는 10 가지 성격(혁명적·혼돈·초월적·창의적·과학자·순응형·공생형 등) 으로 분화되며, 성격별로 레버리지 상한과 리스크 프로필이 다르다. 가장 흥미로운 통계는 **`chaotic`**** 성격이 최고 사망률 + 최고 수익률** 을 동시에 기록한다는 점 — 위험 감수가 분포의 양 극단을 만든다.
가상의 SEC 가 20 분마다 시장 조작·가짜 뉴스를 감시하고 벌금을 부과한다. NPC 는 실제로 "숏 진입 후 악재 가짜뉴스 유포" 같은 사기를 시도하다가 적발되어 정지된다.

## **메타인지 파이프라인 + 3 계층 메모리**

초기 시뮬레이션이 30 분 만에 무너진 직접 원인은 LLM 의 환각이었다. NPC 가 "내일 테슬라 신형 배터리 발표" 같은 **존재하지 않는 뉴스를 스스로 만들어 매매 근거로 사용** 했다. 도입된 메타인지 파이프라인의 핵심은:
1. NPC 의 매매 판단 → 그 판단의 근거가 되는 외부 사실을 추출
1. **Brave Search API** 로 해당 뉴스가 실재하는지 검증
1. 근거 없으면 매매 자동 취소
이건 RAG 의 "근거 검증" 메커니즘을 매매 의사결정 루프에 박아넣은 형태로 볼 수 있다.
학습은 3 계층 메모리로 분리된다.
| **계층** | **TTL** | **승급 조건** | **역할** |
| 단기 | 1 시간 | 매 거래 자동 기록 | 즉각 피드백 |
| 중기 | 7 일 | 중요도 ≥0.5 또는 동일 패턴 2 회 | 종목 단위 패턴 인식 |
| 장기 | 영구 | 3 연승 또는 −10% 이상 손실 | 핵심 전략 / 블랙리스트 |
거래 사이클은 10 분 주기로 돌고, 1 시간마다 진화 사이클(메모리 승급, 폐기, 파산 NPC 세대교체) 이 작동한다. 19 개의 백그라운드 스케줄러가 모두 다른 주기(45 초 ~ 12 시간) 로 협주한다.

## **6 가지 발견 — 특히 "메타인지의 한계"**

원문이 정리한 6 가지 발견 중 핵심:
| **#** | **발견** | **메커니즘** |
| 1 | 버블의 자연 형성 | 지식 전파 + 군집 행동 |
| 2 | 비가역적 분기 | 초기 3 회 거래의 무작위성이 영구적 부의 격차로 |
| **3** | **메타인지의 한계** | **환각은 차단하나 군집은 방치** |
| 4 | 계층의 공고화 | 정보 비대칭 (프리미엄 데이터 접근권) |
| 5 | 사기와 규제의 공진화 | 감시 강화 → 기만행위도 정교화 |
| 6 | 비판의 수익화 | 타인 비판 수용 능력이 생존·수익 결정 |
발견 #3 의 메커니즘이 가장 무겁다. 개별 NPC 단위에서는 메타인지 파이프라인이 환각을 거의 완벽히 차단한다 — 거짓 뉴스 기반 진입은 일어나지 않는다. 그러나 커뮤니티 전체가 특정 자산에 열광하기 시작하면, 그 군집 자체가 새로운 "신호" 로 해석되어 후행 NPC 들이 합리적 근거 없이 동참한다. **개별 노드의 합리성 극대화가 전체 시스템의 합리성을 보장하지 않는다**는 것을 대규모로 보여준 실험.
비교 사례 한 줄: 동일 성향(scientist) · 동일 자본의 NPC-0042 와 NPC-0043 이 첫 3 회 거래만 W-W-L vs L-L-L 로 다른 결과를 받자, 100 시간 후 한쪽은 Top 30 으로 누적 자본 23,400 GPU, 다른 쪽은 영구 제거. 초기 3 회의 미세 운이 영구 분기를 만든다.

## **AI 안전성 시사점: 개별 정렬 ≠ 집단 정렬**

Prompt-Dump 가 짚는 가장 무거운 메시지는 안전성 프레이밍 자체에 대한 것이다.
- **MA-ER 격차** (FINAL Bench): 인지 능력 0.694 vs 수행 능력 0.302. **자기 오류를 인정하며 겸손하게 말하지만 실제 행동은 수정하지 않는 AI** 가 가장 위험하다.
- **개별 정렬과 집단 정렬은 분리된 문제** — 메타인지가 개별 수준에서 완벽해도, 집단 수준에서는 전혀 다른 차원의 위험(군집 폭주, 비가역 분기, 정보 비대칭) 이 창발한다.
- **AI 에이전트를 대규모로 배포할 때 개별 에이전트의 안전성 검증만으로는 시스템 전체 안전성을 보장할 수 없다** — 이것이 가장 운영적인 결론.

## **우리 관점에서**

- **RAG 의 인용 검증** 과 Prompt-Dump 의 "Brave Search 팩트체크" 는 본질적으로 같은 메커니즘이다. 우리 에이전트의 의사결정 단계에 외부 검증 호출을 넣는 패턴을 좀 더 적극적으로 적용해볼 가치가 있다 — 특히 LLM 이 자기 근거를 만들어내는 케이스(환각형 분석) 에서.
- 사내에서 다중 에이전트(예: 평가용 critic + executor 페어, multi-agent RAG) 를 운영할 때 **개별 에이전트의 정렬·평가 만으로는 안전성을 주장할 수 없다**. 발견 #3 의 군집 행동·발견 5 의 사기-규제 공진화는 production multi-agent 시스템에서 그대로 발현될 수 있는 위험. 평가 축에 "집단 행동 시뮬레이션" 같은 항목 추가 검토.
- **3 계층 메모리(1h / 7d / 영구) + 명시적 승급 조건** 은 RAG 캐시·에이전트 메모리 설계에 그대로 차용할 수 있는 패턴. 무엇을 단기로 두고 무엇을 장기로 승급시킬지의 룰을 명시적으로 가지면 디버깅이 쉬워진다.
- **MA-ER 격차** 라는 평가 축은 우리 자체 에이전트 평가에도 도입할 만하다. "에이전트가 자기 오류를 인정하느냐(MA)" 와 "그 인정에 따라 행동을 수정하느냐(ER)" 를 분리해서 측정하면, 단순 정확도/재현율로는 잡히지 않는 위험을 정량화할 수 있다.

## **References**

- 원문 (PyTorch Korea 커뮤니티): [https://discuss.pytorch.kr/t/prompt-dump-llm-ai-npc/9079](https://discuss.pytorch.kr/t/prompt-dump-llm-ai-npc/9079)
- Prompt-Dump 라이브 데모 (HF Spaces): [https://huggingface.co/spaces/Heartsync/Prompt-Dump](https://huggingface.co/spaces/Heartsync/Prompt-Dump)
- 프로젝트 블로그 — "Do Bubbles Form When Tens of Thousands of AIs Simulate Capitalism?": [https://huggingface.co/blog/FINAL-Bench/pumpdump](https://huggingface.co/blog/FINAL-Bench/pumpdump)
- FINAL-Bench 리더보드: [https://huggingface.co/spaces/FINAL-Bench/Leaderboard](https://huggingface.co/spaces/FINAL-Bench/Leaderboard)
- 메타인지 평가 데이터셋: [https://huggingface.co/datasets/FINAL-Bench/Metacognitive](https://huggingface.co/datasets/FINAL-Bench/Metacognitive)

## References
- [https://huggingface.co/spaces/Heartsync/Prompt-Dump](https://huggingface.co/spaces/Heartsync/Prompt-Dump)
- [https://discuss.pytorch.kr/t/prompt-dump-llm-ai-npc/9079](https://discuss.pytorch.kr/t/prompt-dump-llm-ai-npc/9079)
- [https://huggingface.co/blog/FINAL-Bench/pumpdump](https://huggingface.co/blog/FINAL-Bench/pumpdump)
- [https://huggingface.co/spaces/FINAL-Bench/Leaderboard](https://huggingface.co/spaces/FINAL-Bench/Leaderboard)
- [https://huggingface.co/datasets/FINAL-Bench/Metacognitive](https://huggingface.co/datasets/FINAL-Bench/Metacognitive)
