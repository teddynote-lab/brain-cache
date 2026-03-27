---
title: "GPU Programming 101"
description: "GPU 프로그래밍은 CPU와 근본적으로 다른 병렬 처리 아키텍처를 활용하는 기술입니다. CPU가 순차적 처리에 최적화된 반면, GPU는 수천 개의 코어로 대규모 병렬 연산을 수행합니다. AI Research Engineer라면 딥러닝 모델 학습 최적화를 위해 GPU의 "
slug: gpu-programming-101
date: 2025-12-31
authors: [jaehun]
tags:
  - backend
  - architecture
  - reference
source_url: ""
---


# GPU Programming 101

## TL;DR
> GPU 프로그래밍은 CPU와 근본적으로 다른 병렬 처리 아키텍처를 활용하는 기술입니다. CPU가 순차적 처리에 최적화된 반면, GPU는 수천 개의 코어로 대규모 병렬 연산을 수행합니다. AI Research Engineer라면 딥러닝 모델 학습 최적화를 위해 GPU의 메모리 계층 구조(글로벌/공유/레지스터 메모리), 스레드 조직화(그리드/블록/워프), 그리고 메모리 접근 패턴(coalescing)을 이해해야 합니다. CUDA나 OpenCL 같은 프레임워크를 통해 GPU를 프로그래밍하며, 효율적인 커널 설계가 성능의 핵심입니다.

## Key Takeaways
- **대규모 병렬성 활용**: GPU는 수천 개의 경량 코어를 통해 단순한 연산을 대량으로 처리하는데 특화되어 있어, 행렬 연산이 많은 딥러닝에 최적입니다.
- **메모리 계층 최적화**: 글로벌 메모리(느림, 대용량) → 공유 메모리(빠름, 블록 공유) → 레지스터(매우 빠름, 스레드 전용) 순으로 활용하면 성능을 극대화할 수 있습니다.
- **메모리 접근 패턴**: 연속된 스레드가 연속된 메모리를 접근하는 coalesced access 패턴을 유지해야 메모리 대역폭을 효율적으로 사용할 수 있습니다.
- **스레드 조직화 이해**: 워프(32개 스레드 단위) 단위로 동작하므로, 분기문(if-else)은 워프 내 발산(divergence)을 일으켜 성능을 저하시킬 수 있습니다.
- **프레임워크 선택**: CUDA(NVIDIA 전용, 성숙한 생태계)와 OpenCL(크로스 플랫폼) 중 프로젝트 요구사항에 맞게 선택하고, PyTorch/TensorFlow 같은 고수준 라이브러리가 내부적으로 어떻게 GPU를 활용하는지 이해하면 디버깅과 최적화에 유리합니다.

## 상세 내용

### GPU vs CPU: 아키텍처의 근본적 차이

