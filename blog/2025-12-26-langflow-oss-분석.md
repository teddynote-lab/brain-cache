---
title: "LangFlow OSS 분석"
description: "Langflow는 MIT 라이선스 기반의 오픈소스 Python 프레임워크로, AI 워크플로우를 시각적으로 빠르게 구축할 수 있는 low-code 플랫폼입니다. n8n이나 Dify와 달리 컴포넌트의 완전한 커스터마이징이 가능하며, 드래그 앤 드롭 방식으로 Agent와 R"
slug: langflow-oss-분석
date: 2025-12-26
authors: [jaehun]
tags:
  - oss-analysis
  - reference
source_url: "https://www.langflow.org/"
---


# LangFlow OSS 분석

## TL;DR
> Langflow는 MIT 라이선스 기반의 오픈소스 Python 프레임워크로, AI 워크플로우를 시각적으로 빠르게 구축할 수 있는 low-code 플랫폼입니다. n8n이나 Dify와 달리 컴포넌트의 완전한 커스터마이징이 가능하며, 드래그 앤 드롭 방식으로 Agent와 RAG 애플리케이션을 쉽게 프로토타이핑하고 API로 배포할 수 있습니다. 특정 LLM이나 벡터 스토어에 종속되지 않아 유연한 통합이 가능하며, Python 기반으로 무제한 확장이 가능합니다.

## Key Takeaways
- **완전한 오픈소스와 커스터마이징**: MIT 라이선스로 셀프 호스팅이 가능하고, Python 코드로 모든 컴포넌트를 완전히 커스터마이징할 수 있어 프로덕션 환경에 유연하게 적용 가능
- **빠른 프로토타이핑과 실시간 테스트**: 시각적 에디터와 Playground로 전체 스택 구축 없이 워크플로우를 실시간으로 테스트하고 반복 개발 가능
- **API 기반 외부 통합**: 구축한 Flow를 REST API로 즉시 서빙할 수 있어, SDK처럼 외부 애플리케이션에서 호출 가능한 공통 규격 제공
- **Agent 및 MCP 지원**: 최신 AI 기능인 Agent와 Model Context Protocol(MCP)을 기본 지원하며, 수백 개의 데이터 소스 및 모델 통합 가능
- **프로토타입에서 프로덕션까지**: 컨테이너화 및 클라우드 배포를 지원하여, 프로토타입을 실제 서비스로 빠르게 전환 가능

## 상세 내용

### Langflow 개요

