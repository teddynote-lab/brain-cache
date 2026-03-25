---
title: "LLM이 가장 잘 이해하는 Table Format에 대한 평가실험"
description: "재무제표 데이터를 LLM에 전달할 때 데이터 포맷에 따라 성능과 비용이 크게 달라집니다. 11가지 포맷을 비교한 결과, TSV(tab-separated) 포맷이 정확도 100%, 최소 토큰 사용(7,192개), 최단 응답시간(8.24초)으로 모든 지표에서 최고 성능을 "
slug: llm이-가장-잘-이해하는-table-format에-대한-평가실험
date: 2025-12-15
authors: [braincrew]
tags:
  - evaluation
source_url: "https://www.improvingagents.com/blog/best-input-data-format-for-llms?cmid=34b34591-5868-43e7-8016-bbb6fbea4bf1"
---

# LLM이 가장 잘 이해하는 Table Format에 대한 평가실험

## TL;DR
> 재무제표 데이터를 LLM에 전달할 때 데이터 포맷에 따라 성능과 비용이 크게 달라집니다. 11가지 포맷을 비교한 결과, TSV(tab-separated) 포맷이 정확도 100%, 최소 토큰 사용(7,192개), 최단 응답시간(8.24초)으로 모든 지표에서 최고 성능을 보였습니다. 반면 DICT와 XML은 프로그래밍 문법의 메타 문자로 인해 토큰을 2배 이상 낭비했고, STRING 포맷은 정확도가 75%로 떨어졌습니다. 실무에서는 TSV가 이론적 최적이지만, Markdown Key-Value가 가독성과 효율성의 균형점으로 더 실용적일 수 있습니다.

## Key Takeaways
- **간결한 포맷이 LLM 성능과 비용 모두 우수**: TSV는 XML 대비 토큰을 57% 절감하고 응답속도를 3배 향상시켰습니다. 메타 문자를 최소화하는 것이 핵심입니다.
- **구조화된 포맷이 필수**: STRING 같은 비구조화 포맷은 정확도가 25% 하락합니다. 테이블 형태의 명확한 구조가 LLM의 이해도를 크게 높입니다.
- **프로그래밍 문법은 토큰 낭비**: DICT, XML처럼 `{`, `}`, `'` 등 메타 문자가 많은 포맷은 실제 데이터 대비 구조 표현에 토큰을 과다 소모합니다. JSON이나 TSV 같은 간결한 대안을 선택하세요.
- **가독성과 효율성의 트레이드오프 고려**: 이론적으로 TSV가 최적이지만, 실무에서는 Markdown Key-Value처럼 사람과 기계 모두 읽기 쉬운 포맷이 유지보수와 확장성 면에서 더 나을 수 있습니다.
- **포맷 선택은 비용에 직결**: 대규모 RAG 시스템에서 포맷 최적화만으로 토큰 비용을 50% 이상 절감할 수 있습니다. 초기 설계 단계에서 포맷을 신중히 선택하세요.

## 상세 내용

### 배경: 왜 테이블 포맷이 중요한가?

많은 RAG(Retrieval-Augmented Generation) 파이프라인에서 재무제표, 스프레드시트, 데이터베이스 쿼리 결과 등 테이블 형태의 데이터를 LLM에 전달해야 합니다. 하지만 같은 데이터라도 어떤 포맷으로 인코딩하느냐에 따라 LLM의 이해도, 토큰 사용량, 응답 속도가 크게 달라집니다.

예를 들어, Elasticsearch에서 추출한 재무제표 데이터를 LLM에 전달할 때:
- JSON으로 보낼 것인가?
- CSV나 TSV로 보낼 것인가?
- Markdown 테이블이나 HTML을 사용할 것인가?

이 선택은 시스템 정확도와 운영 비용에 직접적인 영향을 미칩니다. IBK Capital 프로젝트에서는 이 질문에 답하기 위해 체계적인 실험을 수행했습니다.

### 실험 설계

**평가 대상 포맷 (11가지)**
1. TSV (tab-separated values)
2. JSON
3. CSV
4. Markdown Table
5. HTML Table
6. Markdown Key-Value
7. DICT (Python dictionary list)
8. LaTeX
9. XML
10. NumPy array
11. STRING (자연어 형식)

