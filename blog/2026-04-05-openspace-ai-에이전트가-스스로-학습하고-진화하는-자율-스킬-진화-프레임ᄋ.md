---
title: "OpenSpace: AI 에이전트가 스스로 학습하고 진화하는 자율 스킬 진화 프레임워크 (feat. HKUDS)"
description: "HKUDS의 OpenSpace는 AI 에이전트가 작업 실행 중 자동으로 스킬을 진화시키는 프레임워크로, AUTO-FIX(깨진 스킬 복구), AUTO-IMPROVE(성공 패턴 정제), AUTO-LEARN(트레이스 기반 워크플로 추출) 3가지 메커니즘으로 작동합니다. GDPVal 벤치마크에서 동일 LLM(Qwen 3.5-Plus) 기준 토큰 46% 절감과 품질"
slug: openspace-ai-에이전트가-스스로-학습하고-진화하는-자율-스킬-진화-프레임ᄋ
date: 2026-04-05
authors: [braincrew]
tags:
  - knowledge-sharing
source_url: "https://discuss.pytorch.kr/t/openspace-ai-feat-hkuds/9476"
---

# OpenSpace: AI 에이전트가 스스로 학습하고 진화하는 자율 스킬 진화 프레임워크 (feat. HKUDS)

## TL;DR
> HKUDS의 OpenSpace는 AI 에이전트가 작업 실행 중 자동으로 스킬을 진화시키는 프레임워크로, AUTO-FIX(깨진 스킬 복구), AUTO-IMPROVE(성공 패턴 정제), AUTO-LEARN(트레이스 기반 워크플로 추출) 3가지 메커니즘으로 작동합니다. GDPVal 벤치마크에서 동일 LLM(Qwen 3.5-Plus) 기준 토큰 46% 절감과 품질 30포인트 향상을 달성했으며, 특히 컴플라이언스 영역에서 +18.5p의 개선을 보였습니다. 진화된 165개 스킬 분석 결과 대부분이 도메인 지식이 아닌 "도구 신뢰성·오류 복구" 관련이었다는 점은 에이전트의 실제 병목이 환경 적응력임을 실증합니다. MCP 프로토콜로 Claude Code, Codex 등 기존 에이전트에 통합 가능하며, 스킬 출처를 IMPORTED/CREATED/DERIVED/FIXED/CAPTURED로 분류 추적해 감사 추적과 롤백이 가능합니다.

## **Key Takeaways**

- AI 에이전트가 작업하면서 "스킬" 을 자동 진화시킨다는 발상이 핵심 — AUTO-FIX(깨진 스킬 복구) · AUTO-IMPROVE(성공 패턴 정제) · AUTO-LEARN(실행 트레이스에서 워크플로 추출) 3 축으로 작동.
- GDPVal 벤치마크에서 **동일 LLM(Qwen 3.5-Plus)** 으로 **46% 적은 토큰** + **30 포인트 높은 품질** 달성 — 단순 성능이 아니라 토큰 경제성까지 잡은 점이 실무적으로 강력.
- 진화된 스킬 165 개 중 다수가 도메인 지식이 아니라 **"도구 신뢰성·오류 복구"** 였다는 분석. 에이전트의 실제 병목이 "더 똑똑해지는 것" 이 아니라 "환경에서 살아남는 것" 이라는 실증.
- `open-space.cloud` 의 **공유 스킬 리포지토리** — 한 에이전트의 개선이 커뮤니티 전체로 파급되는 네트워크 효과 설계.
- Claude Code · Codex · Cursor 등 스킬 지원 에이전트와 **MCP 로 통합** 가능 → 우리가 쓰는 에이전트 위에 얹는 형태로 도입 검토 가능.

## **OpenSpace 가 제안하는 것 — "작업 실행 = 학습"**

