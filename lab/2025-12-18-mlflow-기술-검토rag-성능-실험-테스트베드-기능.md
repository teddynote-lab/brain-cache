---
title: "MLflow 기술 검토(RAG 성능 실험 테스트베드 기능)"
description: "MLflow는 전통적인 ML과 LLM 애플리케이션의 전체 생명주기를 관리할 수 있는 오픈소스 통합 플랫폼입니다. LangGraph 기반 RAG Agent 개발 시 Tracking으로 하이퍼파라미터와 메트릭을 관리하고, Tracing으로 복잡한 LLM 호출 흐름을 추적하"
slug: mlflow-기술-검토rag-성능-실험-테스트베드-기능
date: 2025-12-18
authors: [hank]
tags:
  - evaluation
source_url: "https://github.com/taehan79-kim/mlflow-genai-tutorial"
---

# MLflow 기술 검토(RAG 성능 실험 테스트베드 기능)

## TL;DR
> MLflow는 전통적인 ML과 LLM 애플리케이션의 전체 생명주기를 관리할 수 있는 오픈소스 통합 플랫폼입니다. LangGraph 기반 RAG Agent 개발 시 Tracking으로 하이퍼파라미터와 메트릭을 관리하고, Tracing으로 복잡한 LLM 호출 흐름을 추적하며, Evaluation으로 LLM-as-a-Judge를 포함한 다양한 평가 지표를 자동화할 수 있습니다. OpenTelemetry 표준 준수로 기존 옵저버빌리티 도구와 쉽게 연동 가능하며, 완전 오픈소스로 온프레미스/클라우드 자체 호스팅이 가능합니다.

## Key Takeaways

- **계층적 실험 관리**: Experiment > Run 구조로 RAG 시스템의 chunk_size, top_k, temperature 등 다양한 설정 조합을 체계적으로 추적하고 MLflow UI에서 시각적으로 비교할 수 있어, 최적 구성 탐색이 효율적입니다.

- **OpenTelemetry 표준 기반 Tracing**: MLflow Tracing은 OpenTelemetry 호환으로 Grafana, Datadog, New Relic 등 기존 옵저버빌리티 도구와 즉시 연동 가능하며, Span 계층 구조로 복잡한 LLM 체인의 입출력과 토큰 사용량을 단계별로 추적할 수 있습니다.

- **LLM-as-a-Judge 평가 자동화**: faithfulness, answer_relevance 등 주관적 품질 지표를 LLM으로 자동 평가하고, `make_genai_metric()`으로 커스텀 평가 기준을 프롬프트로 정의하여 평가 프로세스를 표준화할 수 있습니다.

- **프롬프트 버전 관리**: 프롬프트를 실험 변수 및 아티팩트로 저장하여 변경 사항을 추적하고, 여러 프롬프트 변형의 성능을 정량적으로 비교해 A/B 테스트를 수행할 수 있습니다.

- **오픈소스 vs 상용 플랫폼 선택**: MLflow는 Apache 2.0 오픈소스로 인프라 비용만 발생하고 전통적 ML과 LLM을 통합 관리 가능한 반면, LangSmith는 LangChain 전용 SaaS로 즉시 사용 가능하지만 벤더 종속성이 있습니다. 프로젝트 요구사항(자체 호스팅 필요성, 기존 도구 통합, 비용 구조)에 따라 선택해야 합니다.

## 상세 내용

### 배경: LLM 애플리케이션의 실험 관리 문제

LLM 기반 RAG Agent 개발은 전통적인 ML 모델과 다른 어려움이 있습니다. 문서 청크 크기, 임베딩 모델, 검색 개수(top_k), LLM temperature, 프롬프트 템플릿 등 수많은 하이퍼파라미터 조합을 실험해야 하며, LLM 출력의 비결정성과 주관성으로 인해 품질 평가가 어렵습니다. 또한 여러 컴포넌트(Retriever → LLM → Reranker)가 연결된 복잡한 파이프라인에서 병목 구간을 찾기 위해 각 단계의 실행 흐름을 추적해야 합니다.

MLflow는 이러한 문제를 해결하기 위해 전통적인 ML과 LLM 애플리케이션을 모두 지원하는 통합 플랫폼으로, Tracking, Tracing, Evaluation 기능을 제공합니다.

### 1. MLflow Tracking: 실험 파라미터와 메트릭 관리

**핵심 구조**

MLflow는 Experiment(실험 그룹) > Run(단일 실행) 계층 구조로 실험을 조직화합니다. 각 Run은 고유 ID로 식별되며 다음을 기록합니다:

