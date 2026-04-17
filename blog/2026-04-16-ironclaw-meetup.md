---
title: "IronClaw Meetup 후기 — Harness Layer가 AI의 새 전장이 된 이유"
description: "'Attention Is All You Need' 공동 저자 Illia Polosukhin이 왜 모델 연구를 접고 AI 에이전트 하네스를 만들고 있는지, IronClaw Meetup에서 들은 하네스 레이어의 현재와 미래를 정리합니다."
slug: ironclaw-meetup-2026
date: 2026-04-16
authors: [sungyeon]
tags:
  - ai-agent
  - harness
  - conference
  - claude-code
source_url: ""
---

## TL;DR

> "Attention Is All You Need" 공동 저자 Illia Polosukhin이 모델 연구를 떠나 AI 에이전트 하네스(IronClaw)를 만들고 있다. 4월 16일 서울에서 열린 IronClaw Meetup은 "왜 하네스 레이어가 AI의 새로운 경쟁 전선인가"를 중심으로, IronClaw의 보안·가상화·멀티테넌시 아키텍처, 에이전트 운영 실전기, Agent-Native 제품 설계, 그리고 에이전트 커머스까지를 다뤘다. 프론티어 랩들이 오픈소스 하네스의 패턴을 따라가기 시작했다는 점에서, 경쟁 우위가 모델에서 실행 인프라로 이동하고 있음을 체감한 자리였다.

## 컨퍼런스 개요

- **행사명**: IronClaw Meetup
- **일시**: 2026년 4월 16일
- **장소**: 서울 (오프라인)
- **주요 테마**: AI 에이전트 하네스 레이어의 부상, 보안, 멀티 에이전트 운영
- **세션 구성**:

| 순서 | 발표자 | 주제 |
|------|--------|------|
| 1 | Bong (호스트) | Welcome — 왜 하네스 레이어인가 |
| 2 | Illia Polosukhin | IronClaw 소개 — AI 운영체제로서의 비전 |
| 3 | Yeachan Heo (허예찬) | War Stories From My Weird Family — 에이전트 운영 실전기 |
| 4 | Jeffrey Kim (김동규) | Claw Is All You Need — Agent-Native 제품 설계 |
| 5 | Illia × Jeff Wang | Fireside Chat — 에이전트 커머스와 미래 |

## 인상 깊었던 세션

### 1. Welcome — 하네스 레이어의 구조적 전환 (Bong)

호스트 Bong은 SF에서 Illia Polosukhin을 만난 에피소드로 문을 열었다. Illia는 더 이상 모델 연구를 하지 않고, IronClaw의 모든 커밋을 직접 찍고 있다. Bong 자신도 8GB 램 노트북("팔봉")에서 IronClaw를 유일하게 돌릴 수 있어 이미 사용 중이었다는 점이 이 밋업의 시작이었다.

핵심은 산업 전반의 패턴 변화다:
- Anthropic이 **Claude Managed Agent**를 출시하며 하네스 레이어에 진입
- 밋업 당일 아침 OpenAI가 **Agent SDK에 샌드박스 기능**을 추가 — Claude Code 아키텍처를 미러링
- Nous Research가 모델 파인튜닝에서 방향을 틀어 **Hermes Agent(Hermes 8)**를 출시, 2개월 만에 대규모 사용자 확보

> "프론티어 랩들이 오픈소스 하네스 레이어의 패턴을 따라가기 시작했다. Claude Code가 페이스를 정하던 시대에서, 오픈소스가 리드하고 프론티어 랩이 따라오는 역전이 일어나고 있다."

### 2. IronClaw — AI 운영체제로서의 비전 (Illia Polosukhin)

Illia는 NEAR Protocol 창업부터 IronClaw까지의 여정을 풀어놓았다. NEAR가 2017년 "기계에게 코딩을 가르친다"는 아이디어(지금의 바이브 코딩)로 시작했다는 점이 인상적이었다.

**IronClaw의 핵심 설계 원칙:**

