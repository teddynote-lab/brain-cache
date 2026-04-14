# Tech Blog (Brain Cache)

## Overview
- Docusaurus 3 기반 기술 블로그
- URL: https://brain-cache.vercel.app
- Vercel 프로젝트: `tech-blog` (scope: `seongyeon1s-projects`)

## Deployment Guide

Vercel 서버 빌드가 불안정하므로 **로컬 빌드 후 prebuilt 배포** 방식을 사용한다.

### 배포 명령어 (3단계)

```bash
# 1. 로컬에서 production 빌드
vercel build --prod

# 2. prebuilt 결과물을 build/ 디렉토리에 복사 후 배포
cd build
cp -r ../.vercel/output .vercel/output
cp ../.vercel/project.json .vercel/project.json
vercel deploy --prebuilt --prod

# 3. brain-cache.vercel.app 도메인 연결 (배포 URL은 출력에서 확인)
vercel alias <배포된-URL> brain-cache.vercel.app

# 4. build 디렉토리 정리
rm -rf .vercel
cd ..
```

### 주의사항
- `vercel --prod` (서버 빌드)는 `Unexpected error`가 자주 발생하므로 사용하지 않는다
- 반드시 `vercel build --prod` → `vercel deploy --prebuilt --prod` 순서로 배포한다
- 배포 후 `vercel alias`로 `brain-cache.vercel.app`에 연결해야 실제 URL에 반영된다
- `vercel pull --yes`로 프로젝트 설정이 최신인지 먼저 확인하면 안전하다

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

본문 구조: `# 제목` → `## TL;DR` (blockquote) → `## Key Takeaways` (bullet list) → `## 상세 내용` (h3 섹션들)

## Authors
- sungyeon, jaehun, mason, hank, braincrew (authors.yml에 정의)

## Static Assets
- 이미지: `static/img/blog/<post-slug>/` 디렉토리에 저장
- 마크다운에서 참조: `![alt](/img/blog/<post-slug>/filename.jpeg)`

## Custom Features (구현 완료)
- 검색: `@easyops-cn/docusaurus-search-local` (한국어/영어, Ctrl+K)
- 이미지 zoom: `docusaurus-plugin-image-zoom` (글 내 이미지 클릭 확대)
- 읽기 진행 바: `src/theme/Root.tsx` (스크롤 기반 프로그레스 바)
- 사이드바 토글: `src/theme/Root.tsx` (좌하단 «/» 버튼)
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
