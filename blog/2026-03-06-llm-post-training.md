---
title: "LLM Post Training"
description: "LLM Post Training은 사전학습된 언어 모델을 실제 사용 가능한 AI 어시스턴트로 변환하는 핵심 과정입니다. Supervised Fine-Tuning(SFT)으로 instruction-following 능력을 학습한 후, Reinforcement Learni"
slug: llm-post-training
date: 2026-03-06
authors: [jaehun]
tags:
  - llm
  - post-training
  - reference
source_url: ""
---


# LLM Post Training

## TL;DR
> LLM Post Training은 사전학습된 언어 모델을 실제 사용 가능한 AI 어시스턴트로 변환하는 핵심 과정입니다. Supervised Fine-Tuning(SFT)으로 instruction-following 능력을 학습한 후, Reinforcement Learning from Human Feedback(RLHF)를 통해 인간의 선호도에 맞춰 모델을 정렬합니다. 최근에는 Direct Preference Optimization(DPO) 같은 방법으로 RL 없이도 효과적인 선호도 학습이 가능해졌으며, Rejection Sampling과 iterative training을 통해 지속적인 성능 개선을 달성할 수 있습니다.

## Key Takeaways
- **Post Training은 3단계 프로세스**: SFT → Reward Modeling → RL/DPO로 구성되며, 각 단계는 모델의 유용성(helpfulness)과 무해성(harmlessness)을 점진적으로 개선
- **DPO는 RL의 실용적 대안**: Reward model과 복잡한 RL 파이프라인 없이 preference pair 데이터만으로 직접 최적화 가능하여 구현 및 안정성 측면에서 유리
- **Rejection Sampling으로 데이터 품질 향상**: 모델이 생성한 여러 샘플 중 높은 reward를 받은 응답만 선별하여 SFT 데이터셋을 강화하는 self-improvement 기법
- **Iterative training이 핵심**: SFT와 RL/DPO를 반복적으로 수행하며, 매 iteration마다 새로운 데이터로 학습하여 모델의 지속적인 성능 향상 달성
- **실무 적용 시 trade-off 고려**: Helpfulness와 harmlessness 간의 균형, 학습 안정성과 성능 간의 trade-off를 도메인 특성에 맞게 조정 필요

## 상세 내용

### Post Training의 전체 구조

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/0d39b303-15b4-4e69-bd29-e54e9ef22041/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663GPPEBMS%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T065709Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDZrbugPUCbzgt%2FOXDqMwyPEqw4l91MjfgrjlbZGwwVXgIhAK%2Bv%2Bowqi17EMdRgWEvO%2B3PZIK2wacd%2B484IB8H5InLSKogECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1IgzgVVeN9sn5VNRnpCcq3ANLPfIq5vvCnEMvmXjBH0xPG%2BdtFlb3BwYyNy9S1lWVhKBH%2FwUVnoToCFAbapCtJuzLJAVg%2Bc%2Fg48bDqjjdH6otZKAyqCSFQsIn6LXfV2OBJ2dgWUDjKQIW%2FsYQPhiGmFXfyKfPAInDlUAnjGio%2FyAUTB0YoekjhKU2pJSZfsCSv1fh7RbvrCgyye231Kdf3eet%2B7oKAUPJICqpfgTOxNHz8zXhNgwIMFnQGw1ygsWzxiPcd22vot1oa5QoOt9qdcVXhh9kvSHzlf%2ByFGoQ9fP%2Fy1csOeNVw05UHv%2FoajCTRYjUFAW86EzyGDdboqhSkK2CHWDZFfDgMjGunIffzGpkTGDl7%2BjrMbaNj1Syxsq8kafa6LQFaRxCJt8MBE47moH0mZATK%2FQiVvreFL5bQK9bshsO1jbhRT3zPyM3KUkpBfW9XfI0qCjbQj81hZ4n8spJ%2BE1MUvCV8K3dCzyaQi2h21EpuiRVBWlzxu34TRX5TBz9qrTnXnukzR8vS0M59Smv4Bhg%2BnTEujeeBEcYWFgF4sD8ITvusPpSsyGnoPStyWizCJh6kyKWHS6TvoKx%2FvDWbJajZbFlTz0nOnvTVTwwqWTnok8tzWRunkDag59Y54mfU1iVWkijj9CY%2FDC7%2FY3OBjqkAbP%2F2ef6A8887gUbu%2F80lGRhpzTHeaqoAq0Qw5F5YZCbx11ADz4cGXWG%2BbAF9tcmZG0i4eMiQU5CjnRNP1yjYUblP%2Bp2cLzcZhsYpMM%2FM08X%2F1sYR2LyanJsfczKYLpZxR%2FYklxC7QfLbi0IMTnllAmypt%2FwikJNyfvO5Kb35%2F%2B0AMW15swPs0WH8ItQMBmkscyYQI0Dh%2BZf1ZQUNAJg7neC1dVr&X-Amz-Signature=209ac13ea92bebad58f9b6d88f5c7053e8be22a3f9a954125bdad192343a5237&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