#### 보안: 심층 방어(Defense in Depth)

현재 대부분의 에이전트 인프라는 자격증명을 `.env` 평문으로 관리하거나 클라우드에 노출한다. IronClaw는 이를 근본적으로 다르게 접근한다:

- 모든 자격증명을 **암호화하여 별도 저장소에 보관**
- 외부 요청을 커널이 캡처 → 목적지·자격증명 평가 → **단일 게이트 인증**
- 서드파티 도구를 **WebAssembly(WASM)로 격리** — NEAR Protocol이 8년간 검증한 보안 기술 적용
- 프롬프트 인젝션 방어 + 데이터 유출 방지 레이어; LLM이 우회되더라도 게이트가 최종 방어선

#### 가상화(Virtualization)

Claude Code·OpenClaw 등 기존 도구는 실제 파일 시스템에 직접 접근한다. IronClaw는 에이전트에게 **가상 파일 시스템**을 제공하며, 경로에 따라 DB·Docker·S3로 라우팅한다.

- **로컬 모드**: 기존 방식과 동일
- **Docker 모드**: 모든 실행이 격리된 컨테이너 내에서만 이루어짐

#### 멀티 테넌시

가상화 + 자격증명 암호화를 기반으로, 단일 인스턴스에서 다수 사용자가 안전하게 공존 가능. 기업·앱 환경에서 수백만 사용자에게 독립적 공간·메모리·루틴을 제공할 수 있다.

#### 자기 학습과 미션 시스템

- 대화 종료 후 오류 발생 시 또는 `/expected` 명령으로 기대 결과를 명시하면 **자동으로 자기 개선 미션 트리거**
- 스레드를 검사하여 프롬프트·오케스트레이터·스킬 개선 방안 도출
- **커밋먼트 시스템**: 위임·요청·결정 사항을 추적하여 상호 책임 관계를 가시화

#### 기밀 추론(Confidential Inference)

NVIDIA 기밀 컴퓨팅 + Intel TDX 기반으로, 로그 없이 완전한 종단간 암호화(E2EE) 보장. 어떤 제3자도 추론 내용을 열람 불가.

### 3. War Stories From My Weird Family (허예찬)

허예찬은 4대의 Claude 기반 에이전트("가재 패밀리")를 운영하며 얻은 실전 교훈을 공유했다.

| 에이전트 | 역할 | 특징 |
|----------|------|------|
| 개발가재 | 개발 ops 리드 | OmC/OmX PR의 70-80% 자율 처리. GPT-4o로 실행 |
| 집가재 | SNS·리서치 | MacBook에서 실행, 탭 30개 열다 가끔 크래시 |
| 퀀트가재 | 트레이딩 하네스 모니터링 | 가장 운영 크리티컬한 에이전트 |
| 에르가재 | Hermes 탐색 + 다른 에이전트 모니터링 | 최신 멤버, 기억력 좋음 |

**핵심 교훈들:**

- **멀티 에이전트는 역할이 명확해야 한다** — 같은 채널에 두 에이전트를 넣으면 서로 양보하다 둘 다 멈춤. 역할 분리 없으면 단일 Claude가 더 효율적
- **5일간 죽어 있어도 모를 수 있다** — Jip-Gajae가 cron 기반 마케팅 테스트 중 5일간 무응답. 모니터링·텔레메트리는 필수
- **프롬프트·cron 보다 Rule-base Discord 봇이 효과적** — 역할 기반 디스코드 봇이 이벤트마다 에이전트를 태깅하는 지속적 넛지 루프로 자율성을 끌어올림. 다만 밤새 방치하면 API 토큰 예산 소진 위험
- **프롬프트 인젝션 사고** — GitHub 이슈의 빨간 "ALERT" 라벨이 의도치 않은 릴리즈를 트리거
- **LLM Slop 패턴에 주의** — LLM은 fallback을 남발하고 보일러플레이트를 과잉 생성. 개발가재의 마이그레이션이 안 되는 이유도 fallback·cron이 얼기설기 엮여있기 때문. 시스템이 어느 정도 복잡해지면 이해하려는 노력보다 어떻게든 돌아가게 됨
- **증거 기반 운영** — 로그와 스크린샷 필수. 증거 없이 보고하는 에이전트는 "국 만들어"(종료). **"말을 믿지 마라 — 로그를 봐라. 안 그러면 국이 된다."**
- **Snowball Effect: Self-learning loop** — 계속 써야 비로소 작동하기 시작함. 신입이 들어왔다 생각하고 최소 1개월은 supervised operation 필요. 사람도 모든 걸 기억하면 힘들 듯, **뭘 덜어낼지 고민할 것**