![GPU Programming 101](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/b50e39ce-3e48-40b9-b090-5c32d1adbb5f/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4666XD6XPCG%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T063429Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIAPGtWN27dMlrehUHsB86IFRuV9sxK8tX9V7yJEdaM6yAiEAkOacSsjrTeQSN0P1i38g8L8jYroqjuV4gp3INAcaewUqiAQIp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDCvl5bFY6j0GVqjGeircA%2BZo9Ya%2Fu2WYkPfJJ6HzTBKO3L9NBUY2X5QA%2FLK%2BzOoZDI1TTzlO%2B1%2FPARBWcx2Ppma9mYeRPJm%2FFwsPRzurf2jGsspDuv8pwTp4fUVYk8P%2FGQKfTr01Zy9scN8ebHavigYn4v7LtbGYDi4ELbFasfk2SwEwCuPIe5IVesoCdbMjgG8kw18LpXBNY8IFEZRqflpNU0itieGaDdXHmZHDu%2F5pXrxEbOQj%2FaFW6bS3au61PloTaPpxd6U0CGpkIF5Qb1TH3LY5XMgrBXYUlno1JFR0l6PPtI9qZEJiv44MKeUc2TiuIUXVvyBfvD%2FN2SISZp016lM3qmEC8H0JkyARcyBBD0718ywo9zRl4P8jv3TtizkAWeaJq6euqhcqcg1C99rht%2FD%2FnXTfQZEdoilnjne0LE6EZiRuB9ysW1SmrCk8qU%2F6%2FB2Xme%2Fcmnjwqbnr%2BXdMbuiIZUPgv5XryvVuG9fnS3KipDzKuDIQ6SvlZ4GLlZSWyfPWS8hRwTgTc60WJv0QNs%2B0UocQMRMIIvzScpRMgMWbgjkm3E4cP0CKfsDbpTuAJRxPBogbejV0pq1%2Bfgmw8mn99PP3ukXh3eIheAF%2BJa%2BP%2BVvGwNALfticSJpt%2F2ZwYhbVJHVJXH4%2FMLv9jc4GOqUBScMtpE35CuJGGGzfRYdtsGQPm1hf%2B5NeW9adYF11raOqi6NBQX4yp9THRXOd5JEox%2F0lxvAtF8o9%2FJYD5dT%2ByZJi9JMmnyiJ%2FhNWj89OEX99Mbl4LURPJ%2BP2SWvrlOIQkgYB7Zo666UCKtMXxNidEP2mCAY1ulYXrnWWgXbmXpN4fkxNrB0owic8nOgBlyiuTJSac3k9NvZ77FUdhYAQL2rzOVmL&X-Amz-Signature=22343eda77fd71efd805f5e0836029eaed90a3a330f0d9b24661d5653ff64db1&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

CPU와 GPU는 서로 다른 목적으로 설계된 프로세서입니다. CPU는 복잡한 제어 로직과 큰 캐시를 가진 소수의 강력한 코어로 구성되어, 순차적 처리와 분기 예측에 최적화되어 있습니다. 반면 GPU는 간단한 제어 유닛을 가진 수천 개의 작은 코어로 구성되어, 동일한 연산을 대량의 데이터에 병렬로 적용하는 SIMT(Single Instruction, Multiple Threads) 아키텍처를 채택합니다.

AI/ML 워크로드에서 GPU가 압도적인 이유는 명확합니다. 신경망 학습의 핵심인 행렬 곱셈, 컨볼루션 연산, 활성화 함수 적용 등은 모두 수백만 개의 독립적인 연산으로 분해될 수 있으며, 이는 GPU의 대규모 병렬 처리 능력과 완벽하게 부합합니다.

### GPU 메모리 계층 구조

GPU 프로그래밍에서 성능 최적화의 핵심은 메모리 계층을 이해하고 활용하는 것입니다:

**글로벌 메모리 (Global Memory)**
- 가장 크지만 가장 느린 메모리 (수백 사이클 지연)
- 모든 스레드에서 접근 가능
- 일반적으로 수 GB ~ 수십 GB 용량
- CPU의 메인 메모리와 유사한 역할

**공유 메모리 (Shared Memory)**
- 블록 내 스레드들이 공유하는 고속 메모리
- 레지스터보다 느리지만 글로벌 메모리보다 100배 이상 빠름
- 스레드 간 데이터 교환 및 재사용에 활용
- 일반적으로 블록당 48~96 KB

**레지스터 (Registers)**
- 각 스레드 전용의 가장 빠른 메모리
- 지연 시간이 거의 없음
- 로컬 변수가 저장되는 공간
- 제한적이므로 과도한 사용 시 occupancy 감소

**효율적인 메모리 사용 패턴**은 다음과 같습니다:
1. 글로벌 메모리에서 데이터를 공유 메모리로 로드
2. 공유 메모리에서 여러 번 재사용하며 연산 수행
3. 결과를 다시 글로벌 메모리에 저장

이 패턴은 느린 글로벌 메모리 접근을 최소화하고, 빠른 공유 메모리의 지역성(locality)을 활용합니다.

### 스레드 조직화: 그리드, 블록, 워프

GPU 프로그래밍에서는 스레드를 계층적으로 조직합니다:

**그리드 (Grid)**
- 전체 커널 실행 단위
- 여러 블록으로 구성
- 1D, 2D, 3D 구조 가능

**블록 (Block)**
- 스레드의 그룹
- 같은 블록 내 스레드는 공유 메모리 사용 가능
- 동기화 가능 (`__syncthreads()`)
- 일반적으로 128~1024 스레드로 구성

**워프 (Warp)**
- 32개 스레드의 실행 단위 (NVIDIA 기준)
- 동일한 명령어를 동시에 실행
- 워프 내 분기(branch divergence) 발생 시 직렬화되어 성능 저하

**최적화 팁:**
- 블록 크기는 워프 크기(32)의 배수로 설정
- 워프 내 조건 분기 최소화
- 메모리 접근은 coalesced pattern 유지 (연속된 스레드가 연속된 메모리 접근)

### 프로그래밍 모델과 프레임워크

**CUDA (Compute Unified Device Architecture)**
- NVIDIA GPU 전용
- 가장 성숙한 생태계와 도구
- C/C++ 확장 형태
- cuDNN, cuBLAS 등 최적화된 라이브러리 제공

```cuda
__global__ void vectorAdd(float *A, float *B, float *C, int N) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < N) {
        C[idx] = A[idx] + B[idx];
    }
}
```

**OpenCL (Open Computing Language)**
- 크로스 플랫폼 (NVIDIA, AMD, Intel 등)
- 이식성이 높지만 CUDA 대비 복잡한 API
- 다양한 하드웨어 지원 필요 시 선택

**고수준 프레임워크**
- PyTorch, TensorFlow: 자동 GPU 가속
- Numba, CuPy: Python에서 GPU 커널 작성
- Triton: OpenAI의 GPU 프로그래밍 언어

### AI Research Engineer를 위한 실전 가이드

**프로파일링과 디버깅**
- NVIDIA Nsight Systems/Compute로 병목 지점 분석
- 커널 실행 시간, 메모리 전송 시간 측정
- Occupancy 확인 (이론적 최대 대비 실제 활용률)

**일반적인 최적화 전략**
1. **메모리 대역폭 최적화**: Coalesced access, 불필요한 전송 제거
2. **연산 강도 증가**: 메모리 접근 대비 연산 비율 높이기
3. **Occupancy 최적화**: 블록 크기, 레지스터 사용량 조절
4. **텐서 코어 활용**: Mixed precision training (FP16/BF16)

**딥러닝 특화 최적화**
- Fused kernels: 여러 연산을 하나의 커널로 결합
- Memory pooling: 반복적 할당/해제 오버헤드 제거
- Gradient accumulation: 큰 배치를 여러 작은 배치로 분할
- Flash Attention: 메모리 효율적인 attention 구현

### 실무에서의 고려사항

GPU 프로그래밍은 추상화 수준에 따라 접근 방식이 달라집니다:

- **고수준 (대부분의 경우)**: PyTorch/TensorFlow 사용, 프레임워크 최적화 기능 활용
- **중간 수준**: 커스텀 CUDA 커널 작성 (PyTorch custom ops)
- **저수준**: 전체 시스템 최적화, 새로운 아키텍처 구현

대부분의 AI Research Engineer는 고수준 프레임워크를 주로 사용하지만, GPU 동작 원리를 이해하면:
- 예상치 못한 성능 저하 원인 파악 가능
- 메모리 부족(OOM) 문제 해결 전략 수립
- 모델 아키�처 설계 시 하드웨어 친화적 선택
- 프로파일링 결과를 올바르게 해석

## References
- 원본 문서: GPU Programming 101 (Backend-Engineering, Architecture)
