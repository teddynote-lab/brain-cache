---
title: "Is TOON really saving you tokens?"
description: "TOON(Token-Oriented Object Notation)은 LLM 프롬프트의 토큰 효율성을 높이는 포맷이지만, 만능 솔루션은 아닙니다. 평면적(flat)이고 균일한 데이터에서는 JSON 대비 30-60% 토큰을 절약하지만, 깊게 중첩된(deeply nested"
slug: is-toon-really-saving-you-tokens
date: 2025-12-13
authors: [braincrew]
tags:
  - cost-efficiency
  - reference
source_url: "https://github.com/toon-format/toon/tree/main"
---


# Is TOON really saving you tokens?

## TL;DR
> TOON(Token-Oriented Object Notation)은 LLM 프롬프트의 토큰 효율성을 높이는 포맷이지만, 만능 솔루션은 아닙니다. 평면적(flat)이고 균일한 데이터에서는 JSON 대비 30-60% 토큰을 절약하지만, 깊게 중첩된(deeply nested) 데이터에서는 오히려 비효율적일 수 있습니다. 실제 벤치마크에서 flat 데이터는 35% 절약, nested 데이터는 오히려 9% 더 많은 토큰을 소비했습니다. 프로덕션 환경에서는 데이터 구조에 따라 포맷을 전략적으로 선택해야 합니다.

## Key Takeaways
- **데이터 구조가 효율성을 결정**: Flat/tabular 데이터에서는 TOON이 JSON 대비 35% 이상 토큰을 절약하지만, 깊게 중첩된 구조에서는 indentation overhead로 인해 오히려 더 많은 토큰을 소비할 수 있음
- **전처리 전략의 중요성**: JSON을 TOON으로 단순 변환하는 것보다 "flatten → TOON 변환" 파이프라인이 더 효과적이며, 이를 통해 토큰 절약과 LLM 이해도를 동시에 개선 가능
- **프로덕션 비용 최적화**: 포맷 선택은 API 비용, 레이턴시, 모델 컨텍스트 용량에 직접적인 영향을 미치므로, 데이터 스키마 분석을 통한 포맷 결정이 필수
- **스키마 일관성이 핵심**: TOON은 일관된 스키마를 가진 반복적인 구조에서 가장 효과적이며, 이는 정확도(accuracy) 향상에도 기여
- **하이브리드 접근**: JSON과 TOON을 경쟁 관계가 아닌 상호 보완적 도구로 활용하여, 데이터 형태에 따라 최적의 포맷을 선택하는 것이 실용적 전략

## 상세 내용

### TOON이란 무엇인가?

TOON(Token-Oriented Object Notation)은 LLM 프롬프트를 위해 설계된 컴팩트하고 스키마 인식형 데이터 포맷입니다. JSON의 가독성은 유지하면서도 토큰 효율성을 극대화하려는 시도로, 특히 LLM API 비용 절감과 컨텍스트 윈도우 최적화를 목표로 합니다.

최근 TOON에 대한 관심이 급증하고 있으며, 실제로 특정 상황에서는 상당한 효율성 개선을 보여줍니다. 하지만 모든 데이터 구조에 적용 가능한 만능 솔루션은 아닙니다.

### 실제 벤치마크 결과

다음은 실제 테스트를 통해 측정된 토큰 사용량 비교입니다:

**평면적 데이터 (Flat Data)**
- JSON: 797 tokens
- TOON: 517 tokens
- **결과: 35% 절약**

**중첩 데이터 (Nested Data)**
- JSON: 802 tokens
- TOON: 877 tokens
- **결과: TOON이 9% 더 많은 토큰 소비**

