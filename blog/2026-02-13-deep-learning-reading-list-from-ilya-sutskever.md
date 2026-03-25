---
title: "Deep learning reading list from Ilya Sutskever"
description: "OpenAI의 공동 창립자 Ilya Sutskever가 John Carmack에게 제시한 약 30편의 딥러닝 필독 논문 목록입니다. "
slug: deep-learning-reading-list-from-ilya-sutskever
date: 2026-02-13
authors: [braincrew]
tags:
  - llm
  - paper-review
source_url: "https://arc.net/folder/D0472A20-9C20-4D3F-B145-D2865C0A9FEE"
---


# Deep learning reading list from Ilya Sutskever

## TL;DR
> OpenAI의 공동 창립자 Ilya Sutskever가 John Carmack에게 제시한 약 30편의 딥러닝 필독 논문 목록입니다. "이것들을 제대로 학습하면 오늘날 중요한 것의 90%를 알게 될 것"이라는 말과 함께 공유된 이 리스트는 Transformer 아키텍처, RNN/LSTM, ResNet 같은 핵심 모델부터 복잡도 이론과 Kolmogorov Complexity 같은 이론적 기초까지 망라합니다. 현대 딥러닝의 필수 개념들을 체계적으로 학습할 수 있는 커리큘럼으로, AI Research Engineer라면 반드시 숙지해야 할 핵심 지식의 정수입니다.

## Key Takeaways
- **선별된 핵심 논문들**: 방대한 딥러닝 연구 중에서 실제로 중요한 90%를 커버하는 약 30편으로 압축된 ��리큘럼
- **이론과 실무의 균형**: Attention 메커니즘, ResNet 같은 실용적 아키텍처부터 Kolmogorov Complexity, MDL 같은 이론적 기초까지 포괄
- **시대를 초월한 기초**: RNN/LSTM 같은 초기 시퀀스 모델부터 Transformer, Scaling Laws까지 진화 과정을 이해할 수 있는 구성
- **실용적 구현 자료**: 대부분의 논문에 코드 구현이나 주석이 달린 튜토리얼이 포함되어 있어 학습과 동시에 실습 가능
- **압축과 복잡도 관점**: MDL, Kolmogorov Complexity 등을 통해 신경망을 정보 이론적 관점에서 이해하는 깊이 있는 시각 제공

## 상세 내용

### 리딩 리스트의 배경과 의의

OpenAI의 Chief Scientist이자 공동 창립자인 Ilya Sutskever는 게임 개발의 전설 John Carmack에게 "만약 이것들을 제대로 학습한다면, 오늘날 중요한 것의 90%를 알게 될 것"이라는 말과 함께 이 리스트를 공유했습니다. 이는 단순한 논문 목록이 아니라, 현대 딥러닝의 핵심을 관통하는 체계적인 학습 경로입니다.

이 목록의 특징은 최신 논문만을 추구하지 않고, 시대를 초월한 기본 원리와 실용적인 최신 기술을 균형있게 배치했다는 점입니다. 이론적 기초(Kolmogorov Complexity, MDL)부터 실용적 아키텍처(Transformer, ResNet), 그리고 스케일링 법칙까지 딥러닝의 과거, 현재, 미래를 아우릅니다.

### 핵심 아키텍처 논문들

**Transformer와 Attention 메커니즘**

- **Attention Is All You Need** (Vaswani et al.): 현대 LLM의 근간이 되는 Transformer 아키텍처의 원조 논문
- **The Annotated Transformer**: Harvard NLP 팀이 제공하는 line-by-line 구현과 주석. 단순히 논문을 읽는 것을 넘어 실제로 작동하는 코드와 함께 학습 가능
- **Neural Machine Translation by Jointly Learning to Align and Translate** (Bahdanau et al.): Attention 메커니즘의 초기 제안으로, Transformer 이전에 어떻게 시퀀스 모델에서 선택적 집중이 가능했는지 이해하는 데 필수

**RNN과 LSTM의 이해**

- **The Unreasonable Effectiveness of Recurrent Neural Networks** (Andrej Karpathy): RNN의 놀라운 생성 능력을 직관적으로 보여주는 블로그 포스트. 문자 단위 언어 모델이 어떻게 의미 있는 텍스트를 생성하는지 설명
- **Understanding LSTM Networks** (Christopher Olah): LSTM의 내부 구조를 시각적으로 명쾌하게 설명한 고전적 튜토리얼
- **Recurrent Neural Network Regularization** (Zaremba et al.): RNN 학습의 실용적 측면을 다루며, dropout 같은 정규화 기법의 적용

**Convolutional Networks와 Computer Vision**

- **ImageNet Classification with Deep Convolutional Neural Networks** (AlexNet): 딥러닝 부흥의 시발점이 된 역사적 논문
- **Deep Residual Learning for Image Recognition** (ResNet): Skip connection을 통해 매우 깊은 네트워크 학습을 가능하게 한 혁신
- **Identity Mappings in Deep Residual Networks**: ResNet의 개선 버전으로, 왜 특정 구조가 더 잘 작동하는지에 대한 이론적 이해 제공

