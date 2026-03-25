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
| [Knowledge](/knowledge) | 프로젝트 실전 경험에서 얻은 인사이트, 문제 해결 과정, 의사결정 맥락 |
| Guides | 팀 내부 가이드라인, 실무 노하우 문서 (이 섹션) |

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