- **Parameters**: 모델 설정값 (불변)
- **Metrics**: 정량적 성능 지표 (시간에 따라 변화 가능)
- **Artifacts**: 파일 형태의 결과물 (모델, 설정 파일, 생성된 답변 등)
- **Tags**: 메타데이터 (환경, 버전 등)

**RAG 시스템 적용 사례**

```python
import mlflow

mlflow.set_experiment("rag-optimization")

with mlflow.start_run(run_name="chunk-512-topk-5"):
    # 파라미터 기록
    mlflow.log_param("chunk_size", 512)
    mlflow.log_param("chunk_overlap", 50)
    mlflow.log_param("top_k", 5)
    mlflow.log_param("embedding_model", "text-embedding-3-small")
    mlflow.log_param("llm_model", "gpt-4")
    mlflow.log_param("temperature", 0.7)
    
    # RAG 파이프라인 실행
    result = rag_pipeline.run(query)
    
    # 메트릭 기록
    mlflow.log_metric("response_time", result.latency)
    mlflow.log_metric("num_retrieved_docs", len(result.docs))
    mlflow.log_metric("total_tokens", result.token_count)
    
    # 아티팩트 저장
    mlflow.log_text(result.answer, "generated_answer.txt")
    mlflow.log_dict(result.config, "config.json")
```

**의사결정 포인트**: Parameters는 실험 시작 시 결정되는 불변 값으로, Metrics는 실행 중/후에 측정되는 성능 지표로 구분해야 합니다. 프롬프트 템플릿은 아티팩트로 저장하면 버전별 변경 사항을 명확히 추적할 수 있습니다.

**UI 활용**

MLflow UI에서 여러 Run의 메트릭을 테이블 또는 차트로 비교할 수 있습니다. 예를 들어 chunk_size와 response_time의 상관관계를 scatter plot으로 시각화하거나, top_k 값에 따른 답변 품질 변화를 확인할 수 있습니다. Backend 서버로 배포하면 REST API로 프로그래밍 방식 접근도 가능합니다.

### 2. MLflow Tracing: LLM 호출 흐름 추적

**핵심 개념: Trace와 Span**

MLflow Tracing은 OpenTelemetry 표준을 따르며 다음 구조를 사용합니다:

- **Trace**: 전체 요청/세션의 실행 흐름
- **Span**: Trace를 구성하는 개별 작업 단위 (시작/종료 시간, 입출력, 메타데이터 포함)
- Span은 Parent-Child 계층 구조로 실행 순서를 표현

**자동 Tracing vs 수동 Tracing**

**자동 Tracing (Autolog)**:

```python
import mlflow

# LangChain 자동 추적 활성화
mlflow.langchain.autolog()

# 이후 LangChain 호출은 자동으로 Trace 생성
chain = create_retrieval_chain(retriever, llm)
result = chain.invoke({"input": "What is RAG?"})
```

자동 추적은 다음을 자동 수집합니다:
- 각 컴포넌트(Retriever, LLM, Chain)별 Span
- 입출력 데이터
- 토큰 사용량 (LLM 호출 시)
- 실행 시간

**수동 Tracing (Decorator)**:

```python
import mlflow

@mlflow.trace(name="document_preprocessing", span_type="PROCESSING")
def preprocess_documents(docs):
    """문서 전처리 로직"""
    mlflow.set_span_attribute("num_docs", len(docs))
    processed = [clean_text(doc) for doc in docs]
    return processed

@mlflow.trace(name="rerank_documents", span_type="RETRIEVAL")
def rerank(query, docs):
    """검색 결과 재정렬"""
    scores = compute_relevance_scores(query, docs)
    mlflow.set_span_attribute("rerank_model", "cross-encoder-v2")
    return sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
```

**의사결정 근거**: 자동 추적은 LangChain/LangGraph 기본 동작을 추적할 때 편리하지만, 비즈니스 로직이나 커스텀 컴포넌트는 수동 데코레이터로 명시적으로 Span을 추가해야 합니다. 특히 문서 전처리, 필터링, 재정렬 등 RAG 파이프라인의 중간 단계를 추적하려면 수동 Tracing이 필수입니다.

**Trace 시각화**

MLflow UI의 Traces 탭에서 다음을 확인할 수 있습니다:

- **Tree View**: Span 간 계층 구조와 실행 순서
- **Timeline View**: 각 Span의 시작/종료 시간과 병렬 실행 여부
- **Details Panel**: Span별 입출력 데이터, 토큰 사용량, 커스텀 속성
- **Error Tracking**: 예외 발생 Span 및 스택 트레이스

**OpenTelemetry 통합**

MLflow Tracing은 OpenTelemetry 표준을 준수하므로 기존 관찰성 도구와 쉽게 연동됩니다:

```python
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# OpenTelemetry 설정
trace.set_tracer_provider(TracerProvider())
otlp_exporter = OTLPSpanExporter(endpoint="http://grafana-tempo:4317")
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(otlp_exporter))

# MLflow Tracing은 자동으로 OpenTelemetry와 통합됨
mlflow.langchain.autolog()
```

이를 통해 Grafana, Datadog, New Relic 등에서 MLflow Trace를 시각화하고, 마이크로서비스 환경에서 분산 추적이 가능합니다.

### 3. MLflow Evaluation: LLM 출력 품질 평가

**평가 워크플로우**

MLflow Evaluation은 다음 단계로 구성됩니다:

1. **평가 데이터셋 준비** (Pandas DataFrame)
2. **모델 또는 예측 함수 정의**
3. **평가 지표(Scorer) 선택**
4. **`mlflow.evaluate()` 실행**
5. **결과 분석** (MLflow UI 또는 API)

**평가 데이터셋 구조**

```python
import pandas as pd

eval_data = pd.DataFrame({
    "inputs": [
        "What is the capital of France?",
        "Explain quantum computing",
        "How does photosynthesis work?"
    ],
    "context": [
        "France is a country in Europe. Paris is its capital.",
        "Quantum computing uses quantum bits...",
        "Plants use sunlight to produce energy..."
    ],
    "ground_truth": [
        "Paris",
        "A computing paradigm using quantum mechanics",
        "Process where plants convert light to chemical energy"
    ]
})
```

필수 컬럼:
- **inputs**: 모델 입력
- **context**: (선택) RAG의 검색 문서 등 추가 정보
- **ground_truth** 또는 **targets**: (선택) 정답 레이블

**Built-in Evaluators 활용**

```python
import mlflow

# LLM 출력 품질 평가
results = mlflow.evaluate(
    model="openai:/gpt-4",  # 또는 커스텀 함수
    data=eval_data,
    model_type="question-answering",
    evaluators="default",  # 기본 메트릭 세트
    extra_metrics=[
        mlflow.metrics.toxicity(),
        mlflow.metrics.flesch_kincaid_grade_level(),
        mlflow.metrics.answer_similarity(),
        mlflow.metrics.faithfulness(model="openai:/gpt-4-turbo"),
        mlflow.metrics.answer_relevance(model="openai:/gpt-4-turbo")
    ]
)

print(results.metrics)
```

**주요 LLM 메트릭**:

- **toxicity**: 유해성 점수 (0~1, 낮을수록 좋음)
- **flesch_kincaid_grade_level**: 가독성 (미국 학년 수준)
- **answer_similarity**: 임베딩 기반 답변-정답 유사도
- **faithfulness**: 답변이 제공된 context에 충실한지 (LLM-as-Judge)
- **answer_relevance**: 답변이 질문과 관련 있는지 (LLM-as-Judge)

**LLM-as-a-Judge 동작 원리**

faithfulness, answer_relevance 같은 메트릭은 LLM을 판단자로 사용합니다:

1. 평가용 프롬프트 생성 (질문 + 답변 + context)
2. Judge LLM에 전송 (예: GPT-4)
3. LLM이 평가 기준에 따라 점수 반환 (1~5 척도 등)
4. 점수를 정규화하여 저장

**의사결정 포인트**: Judge 모델은 평가 대상 모델보다 강력해야 신뢰성이 높습니다. 예를 들어 GPT-3.5로 생성한 답변을 GPT-4로 평가하거나, 오픈소스 LLM 출력을 Claude Opus로 평가하는 방식이 권장됩니다.

**Custom Evaluators 작성**

**함수 기반 메트릭**:

```python
from mlflow.metrics import make_metric

def contains_keyword(eval_df, builtin_metrics):
    """답변에 특정 키워드가 포함되어 있는지 체크"""
    keywords = ["quantum", "photosynthesis", "capital"]
    scores = []
    for _, row in eval_df.iterrows():
        answer = row["outputs"].lower()
        score = 1.0 if any(kw in answer for kw in keywords) else 0.0
        scores.append(score)
    return scores

keyword_metric = make_metric(
    eval_fn=contains_keyword,
    greater_is_better=True,
    name="keyword_presence"
)

mlflow.evaluate(
    model=rag_model,
    data=eval_data,
    extra_metrics=[keyword_metric]
)
```