![**[Figure 01]** Langflow Flow 예시](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/443e0e32-d749-470b-93a3-645eca1deb30/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SWM7WZ6Y%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T071043Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIHFfY7Wc%2BEhMJvBpVm24RqWxGtIrw5CkLXMgsinsBmnQAiEAlfHOkVyt5dj6BD6tDUJvjeMrKWTD09TKPAlwIXBkowEqiAQIp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDIazsU9%2Bxke6mBqXPyrcAwaxiYQIHu%2BcDSwzRbu5Xci%2BN%2F82pg0KzX91IkXC3JgOgIa%2FWjMHYUb0z1QYeWmmtJPTKUVdGys6UVzlLJHIbMSntYO0NXKHsaykEsGCgENzICnasbXdc3mheZQyVPCzH89ePdmveGeD2Ny%2BSqQSDc0XlREvuqCzmzsqrcfN65%2Bee1XJp5jmTKLNuyjsGMXLByqz855i0chO7LU9zRiBTFgrM2RB9EF3gVygOiZBm55emgwN9w2WtGZvIpzMJ8uGwDa81ZXCu4QMNpMjUGnCKeWMi2xxxprD%2BzHq7NgoC%2BQHb%2F3feRAbatPBnn5nhdu5GPJSzhgxDaffLMDedQxAgcr4lhsnY2I%2FQ6S1G69IA9T5VLbnz6mIdfJUF2%2FuHFqLDL84Bfg1cAwrgq15BjdbezSGXNzAkxWOnG4cfuLWW%2BSkZXs1pd4seQu%2Falu%2FFUU7f%2FF7uKwCgd1laidH33EVDtNZaYHXm4Mmb0413Q9DJ%2BaAdjWHUMp%2FuJKQ8LS1x905MarpDIv30mMrB6tzI8XfOVoOINVIT9qJbFMzXy%2Bra6eJ0kqBme3tQlyI2PEfxt9cRuJOxq7C1DfIxqSd9bRUT%2F74c%2B4OXOt5bnZZbAERjatdbN4x4%2BqQKvZaP0BBMLz9jc4GOqUBn5gIIGfR28hzBe0GoJNOvX3z8xVOitBzmAPnlWzd3xBkPGMK5WbVf44GapU2TnOmBYsCKMbwurWyxV7C0z2PYN5Qcyr3mQ0Rt87qa%2B4ifpXfhwS0mYSjcn0%2F%2BjFThPrDU%2Ff4lROwmkrfl%2F18xZUiMmTCy2WAGKW9D6xN4OLg9pDzYbhS9nl%2FmIt4zeEjgrPfhGirhV2qzZcso5KZaXmnQL3%2FAZhm&X-Amz-Signature=e229a97b94421c3ced55cdb0a2edfcfbdb70e275098cb9ef9361c08c9fa8e921&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Langflow는 컴포넌트를 드래그 앤 드롭하여 AI 워크플로우를 시각적으로 구축할 수 있는 오픈소스 플랫폼입니다. Python 기반으로 개발되었으며, Agent 및 RAG(Retrieval-Augmented Generation) 애플리케이션 개발에 특화되어 있습니다.

**타 플랫폼과의 비교**
- **셀프호스팅 & 완전제어**: n8n > Langflow > Dify
- **비개발자 유저친화도**: Dify > n8n > Langflow

Langflow의 핵심 차별점은 MIT 라이선스를 채택한 완전한 오픈소스이며, 컴포넌트의 완전한 커스터마이징(Fully-custom)이 가능하다는 점입니다. 이는 프로덕션 환경에서 비즈니스 요구사항에 맞춰 세밀한 조정이 필요한 Research Engineer에게 중요한 장점입니다.

### 프로젝트 목적과 활용 방향

**1. 빠른 프로토타이핑**
Langflow를 사용하면 복잡한 Agent 및 워크플로우를 시각적으로 빠르게 구성하고 테스트할 수 있습니다. 이를 통해 아이디어 검증 단계부터 프로덕션 배포까지의 시간을 대폭 단축할 수 있습니다.

**2. 표준화된 외부 제공 인터페이스**
구축한 Flow를 SDK처럼 외부에서 호출할 수 있는 공통 규격을 제공합니다. REST API를 통해 다른 시스템과 쉽게 통합할 수 있어, 마이크로서비스 아키텍처에 적합합니다.

### 핵심 구성 요소

#### Projects와 Flow

![**[Figure 02]** Project와 flow](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/4e0199e9-f7d2-44ef-ba20-4faa115bf835/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SWM7WZ6Y%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T071043Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIHFfY7Wc%2BEhMJvBpVm24RqWxGtIrw5CkLXMgsinsBmnQAiEAlfHOkVyt5dj6BD6tDUJvjeMrKWTD09TKPAlwIXBkowEqiAQIp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDIazsU9%2Bxke6mBqXPyrcAwaxiYQIHu%2BcDSwzRbu5Xci%2BN%2F82pg0KzX91IkXC3JgOgIa%2FWjMHYUb0z1QYeWmmtJPTKUVdGys6UVzlLJHIbMSntYO0NXKHsaykEsGCgENzICnasbXdc3mheZQyVPCzH89ePdmveGeD2Ny%2BSqQSDc0XlREvuqCzmzsqrcfN65%2Bee1XJp5jmTKLNuyjsGMXLByqz855i0chO7LU9zRiBTFgrM2RB9EF3gVygOiZBm55emgwN9w2WtGZvIpzMJ8uGwDa81ZXCu4QMNpMjUGnCKeWMi2xxxprD%2BzHq7NgoC%2BQHb%2F3feRAbatPBnn5nhdu5GPJSzhgxDaffLMDedQxAgcr4lhsnY2I%2FQ6S1G69IA9T5VLbnz6mIdfJUF2%2FuHFqLDL84Bfg1cAwrgq15BjdbezSGXNzAkxWOnG4cfuLWW%2BSkZXs1pd4seQu%2Falu%2FFUU7f%2FF7uKwCgd1laidH33EVDtNZaYHXm4Mmb0413Q9DJ%2BaAdjWHUMp%2FuJKQ8LS1x905MarpDIv30mMrB6tzI8XfOVoOINVIT9qJbFMzXy%2Bra6eJ0kqBme3tQlyI2PEfxt9cRuJOxq7C1DfIxqSd9bRUT%2F74c%2B4OXOt5bnZZbAERjatdbN4x4%2BqQKvZaP0BBMLz9jc4GOqUBn5gIIGfR28hzBe0GoJNOvX3z8xVOitBzmAPnlWzd3xBkPGMK5WbVf44GapU2TnOmBYsCKMbwurWyxV7C0z2PYN5Qcyr3mQ0Rt87qa%2B4ifpXfhwS0mYSjcn0%2F%2BjFThPrDU%2Ff4lROwmkrfl%2F18xZUiMmTCy2WAGKW9D6xN4OLg9pDzYbhS9nl%2FmIt4zeEjgrPfhGirhV2qzZcso5KZaXmnQL3%2FAZhm&X-Amz-Signature=c4d5740c3cfc02eec47a51c036f57cb905bff8928e8606132880a72e24687312&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Langflow의 기본 구조는 **Projects**와 **Flow**로 구성됩니다:
- **Projects**: 논리적 폴더 단위로, 관련된 여러 Flow를 그룹화하여 관리
- **Flow**: 실제 워크플로우를 정의하는 단위로, 각 Flow는 여러 컴포넌트로 구성

#### Workflow Builder와 Canvas

![**[Figure 03]** Canvas와 Components](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/7fd48b6d-e9f2-468a-9a4f-baa6255694c6/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SWM7WZ6Y%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T071043Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIHFfY7Wc%2BEhMJvBpVm24RqWxGtIrw5CkLXMgsinsBmnQAiEAlfHOkVyt5dj6BD6tDUJvjeMrKWTD09TKPAlwIXBkowEqiAQIp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDIazsU9%2Bxke6mBqXPyrcAwaxiYQIHu%2BcDSwzRbu5Xci%2BN%2F82pg0KzX91IkXC3JgOgIa%2FWjMHYUb0z1QYeWmmtJPTKUVdGys6UVzlLJHIbMSntYO0NXKHsaykEsGCgENzICnasbXdc3mheZQyVPCzH89ePdmveGeD2Ny%2BSqQSDc0XlREvuqCzmzsqrcfN65%2Bee1XJp5jmTKLNuyjsGMXLByqz855i0chO7LU9zRiBTFgrM2RB9EF3gVygOiZBm55emgwN9w2WtGZvIpzMJ8uGwDa81ZXCu4QMNpMjUGnCKeWMi2xxxprD%2BzHq7NgoC%2BQHb%2F3feRAbatPBnn5nhdu5GPJSzhgxDaffLMDedQxAgcr4lhsnY2I%2FQ6S1G69IA9T5VLbnz6mIdfJUF2%2FuHFqLDL84Bfg1cAwrgq15BjdbezSGXNzAkxWOnG4cfuLWW%2BSkZXs1pd4seQu%2Falu%2FFUU7f%2FF7uKwCgd1laidH33EVDtNZaYHXm4Mmb0413Q9DJ%2BaAdjWHUMp%2FuJKQ8LS1x905MarpDIv30mMrB6tzI8XfOVoOINVIT9qJbFMzXy%2Bra6eJ0kqBme3tQlyI2PEfxt9cRuJOxq7C1DfIxqSd9bRUT%2F74c%2B4OXOt5bnZZbAERjatdbN4x4%2BqQKvZaP0BBMLz9jc4GOqUBn5gIIGfR28hzBe0GoJNOvX3z8xVOitBzmAPnlWzd3xBkPGMK5WbVf44GapU2TnOmBYsCKMbwurWyxV7C0z2PYN5Qcyr3mQ0Rt87qa%2B4ifpXfhwS0mYSjcn0%2F%2BjFThPrDU%2Ff4lROwmkrfl%2F18xZUiMmTCy2WAGKW9D6xN4OLg9pDzYbhS9nl%2FmIt4zeEjgrPfhGirhV2qzZcso5KZaXmnQL3%2FAZhm&X-Amz-Signature=7b4c7d1aa63000990c7c4b22732469dc4812c3c9c23f838c9d39fa938f147c63&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

시각적 에디터는 다음과 같이 구성됩니다:
- **Canvas**: 컴포넌트를 드래그 앤 드롭하여 배치하고 연결하는 작업 영역
- **Components 패널**: 사용 가능한 모든 컴포넌트의 목록

Flow를 구성할 때는 왼쪽 패널에서 필요한 컴포넌트를 Canvas로 드래그하고, 각 컴포넌트의 파라미터를 설정한 후 컴포넌트 간의 입출력을 연결하여 데이터 흐름을 정의합니다.

### Component 시스템

![**[Figure 04]** Components](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/91c140d7-2d66-407d-b622-1f90dfbc8076/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4666DACUGTQ%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T071048Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDrZaaWQ4OsAulREN%2B5ti4iajMpl0VxTmmIVBq0ACl3OwIgNqTy4DEPKjSRzhEGy4kOtoZ4YTA%2BA9gQx63ADT1CDBcqiAQIp%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDLmSqwnuIMysJADS0ircAzad3PK8%2FFr5CTB1QqA4zWw8SRjIV10lgr8rrpP3%2BmHs%2FIICMKzFdHygt3OfCuK0YByZ0rjkvvy7OAsGzjS3uX4XLH27vktUBax2u%2BFG43Ph4zjvsk66Yz4K69Z6%2Bo6SJNNI%2FqOGZJ%2FqIIOahUwSqEL1l%2BngWi%2B1OdMe3rLJYDUCZ5yPcn2c1fZa7kNnbYTDtK%2F5RyVtoh8LGbuUunS%2FF%2F%2B0V1FLOKWi9xTeg2F0CuSMTizIYbllmGjQAlGjZ3OVeBu%2Fqnx2GABoUEPLiOurvWv8jcVcvrkIF1PKd5ToDvyEk9xQRS1V4B3hHBv67EgwKzdzZdjzSzQN%2FEf%2BDF87acFuI5jmkBjEAt0iw4DoHHfQC4iLn0FXvgDyZkc0CLFqPdJrpPRa0jEikIZTbhs9XM8k%2FJW4JDS8OGACGvcc8ZAuALehc6j3xun13fRMslW%2F5tZVOoo7PR0RCfIQ10cXLf9cRSNz0sWE0WZWnf%2Bc%2FPFylmFCKaDq0uB36Yk2D1Kvm%2FUTnct0JPj0a%2F5zhcnPdR6JLyFrqHPevyVZMLM%2F0WzVbyDrYwQSyJTuASMc2sUNVgDnveJthSlLy9eGYuWxRluI4KuycPeeefED%2B37EMAqytLr3uoeIRpSCgWQtMLz9jc4GOqUBM7UE3bNqj4jAlaNWCFoW8uMo5Kj6%2Fq0VfI2beU9uSDUd5XbUmQ7Jh6CYey1N7r2ea%2FZbC6iVkTMiyX9qWgQtFYu16gujQI0U5Q0TYv3%2B80hoE3LuxvDWDuARmm7hD9XdB3dQljPzj%2BJqfnzVIDWDn1GjlfmMNMueLjqYSsCdAztI%2FhrTbjILp69%2F%2Fu83A%2FGtJA4KJJjO%2FoivTdjYWbt1ZZptKMyf&X-Amz-Signature=791f765d24afa5988350079fe98b6ca0075fde49e93ca7d63e74a2d2cf5b66f6&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

#### Basic Components

Langflow는 다음과 같은 카테고리의 기본 컴포넌트를 제공합니다:
- **Language Models**: OpenAI, Anthropic, Google, Meta, Mistral, Groq 등 다양한 LLM 지원
- **Vector Stores**: Pinecone, Qdrant, Milvus, Weaviate, Couchbase 등 주요 벡터 DB 통합
- **Data Sources**: Airbyte, Confluence, Gmail, Google Drive, Notion, Slack 등 다양한 데이터 소스
- **Tools**: Serper, Tavily, Wolfram Alpha, Yahoo Finance 등 외부 API 통합
- **Agents**: LangChain, CrewAI 등 에이전트 프레임워크 지원
- **Input/Output**: 범용 입출력 컴포넌트

![**[Figure 05]** Detail Component](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/bfee0afa-1c2a-42f7-9ab8-38b328c4a5e8/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466QACOPKHI%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T071048Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJGMEQCIBQmL%2BFAp0PMwK46HeFb0uQwC%2FAQgR7%2BazQSnCp3bfvkAiA8Bd0SNNnrgAwe7HNhWSXZChjcoYlPUQoau%2BEBrffC7SqIBAin%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDYzNzQyMzE4MzgwNSIMaPildgUq4u2ZFuD2KtwDnZbCzmrO2TZ3NIf1v0B%2BTFSbRQCVxYAmAyU%2BKIzM8mNDLC%2B10Xbq7FlYlkcfBkMPXqWwzC2gtXv1QzLjS5SEQG1T4m3OUtSWE16%2B7DNWXx1%2FQsSBnqxpYj3CKapVmogwJmkKhNFOIwssA799oW41JiBUtrNymd2QVTXkmj%2FoS4oad%2B3yWnMxUfUV8BWEDgMbmgTZysxUCuueiX1KYytRK3xmoPy0lPzSdP1caOhHzSeeYolGYIN3rD%2FgylFCGA0AAkJGxPPhnHZlzNBld6lXNvr7Qgi1GRErpQqLC1AO1RMwsCp3zy8dPiV4xXG6xhHgPD%2FCVfiMKucwFhqON73NjhmAhvlKqm5nJwcpPCVBVG0HJ9ZAUlSz6dm48r9iBehFtJR%2BLTaFMJSm%2FnlCCTsSoB7Vdt8yoXp5dXpKV6lQ72fsC9wMuyVyVwiSrKdFp%2FQnW%2BgVTpGwyLqhyRDg6os0%2FG78bMUrh5TlKXnDTuiI1DXnStWw8sZCWnFYYuLEhJIKzQV2FaHAwFEQgaWVitr9MW%2FihTfFQ5XZ6x3aPKlr82j9osjO4NWfp%2Bmz7fZn1hkXXMnzkxOr5tFTbYhSMQRvyyp8oFKwanOTpOJXGSLp2yYgHXkXozutmDMepBYwvf2NzgY6pgGTwKFvokVxrPveLPYmiIRwkH5s9QA%2