**평가 지표**
- **정확도**: LLM이 데이터 기반 질문에 정확히 답변한 비율 (0-1)
- **토큰 사용량**: 프롬프트와 응답에 소요된 총 토큰 수
- **응답 속도**: 질의응답 완료까지 걸린 시간 (초)

**실험 환경**
- 모델: AWS Bedrock Claude Sonnet 4.5
- 데이터: Elasticsearch에서 추출한 실제 재무제표 데이터 (매출액, EBIT, EBITDA 등 약 40개 항목)
- 질문 형식: "2020년 12월의 매출액은 얼마인가요?" 같은 특정 값 조회

**종합 점수 계산**
각 지표를 정규화(0-1)한 후 가중 평균:
- 정확도: 0.5
- 토큰 효율: 0.3
- 속도: 0.2

### 실험 결과: TSV의 압도적 우위

**종합 순위**

| 순위 | 포맷 | 종합점수 | 정확도 | 토큰수 | 지연시간(초) |
|------|------|----------|--------|--------|--------------|
| 1 | TSV | 1.0000 | 1.00 | 7,192 | 8.24 |
| 2 | JSON | 0.8973 | 1.00 | 9,941 | 10.25 |
| 3 | HTML | 0.8768 | 1.00 | 10,229 | 11.59 |
| 4 | Markdown | 0.8505 | 1.00 | 9,805 | 16.17 |
| 5 | Markdown KV | 0.8176 | 1.00 | 11,075 | 15.41 |
| ... | ... | ... | ... | ... | ... |
| 10 | XML | 0.5523 | 1.00 | 16,852 | 25.37 |
| 11 | STRING | 0.3773 | 0.75 | 9,183 | 15.30 |

**핵심 발견**
- TSV를 제외한 대부분 구조화 포맷은 정확도 1.00 달성
- STRING 포맷만 정확도 0.75로 하락 → **구조화가 필수**
- 토큰 사용량 차이: 최소(TSV 7,192) vs 최대(XML 16,852) = **2.3배**
- 응답 속도 차이: 최소(TSV 8.24초) vs 최대(DICT 31.44초) = **3.8배**

### 왜 TSV가 최고 성능을 보이는가?

동일한 재무제표 데이터를 세 가지 포맷으로 표현한 예시로 분석해보겠습니다.

**TSV (7,192 토큰)**
```tsv
재무제표	2019/12	2020/12	2021/12	2022/12	2022/09	2023/09
매출액	594,159	591,566	578,744	606,454	473,909	385,849
EBIT	5,148	52,063	13,045	3,755	10,252	-16,558
```

**특징**
- 구분자: 탭 문자 하나만 사용
- 메타 문자: 거의 없음 (줄바꿈뿐)
- 정보 밀도: 매우 높음 (실제 데이터에 집중)

**Markdown Key-Value (11,075 토큰)**
```markdown
## Record 1

재무제표: 매출액
2019/12: 594,159
2020/12: 591,566
2021/12: 578,744
...
```

**특징**
- 구조 요소: `## Record N`, 키-값 구분 `:`
- 가독성: 레코드별 명확한 구분
- 토큰 증가 원인: 마크다운 헤더와 구분자

**DICT (14,436 토큰 - TSV의 2배)**
```python
[{'재무제표': '매출액', '2019/12': '594,159', '2020/12': '591,566', ...}, 
 {'재무제표': 'EBIT', '2019/12': '5,148', '2020/12': '52,063', ...}]
```

**특징**
- 메타 문자 과다: `{`, `}`, `[`, `]`, `'`, `:`, `,` 반복
- 키 중복: 각 레코드마다 `'재무제표':` 반복
- 토큰 낭비: 프로그래밍 문법에 토큰 소모

**토큰 차이 분석**

| 요소 | TSV | Markdown KV | DICT |
|------|-----|-------------|------|
| 레코드 구분 | 줄바꿈 | `## Record N` | `}, {` |
| 키-값 구분 | 탭 | `:` | `': '` |
| 데이터 구분 | 탭 | 줄바꿈 | `', '` |
| 컨테이너 | 없음 | 코드블록 | `[`, `]` |