**LLM-as-Judge 커스텀 메트릭**:

```python
from mlflow.metrics.genai import make_genai_metric

custom_faithfulness = make_genai_metric(
    name="custom_faithfulness",
    definition="답변이 제공된 문서에만 기반하고 외부 지식을 사용하지 않는지 평가",
    grading_prompt="""
    다음 기준으로 답변을 평가하세요:
    - 5점: 모든 정보가 문서에서 직접 추출됨
    - 4점: 대부분 문서 기반이지만 약간의 추론 포함
    - 3점: 문서와 외부 지식이 혼합됨
    - 2점: 주로 외부 지식 사용
    - 1점: 문서와 무관한 정보
    
    질문: {inputs}
    문서: {context}
    답변: {outputs}
    
    점수만 반환하세요 (1~5).
    """,
    grading_context_columns=["context"],
    examples=[
        {
            "inputs": "What is the capital?",
            "outputs": "Paris is the capital.",
            "context": "Paris is the capital of France.",
            "score": 5,
            "justification": "답변이 문서에서 직접 추출됨"
        }
    ],
    model="openai:/gpt-4-turbo",
    parameters={"temperature": 0.0}
)

mlflow.evaluate(
    model=rag_model,
    data=eval_data,
    extra_metrics=[custom_faithfulness]
)
```

**의사결정 근거**: 프로젝트별 도메인 특화 평가 기준(예: 의료 분야의 전문 용어 정확성, 금융 분야의 수치 정확성)은 커스텀 메트릭으로 정의해야 합니다. 프롬프트에 Few-shot 예시를 포함하면 Judge LLM의 평가 일관성이 크게 향상됩니다.

**평가 결과 활용**

```python
# 평가 결과 출력
print(results.metrics)
# {'toxicity/v1/mean': 0.02, 'faithfulness/v1/mean': 4.5, ...}

# 행별 상세 결과
results_df = results.tables["eval_results_table"]
print(results_df[["inputs", "outputs", "faithfulness/v1/score"]])

# MLflow UI에서 시각화
# - 메트릭별 분포 히스토그램
# - 실패 사례 필터링
# - 여러 모델 간 평가 결과 비교
```

### 4. 추가 고급 기능

**프롬프트 버전 관리**

```python
import mlflow

prompt_template_v1 = """
You are a helpful assistant. Answer the question based on the context.

Context: {context}
Question: {question}
Answer:
"""

with mlflow.start_run():
    mlflow.log_param("prompt_version", "v1")
    mlflow.log_text(prompt_template_v1, "prompt_template.txt")
    
    # 프롬프트 성능 평가
    results = evaluate_prompt(prompt_template_v1, test_data)
    mlflow.log_metrics(results)
```

프롬프트를 파라미터와 아티팩트로 저장하여 변경 사항을 추적하고, 여러 버전의 성능을 비교할 수 있습니다.

**Multi-Turn 대화 추적**

```python
import mlflow

session_id = "user-123-session-456"

with mlflow.start_run(run_name=f"conversation-{session_id}") as run:
    mlflow.set_tag("session_id", session_id)
    
    conversation_history = []
    for turn, user_input in enumerate(user_inputs):
        with mlflow.start_span(name=f"turn_{turn}") as span:
            response = chatbot.reply(user_input, conversation_history)
            conversation_history.append({"user": user_input, "bot": response})
            
            mlflow.log_metric(f"turn_{turn}_latency", response.latency)
    
    # 전체 대화 저장
    mlflow.log_dict({"conversation": conversation_history}, "full_conversation.json")
```

session_id 태그로 대화를 그룹화하고, 턴별 Span으로 각 응답을 추적합니다.

**OpenTelemetry 분산 추적**

마이크로서비스 환경에서 여러 서비스에 걸친 요청을 추적:

```python
# Service A (Gateway)
import mlflow
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("gateway_request"):
    with mlflow.start_span(name="preprocess_input"):
        cleaned_input = preprocess(user_query)
    
    # Service B 호출 (Trace context 자동 전파)
    response = requests.post("http://rag-service/query", json={"input": cleaned_input})
```

OpenTelemetry context propagation으로 Service A와 Service B의 Span이 하나의 Trace로 연결됩니다.