LLM Post Training은 사전학습(Pre-training)된 base model을 실제 사용자와 상호작용할 수 있는 대화형 AI로 변환하는 과정입니다. 사전학습 단계에서는 대규모 텍스트 코퍼스로 next-token prediction을 학습하지만, 이것만으로는 사용자의 지시를 따르거나 안전한 응답을 생성하기 어렵습니다.

Post Training은 크게 세 가지 주요 단계로 구성됩니다:
1. **Supervised Fine-Tuning (SFT)**: Instruction-response 쌍으로 모델을 fine-tuning
2. **Reward Modeling**: 인간의 선호도를 학습하는 reward model 구축
3. **Reinforcement Learning (RL) / Direct Preference Optimization (DPO)**: 선호도에 맞춰 모델 정렬

### Supervised Fine-Tuning (SFT)

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/9242a2c4-7843-4574-9722-263fd5ab16c8/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663GPPEBMS%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T065709Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDZrbugPUCbzgt%2FOXDqMwyPEqw4l91MjfgrjlbZGwwVXgIhAK%2Bv%2Bowqi17EMdRgWEvO%2B3PZIK2wacd%2B484IB8H5InLSKogECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1IgzgVVeN9sn5VNRnpCcq3ANLPfIq5vvCnEMvmXjBH0xPG%2BdtFlb3BwYyNy9S1lWVhKBH%2FwUVnoToCFAbapCtJuzLJAVg%2Bc%2Fg48bDqjjdH6otZKAyqCSFQsIn6LXfV2OBJ2dgWUDjKQIW%2FsYQPhiGmFXfyKfPAInDlUAnjGio%2FyAUTB0YoekjhKU2pJSZfsCSv1fh7RbvrCgyye231Kdf3eet%2B7oKAUPJICqpfgTOxNHz8zXhNgwIMFnQGw1ygsWzxiPcd22vot1oa5QoOt9qdcVXhh9kvSHzlf%2ByFGoQ9fP%2Fy1csOeNVw05UHv%2FoajCTRYjUFAW86EzyGDdboqhSkK2CHWDZFfDgMjGunIffzGpkTGDl7%2BjrMbaNj1Syxsq8kafa6LQFaRxCJt8MBE47moH0mZATK%2FQiVvreFL5bQK9bshsO1jbhRT3zPyM3KUkpBfW9XfI0qCjbQj81hZ4n8spJ%2BE1MUvCV8K3dCzyaQi2h21EpuiRVBWlzxu34TRX5TBz9qrTnXnukzR8vS0M59Smv4Bhg%2BnTEujeeBEcYWFgF4sD8ITvusPpSsyGnoPStyWizCJh6kyKWHS6TvoKx%2FvDWbJajZbFlTz0nOnvTVTwwqWTnok8tzWRunkDag59Y54mfU1iVWkijj9CY%2FDC7%2FY3OBjqkAbP%2F2ef6A8887gUbu%2F80lGRhpzTHeaqoAq0Qw5F5YZCbx11ADz4cGXWG%2BbAF9tcmZG0i4eMiQU5CjnRNP1yjYUblP%2Bp2cLzcZhsYpMM%2FM08X%2F1sYR2LyanJsfczKYLpZxR%2FYklxC7QfLbi0IMTnllAmypt%2FwikJNyfvO5Kb35%2F%2B0AMW15swPs0WH8ItQMBmkscyYQI0Dh%2BZf1ZQUNAJg7neC1dVr&X-Amz-Signature=dd54ee4d2358915e37c9382f6b1c2794b0b4defcd2d3e5cd91a46378cdac434f&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

SFT는 Post Training의 첫 번째 단계로, 고품질의 instruction-response 데이터셋을 사용하여 모델이 사용자의 요청을 이해하고 적절히 응답하는 능력을 학습합니다. 

**핵심 특징:**
- 기존의 일반적인 supervised learning과 동일한 방식으로 학습
- 입력(instruction)과 출력(response) 쌍으로 구성된 데이터 필요
- 모델이 instruction-following 능력을 획득하는 기초 단계

SFT 데이터의 품질이 최종 모델의 성능을 크게 좌우합니다. 따라서 다양한 도메인과 태스크를 포괄하면서도 높은 품질을 유지하는 데이터셋 구축이 중요합니다.