TSV가 최소 토큰을 사용하는 이유:
1. **불필요한 메타 문자 제거**: DICT의 `{`, `}`, `'` 같은 문법 요소 없음
2. **키 중복 없음**: 헤더에 한 번만 키 정의
3. **구분자 최소화**: 탭 하나로 열 구분 (CSV는 쉼표 + 따옴표 필요)

### 왜 Markdown Key-Value가 DICT보다 나은가?

실험 결과 Markdown Key-Value(11,075 토큰)가 DICT(14,436 토큰)보다 23% 효율적입니다.

**DICT의 문제점**
```python
# 각 레코드마다 반복되는 메타 문자
{'재무제표': '매출액', '2019/12': '594,159', ...}  # { } ' ' : , 모두 토큰 소모
{'재무제표': 'EBIT', '2019/12': '5,148', ...}      # 키 이름 '재무제표' 반복
```

**Markdown Key-Value의 장점**
```markdown
## Record 1
재무제표: 매출액
2019/12: 594,159
```

1. **간결한 구분자**: `:` 하나로 키-값 구분
2. **키 중복 최소화**: 레코드 헤더로 한 번만 정의
3. **LLM 친화적**: 마크다운은 LLM 학습 데이터에 흔한 형식
4. **가독성**: 사람이 읽고 디버깅하기 쉬움

### 실무 의사결정: TSV vs Markdown Key-Value

**이론적 최적: TSV**
- 토큰 최소 (7,192)
- 속도 최고 (8.24초)
- 비용 최저

**실무 선택: Markdown Key-Value**

프로덕션 환경에서 Markdown Key-Value를 선택한 이유:

1. **가독성과 유지보수성**
   ```markdown
   # TSV - 기계 최적화
   항목	2020	2021	2022
   매출	100	110	120
   
   # Markdown KV - 사람과 기계 모두 고려
   ## 2020년 실적
   매출: 100
   영업이익: 10
   ```

2. **디버깅 용이성**
   - 로그 파일에서 데이터 확인 시 TSV는 읽기 어려움
   - Markdown은 구조가 명확해 문제 파악 빠름

3. **확장성**
   - 추가 메타데이터 삽입 용이
   - 중첩 구조 표현 가능
   - 주석 추가 가능

4. **성능 트레이드오프 합리성**
   - TSV 대비 54% 토큰 증가 (7,192 → 11,075)
   - 하지만 DICT 대비 23% 절감 (14,436 → 11,075)
   - 실용성 고려 시 충분히 효율적

**코드 예시: 포맷 변환 함수**

```python
def convert_to_markdown_kv(df, record_name="Record"):
    """DataFrame을 Markdown Key-Value 형식으로 변환"""
    result = []
    for idx, row in df.iterrows():
        result.append(f"## {record_name} {idx + 1}\n")
        result.append("```")
        for col, value in row.items():
            result.append(f"{col}: {value}")
        result.append("```\n")
    return "\n".join(result)

def convert_to_tsv(df):
    """DataFrame을 TSV 형식으로 변환"""
    return df.to_csv(sep='\t', index=False)

# 사용 예시
import pandas as pd

df = pd.DataFrame({
    '재무제표': ['매출액', 'EBIT'],
    '2020/12': [591566, 52063],
    '2021/12': [578744, 13045]
})

# 비용 최적화가 중요한 경우
tsv_format = convert_to_tsv(df)

# 가독성과 유지보수가 중요한 경우
markdown_format = convert_to_markdown_kv(df)
```

### 실무 적용 가이드

**시나리오별 포맷 선택**

| 시나리오 | 추천 포맷 | 이유 |
|---------|----------|------|
| 대용량 배치 처리 | TSV | 비용과 속도 최우선 |
| 프로덕션 API | Markdown KV | 가독성과 효율 균형 |
| 디버깅/개발 | Markdown KV | 사람이 읽기 쉬움 |
| 레거시 시스템 연동 | JSON | 표준 호환성 |
| 실시간 응답 | TSV | 최저 지연시간 |

**비용 절감 계산 예시**

```python
# GPT-4 기준 (input $2.50/1M tokens)
COST_PER_1M_TOKENS = 2.50

