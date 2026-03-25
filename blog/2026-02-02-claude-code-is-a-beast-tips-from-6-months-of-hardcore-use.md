---
title: "Claude Code is a Beast – Tips from 6 Months of Hardcore Use"
description: "6개월간 30만 LOC 프로젝트를 단독으로 진행하며 Claude Code를 극한까지 활용한 엔지니어가 검증된 워크플로우를 공개합니다. Skills 자동 활성화 시스템(TypeScript hooks 기반), 컨텍스트 유지를 위한 Dev Docs 패턴, PM2 통합 에러 "
slug: claude-code-is-a-beast-tips-from-6-months-of-hardcore-use
date: 2026-02-02
authors: [braincrew]
tags:
  - vibe-coding
  - reference
source_url: "https://www.reddit.com/r/ClaudeAI/comments/1oivjvm/claude_code_is_a_beast_tips_from_6_months_of/?share_id=BxNodPkCuGxC9aB-ekau5&utm_content=2&utm_medium=ios_app&utm_name=ioscss&utm_source=share&utm_term=1"
---


# Claude Code is a Beast – Tips from 6 Months of Hardcore Use

## TL;DR
> 6개월간 30만 LOC 프로젝트를 단독으로 진행하며 Claude Code를 극한까지 활용한 엔지니어가 검증된 워크플로우를 공개합니다. Skills 자동 활성화 시스템(TypeScript hooks 기반), 컨텍스트 유지를 위한 Dev Docs 패턴, PM2 통합 에러 추적, 10개의 전문화된 AI 에이전트로 구성된 시스템을 통해 일관된 코드 품질과 생산성을 확보했습니다. 단순한 "vibe coding"이 아닌, AI와 협업하는 엔지니어링 접근법이 핵심입니다.

## Key Takeaways
- **Hook 기반 Skills 자동 활성화**: UserPromptSubmit과 Stop Event 두 가지 hooks로 Claude가 관련 Skills를 자동으로 참조하게 만들어 일관성 문제 해결
- **Dev Docs 패턴으로 컨텍스트 관리**: 장기 프로젝트에서 Claude가 "길을 잃는" 문제를 방지하는 문서화 전략으로 컨텍스트 리셋에도 대응 가능
- **Re-prompt 전략**: 같은 프롬프트를 재시도(double-ESC)하되 이전 결과에서 얻은 "원하지 않는 것"에 대한 지식을 활용하면 품질이 크게 향상
- **인간 개입의 중요성**: AI가 30분간 고생하는 문제를 2분 만에 해결할 수 있다면 직접 수정하는 것이 효율적 - 도구를 활용하되 맹신하지 않기
- **전문화된 에이전트 아키텍처**: 코드 리뷰, 리팩토링, 에러 수정 등 10개의 특화된 에이전트로 작업별 최적화된 결과 확보

## 상세 내용

### 프로젝트 배경과 규모

7년 경력의 웹 개발 엔지니어가 회사 내부 도구의 전면 재설계를 제안하고 승인받았습니다. 원래 10만 LOC였던 레거시 프로젝트를 몇 개월 내에 단독으로 완성하겠다는 약속이었지만, 실제로는 6개월이 소요되었습니다. 최종 결과물은 30~40만 LOC 규모로 성장했습니다.

기술 스택의 대대적인 업그레이드가 이루어졌습니다:
- React 16 JavaScript → React 19 TypeScript
- React Query v2 → TanStack Query v5
- React Router v4 (hashrouter) → TanStack Router (file-based routing)
- Material UI v4 → MUI v7

레거시 시스템의 주요 문제점들을 모두 해결했습니다:
- 테스트 커버리지 0% → 적절한 커버리지 확보
- 끔찍한 개발자 경험 → CLI 도구로 테스트 데이터 생성 및 dev mode 구축
- 막대한 기술 부채 → 관리 가능한 수준으로 개선

### 품질과 일관성에 대한 철학

Claude Code 사용자들 사이에서 자주 제기되는 불만 중 하나는 출력 품질의 일관성 부족입니다. 하지만 저자는 지난 몇 달간 오히려 출력 품질이 **향상**되었다고 느끼며, 이는 워크플로우를 지속적으로 개선한 결과라고 설명합니다.

**품질 저하의 실제 원인:**

1. **확률적 특성(Stochastic Nature)**: AI 모델은 동일한 입력에도 매우 다른 출력을 생성할 수 있습니다. 때로는 단순히 랜덤성이 불리하게 작용할 뿐입니다.