홍콩대학교 데이터 과학 연구소(HKUDS) 가 [PyTorch Korea 커뮤니티에 소개](https://discuss.pytorch.kr/t/openspace-ai-feat-hkuds/9476) 한 [OpenSpace](https://github.com/HKUDS/OpenSpace) 는 AI 에이전트가 작업을 수행하는 것 자체를 학습 사이클로 본다. **작업 실행 → 실행 트레이스 분석 → 스킬 추출·정제·복구 → 다음 실행에서 재사용**. 이 루프가 자동으로 돌아가면서 시간이 갈수록 같은 작업이 더 빠르고 더 싸게 처리된다.
기존 AI 에이전트의 가장 흔한 실패 패턴은 도구 버전이 바뀌거나 환경이 미세하게 달라졌을 때 기존 방식이 조용히 깨지면서 성능 저하가 누적되는 것. OpenSpace 는 이걸 자동 복구로 처리하는 것을 가장 큰 차별점으로 제시한다.

![OpenSpace 자기진화 아키텍쳐](/img/blog/openspace-ai-에이전트가-스스로-학습하고-진화하는-자율-스킬-진화-프레임ᄋ/img-00-0645a1d94b.png)


## **자기 진화 4 모듈**

- **AUTO-FIX**: 도구 버전 변경·실행 환경 변동으로 깨진 스킬을 자동 수리. 도메인별(문서 / 컴플라이언스 / 엔지니어링 등) 오류 상황에 대응.
- **AUTO-IMPROVE**: 성공한 실행 패턴을 감지해서 더 효율적인 버전으로 정제. 동일 작업의 반복 비용이 시간이 갈수록 떨어진다.
- **AUTO-LEARN**: 실행 트레이스에서 재사용 가능한 워크플로를 자동 추출. 비슷한 작업이 들어오면 처음부터 LLM 으로 추론할 필요가 없다.
- **다중 레이어 품질 모니터링**: 성능 저하를 실시간 감지하고 즉시 복구를 트리거.
위 4 개가 만들어내는 스킬은 출처에 따라 5 가지로 분류된다. **IMPORTED**(커뮤니티 다운로드) / **CREATED**(새 작업에서 생성) / **DERIVED**(AUTO-IMPROVE 결과) / **FIXED**(AUTO-FIX 결과) / **CAPTURED**(AUTO-LEARN 결과). 출처 추적이 가능한 덕분에 신뢰도와 롤백 포인트가 명확해진다.

## **벤치마크: GDPVal 결과**

GDPVal 은 6 개 산업군(문서·컴플라이언스·미디어·엔지니어링·스프레드시트·전략 분석) 에서 50 개 전문 작업을 수행하는 벤치마크.
| **카테고리** | **Phase 1** | **Phase 2** | **개선** |
| 컴플라이언스 & 양식 | 51% | 70% | +18.5p |
| 엔지니어링 | 70% | 78% | +8.7p |
| 스프레드시트 | 63% | 70% | +7.3p |
| 미디어 제작 | 53% | 58% | +5.8p |
| 문서 & 서신 | 71% | 74% | +3.3p |
| 전략 분석 | 88% | 89% | +1.0p |
**컴플라이언스 영역의 +18.5 포인트 점프** 가 인상적. 정형화된 규칙을 따라야 하는 도메인일수록 스킬 진화의 가치가 크다는 신호로 읽을 수 있다. Phase 1 에서 진화된 스킬 165 개 중 다수가 도메인 지식이 아니라 도구 신뢰성·오류 복구였다는 점은, 에이전트의 실제 병목이 "환경에서 살아남는 것" 이라는 실증.

## **도입 경로 — MCP / 독립형 / CLI**

OpenSpace 는 두 가지 통합 방식을 제공한다.
**Path A — MCP 서버**: `mcp_config.json` 에 `openspace-mcp` 등록 후 핵심 스킬(`delegate-task`, `skill-discovery`) 을 에이전트의 skill 디렉토리에 복사. Claude Code · Codex 등에 그대로 얹을 수 있다.
**Path B — 독립형 Python**:

```python
import asyncio
from openspace import OpenSpace

async def main():
    async with OpenSpace() as cs:
        result = await cs.execute("Docker 컨테이너 모니터링 대시보드 만들기")
        print(result["response"])

asyncio.run(main())
```

추가로 `openspace` CLI 직접 실행, `openspace-dashboard` 로컬 대시보드(백엔드 :7788 + 프론트엔드 Node.js ≥20) 도 제공된다. 데이터는 SQLite(`showcase/.openspace/openspace.db`) 에 저장되며 직접 탐색 가능 — 에이전트가 무엇을 어떻게 학습했는지 **감사 추적이 된다**는 점이 운영 관점에서 의미 있다.

## **우리 관점에서**

- 현재 우리 RAG / Agent 시스템에서도 시간이 지나면서 외부 도구(검색 API · 임베딩 모델 SDK 등) 버전 변경으로 깨지는 케이스가 발생한다. OpenSpace 의 AUTO-FIX 같은 메커니즘을 자체 구축하기보단 **MCP 통합으로 얹어서 검증** 해볼 가치가 있다.
- "스킬의 출처 5 분류" 는 우리도 흉내낼 만한 패턴 — 우리 에이전트가 만들어내는 스킬·프롬프트·체인을 IMPORTED / CREATED / DERIVED / FIXED / CAPTURED 메타데이터로 태깅하면 향후 디버깅·롤백 포인트가 분명해진다.
- **토큰 -46% / 품질 +30p** 의 핵심은 "성공 사례 캐싱". 우리 에이전트의 성공 트레이스를 별도 저장하고 재사용 후보로 등록만 해도, 진화 자동화 없이 비슷한 효과의 일부는 가져올 수 있을 것으로 보인다 — 가벼운 적용 시도부터.
- 다만 `open-space.cloud` 의 **공유 스킬 리포지토리** 는 보안·라이선스 검토 없이 곧바로 사내 도입은 어렵다. 외부 스킬을 IMPORTED 로 가져올 때 입력·출력 검증 레이어가 필수.


## 참고자료

- [https://open-space.cloud/?utm_source=pytorchkr&ref=pytorchkr](https://open-space.cloud/?utm_source=pytorchkr&ref=pytorchkr)
- [https://github.com/HKUDS/OpenSpace?utm_source=pytorchkr&ref=pytorchkr](https://github.com/HKUDS/OpenSpace?utm_source=pytorchkr&ref=pytorchkr)

## References
- [https://discuss.pytorch.kr/t/openspace-ai-feat-hkuds/9476](https://discuss.pytorch.kr/t/openspace-ai-feat-hkuds/9476)
- [https://github.com/HKUDS/OpenSpace](https://github.com/HKUDS/OpenSpace)
- [https://open-space.cloud/?utm_source=pytorchkr&ref=pytorchkr](https://open-space.cloud/?utm_source=pytorchkr&ref=pytorchkr)
- [https://github.com/HKUDS/OpenSpace?utm_source=pytorchkr&ref=pytorchkr](https://github.com/HKUDS/OpenSpace?utm_source=pytorchkr&ref=pytorchkr)
