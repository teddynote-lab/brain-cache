# Tech Blog (Braincache)

## Overview
- Docusaurus 3 기반 기술 블로그
- URL: https://braincrew-lab.github.io/brain-cache/
- 배포: GitHub Pages (main push 시 자동, `.github/workflows/deploy.yml`)

## Blog Structure

```
blog/       — Library: 외부 아티클 큐레이션, 레퍼런스
lab/        — Lab: 자체 실험, 리서치
projects/   — Projects: 프로젝트 회고, 의사결정 기록
seminar/    — Seminar: 내부 세미나, 스터디 노트
```

## Blog Post Format

파일명: `YYYY-MM-DD-slug.md`

```yaml
---
title: "제목"
description: "설명 (~200자)"
slug: url-slug
date: YYYY-MM-DD
authors: [sungyeon]  # authors.yml 참조
tags:
  - tag1
  - tag2
source_url: "https://..."  # 외부 참조 시 (선택)
---
```

본문 구조: `# 제목` → `## TL;DR` (blockquote, AI 생성) → Notion 원문 본문 → `## References` (외부 링크 자동 수집)

> 자동 발행 파이프라인은 TL;DR 만 AI 로 생성하고 본문은 Notion 원문을 그대로 파싱합니다. 수동 작성 글은 자유로운 구조로 작성 가능합니다.

## Authors
- sungyeon, jaehun, mason, hank, dante, sean, braincrew (authors.yml에 정의)

## Static Assets
- 이미지: `static/img/blog/<post-slug>/` 디렉토리에 저장
- 마크다운에서 참조: `![alt](/img/blog/<post-slug>/filename.jpeg)`

## Custom Features (구현 완료)
- 검색: `@easyops-cn/docusaurus-search-local` (한국어/영어, Ctrl+K)
- 이미지 zoom: `docusaurus-plugin-image-zoom` (글 내 이미지 클릭 확대)
- 읽기 진행 바: `src/theme/Root.tsx` (스크롤 기반 프로그레스 바)
- navbar active 동기화: `src/theme/Root.tsx` (탭 기반 메뉴 하이라이트)
- 관련 글 추천: `src/components/RelatedPosts.tsx` + `src/theme/BlogPostPage/index.tsx` (태그 기반)
- 소셜 공유: `src/components/ShareButtons.tsx` (X, LinkedIn, 링크 복사)
- 홈페이지: `plugins/recent-posts.js`로 빌드 시 글 목록 수집 → 카테고리별 카드 그리드
- 코드 블록: 복사 버튼 + 파일명 지원 (` ```python title="main.py" `)

## Frontend TODO

### 바로 적용 가능 (Low effort) — 완료
- [x] 홈 카드에 카테고리별 색상 악센트 — Library(초록), Lab(파랑), Projects(보라), Seminar(주황) 좌측 보더 + 뱃지 색 구분
- [x] SEO 구조화 데이터 (JSON-LD) — BlogPosting 스키마. `src/theme/BlogPostPage/index.tsx`에 자동 삽입
- [x] Footer 소셜 링크 — LinkedIn 추가
- [x] 모바일 반응형 개선 — 공유 버튼, 관련 글 카드, 본문 폰트 모바일 최적화
- [x] 프린트 스타일시트 — `@media print` 네비바/푸터/사이드바 숨김, 링크 URL 자동 표시

### 중간 노력 (Medium effort)
- [ ] 글별 OG 이미지 자동 생성 — SNS 공유 시 글 제목이 포함된 커스텀 이미지. `@vercel/og` 또는 빌드 스크립트로 생성
- [ ] 뉴스레터 구독 CTA — 글 하단 또는 Footer에 이메일 수집 폼. Buttondown, Resend 등 외부 서비스 연동 필요
- [ ] 홈 카드에 커버 이미지/썸네일 — 각 글 frontmatter에 `image` 필드 추가 → 카드에 썸네일 표시. 이미지 없는 글은 카테고리별 기본 그래디언트

### 장기 개선 (Longer-term)
- [ ] 다국어 지원 (i18n) — 한국어 + 영어. Docusaurus 내장 i18n 기능 활용
- [ ] 댓글 시스템 — GitHub Discussions 연동 (giscus) 또는 utterances
- [ ] 글 난이도 표시 — frontmatter에 `level: beginner|intermediate|advanced` 추가 → 태그/뱃지로 표시
- [ ] 태그 기반 필터링 UI — 홈페이지 또는 Library 목록에서 태그 클릭으로 필터링