# 일일 100만 건 처리 시
DAILY_QUERIES = 1_000_000

# 포맷별 토큰 사용량
tokens_xml = 16_852
tokens_tsv = 7_192

# 비용 계산
cost_xml = (tokens_xml * DAILY_QUERIES / 1_000_000) * COST_PER_1M_TOKENS
cost_tsv = (tokens_tsv * DAILY_QUERIES / 1_000_000) * COST_PER_1M_TOKENS

print(f"XML 사용 시: ${cost_xml:,.2f}/day")  # $42.13/day
print(f"TSV 사용 시: ${cost_tsv:,.2f}/day")  # $17.98/day
print(f"절감액: ${cost_xml - cost_tsv:,.2f}/day")  # $24.15/day (57% 절감)
print(f"연간 절감: ${(cost_xml - cost_tsv) * 365:,.2f}")  # $8,815/year
```

**피해야 할 포맷과 이유**

1. **STRING (자연어)**
   - 정확도 75% → 25% 오류율은 실무에서 치명적
   - 구조 없어 파싱 불안정

2. **XML**
   - 토큰 2.3배 낭비 (16,852 vs 7,192)
   - 태그 중복으로 비효율적

3. **DICT**
   - 프로그래밍 문법 메타 문자로 토큰 과다 소모
   - JSON이 더 표준적이고 효율적

### 추가 고려사항

**대용량 데이터 처리**

1000개 이상 레코드 처리 시:
- TSV/CSV는 100줄마다 헤더 반복 권장
- Markdown은 청크 단위로 분할
- JSON은 스트리밍 파싱 고려

```python
def chunk_tsv_with_headers(df, chunk_size=100):
    """TSV를 헤더 반복하며 청크로 분할"""
    chunks = []
    for i in range(0, len(df), chunk_size):
        chunk = df.iloc[i:i+chunk_size]
        chunks.append(chunk.to_csv(sep='\t', index=False))
    return chunks
```

**다른 연구 결과와의 비교**

improvingagents.com의 연구(1000개 직원 레코드, 8개 속성)에서도 유사한 결과:
- Markdown Key-Value: 60.7% 정확도
- INI: 55.7%
- YAML: 54.5%
- Markdown Table: 51.8%

차이점:
- 본 실험은 재무 데이터로 정확도가 더 높음 (대부분 100%)
- 도메인 특성상 테이블 구조가 더 명확해 LLM이 잘 이해

### 결론 및 제언

**핵심 요약**
1. **TSV가 이론적 최적**: 토큰 57% 절감, 속도 3.8배 향상
2. **Markdown Key-Value가 실무 최적**: 효율성과 실용성의 균형
3. **간결함이 핵심**: 메타 문자 최소화가 성능과 비용에 직결
4. **구조화는 필수**: STRING 같은 비구조화 포맷은 정확도 25% 하락

**실무 적용 체크리스트**
- [ ] 비용이 최우선이면 TSV 사용
- [ ] 팀 협업과 유지보수 고려 시 Markdown Key-Value
- [ ] STRING, XML, DICT는 피하기
- [ ] 대용량 데이터는 청크 분할 및 헤더 반복
- [ ] 포맷 변경만으로 연간 수천~수만 달러 절감 가능

**향후 연구 방향**
- 다양한 LLM 모델(GPT-4, Claude, Llama 등)에서 재현성 검증
- 비정형 데이터(텍스트 포함 테이블)에서의 포맷 영향 분석
- 멀티모달 환경(이미지 + 테이블)에서의 최적 포맷 연구

## References
- [Which Table Format Do LLMs Understand Best?](https://www.improvingagents.com/blog/best-input-data-format-for-llms?cmid=34b34591-5868-43e7-8016-bbb6fbea4bf1) - improvingagents.com의 11가지 포맷 비교 연구
- [AWS Bedrock Claude Models](https://aws.amazon.com/bedrock/claude/) - 실험에 사용된 Claude Sonnet 4.5 모델 정보
- [Pandas DataFrame Formatting](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_csv.html) - TSV/CSV 변환 공식 문서
- [Markdown Tables Specification](https://www.markdownguide.org/extended-syntax/#tables) - Markdown 테이블 형식 가이드