### 이론적 기초와 철학

**복잡도와 정보 이론**

- **The First Law of Complexodynamics** (Scott Aaronson): Kolmogorov complexity를 활용하여 물리 시스템의 복잡도가 시간에 따라 어떻게 변하는지 설명. 엔트로피는 단조 증가하지만 "재미있음(interestingness)"은 증가했다 감소한다는 통찰 제공

- **Keeping Neural Networks Simple by Minimizing the Description Length of the Weights** (Hinton): MDL(Minimum Description Length) 원리를 신경망에 적용. 모델의 복잡도를 가중치를 설명하는 데 필요한 비트 수로 측정

- **A Tutorial Introduction to the Minimum Description Length Principle**: 압축과 학습의 관계에 대한 근본적 이해. 좋은 모델은 데이터를 잘 압축하는 모델

- **Kolmogorov Complexity and Algorithmic Randomness**: 객체의 본질적 복잡도를 정의하는 수학적 프레임워크. 일반화와 압축의 관계를 이해하는 이론적 토대

**철학적 고려사항**

- **Machine Super Intelligence** (Shane Legg): DeepMind 공동 창립자의 박사 논문. AGI에 대한 수학적이고 철학적인 접근

### 실용적 기법과 시스템

**스케일링과 병렬화**

- **Scaling Laws for Neural Language Models** (Kaplan et al.): 모델 크기, 데이터, 컴퓨팅의 관계를 정량화한 획기적 연구. 현대 LLM 개발의 나침반 역할

- **GPipe: Easy Scaling with Micro-Batch Pipeline Parallelism**: 거대 모델을 효율적으로 학습시키기 위한 파이프라인 병렬화 기법

**특수 아키텍처와 응용**

- **Pointer Networks**: 출력이 가변 길이 이산 토큰인 문제(조합 최적화 등)를 다루는 혁신적 접근

- **Neural Turing Machines**: 외부 메모리를 가진 신경망으로, 알고리즘 학습 가능성 탐구

- **Deep Speech 2**: End-to-end 음성 인식의 실용적 구현

- **Order Matters: Sequence to sequence for sets**: 순서가 없는 집합을 다루면서도 순서가 중요한 시퀀스 모델의 특성 활용

### 관계 추론과 구조

- **A simple neural network module for relational reasoning**: 객체 간 관계를 추론하는 네트워크 모듈

- **Relational recurrent neural networks**: RNN에 관계 추론 능력을 부여

- **Neural Message Passing for Quantum Chemistry**: 그래프 신경망을 화학 분자 특성 예측에 적용

### 생성 모델과 표현 학습

- **Variational Lossy Autoencoder**: VAE의 개선된 형태로, 더 나은 생성과 압축의 균형

### 교육 자료

- **CS231n: Convolutional Neural Networks for Visual Recognition**: Stanford의 유명한 딥러닝 강의. 체계적인 기초 학습을 위한 커리큘럼

### 학습 순서와 전략

이 리스트를 효과적으로 학습하기 위한 제안:

1. **기초부터 시작**: CS231n으로 기본 개념 확립
2. **RNN 계열 이해**: Karpathy와 Olah의 블로그로 직관 형성 → LSTM 정규화로 실용 지식 습득
3. **Attention과 Transformer**: Bahdanau attention → Transformer 논문 → Annotated Transformer로 구현까지
4. **컴퓨터 비전 기초**: AlexNet → ResNet으로 발전 과정 이해
5. **이론적 심화**: MDL, Kolmogorov Complexity로 깊이 있는 이해
6. **스케일링과 실용화**: Scaling Laws, GPipe 등으로 현대적 관점 확보

대부분의 자료가 코드나 상세한 튜토리얼과 함께 제공되므로, 단순히 읽는 것을 넘어 직접 구현하고 실험하는 것이 핵심입니다. The Annotated Transformer처럼 working notebook 형태의 자료들은 학습과 실습을 동시에 가능하게 합니다.

## References

- [Original Reading List - Ilya 30u30 Folder](https://arc.net/folder/D0472A20-9C20-4D3F-B145-D2865C0A9FEE)
- [The Annotated Transformer](https://nlp.seas.harvard.edu/annotated-transformer/)
- [The Annotated Transformer - GitHub](https://github.com/harvardnlp/annotated-transformer/)
- [The First Law of Complexodynamics - Scott Aaronson](https://scottaaronson.blog/?p=762)
- [The Unreasonable Effectiveness of Recurrent Neural Networks - Andrej Karpathy](https://karpathy.github.io/2015/05/21/rnn-effectiveness/)
- [Understanding LSTM Networks - Christopher Olah](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)
- [char-rnn GitHub Repository](https://github.com/karpathy/char-rnn)
- [Recurrent Neural Network Regularization (ArXiv)](https://arxiv.org/abs/1409.2329)
- [LSTM Regularization Code](https://github.com/wojzaremba/lstm)
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361)