### Reward Model Training

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/0dccbb55-86b2-4885-8451-d5cf8ffd2973/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663GPPEBMS%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T065709Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDZrbugPUCbzgt%2FOXDqMwyPEqw4l91MjfgrjlbZGwwVXgIhAK%2Bv%2Bowqi17EMdRgWEvO%2B3PZIK2wacd%2B484IB8H5InLSKogECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1IgzgVVeN9sn5VNRnpCcq3ANLPfIq5vvCnEMvmXjBH0xPG%2BdtFlb3BwYyNy9S1lWVhKBH%2FwUVnoToCFAbapCtJuzLJAVg%2Bc%2Fg48bDqjjdH6otZKAyqCSFQsIn6LXfV2OBJ2dgWUDjKQIW%2FsYQPhiGmFXfyKfPAInDlUAnjGio%2FyAUTB0YoekjhKU2pJSZfsCSv1fh7RbvrCgyye231Kdf3eet%2B7oKAUPJICqpfgTOxNHz8zXhNgwIMFnQGw1ygsWzxiPcd22vot1oa5QoOt9qdcVXhh9kvSHzlf%2ByFGoQ9fP%2Fy1csOeNVw05UHv%2FoajCTRYjUFAW86EzyGDdboqhSkK2CHWDZFfDgMjGunIffzGpkTGDl7%2BjrMbaNj1Syxsq8kafa6LQFaRxCJt8MBE47moH0mZATK%2FQiVvreFL5bQK9bshsO1jbhRT3zPyM3KUkpBfW9XfI0qCjbQj81hZ4n8spJ%2BE1MUvCV8K3dCzyaQi2h21EpuiRVBWlzxu34TRX5TBz9qrTnXnukzR8vS0M59Smv4Bhg%2BnTEujeeBEcYWFgF4sD8ITvusPpSsyGnoPStyWizCJh6kyKWHS6TvoKx%2FvDWbJajZbFlTz0nOnvTVTwwqWTnok8tzWRunkDag59Y54mfU1iVWkijj9CY%2FDC7%2FY3OBjqkAbP%2F2ef6A8887gUbu%2F80lGRhpzTHeaqoAq0Qw5F5YZCbx11ADz4cGXWG%2BbAF9tcmZG0i4eMiQU5CjnRNP1yjYUblP%2Bp2cLzcZhsYpMM%2FM08X%2F1sYR2LyanJsfczKYLpZxR%2FYklxC7QfLbi0IMTnllAmypt%2FwikJNyfvO5Kb35%2F%2B0AMW15swPs0WH8ItQMBmkscyYQI0Dh%2BZf1ZQUNAJg7neC1dVr&X-Amz-Signature=e5ed7e739aa059338cab4b5effde892ba12a16d815388376799ef642cc03e30c&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Reward Model은 인간의 선호도를 수치화하여 모델 응답의 품질을 평가하는 역할을 합니다. RLHF(Reinforcement Learning from Human Feedback)의 핵심 구성요소입니다.

**학습 방식:**
- 동일한 입력에 대해 여러 응답을 생성하고, 인간 평가자가 선호도를 매깁니다
- Preference pair 형태의 데이터: (prompt, chosen_response, rejected_response)
- Bradley-Terry 모델을 기반으로 ranking loss를 최소화하도록 학습

Reward Model은 이후 RL 단계에서 모델의 행동을 guide하는 신호로 사용되며, 인간의 피드백을 효율적으로 스케일업할 수 있게 해줍니다.