2. **프롬프트 구조**: 미묘한 표현 차이가 결과에 큰 영향을 미칩니다. 모델은 말 그대로 해석하므로, 애매한 표현이나 잘못된 표현은 크게 열등한 결과를 낳습니다.

3. **피로도**: 하루 말미에 게으름이 생겨 프롬프트에 충분한 노력을 기울이지 않으면 결과가 확연히 나빠집니다.

**Re-prompt 전략:**

Double-ESC를 눌러 이전 프롬프트를 불러오고, 원하지 않는 결과에 대한 지식을 바탕으로 같은 프롬프트에서 분기할 수 있습니다. 이 방법으로 훨씬 더 나은 결과를 얻을 수 있습니다.

> "Ask not what Claude can do for you, ask what context you can give to Claude" ~ Wise Dude

### Skills 자동 활성화 시스템 (Game Changer)

이것이 가장 핵심적인 혁신입니다.

**기존 문제점:**

Anthropic이 Skills 기능을 출시했을 때, 재사용 가능한 가이드라인을 Claude가 참조할 수 있다는 아이디어는 완벽해 보였습니다. 저자는 프론트엔드, 백엔드, 데이터베이스 작업, 워크플로우 관리 등에 대한 포괄적인 Skills를 작성하는 데 상당한 시간을 투자했습니다. 수천 줄의 베스트 프랙티스, 패턴, 예제들이었습니다.

하지만 Claude는 그것들을 사용하지 않았습니다. Skill 설명의 정확한 키워드를 사용해도, Skills을 트리거해야 하는 파일을 작업해도 아무 일도 일어나지 않았습니다.

**해결책: Hooks 시스템**

Claude가 자동으로 Skills를 사용하지 않는다면, Skills를 확인하도록 **강제**하는 시스템을 만들면 어떨까? TypeScript hooks를 사용한 다층 자동 활성화 아키텍처를 구축했습니다.

**1. UserPromptSubmit Hook** (Claude가 메시지를 보기 **전**에 실행):
- 프롬프트를 분석하여 키워드와 의도 패턴을 파악
- 관련될 수 있는 Skills 확인
- 포맷된 리마인더를 Claude의 컨텍스트에 주입
- 예: "how does the layout system work?"라고 물으면 Claude는 질문을 읽기 전에 "🎯 SKILL ACTIVATION CHECK - Use project-catalog-developer skill"을 먼저 봅니다

**2. Stop Event Hook** (Claude가 응답을 마친 **후**에 실행):
- 어떤 파일이 편집되었는지 분석
- 위험한 패턴 확인 (try-catch 블록, 데이터베이스 작업, async 함수)
- 부드러운 셀프 체크 리마인더 표시
- "에러 핸들링을 추가했나요? Prisma 작업이 repository 패턴을 사용하나요?"
- Non-blocking 방식으로 Claude의 인식을 유지하되 성가시지 않게

**skill-rules.json 설정:**

모든 Skill을 정의하는 중앙 설정 파일:
- **Keywords**: 명시적 주제 매칭 ("layout", "workflow", "database")
- **Intent patterns**: 액션을 캐치하는 정규표현식 ("(create|add).*?(feature|route)")
- **File path triggers**: 파일 경로 기반 활성화

### Dev Docs 워크플로우

장기 프로젝트에서 Claude가 "길을 잃는" 것을 방지하는 패턴입니다. 컨텍스트 리셋에도 살아남는 문서화 전략으로, Claude가 프로젝트의 전체적인 구조와 의사결정 맥락을 항상 유지할 수 있도록 합니다.

### PM2 + Hooks: Zero-Errors-Left-Behind

PM2 프로세스 모니터링과 통합하여 빌드 오류를 자동으로 추적하고 대응합니다. 에러가 발생하면 즉시 감지되고, 관련 hooks가 트리거되어 Claude가 문제를 인식하고 수정할 수 있도록 합니다.

### 전문화된 에이전트 군단

10개의 특화된 에이전트를 구축했습니다:
- 코드 리뷰 에이전트
- 리팩토링 에이전트
- 에러 수정 에이전트
- 테스팅 에이전트
- 기획 에이전트
- 기타 등등

각 에이전트는 특정 작업에 최적화된 프롬프트와 컨텍스트를 가지고 있어, 범용 프롬프트보다 훨씬 높은 품질의 결과를 제공합니다.

### 모듈화된 Skill 아키텍처

