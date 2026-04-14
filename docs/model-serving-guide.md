---
sidebar_position: 5
title: 모델 서빙 & 배포 가이드
---

# 모델 서빙 & 배포 가이드

LLM 및 ML 모델을 프로덕션 환경에서 서빙하기 위한 핵심 개념과 실무 가이드입니다.

## 서빙 아키텍처 선택

### API 기반 (Managed)

외부 LLM API를 활용하는 방식입니다.

| 제공자 | 대표 모델 | 특징 |
|--------|---------|------|
| Anthropic | Claude | 긴 컨텍스트, 안전성 |
| OpenAI | GPT-4o | 범용성, 생태계 |
| AWS Bedrock | 다수 모델 | 엔터프라이즈 보안, 다중 모델 |

**적합한 경우**: 빠른 프로토타이핑, 인프라 관리 부담 최소화, 다양한 모델 실험

### 자체 호스팅 (Self-hosted)

직접 GPU 서버에서 모델을 서빙하는 방식입니다.

| 프레임워크 | 특징 |
|-----------|------|
| **vLLM** | PagedAttention으로 높은 처리량, 프로덕션 표준 |
| **TGI** | HuggingFace 생태계, 간편 설정 |
| **SGLang** | 구조화된 출력 최적화, RadixAttention |

**적합한 경우**: 데이터 보안 요구, 비용 최적화, 모델 커스터마이징

## GPU 인스턴스 선택

### AWS EC2 GPU 인스턴스

| 인스턴스 | GPU | VRAM | 적합한 모델 크기 |
|---------|-----|------|--------------|
| g5.xlarge | A10G x1 | 24GB | 7B 이하 |
| g5.12xlarge | A10G x4 | 96GB | 13B~30B |
| p4d.24xlarge | A100 x8 | 320GB | 70B+ |

### 모델 크기별 최소 VRAM

- **7B (FP16)**: ~14GB → A10G 1장
- **13B (FP16)**: ~26GB → A10G 2장 or A100 1장
- **70B (FP16)**: ~140GB → A100 2장+
- **양자화 적용 시**: 약 50~75% 절감

## 최적화 기법

### 양자화 (Quantization)

| 방법 | 정밀도 | 메모리 절감 | 품질 영향 |
|------|-------|-----------|---------|
| FP16 | 16bit | 기준 | 없음 |
| INT8 | 8bit | ~50% | 미미 |
| INT4 (GPTQ/AWQ) | 4bit | ~75% | 소폭 |
| GGUF Q4_K_M | 4bit | ~75% | 소폭 |

### KV Cache 최적화

- **PagedAttention** (vLLM): 메모리 단편화 방지, 처리량 향상
- **Prefix Caching**: 공통 시스템 프롬프트 캐싱으로 TTFT 감소
- **Chunked Prefill**: 긴 프롬프트의 prefill 단계를 분할하여 지연 감소

### 배칭 전략

| 전략 | 설명 |
|------|------|
| Static Batching | 같은 길이 요청 묶기 (단순, 비효율) |
| Continuous Batching | 완료된 요청 즉시 교체 (vLLM 기본) |
| Dynamic Batching | 도착 순서대로 동적 그룹화 |

## 모니터링 지표

| 지표 | 의미 | 목표 |
|------|------|------|
| TTFT | 첫 토큰까지 걸리는 시간 | < 1초 |
| TPS | 초당 생성 토큰 수 | 모델/GPU 의존 |
| P99 Latency | 99퍼센타일 응답 시간 | SLA에 따라 |
| Throughput | 초당 처리 요청 수 | 동시 사용자 기반 |
| GPU Utilization | GPU 사용률 | 70~90% |

## 배포 체크리스트

- [ ] 로드 테스트 완료 (예상 동시 사용자 x 2배)
- [ ] Health check 엔드포인트 구현
- [ ] 타임아웃 설정 (generation timeout, connection timeout)
- [ ] Rate limiting 적용
- [ ] 모니터링 대시보드 구성
- [ ] Fallback 모델/API 준비
- [ ] 로그 수집 파이프라인 구축
