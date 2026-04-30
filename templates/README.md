# Braincache 작성 템플릿

노션 Hub 에서 글을 작성할 때 따라쓰는 본문 골격 모음입니다.

## 자동 생성 항목

발행 파이프라인(`scripts/notion-publish.py`)이 다음을 자동으로 채워줍니다 — 노션에 적지 않으셔도 됩니다.

- `frontmatter` (title / description / slug / date / authors / tags / source_url)
- 글 제목 (`# <노션 페이지 제목>`)
- `## TL;DR` (LLM 이 본문을 읽고 3~5줄로 자동 작성, PR Summary 로도 사용)
- `## References` (본문에 등장한 외부 링크 자동 수집, 최대 20개)

**본문 외에는 신경 쓰지 마시고, 아래 카테고리에 맞는 골격으로 본문만 작성하세요.**

## 카테고리별 템플릿

| Hub | Document Type | 템플릿 | 출력 디렉토리 |
|-|-|-|-|
| Documents | `reference` | [reference.md](./reference.md) | `blog/` (Library) |
| Documents | `tutorial` | [tutorial.md](./tutorial.md) | `blog/` (Library) |
| Documents | `conference` | [conference.md](./conference.md) | `blog/` (Library) |
| Documents | `knowledge` | [knowledge.md](./knowledge.md) | `lab/` (Lab) |
| Projects | (자동) | [projects.md](./projects.md) | `projects/` (Projects) |
| Seminar & Paper | `paper` | [paper.md](./paper.md) | `seminar/` (Seminar) |
| Seminar & Paper | `inner-seminar` | [inner-seminar.md](./inner-seminar.md) | `seminar/` (Seminar) |

> Projects Hub 는 Document Type 과 무관하게 모든 글이 `projects/` 로 발행됩니다.
> Seminar & Paper Hub 도 paper / inner-seminar 모두 `seminar/` 로 발행됩니다.

## 글 작성 → 발행 흐름

1. 노션 Hub 에 새 페이지 생성, 해당 카테고리의 템플릿 골격대로 본문 작성
2. Document Type, Category, Publisher, Upload Date 속성 채우기
3. 글이 준비되면 Status 를 `Publish` 로 변경
4. 30 분마다 자동 실행되는 GitHub Actions(`notion-publish.yml`) 가 PR 생성
5. PR 리뷰 → 머지 → Notion Status 가 `Published` 로 자동 갱신

## 공통 규칙

- 이미지는 노션에 그대로 붙여넣으세요 — 발행 시 `static/img/blog/<slug>/` 로 자동 다운로드 + 경로 치환됩니다.
- 외부 링크는 본문 중에 자유롭게 사용하세요 — `## References` 로 자동 수집됩니다.
- 민감 정보(고객사명, 내부 시스템명 등)가 포함된 글은 노션의 `Confidentiality` 속성을 `Internal Use Only` 로 설정하면 발행에서 제외됩니다.
- LLM 입력 본문은 12,000자로 잘립니다 — 너무 긴 글은 핵심만 노션 본문에 두고 상세는 외부 문서로 링크하세요.