### 5. LangSmith와의 비교

**MLflow 선택이 유리한 경우**:

- 전통적인 ML 모델과 LLM을 동일 플랫폼에서 관리하고 싶을 때
- 온프레미스 또는 프라이빗 클라우드에서 자체 호스팅이 필요할 때
- 기존 옵저버빌리티 스택(Grafana, Prometheus)과 통합하고 싶을 때
- 오픈소스 라이선스로 비용 절감이 중요할 때
- Scikit-learn, PyTorch, TensorFlow 등 다양한 프레임워크를 함께 사용할 때

**LangSmith 선택이 유리한 경우**:

- LangChain/LangGraph를 주요 프레임워크로 사용하고, 즉시 사용 가능한 SaaS가 필요할 때
- Playground 기능으로 프롬프트를 즉시 테스트하고 수정하고 싶을 때
- 사용자 피드백(thumbs up/down)을 손쉽게 수집하고 관리하고 싶을 때
- 인프라 운영 리소스가 부족하고 관리형 서비스를 선호할 때

**의사결정 체크리스트**:

| 항목 | MLflow | LangSmith |
|------|--------|-----------|
| 라이선스 | 오픈소스 (Apache 2.0) | 상용 (Free tier 제한적) |
| 호스팅 | 자체 호스팅 필요 | 클라우드 SaaS |
| 프레임워크 지원 | 범용 (Scikit-learn, PyTorch, LangChain 등) | LangChain 전용 |
| 통합성 | OpenTelemetry 표준 | LangChain 에코시스템 |
| UI/UX | 범용 실험 관리 UI | LangChain 특화 대화형 UI |
| 비용 | 인프라 비용만 | 사용량 기반 과금 |

**하이브리드 접근**: 일부 팀은 개발 단계에서 LangSmith로 빠른 프로토타이핑을 하고, 프로덕션 배포는 MLflow로 전환하는 전략을 사용합니다.

### 실전 적용 시 주의사항

**1. 민감 데이터 로깅 제어**

LLM 입출력에 개인정보가 포함될 수 있으므로 로깅 전 필터링이 필요합니다:

```python
import mlflow
from mlflow.utils.autologging_utils import disable_for_unsupported_versions

# 특정 필드 제외
mlflow.langchain.autolog(log_inputs=False, log_outputs=True)

# 또는 커스텀 필터 적용
def sanitize_output(output):
    # 이메일, 전화번호 등 마스킹
    return re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', output)
```

**2. 대규모 Trace 저장 비용**

Tracing을 모든 요청에 활성화하면 스토리지 비용이 급증할 수 있습니다. 샘플링 전략 적용:

```python
import random
import mlflow

# 10% 샘플링
if random.random() < 0.1:
    mlflow.langchain.autolog()
else:
    mlflow.langchain.autolog(disable=True)
```

**3. Evaluation Judge 모델 비용**

LLM-as-a-Judge 메트릭은 평가 데이터셋 크기에 비례해 API 호출 비용이 발생합니다. 캐싱 전략 활용:

```python
from mlflow.metrics.genai import make_genai_metric

custom_metric = make_genai_metric(
    name="faithfulness",
    # ...
    model="openai:/gpt-4-turbo",
    parameters={
        "temperature": 0.0,  # 결정적 출력으로 캐싱 효율 향상
        "seed": 42
    }
)
```

**4. MLflow Server 고가용성**

프로덕션 환경에서는 MLflow Tracking Server를 고가용성으로 구성:

- Backend Store: PostgreSQL/MySQL (복제 구성)
- Artifact Store: S3/GCS (자동 복제)
- Load Balancer: 여러 MLflow 서버 인스턴스 앞단 배치
- 모니터링: Prometheus + Grafana로 서버 상태 추적

## References

- [MLflow Official Documentation](https://mlflow.org/docs/latest/index.html)
- [MLflow LLMs Guide](https://mlflow.org/docs/latest/llms/index.html)
- [MLflow Tracing Documentation](https://mlflow.org/docs/latest/llms/tracing/index.html)
- [MLflow GenAI Evaluation Guide](https://mlflow.org/docs/latest/llms/llm-evaluate/index.html)
- [OpenTelemetry Python SDK](https://opentelemetry.io/docs/languages/python/)
- [LangChain MLflow Integration](https://python.langchain.com/docs/integrations/providers/mlflow/)
- [프로젝트 테스트 코드 GitHub Repository](https://github.com/taehan79-kim/mlflow-genai-tutorial)