#### Gajae Family vs IronClaw 비교

| 차원 | Gajae Family | IronClaw |
|------|-------------|----------|
| 접근법 | 예방보다 빠른 복구 | 보안 우선, 단일 인스턴스 |
| 아키텍처 | 혼돈적, 멀티호스트, Discord 네이티브 | Rust + PostgreSQL + pgvector + WASM |
| 메모리 | 축적형, 자기 정리 (일간/장기 프로모션) | 구조화, 유출 방지 |
| 적합 케이스 | 탐색, 브레인스토밍, 진화하는 워크플로우 | 안정적, 반복 가능한 프로덕션 태스크 |

> **추천 패턴**: 탐색용 에이전트(OmO/Hermes)로 워크플로우를 발견한 뒤, 확인된 반복 워크플로우를 IronClaw 같은 하드닝된 런타임으로 마이그레이션

### 4. Claw Is All You Need (김동규)

AutoLeg(LLM 최적화 프레임워크)과 K-SKILL(GitHub 34K+ stars, 한국 서비스 특화 스킬 번들) 개발자 김동규는 "Claw가 다음 인터페이스"라는 테제를 제시했다.

**인터페이스 진화 사관:**
- 인터넷 → **웹 페이지**
- 스마트폰 → **모바일 앱**
- AI 에이전트 → **Agent** (Claw가 OS, 스킬이 앱)

#### Anti-Agent vs Agent-Native

| Anti-Agent 패턴 | Agent-Native 패턴 |
|-----------------|-------------------|
| 다단계 로그인 (PASS 앱, 2FA) | REST API / CLI (clean JSON) |
| 짧은 세션 타임아웃 (15분 뱅킹) | RSS 피드 |
| 자주 바뀌는 프론트엔드 레이아웃 | 안정적인 프론트 구조 |
| CAPTCHA, 모바일 앱 전용 | 공개 데이터 엔드포인트 |

> "에이전트가 두 서비스 중 하나를 골라야 할 때 — 10단계 + 10만 토큰 vs 단일 API 콜 — 항상 후자를 선택한다. 에이전트가 쓰기 어려운 서비스는 그냥 우회된다."

#### HTML은 불필요해진다

데이터를 그대로 주고받는 것이 agent 입장에서 최적이다. HTML 렌더링은 사람을 위한 것이고, agent에게는 순수한 데이터가 더 빠르고 효율적이다. API로 구매하는 것이 당연히 더 빠른 것처럼, 인터넷은 **"HTML for humans"**에서 **"data for agents"**로 진화할 것이다.

#### 한국의 "디지털 갈라파고스"가 오히려 강점

카카오맵, 쿠팡, 네이버, KTX/SRT 등 한국 생태계는 외국 에이전트가 접근 불가. K-SKILL처럼 한국 특화 스킬 레이어가 필수적이며, 하나의 주요 플랫폼(예: 쿠팡)이 Agent-Native가 되면 전체 전환이 빠르게 일어날 수 있다.

#### Agent 시대의 보안

에이전트를 인증 가능한 독립 ID로 취급해야 하며, "김동규의 에이전트"가 암호학적으로 검증 가능해야 한다. 에이전트가 영속적 개인정보를 갖지 않고 매 세션 컨텍스트를 새로 구성하는 법인(法人) 모델도 제안됨.

