---
sidebar_position: 1
---

# Brain Cache

Brain Crew의 AI Research & Engineering 기술 블로그입니다.

실무에서 축적한 인사이트, 가이드라인, 논문 리뷰, 프로젝트 경험을 공유합니다.

## Content

| 섹션 | 설명 |
|------|------|
| [Library](/blog) | 외부 아티클, 논문 리뷰, 기술 레퍼런스를 AI Research Engineer 관점에서 큐레이션 |
| [Lab](/lab) | 직접 실험하고 리서치한 결과물 — Research, Experiments, Knowledge를 통합 |
| [Projects](/projects) | 회사 프로젝트 단위의 회고와 의사결정 기록 |
| [Seminar](/seminar) | 팀 내부 세미나 발표자료 및 스터디 정리 |
| Guides | 팀 내부 가이드라인, 실무 노하우 문서 (이 섹션) |

## 분류 기준: 콘텐츠의 원천(Origin)

콘텐츠가 **어디서 시작되었는가**를 기준으로 4개 영역을 나눕니다.

| 기준 | 메뉴 |
|------|------|
| 외부에서 가져온 지식 → 읽고 해석한 것 | **Library** |
| 내가 직접 만든 실험/연구 → 직접 실험하고 발견한 것 | **Lab** |
| 회사 프로젝트에서 나온 회고 → 프로젝트에서 배운 것 | **Projects** |
| 팀과 함께 나눈 발표 → 팀과 나눈 것 | **Seminar** |

### 판별 플로우

```
Q1. 팀 앞에서 발표한 자료인가?        → Yes → Seminar
Q2. 특정 회사 프로젝트의 회고인가?     → Yes → Projects
Q3. 직접 코드를 짜거나 실험을 돌렸는가? → Yes → Lab
Q4. 외부 자료를 읽고 정리/해석한 것인가? → Yes → Library
```

순서대로 질문하면 항상 하나의 메뉴에 도달합니다.

### 각 메뉴 상세

**Library** — 외부 소스 기반 큐레이션 + 내 해석. 외부 아티클 리뷰, 논문 리뷰, 기술 레퍼런스 정리, Document Hub 중 보편적 지식 전달 + 개인 인사이트가 담긴 포스트를 포함합니다.

**Lab** — 직접 손으로 돌려보고 얻은 결과물. Research(개인 리서치), Experiments(실험내역 + 인사이트), Knowledge(프로젝트 속 개인 실험내역)를 하나로 통합합니다. 세 가지는 모두 "직접 해본 것"이라는 공통점이 있고, 실제로 경계가 모호하기 때문입니다. Research → Experiment → Knowledge의 순환 관계를 가지며, 태그(`research`, `experiment`, `knowledge-note`)로 세분화합니다.

**Projects** — 프로젝트 단위의 회고록, 의사결정 기록, 아키텍처 선택 배경. Lab이 "주제 중심"이라면 Projects는 "프로젝트 타임라인 중심"으로, 읽는 사람의 진입 의도가 다릅니다.

**Seminar** — 세미나 발표자료, 스터디 정리, 워크숍 기록. 포맷이 다르고(슬라이드, 요약 + 영상 링크 등), 팀 문화를 보여주는 역할이 있어 독립 메뉴로 분리합니다.

## Topics

- LLM & Post Training
- RAG & Retrieval
- AI Agent
- Evaluation & Benchmarking
- Infrastructure & Serving
- Backend Engineering

## How It Works

블로그 글은 Notion Document Hub에서 자동 생성됩니다.

```bash
# Library 생성 (Notion Document Hub → 마크다운)
python3 main.py blog-generate

# Knowledge 생성 (Notion 지식내재화 → 마크다운)
python3 main.py knowledge-generate
```