500줄 규모의 Skills를 progressive disclosure 패턴으로 구조화했습니다. 필요한 정보만 점진적으로 드러나도록 설계하여 토큰 효율성과 가독성을 동시에 확보했습니다.

### 인간 개입의 중요성

AI는 놀라운 도구지만 마법은 아닙니다. 패턴 인식과 인간의 직관이 단순히 승리하는 문제들이 있습니다.

**핵심 원칙:**

Claude가 30분 동안 고군분투하는 것을 지켜보고 있는데, 당신이 2분 만에 고칠 수 있다면 그냥 직접 고치세요. 부끄러울 것이 없습니다. 자전거 타는 법을 가르치는 것처럼 생각하세요 - 때로는 다시 놓기 전에 잠깐 핸들을 잡아줘야 합니다.

특히 논리 퍼즐이나 실세계 상식이 필요한 문제에서 이런 상황을 자주 봅니다. AI는 많은 것을 무차별 대입할 수 있지만, 때로는 인간이 그냥 더 빨리 "이해"합니다.

완고함이나 "AI가 모든 것을 해야 한다"는 잘못된 신념으로 시간을 낭비하지 마세요. 개입하고, 문제를 해결하고, 계속 진행하세요.

### 실용적인 조언들

**20x Max 플랜 사용:**
저자는 Claude의 20x Max 플랜을 사용하고 있으며, 이는 사용 경험에 영향을 미칠 수 있다고 명시합니다.

**"Vibe Coding"이 아닌 엔지니어링:**
최고의 결과를 얻으려면 Claude Code와 **함께 작업**해야 합니다: 기획하고, 리뷰하고, 반복하고, 다양한 접근법을 탐색하는 것입니다. 단순히 프롬프트를 던지고 코드가 나오기를 기대하는 방식은 권장하지 않습니다.

**품질 저하를 느낀다면:**
Anthropic이 Claude를 몰래 약화시켰다고 생각하기 전에, 자신의 프롬프팅 방식을 되돌아보세요. 특히 하루 끝에 피곤할 때 게으른 프롬프팅을 하고 있지 않은지 자기 성찰이 필요합니다.

### 공개된 리포지토리

커뮤니티의 요청에 따라 저자는 GitHub 리포지토리를 공개했습니다:
**🎯 Repository:** [https://github.com/diet103/claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase)

**포함된 내용:**
- Skills 자동 활성화 시스템 (hooks + skill-rules.json)
- 모듈화된 Skill 아키텍처 (progressive disclosure 패턴)
- 10개의 전문화된 에이전트
- Hooks 시스템
- Dev Docs 패턴 예제

**중요 주의사항:**
- 즉시 사용 가능한 시스템이 아닌 참고 라이브러리입니다
- settings.json은 존재하지 않는 디렉토리 구조를 참조하므로 초기에 오류가 발생합니다
- CLAUDE_INTEGRATION_GUIDE.md가 포함되어 있어 Claude Code가 컴포넌트 통합을 도울 때 참조합니다
- 기술 스택 호환성 확인, 적응 가이던스, 프로젝트 구조 커스터마이징을 자동으로 처리합니다

### 장기 프로젝트에서 얻은 교훈

6개월간 30만 LOC를 다루며 얻은 가장 큰 교훈은 **시스템적 접근**의 중요성입니다. 단순히 AI에게 코드를 생성하도록 요청하는 것이 아니라:

1. **컨텍스트 관리 시스템** 구축 (Dev Docs)
2. **품질 보증 메커니즘** 마련 (Hooks, 전문화된 에이전트)
3. **자동화 가능한 것은 자동화** (Skills 자동 활성화)
4. **인간 판단이 필요한 순간 인식** (언제 개입할지)

이러한 시스템적 접근이 일관된 품질과 생산성을 가능하게 했습니다.

## References
- [Original Reddit Post: Claude Code is a Beast – Tips from 6 Months of Hardcore Use](https://www.reddit.com/r/ClaudeAI/comments/1oivjvm/claude_code_is_a_beast_tips_from_6_months_of/)
- [GitHub Repository: claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase)
- [Follow-up Reddit Post: Examples Repo](https://www.reddit.com/r/ClaudeAI/comments/1ojqxbg/claude_code_is_a_beast_examples_repo_by_popular/)
- [ElevenLabs Reader - Text to Speech](https://elevenlabs.io/text-reader)
- [Natural Reader - Text to Speech](https://www.naturalreaders.com/online/)