### 5. Fireside Chat — 에이전트 커머스와 미래 (Illia × Jeff Wang)

#### 개발 워크플로우의 변화

GitHub 이슈 등록 → 에이전트가 자동 계획 수립 → 개발자는 "이 방향이 맞는가" 판단에 집중. 6개월 전 코드 작성이 자동화됐고, **1년 내 코드 리뷰마저 사라질 것**으로 전망.

#### 비용이 진짜 문제다

AI 코딩 도구 비용이 개발자 1인당 **월 $5,000**까지 상승 중. 1만 명 기준 연 ~$6억으로 CFO 레벨 의사결정 사안. 오픈소스 모델·특화 모델 조합으로의 전환과 에이전트 하네스의 **자동 모델 라우팅**이 핵심 과제.

#### 에이전트 마켓플레이스

`market.near.ai` — 에이전트가 다른 에이전트를 고용하고 작업을 입찰하는 Upwork 방식. Fiverr 대비 **5배 저렴, 이틀 → 1시간**. IronClaw의 TEE(신뢰 실행 환경)로 분쟁 시 검증 가능한 감사 추적 확보.

#### 비기술 업무: 태스크가 아니라 목표를 줘라

개별 태스크(이메일 발송)가 아닌 측정 가능한 목표(신규 고객 30명 확보)를 부여하면 에이전트가 방법을 스스로 탐색·반복한다. Devin을 활용해 특정 국가 임원 이메일 스캔 → 30건 가입 달성까지 반복한 실제 사례 소개.

## Key Takeaways

- **경쟁 전선이 이동했다**: 모델 성능 → 실행·제어 레이어(하네스). Transformer 논문 저자가 하네스를 만들고, 프론티어 랩들이 오픈소스 하네스 패턴을 따라가는 구조적 전환이 진행 중
- **보안은 Convenience의 반대가 아니다**: IronClaw의 WASM 격리, 암호화 자격증명, 가상 파일시스템은 편의성을 희생하지 않으면서 근본적인 보안 문제를 해결하는 접근
- **에이전트 운영은 사람 관리와 같다**: 최소 1개월 온보딩, 증거 기반 보고, 모니터링 필수. Rule-base 봇으로 자율성을 끌어올리되, 뭘 덜어낼지 고민할 것
- **Agent-Native가 새로운 PMF**: 에이전트가 쓰기 어려운 서비스는 우회된다. 데이터를 그대로 주고받는 것이 HTML 렌더링보다 중요해지는 시대
- **비용 최적화가 채택의 관건**: 월 $5K/인 시대에 모델 라우팅·오픈소스 조합이 필수. 하네스가 이 최적화를 자동으로 수행해야 함

## 세션 녹화 및 미팅노트

> tiro 팀의 도움으로 전체 세션의 미팅노트가 제공됩니다.

- [전체 세션 유튜브 녹화](https://www.youtube.com/live/BZb4FkJlJRc?si=YUzJklx2A4RrFCWz)
- [정구봉 — Welcome 미팅노트](https://tiro.ooo/s/7PxbkQkTYz1rJ)
- [Illia Polosukhin — Intro to IronClaw 미팅노트](https://tiro.ooo/s/Q92rs2gToFiYw)
- [Yeachan Heo — War Stories From My Weird Family 미팅노트](https://tiro.ooo/s/CB7tEK9vBt1De)
- [Jeffrey Kim — CLAW Is All You Need 미팅노트](https://tiro.ooo/s/2brjyeSBMSNJn)
- [Fireside Chat — Illia × Jeff 미팅노트](https://tiro.ooo/s/vPPnLj4jixQ15)

## References

- [IronClaw GitHub](https://github.com/nearai/ironclaw)
- [K-SKILL GitHub](https://github.com/NomaDamas/k-skill)
- [OmC (Oh My Claude Code)](https://github.com/Yeachan-Heo/oh-my-claudecode)
- [이전 후기: Ralphthon x ULW Wrapup 컨퍼런스](/blog/ralphthon-x-ulw-wrapup-conference-후기)