### Reinforcement Learning from Human Feedback (RLHF)

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/7aed5bfc-81ef-4a97-a0f9-bcfb8d5a74f0/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663GPPEBMS%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T065709Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDZrbugPUCbzgt%2FOXDqMwyPEqw4l91MjfgrjlbZGwwVXgIhAK%2Bv%2Bowqi17EMdRgWEvO%2B3PZIK2wacd%2B484IB8H5InLSKogECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1IgzgVVeN9sn5VNRnpCcq3ANLPfIq5vvCnEMvmXjBH0xPG%2BdtFlb3BwYyNy9S1lWVhKBH%2FwUVnoToCFAbapCtJuzLJAVg%2Bc%2Fg48bDqjjdH6otZKAyqCSFQsIn6LXfV2OBJ2dgWUDjKQIW%2FsYQPhiGmFXfyKfPAInDlUAnjGio%2FyAUTB0YoekjhKU2pJSZfsCSv1fh7RbvrCgyye231Kdf3eet%2B7oKAUPJICqpfgTOxNHz8zXhNgwIMFnQGw1ygsWzxiPcd22vot1oa5QoOt9qdcVXhh9kvSHzlf%2ByFGoQ9fP%2Fy1csOeNVw05UHv%2FoajCTRYjUFAW86EzyGDdboqhSkK2CHWDZFfDgMjGunIffzGpkTGDl7%2BjrMbaNj1Syxsq8kafa6LQFaRxCJt8MBE47moH0mZATK%2FQiVvreFL5bQK9bshsO1jbhRT3zPyM3KUkpBfW9XfI0qCjbQj81hZ4n8spJ%2BE1MUvCV8K3dCzyaQi2h21EpuiRVBWlzxu34TRX5TBz9qrTnXnukzR8vS0M59Smv4Bhg%2BnTEujeeBEcYWFgF4sD8ITvusPpSsyGnoPStyWizCJh6kyKWHS6TvoKx%2FvDWbJajZbFlTz0nOnvTVTwwqWTnok8tzWRunkDag59Y54mfU1iVWkijj9CY%2FDC7%2FY3OBjqkAbP%2F2ef6A8887gUbu%2F80lGRhpzTHeaqoAq0Qw5F5YZCbx11ADz4cGXWG%2BbAF9tcmZG0i4eMiQU5CjnRNP1yjYUblP%2Bp2cLzcZhsYpMM%2FM08X%2F1sYR2LyanJsfczKYLpZxR%2FYklxC7QfLbi0IMTnllAmypt%2FwikJNyfvO5Kb35%2F%2B0AMW15swPs0WH8ItQMBmkscyYQI0Dh%2BZf1ZQUNAJg7neC1dVr&X-Amz-Signature=8fa8a2095236182b9555960c999ea9d38ccbe240c5a2d6431a9acd8c7e9b22f3&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

RLHF는 Reward Model을 활용하여 LLM을 인간의 선호도에 맞게 최적화하는 단계입니다. 주로 Proximal Policy Optimization (PPO) 알고리즘이 사용됩니다.

**학습 프로세스:**
1. SFT 모델에서 prompt에 대한 응답 생성
2. Reward Model이 생성된 응답의 점수를 평가
3. PPO를 통해 높은 reward를 받는 방향으로 policy 업데이트
4. KL divergence penalty를 추가하여 원본 SFT 모델로부터 너무 멀어지지 않도록 규제

**장단점:**
- 장점: 인간의 복잡한 선호도를 효과적으로 학습 가능
- 단점: 학습이 불안정하고, reward model, reference model, policy model 등 여러 모델을 동시에 관리해야 하는 복잡성

### Direct Preference Optimization (DPO)

![](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/75298940-c149-426f-81e4-cf709b8b691d/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663GPPEBMS%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T065709Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDZrbugPUCbzgt%2FOXDqMwyPEqw4l91MjfgrjlbZGwwVXgIhAK%2Bv%2Bowqi17EMdRgWEvO%2B3PZIK2wacd%2B484IB8H5InLSKogECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1IgzgVVeN9sn5VNRnpCcq3ANLPfIq5vvCnEMvmXjBH0xPG%2BdtFlb3BwYyNy9S1lWVhKBH%2FwUVnoToCFAbapCtJuzLJAVg%2Bc%2Fg48bDqjjdH6otZKAyqCSFQsIn6LXfV2OBJ2dgWUDjKQIW%2FsYQPhiGmFXfyKfPAInDlUAnjGio%2FyAUTB0YoekjhKU2pJSZfsCSv1fh7RbvrCgyye231Kdf3eet%2B7oKAUPJICqpfgTOxNHz8zXhNgwIMFnQGw1ygsWzxiPcd22vot1oa5QoOt9qdcVXhh9kvSHzlf%2ByFGoQ9fP%2Fy1csOeNVw05UHv%2FoajCTRYjUFAW86EzyGDdboqhSkK2CHWDZFfDgMjGunIffzGpkTGDl7%2BjrMbaNj1Syxsq8kafa6LQFaRxCJt8MBE47moH0mZATK%2FQiVvreFL5bQK9bshsO1jbhRT3zPyM3KUkpBfW9XfI0qCjbQj81hZ4n8spJ%2BE1MUvCV8K3dCzyaQi2h21EpuiRVBWlzxu34TRX5TBz9qrTnXnukzR8vS0M59Smv4Bhg%2BnTEujeeBEcYWFgF4sD8ITvusPpSsyGnoPStyWizCJh6kyKWHS6TvoKx%2FvDWbJajZbFlTz0nOnvTVTwwqWTnok8tzWRunkDag59Y54mfU1iVWkijj9CY%2FDC7%2FY3OBjqkAbP%2F2ef6A8887gUbu%2F80lGRhpzTHeaqoAq0Qw5F5YZCbx11ADz4cGXWG%2BbAF9tcmZG0i4eMiQU5CjnRNP1yjYUblP%2Bp2cLzcZhsYpMM%2FM08X%2F1sYR2LyanJsfczKYLpZxR%2
