# Braincache 배포 가이드

## 아키텍처

```
Notion (Document Hub / Knowledge)
        ↓  python3 main.py blog-generate / knowledge-generate
notion-slack/ (마크다운 생성 엔진)
        ↓  output → ../tech-blog/blog/ , ../tech-blog/knowledge/
tech-blog/ (Docusaurus 사이트)
        ↓  npm run build → vercel deploy
brain-cache.vercel.app (배포)
```

## 사전 준비

### 필수 도구
- Node.js 20+
- Python 3.9+
- Vercel CLI (`npm i -g vercel`)

### 환경변수 (notion-slack/.env)
```
NOTION_API_KEY=...
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
LLM_MODEL_ID=global.anthropic.claude-sonnet-4-5-20250929-v1:0
```

## 콘텐츠 생성

### Library (Document Hub → /blog)
```bash
cd /Users/sungyeon/Desktop/teddynote-lab/personal/notion-slack

# Done 상태 전체 문서 생성
python3 main.py blog-generate

# 특정 문서만 생성
python3 main.py blog-generate --id <notion-page-id>

# 미리보기 (파일 저장 안 함)
python3 main.py blog-generate --dry-run
```

### Knowledge (지식내재화 → /knowledge)
```bash
# Done 상태 전체 문서 생성
python3 main.py knowledge-generate

# 특정 문서만 생성
python3 main.py knowledge-generate --id <notion-page-id>

# 미리보기
python3 main.py knowledge-generate --dry-run
```

### 수동 글 작성
`tech-blog/blog/` 또는 `tech-blog/knowledge/`에 직접 마크다운 파일 추가 가능.

파일명 형식: `YYYY-MM-DD-slug.md`

frontmatter 예시:
```yaml
---
title: "글 제목"
description: "한 줄 설명"
slug: my-post-slug
date: 2026-03-25
authors: [braincrew]
tags:
  - llm
  - retrieval
---
```

## 로컬 테스트

```bash
cd /Users/sungyeon/Desktop/teddynote-lab/personal/tech-blog

# 개발 서버 (Hot Reload)
npm start

# 프로덕션 빌드 + 로컬 서빙
npm run build
npm run serve -- --port 3333
```

## 배포

### 방법 1: 한 줄 배포 (추천)

```bash
cd /Users/sungyeon/Desktop/teddynote-lab/personal/tech-blog
npm run build && cd build && vercel --prod --yes && vercel alias $(vercel ls --json 2>/dev/null | head -1) brain-cache.vercel.app
```

### 방법 2: 단계별 배포

```bash
# 1. 빌드
cd /Users/sungyeon/Desktop/teddynote-lab/personal/tech-blog
npm run build

# 2. 배포
cd build
vercel --prod --yes

# 3. 도메인 연결 (배포 후 출력된 URL 사용)
vercel alias <배포URL> brain-cache.vercel.app
```

### 방법 3: 전체 파이프라인 (Notion → 빌드 → 배포)

```bash
# 1. 콘텐츠 생성
cd /Users/sungyeon/Desktop/teddynote-lab/personal/notion-slack
python3 main.py blog-generate
python3 main.py knowledge-generate

# 2. 빌드 & 배포
cd /Users/sungyeon/Desktop/teddynote-lab/personal/tech-blog
npm run build && cd build && vercel --prod --yes

# 3. 도메인 연결
vercel alias <배포URL> brain-cache.vercel.app
```

## 배포 URL

| 용도 | URL |
|------|-----|
| Production | https://brain-cache.vercel.app |
| Vercel 대시보드 | https://vercel.com/seongyeon1s-projects/tech-blog |
| GitHub Repo | https://github.com/braincrew-lab/brain-cache |

## 사이트 구조

| 경로 | 설명 | Notion 소스 |
|------|------|-------------|
| `/blog` | Library - 외부 아티클 큐레이션 | Document Hub DB |
| `/knowledge` | Knowledge - 프로젝트 실전 경험 | 지식내재화 DB |
| `/docs` | Guides - 팀 내부 가이드라인 | 수동 작성 |

## 트러블슈팅

### Vercel 빌드 에러 시
서버 빌드 대신 로컬 빌드 후 `build/` 폴더를 직접 배포:
```bash
npm run build
cd build && vercel --prod --yes
```

### MDX 파싱 에러
`docusaurus.config.ts`에 `markdown: { format: 'md' }` 설정으로 순수 마크다운 모드 사용 중.
블로그 글에 `{}` 등 JSX 문법이 있으면 에러 발생하지 않음.

### Notion API 접근 에러
Notion 페이지가 "team-weekly-bot" 인테그레이션에 공유되어 있는지 확인:
페이지 우측 상단 `...` → Connections → team-weekly-bot 추가
