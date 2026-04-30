#!/usr/bin/env python3
"""Notion 3 Hub (Documents / Projects / Seminar) → Braincache 블로그 자동 발행 스크립트.

각 Hub DB 에서 Status="Publish" 인 글을 가져와서:
1. Markdown 변환 + 이미지 다운로드 (본문은 Notion 원문 그대로 보존)
2. LLM 으로 **TL;DR 만** 생성 (본문은 절대 가공하지 않음)
3. Hub / Document Type 에 따라 blog/lab/projects/seminar 디렉토리 분기
4. Git 브랜치 생성 + PR 생성 (TL;DR 이 PR Summary 로도 사용)
5. Notion 상태를 "In Review" 로 업데이트

Usage:
    python scripts/notion-publish.py                  # 실행 (3 Hub 전부 순회)
    python scripts/notion-publish.py --dry-run        # 미리보기만
    python scripts/notion-publish.py --id <page_id>   # 특정 페이지만 (Hub 무관)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import re
import subprocess
import sys
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Tuple

import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── 설정 ───────────────────────────────────────────────────

NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_API_KEY = os.environ.get("NOTION_API_KEY", "")

# Hub 별 Notion DB ID 환경변수
#   - documents : 외부 큐레이션·튜토리얼·논문(paper 는 seminar 로) 등 (Doc Type 으로 라우팅)
#   - projects  : 프로젝트 회고 (전부 projects/ 디렉토리)
#   - seminar   : 세미나·논문 리뷰 (전부 seminar/ 디렉토리)
HUB_CONFIG: dict[str, dict] = {
    "documents": {
        "db_id_env": "NOTION_DB_DOCUMENTS",
        # Document Type 속성으로 분기. DOC_TYPE_CONFIG 매핑 사용.
    },
    "projects": {
        "db_id_env": "NOTION_DB_PROJECTS",
        "force_doc_type": "projects",
        "force_output_dir": "projects",
    },
    "seminar": {
        "db_id_env": "NOTION_DB_SEMINAR",
        # Document Type (paper, inner-seminar 등) 그대로 두되 출력은 모두 seminar/
        "force_output_dir": "seminar",
    },
}

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# ── 이메일 → authors.yml 키 ───────────────────────────────

AUTHOR_MAP = {
    "jh@brain-crew.com": "jaehun",
    "sung@brain-crew.com": "sungyeon",
    "mason@brain-crew.com": "mason",
    "hank@brain-crew.com": "hank",
    "kane@brain-crew.com": "kane",
    "dante@brain-crew.com": "dante",
    "sean@brain-crew.com": "sean",
}

AUTHOR_ID_MAP = {
    "2bcd872b-594c-816f-86db-00020ef03ddd": "hank",
}

# ── 작성자별 Git 아이덴티티 + PAT Secret 이름 ──────────────
# (commit_author_name, commit_author_email, pat_env_name)
# 커밋 아바타가 GitHub 프로필로 연결되려면 email이 해당 계정의 verified email이어야 합니다.
AUTHOR_GIT_IDENTITY = {
    "hank":     ("김태한",  "hank@brain-crew.com", "GH_PAT_HANK"),
    "sungyeon": ("김성연",  "sung@brain-crew.com", "GH_PAT_SUNG"),
    "jaehun":   ("최재훈",  "jh@brain-crew.com",   "GH_PAT_JAEHUN"),
}
DEFAULT_PAT_ENV = "GH_PAT_SUNG"
REPO_SLUG = "braincrew-lab/brain-cache"

# ── 필수 리뷰어 (author 제외하고 request) ──────────────────
# 블로그 정책: Sung + Jaehun 둘 다 승인해야 머지 가능.
REQUIRED_REVIEWERS = {
    "sungyeon": "seongyeon1",
    "jaehun":   "ash-hun",
}

# ── Document Type → 출력 디렉토리 ──────────────────────────

DOC_TYPE_CONFIG = {
    "reference": {"output_dir": "blog"},
    "paper": {"output_dir": "seminar"},
    "inner-seminar": {"output_dir": "seminar"},
    "tutorial": {"output_dir": "blog"},
    "knowledge": {"output_dir": "lab"},
    "conference": {"output_dir": "blog"},
    "projects": {"output_dir": "projects"},
}

DOC_TYPE_TAG = {
    "paper": "paper-review",
    "inner-seminar": "paper-review",
    "reference": "reference",
    "tutorial": "tutorial",
    "knowledge": "knowledge",
    "conference": "conference",
    "projects": "projects",
}

# 외부 블로그(braincache) 발행이 허용되는 Confidentiality 값 (정규화된 형태).
# 비교 시 _normalize_confidentiality() 로 대소문자·공백을 흡수해서 매칭하므로
# 노션 측 표기가 "LV01" / "Lv 01" / "lv 01" 어느 쪽이어도 통과.
# LV03 이상(또는 빈 값)은 자동으로 발행에서 제외.
# LV02 는 PR 리뷰·팀장 승인이 게이트 역할이므로 코드 단계에선 통과시킴.
ALLOWED_CONFIDENTIALITY = {"LV01", "LV02"}


def _normalize_confidentiality(value) -> str:
    """대소문자·공백 차이를 흡수 (예: 'Lv 01' → 'LV01')."""
    return (value or "").upper().replace(" ", "")

TAG_MAP = {
    "Evaluation": "evaluation",
    "Cost-Efficiency": "cost-efficiency",
    "Backend-Engineering": "backend",
    "Architecture": "architecture",
    "Retrieval": "retrieval",
    "Graph & Ontology": "graph",
    "Project": "project",
    "Monitoring": "monitoring",
    "OSS Anlayis": "oss-analysis",
    "Growth": "growth",
    "Insight": "insight",
    "LLM": "llm",
    "MCP": "mcp",
    "Optimizer": "optimizer",
    "CI/CD": "ci-cd",
    "Serving": "serving",
    "XAI": "xai",
    "AI Agent": "ai-agent",
    "Vibe Coding": "vibe-coding",
    "Deployment": "deployment",
    "Infrastructure": "infrastructure",
    "Post Training": "post-training",
    "Claude Code": "claude-code",
    "Harness engineering": "harness",
}


# ══════════════════════════════════════════════════════════════
#  Notion API 클라이언트
# ══════════════════════════════════════════════════════════════

NOTION_VERSION = "2025-09-03"  # multi-source DB + data_sources 엔드포인트


def _notion_headers() -> dict:
    return {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


def notion_get_data_source_id(db_id: str) -> str:
    """Database ID → 첫 번째 data source ID. 2025-09-03 이후 query는 data_source 기준."""
    resp = httpx.get(
        f"{NOTION_API_BASE}/databases/{db_id}",
        headers=_notion_headers(),
        timeout=15,
    ).json()
    data_sources = resp.get("data_sources", [])
    if not data_sources:
        log.warning("data_sources 가 비어있음 — DB ID 를 그대로 사용: %s (response=%s)", db_id, resp)
        return db_id
    ds_id = data_sources[0].get("id", "")
    if len(data_sources) > 1:
        log.info("multi-source DB: %d개 중 첫 번째(%s) 사용", len(data_sources), data_sources[0].get("name"))
    return ds_id


def notion_query_db(db_id: str, filter_obj: dict | None = None) -> list:
    """Notion DB를 쿼리 (페이지네이션 처리). 2025-09-03 API는 /data_sources/{id}/query 사용."""
    data_source_id = notion_get_data_source_id(db_id)
    log.info("Data source 쿼리: %s", data_source_id)
    results = []
    body: dict = {"page_size": 100}
    if filter_obj:
        body["filter"] = filter_obj
    while True:
        resp = httpx.post(
            f"{NOTION_API_BASE}/data_sources/{data_source_id}/query",
            headers=_notion_headers(),
            json=body,
            timeout=30,
        ).json()
        results.extend(resp.get("results", []))
        if resp.get("has_more"):
            body["start_cursor"] = resp["next_cursor"]
        else:
            break
    return results


def notion_update_status(page_id: str, status: str) -> None:
    """Notion 페이지의 Status를 업데이트."""
    httpx.patch(
        f"{NOTION_API_BASE}/pages/{page_id}",
        headers=_notion_headers(),
        json={"properties": {"Status": {"status": {"name": status}}}},
        timeout=15,
    )
    log.info("Notion 상태 업데이트: %s → %s", page_id[:8], status)


# ══════════════════════════════════════════════════════════════
#  Notion 블록 → Markdown 변환
# ══════════════════════════════════════════════════════════════

def _get_all_blocks(block_id: str) -> list:
    """블록의 모든 자식을 재귀적으로 가져온다."""
    results = []
    url = f"{NOTION_API_BASE}/blocks/{block_id}/children?page_size=100"
    while url:
        resp = httpx.get(url, headers=_notion_headers(), timeout=30).json()
        for block in resp.get("results", []):
            if block.get("has_children") and block["type"] not in ("child_database",):
                block["_children"] = _get_all_blocks(block["id"])
            results.append(block)
        if resp.get("has_more"):
            cursor = resp["next_cursor"]
            url = f"{NOTION_API_BASE}/blocks/{block_id}/children?page_size=100&start_cursor={cursor}"
        else:
            url = None
    return results


def _rich_text_to_md(rich_texts: list, links: list) -> str:
    parts = []
    for rt in rich_texts:
        text = rt.get("plain_text", "")
        href = rt.get("href")
        ann = rt.get("annotations", {})
        if ann.get("code"):
            text = f"`{text}`"
        if ann.get("bold"):
            text = f"**{text}**"
        if ann.get("italic"):
            text = f"*{text}*"
        if ann.get("strikethrough"):
            text = f"~~{text}~~"
        if href:
            links.append(href)
            text = f"[{text}]({href})"
        parts.append(text)
    result = "".join(parts)
    for url in re.findall(r'https?://[^\s\)\]]+', result):
        if url not in links:
            links.append(url)
    return result


def _blocks_to_md(blocks: list, lines: list, links: list, images: list, depth: int = 0):
    """블록 리스트를 Markdown으로 변환. 이미지 URL도 수집."""
    for block in blocks:
        btype = block["type"]
        indent = "  " * depth

        if btype in ("heading_1", "heading_2", "heading_3"):
            level = int(btype[-1])
            text = _rich_text_to_md(block[btype]["rich_text"], links)
            lines.append(f"\n{'#' * level} {text}\n")

        elif btype == "paragraph":
            text = _rich_text_to_md(block["paragraph"]["rich_text"], links)
            lines.append(f"{indent}{text}" if text.strip() else "")

        elif btype == "bulleted_list_item":
            text = _rich_text_to_md(block["bulleted_list_item"]["rich_text"], links)
            lines.append(f"{indent}- {text}")

        elif btype == "numbered_list_item":
            text = _rich_text_to_md(block["numbered_list_item"]["rich_text"], links)
            lines.append(f"{indent}1. {text}")

        elif btype == "quote":
            text = _rich_text_to_md(block["quote"]["rich_text"], links)
            lines.append(f"\n> {text}\n")

        elif btype == "callout":
            text = _rich_text_to_md(block["callout"]["rich_text"], links)
            icon = block["callout"].get("icon") or {}
            emoji = icon.get("emoji", "") if icon.get("type") == "emoji" else ""
            lines.append(f"\n> {emoji} {text}\n")

        elif btype == "toggle":
            text = _rich_text_to_md(block["toggle"]["rich_text"], links)
            lines.append(f"\n{indent}**{text}**\n")

        elif btype == "code":
            text = _rich_text_to_md(block["code"]["rich_text"], links)
            lang = block["code"].get("language", "")
            lines.append(f"\n```{lang}\n{text}\n```\n")

        elif btype == "image":
            img = block["image"]
            url = ""
            if img["type"] == "external":
                url = img["external"]["url"]
            elif img["type"] == "file":
                url = img["file"]["url"]
            if url:
                caption = ""
                if img.get("caption"):
                    caption = _rich_text_to_md(img["caption"], links)
                images.append((url, caption))
                # placeholder — will be replaced after image download
                lines.append(f"\n![{caption}](%%IMG:{len(images) - 1}%%)\n")

        elif btype == "divider":
            lines.append("\n---\n")

        elif btype == "bookmark":
            url = block["bookmark"].get("url", "")
            if url:
                links.append(url)
                lines.append(f"[{url}]({url})")

        elif btype == "table_row":
            cells = block["table_row"]["cells"]
            row = " | ".join(_rich_text_to_md(c, links) if c else "" for c in cells)
            lines.append(f"| {row} |")

        # 자식 블록
        children = block.get("_children", [])
        if children:
            _blocks_to_md(children, lines, links, images, depth + 1)


def extract_page(page_id: str) -> Tuple[str, List[str], List[Tuple[str, str]]]:
    """Notion 페이지를 Markdown + 링크 + 이미지로 추출."""
    blocks = _get_all_blocks(page_id)
    lines, links, images = [], [], []
    _blocks_to_md(blocks, lines, links, images)
    return "\n".join(lines), list(dict.fromkeys(links)), images


# ══════════════════════════════════════════════════════════════
#  이미지 다운로드
# ══════════════════════════════════════════════════════════════

def download_images(images: list, slug: str) -> list:
    """이미지 URL을 다운로드하여 static/img/blog/<slug>/에 저장. 로컬 경로 반환."""
    if not images:
        return []
    img_dir = PROJECT_ROOT / "static" / "img" / "blog" / slug
    img_dir.mkdir(parents=True, exist_ok=True)

    local_paths = []
    for i, (url, caption) in enumerate(images):
        try:
            resp = httpx.get(url, timeout=30, follow_redirects=True)
            resp.raise_for_status()
            # Determine extension from content-type
            ct = resp.headers.get("content-type", "")
            ext = ".png"
            if "jpeg" in ct or "jpg" in ct:
                ext = ".jpeg"
            elif "gif" in ct:
                ext = ".gif"
            elif "webp" in ct:
                ext = ".webp"
            elif "svg" in ct:
                ext = ".svg"

            # Hash-based filename for dedup
            h = hashlib.md5(resp.content).hexdigest()[:10]
            filename = f"img-{i:02d}-{h}{ext}"
            filepath = img_dir / filename
            filepath.write_bytes(resp.content)
            local_paths.append(f"/img/blog/{slug}/{filename}")
            log.info("  이미지 다운로드: %s", filename)
        except Exception as e:
            log.warning("  이미지 다운로드 실패: %s", e)
            local_paths.append(url)  # fallback to original URL
    return local_paths


def replace_image_placeholders(md: str, local_paths: list, images: list) -> str:
    """Markdown 내 이미지 플레이스홀더를 로컬 경로로 치환."""
    for i, path in enumerate(local_paths):
        caption = images[i][1] if i < len(images) else ""
        md = md.replace(f"%%IMG:{i}%%", path)
    return md


# ══════════════════════════════════════════════════════════════
#  링크 필터 (References / source_url 추출에 사용)
# ══════════════════════════════════════════════════════════════

_SKIP_PATTERNS = ("notion.so", "notion.site", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".pdf", "amazonaws.com")


# ══════════════════════════════════════════════════════════════
#  LLM 호출 (AWS Bedrock Claude)
# ══════════════════════════════════════════════════════════════

LLM_PROMPT_TEMPLATE = """당신은 AI Research Engineer를 위한 기술 블로그의 TL;DR 작성자입니다.