![TOON vs JSON 벤치마크 비교](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/1d47b252-2965-4c23-a7d9-585e0fba64f4/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466XTBUGKEW%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T063343Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCICVEOI%2FVFqJ1qgDB9iT5MlKsnbejiQ1tJxSqeMxhhWJ5AiEAmZHn9NtGe2MPQ70sH9QitEUC43c8gZKrw%2BqMjB3NJ4AqiAQIp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDCc7w%2BqFkW6GDfrzcSrcA5H1Pa8gI6yNuqt6VrJkYUPR3heqqUB%2FaNoq4RhQyK%2FUSCxWb%2BkzEqMiD5NNQvxLQn%2FikwspuDWFiuJVVnAoYftGSorq50QU%2FE%2FMla2FmsQz%2BmMyFjbvot4t4k0RahwtQF2CijJZPCmFvj%2B5rGj9%2BZwv61PcKEwwdO5ETX1kb9p1kOpZhwWJvJi9YBb8tSUKv6Nsi9EBGYGtbGwvpgc6lRDVTHn3Mq7OziUmKEcQjtowfF5kXFFnJGvqNxHSW9hGTavn%2BFgqd1er%2FKRfhrTLqub2dXzcgJ062cuS0eDDZsL8fZY7XVlMbMgTTTj0jJ2Q2iOyEq0Um389THX3fmoXHDUbMvgHmWqzDzlYUVAvPyuPH7pZ%2BKYANgjNvIAfnmk7kkS0YpNVAquB6Nu0blqLf1QiIgJs5GLRO5EAT0pXAnIq0PZyOZ32QHkey08mkNAJLfViNB8Lv912mZLXMqX7lYJ2YCwKiPJUX66yWBFT%2FuarPDcfS8uyg9FFBu%2FwZac2Bkn13R39WQvsMPQ%2FxHvbsejfoEa44CGA7jw%2Foeeyi8ilntwVVpXZMds1E5vqINKkAb74oQNuPQ0pihD4ElIVdLz6dHHEcxyydSnaxmcMgOxiTB808hPXhpIUXfwTML79jc4GOqUBYViVSPhI77QCuVZnL%2FoPvjeGvFuA%2BpesMRFhsRsaGnxL%2FLqzTynBvaERMkRI%2BqmBkB9Cs7aBLs4lEnEgk0YThHJmr3VVF%2FZvrjVSlkrm5maWBzt2lP6svZQ9PhWAZZMBBe5sA%2FTNorojkfO8Sd9dwA%2FRS8IL5fbbv14wdy%2FjuQypUuwGqmH66H0PwGoqtfctzy5VTSdYA5j7zwjeDP3bt4QK36Zp&X-Amz-Signature=490ea5f794bb09db2dad5b71854c8edc326ba528b386403b52ea1dc2d2693b99&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

### 왜 중첩 데이터에서 비효율적인가?

TOON의 구조적 특성상, 깊게 중첩된 데이터에서는 다음과 같은 오버헤드가 발생합니다:

1. **인덴테이션 오버헤드**: TOON은 구조를 명확하게 표현하기 위해 들여쓰기를 사용하는데, nested 구조가 깊어질수록 이로 인한 토큰 비용이 증가합니다.

2. **구조 정보의 반복**: 중첩된 객체마다 스키마 정보를 유지하려면 추가적인 메타데이터가 필요합니다.

3. **압축 효과 감소**: 평면적 데이터에서는 반복되는 키 이름을 효율적으로 압축할 수 있지만, 중첩 구조에서는 이러한 이점이 감소합니다.

반면 compact JSON은 중괄호와 쉼표만으로 구조를 표현하므로, 깊은 중첩에서도 상대적으로 일관된 오버헤드를 유지합니다.

### 실무 적용 전략

#### 1. 데이터 구조 분석이 우선

TOON 도입 전에 반드시 데이터의 특성을 분석해야 합니다:

- **TOON이 유리한 경우**: 테이블 형태의 데이터, 반복적인 레코드, 일관된 스키마를 가진 배열
- **JSON이 유리한 경우**: 복잡한 계층 구조, 불규칙한 스키마, 깊은 중첩(3단계 이상)

#### 2. Flatten → TOON 파이프라인

최적의 접근 방식은 다음과 같습니다:

```
원본 JSON → 구조 평면화(flatten) → TOON 변환 → LLM 입력
```

이 방법을 사용하면:
- ✔ 토큰 사용량 최소화
- ✔ 더 명확한 데이터 구조
- ✔ LLM의 데이터 이해도 향상
- ✔ API 비용 절감

#### 3. 스키마 일관성 확보

TOON은 일관된 스키마에서 최고의 성능을 발휘합니다. 데이터 전처리 단계에서 스키마를 정규화하면 TOON의 효율성이 극대화됩니다.

### 프로덕션 환경에서의 임팩트

올바른 포맷 선택이 프로덕션 LLM 파이프라인에 미치는 영향:

**비용 절감**
- 30-60% 토큰 절약 시 API 비용이 직접적으로 감소
- 대규모 배치 처리에서는 월간 수천 달러의 절약 가능

**레이턴시 개선**
- 더 적은 토큰 = 더 빠른 처리 속도
- 특히 긴 컨텍스트를 다룰 때 체감 가능

**모델 용량 최적화**
- 컨텍스트 윈도우 절약으로 더 많은 정보 포함 가능
- 프롬프트 엔지니어링의 여유 공간 확보

**정확도 향상**
- 평면적 구조와 명확한 스키마는 LLM의 데이터 파싱 오류를 줄임
- 특히 structured output generation에서 효과적

### 하이브리드 접근의 필요성

TOON vs JSON은 경쟁이 아니라 선택의 문제입니다. 실무에서는 다음과 같은 하이브리드 전략이 효과적입니다:

- **라우팅 로직 구현**: 데이터 구조를 분석하여 자동으로 적절한 포맷 선택
- **A/B 테스트**: 실제 워크로드에서 두 포맷의 성능 비교
- **모니터링**: 토큰 사용량, 응답 품질, 비용을 지속적으로 추적

TOON은 특정 상황에서 강력한 최적화 도구이지만, 맹목적 적용보다는 데이터 특성에 기반한 전략적 선택이 중요합니다.

## References
- [TOON GitHub Repository](https://github.com/toon-format/toon/tree/main)
- Original benchmark data and analysis from the post