아래 원본 문서를 읽고, **TL;DR 만** 한국어로 작성하세요.
본문은 원본을 그대로 발행하므로 요약/재작성하지 않습니다.

## 작성 규칙
- 3~5줄 분량으로, 바쁜 엔지니어가 이것만 읽어도 글의 핵심을 파악할 수 있어야 합니다.
- 기술적 개념은 정확하게, 구체적으로 요약합니다.
- "이 글은 ...을 다룹니다" 같은 메타 설명은 피하고, 바로 내용의 핵심을 전달합니다.
- 원본에 없는 내용을 추측해서 추가하지 마세요.

## 출력 규칙
- **오직 TL;DR 본문만** 출력합니다.
- 마크다운 헤더(`## TL;DR`), blockquote(`>`), frontmatter, 제목(`# ...`) 은 포함하지 마세요.
- 순수 텍스트(여러 줄 가능)만 반환합니다.

---

## 원본 문서

제목: {title}
문서 유형: {document_type}
카테고리: {categories}

{content}
"""


def call_llm(prompt: str) -> str:
    """AWS Bedrock Claude로 블로그 글 생성."""
    try:
        import boto3
        from botocore.config import Config

        client = boto3.client(
            "bedrock-runtime",
            region_name=os.environ.get("AWS_REGION", "ap-northeast-2"),
            config=Config(read_timeout=600, connect_timeout=10, retries={"max_attempts": 2}),
        )
        model_id = os.environ.get("LLM_MODEL_ID", "global.anthropic.claude-sonnet-4-5-20250929-v1:0")
        response = client.invoke_model(
            modelId=model_id,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 16384,
                "messages": [{"role": "user", "content": prompt}],
            }),
        )
        result = json.loads(response["body"].read())
        return result["content"][0]["text"].strip()
    except Exception as e:
        log.error("LLM 호출 실패: %s", e)
        return ""


# ══════════════════════════════════════════════════════════════
#  유틸리티
# ══════════════════════════════════════════════════════════════

def get_title(props: dict) -> str:
    for v in props.values():
        if v.get("type") == "title":
            return "".join(rt["plain_text"] for rt in v.get("title", []))
    return "Untitled"


def get_property(props: dict, name: str) -> str | list | None:
    p = props.get(name, {})
    t = p.get("type", "")
    if t == "select":
        sel = p.get("select")
        return sel["name"] if sel else None
    elif t == "multi_select":
        return [o["name"] for o in p.get("multi_select", [])]
    elif t == "rich_text":
        return "".join(rt["plain_text"] for rt in p.get("rich_text", []))
    elif t == "status":
        st = p.get("status")
        return st["name"] if st else None
    elif t == "date":
        d = p.get("date")
        return d["start"] if d else None
    elif t == "people":
        return p.get("people", [])
    elif t == "checkbox":
        return p.get("checkbox", False)
    elif t == "url":
        return p.get("url")
    return None


def resolve_authors(props: dict) -> str:
    people = get_property(props, "Publisher") or []
    if not isinstance(people, list):
        return "braincrew"
    keys = []
    for person in people:
        email = person.get("person", {}).get("email", "")
        key = AUTHOR_MAP.get(email) or AUTHOR_ID_MAP.get(person.get("id", ""))
        if key:
            keys.append(key)
    return ", ".join(keys) if keys else "braincrew"


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = re.sub(r"[^\w\s가-힣-]", "", text)
    text = re.sub(r"[\s_]+", "-", text).strip("-").lower()
    return text[:80] if text else "untitled"


def branch_safe(text: str) -> str:
    """브랜치명에 사용 가능한 ASCII 전용 slug."""
    text = unicodedata.normalize("NFKD", text)
    text = re.sub(r"[^a-zA-Z0-9\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text).strip("-").lower()
    return text[:50] if text else "post"


def extract_first_source_url(links: list) -> str:
    skip = ("notion.so", "notion.site", ".png", ".jpg", ".gif", "amazonaws.com")
    for url in links:
        if not any(p in url.lower() for p in skip):
            return url
    return ""


def build_frontmatter(title, description, categories, doc_type, date, source_url, authors) -> str:
    tags = [TAG_MAP.get(c, c.lower().replace(" ", "-")) for c in (categories if isinstance(categories, list) else [categories])]
    dt_tag = DOC_TYPE_TAG.get(doc_type, doc_type)
    if dt_tag not in tags:
        tags.append(dt_tag)
    tags_yaml = "\n".join(f"  - {t}" for t in tags)
    safe_title = title.replace('"', '\\"')
    safe_desc = description.replace('"', '\\"')
    return f'''---
title: "{safe_title}"
description: "{safe_desc}"
slug: {slugify(title)}
date: {date}
authors: [{authors}]
tags:
{tags_yaml}
source_url: "{source_url}"
---

'''


# ══════════════════════════════════════════════════════════════
#  Git + PR
# ══════════════════════════════════════════════════════════════

def run_cmd(cmd: str, cwd: str | None = None) -> str:
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd or str(PROJECT_ROOT))
    if result.returncode != 0:
        log.warning("Command failed: %s\n%s", cmd, result.stderr)
    return result.stdout.strip()


def resolve_author_identity(author_key: str) -> tuple[str, str, str]:
    """작성자 키 → (git_name, git_email, token). 매핑 없으면 DEFAULT_PAT_ENV 사용."""
    identity = AUTHOR_GIT_IDENTITY.get(author_key)
    if identity:
        name, email, pat_env = identity
    else:
        name, email, pat_env = "Braincache Bot", "bot@brain-crew.com", DEFAULT_PAT_ENV
    token = os.environ.get(pat_env) or os.environ.get(DEFAULT_PAT_ENV) or ""
    if not token:
        log.warning("작성자 %s 용 PAT (%s, %s) 을 찾지 못했습니다.", author_key, pat_env, DEFAULT_PAT_ENV)
    return name, email, token


def create_pr(
    branch: str,
    title: str,
    files: list[str],
    notion_page_id: str = "",
    tldr: str = "",
    doc_type: str = "",
    categories: list | str = "",
    authors: str = "",
    word_count: int = 0,
    author_key: str = "",
) -> str | None:
    """Git 브랜치 생성 + 커밋 + PR. PR 작성자는 author_key 기준으로 결정."""
    cwd = str(PROJECT_ROOT)

    commit_name, commit_email, token = resolve_author_identity(author_key)
    log.info("PR 작성자: key=%s, name=%s, email=%s", author_key, commit_name, commit_email)

    # 커밋 author 를 작성자 본인으로 (로컬 스코프)
    run_cmd(f'git config user.name "{commit_name}"', cwd)
    run_cmd(f'git config user.email "{commit_email}"', cwd)

    run_cmd("git checkout main", cwd)
    run_cmd("git pull origin main", cwd)
    run_cmd(f"git checkout -b {branch}", cwd)
    for f in files:
        run_cmd(f'git add "{f}"', cwd)
    run_cmd(f'git commit -m "feat(blog): auto-publish {title}"', cwd)

    # 푸시는 작성자 PAT으로 직접 인증 (actions/checkout 의 GITHUB_TOKEN extraheader 무력화)
    if token:
        push_url = f"https://x-access-token:{token}@github.com/{REPO_SLUG}.git"
        run_cmd(f'git -c http.extraheader= push {push_url} {branch}', cwd)
    else:
        run_cmd(f"git push origin {branch}", cwd)

    notion_url = f"https://www.notion.so/{notion_page_id.replace('-', '')}" if notion_page_id else ""
    reading_min = max(1, word_count // 500) if word_count else "?"
    tags_str = ", ".join(categories) if isinstance(categories, list) else categories

    # 다중 라인 blockquote — 각 줄에 '>' 프리픽스 유지
    tldr_block = "\n".join(f"> {line}" if line else ">" for line in tldr.split("\n")) if tldr else "> "

    body = (
        f"## Summary\n"
        f"{tldr_block}\n\n"
        f"## Meta\n"
        f"| | |\n|---|---|\n"
        f"| **Category** | {doc_type} |\n"
        f"| **Tags** | {tags_str} |\n"
        f"| **Author** | {authors} |\n"
        f"| **Reading time** | ~{reading_min}min |\n"
        f"| **Notion** | [원본 보기]({notion_url}) |\n\n"
        f"## Review Checklist\n"
        f"- [ ] TL;DR이 글 내용을 정확히 요약하는가 (AI 생성)\n"
        f"- [ ] 본문이 Notion 원문과 일치하는가\n"
        f"- [ ] 태그가 적절한가\n"
        f"- [ ] 이미지가 정상 표시되는가\n"
        f"- [ ] 민감 정보가 포함되어 있지 않은가\n\n"
        f"> 🔐 **머지 정책**: Sung(@seongyeon1) + Jaehun(@ash-hun) 두 명의 승인이 모두 필요합니다.\n\n"
        f"---\n"
        f"notion_page_id: {notion_page_id}"
    )
    env = os.environ.copy()
    if token:
        env["GH_TOKEN"] = token

    # 작성자 본인은 review 요청에서 제외 (GitHub이 self-review 를 거부)
    reviewers = [
        login for key, login in REQUIRED_REVIEWERS.items() if key != author_key
    ]
    gh_cmd = [
        "gh", "pr", "create",
        "--title", f"blog: {title}",
        "--body", body,
        "--base", "main",
        "--head", branch,
        "--assignee", "@me",
    ]
    if reviewers:
        gh_cmd.extend(["--reviewer", ",".join(reviewers)])

    result = subprocess.run(
        gh_cmd,
        capture_output=True, text=True, cwd=cwd, env=env,
    )
    if result.returncode != 0:
        log.warning("PR create failed: %s", result.stderr)
    pr_url = result.stdout.strip()
    # Go back to main
    run_cmd("git checkout main", cwd)
    return pr_url if pr_url else None


# ══════════════════════════════════════════════════════════════
#  메인 파이프라인
# ══════════════════════════════════════════════════════════════

def publish(page_id: Optional[str] = None, dry_run: bool = False):
    if not NOTION_API_KEY:
        log.error("NOTION_API_KEY 환경변수가 필요합니다.")
        sys.exit(1)

    # 1. 페이지 수집 (--id 단일 페이지 또는 3 Hub 순회)
    pages_with_hub: list[tuple[dict, Optional[str]]] = []
    if page_id:
        resp = httpx.get(f"{NOTION_API_BASE}/pages/{page_id}", headers=_notion_headers(), timeout=15).json()
        pages_with_hub.append((resp, None))
    else:
        for hub_name, hub_cfg in HUB_CONFIG.items():
            db_id = (os.environ.get(hub_cfg["db_id_env"]) or "").strip()
            if not db_id:
                log.warning("[%s Hub] %s 환경변수가 비어있음, 건너뜀", hub_name, hub_cfg["db_id_env"])
                continue
            log.info("[%s Hub] DB 쿼리: %s", hub_name, db_id)
            for page in notion_query_db(
                db_id,
                filter_obj={
                    "and": [
                        {"property": "Status", "status": {"equals": "Publish"}},
                    ]
                },
            ):
                pages_with_hub.append((page, hub_name))

    # 2. Confidentiality 필터 — LV01·LV02 화이트리스트 (LV03+ 또는 빈 값은 차단)
    # 정규화 비교로 노션 표기 차이("Lv 01" / "LV01" / "lv 01") 흡수.
    filtered: list[tuple[dict, Optional[str]]] = []
    for page, hub_name in pages_with_hub:
        props = page.get("properties", {})
        conf = get_property(props, "Confidentiality")
        if _normalize_confidentiality(conf) not in ALLOWED_CONFIDENTIALITY:
            title = get_title(props)
            log.info("SKIP (Confidentiality=%s): %s", conf or "(empty)", title)
            continue
        filtered.append((page, hub_name))

    log.info("처리할 문서: %d건 (필터 후)", len(filtered))
    if not filtered:
        log.info("발행할 문서가 없습니다.")
        return

    for i, (page, hub_name) in enumerate(filtered, 1):
        props = page["properties"]
        title = get_title(props)

        # Hub 별 강제 매핑 적용
        hub_cfg = HUB_CONFIG.get(hub_name) if hub_name else None
        force_doc_type = (hub_cfg or {}).get("force_doc_type")
        force_output_dir = (hub_cfg or {}).get("force_output_dir")

        doc_type_raw = (get_property(props, "Document Type") or "reference").lower().replace(" ", "-")
        doc_type = force_doc_type or doc_type_raw
        categories = get_property(props, "Category") or []
        authors = resolve_authors(props)
        upload_date = get_property(props, "Upload Date") or datetime.now().strftime("%Y-%m-%d")
        slug = slugify(title)

        log.info("[%d/%d] 처리 중: %s", i, len(filtered), title)

        try:
            # 3. Notion 콘텐츠 추출
            content, links, images = extract_page(page["id"])
            if not content.strip():
                log.warning("콘텐츠 없음, 건너뜀: %s", title)
                continue

            # 4. 이미지 다운로드
            if not dry_run:
                local_paths = download_images(images, slug)
            else:
                local_paths = [url for url, _ in images]
            content = replace_image_placeholders(content, local_paths, images)

            # 5. LLM 호출 — TL;DR 만 생성 (본문은 원본 그대로 파싱)
            prompt = LLM_PROMPT_TEMPLATE.format(
                title=title,
                document_type=doc_type,
                categories=", ".join(categories) if isinstance(categories, list) else categories,
                content=content[:12000],
            )

            tldr_text = call_llm(prompt).strip()
            if not tldr_text:
                log.error("LLM TL;DR 생성 실패: %s", title)
                continue

            # 혹시 모델이 규칙을 무시하고 헤더/blockquote 를 붙인 경우 제거
            tldr_text = re.sub(r"^\s*#{1,6}\s*TL[;:]?DR\s*\n?", "", tldr_text, flags=re.IGNORECASE)
            tldr_text = "\n".join(re.sub(r"^>\s?", "", line) for line in tldr_text.split("\n")).strip()

            # 6. Markdown 파일 조합
            source_url = extract_first_source_url(links)
            file_date = upload_date or datetime.now().strftime("%Y-%m-%d")

            # TL;DR blockquote 포맷
            tldr_block = "\n".join(f"> {line}" if line else ">" for line in tldr_text.split("\n"))

            # References — 본문 내 외부 링크 수집 (이미지/노션 내부 링크 제외)
            ref_links = [u for u in links if u.startswith("http") and not any(p in u.lower() for p in _SKIP_PATTERNS)]
            # 중복 제거 + 최대 20개
            seen: set[str] = set()
            ref_links_uniq: list[str] = []
            for u in ref_links:
                if u not in seen:
                    seen.add(u)
                    ref_links_uniq.append(u)
                if len(ref_links_uniq) >= 20:
                    break
            references_section = ""
            if ref_links_uniq:
                references_section = "\n\n## References\n" + "\n".join(f"- [{u}]({u})" for u in ref_links_uniq)

            description = " ".join(tldr_text.split())[:200]
            frontmatter = build_frontmatter(title, description, categories, doc_type, file_date, source_url, authors)

            # 본문은 Notion 원본 그대로. TL;DR 만 AI 생성 후 상단에 삽입.
            blog_body = f"## TL;DR\n{tldr_block}\n\n{content.strip()}{references_section}\n"
            full_md = f"{frontmatter}# {title}\n\n{blog_body}"

            output_dir = force_output_dir or DOC_TYPE_CONFIG.get(doc_type, DOC_TYPE_CONFIG["reference"])["output_dir"]
            rel_path = f"{output_dir}/{file_date}-{slug}.md"
            out_file = PROJECT_ROOT / rel_path

            if dry_run:
                print(f"\n{'=' * 60}")
                print(f"[DRY RUN] [{doc_type}] {title}")
                print(f"Output: {rel_path}")
                print(f"{'=' * 60}")
                print(full_md[:3000])
                print("...(truncated)")
                continue

            # 7. 파일 저장
            out_file.parent.mkdir(parents=True, exist_ok=True)
            out_file.write_text(full_md, encoding="utf-8")
            log.info("파일 생성: %s", rel_path)

            # 8. PR 생성
            branch = f"blog/{branch_safe(title)}-{file_date}"
            img_dir = f"static/img/blog/{slug}"
            files_to_add = [rel_path]
            if (PROJECT_ROOT / img_dir).exists():
                files_to_add.append(img_dir)

            word_count = len(full_md)
            first_author_key = authors.split(",")[0].strip() if authors else ""
            pr_url = create_pr(
                branch, title[:60], files_to_add,
                notion_page_id=page["id"],
                tldr=tldr_text,
                doc_type=doc_type,
                categories=categories,
                authors=authors,
                word_count=word_count,
                author_key=first_author_key,
            )
            if pr_url:
                log.info("PR 생성: %s", pr_url)
            else:
                log.warning("PR 생성 실패")

            # 9. Notion 상태 업데이트
            notion_update_status(page["id"], "In Review")
            log.info("완료: %s", title)

        except Exception as e:
            log.error("처리 실패 [%s]: %s", title, e, exc_info=True)
            continue


# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Notion → Braincache 자동 발행")
    parser.add_argument("--id", help="특정 Notion 페이지 ID")
    parser.add_argument("--dry-run", action="store_true", help="미리보기만")
    args = parser.parse_args()
    publish(page_id=args.id, dry_run=args.dry_run)
