---
title: "Scaling PostgreSQL to power 800 million ChatGPT users"
description: "OpenAI는 ChatGPT와 API를 지원하기 위해 단일 Primary PostgreSQL 인스턴스와 50개의 Read Replica를 활용해 80만 사용자를 지원하며, 연간 10배 이상의 트래픽 증가를 처리하고 있습니다. MVCC(Multi-Version Concu"
slug: scaling-postgresql-to-power-800-million-chatgpt-users
date: 2026-01-25
authors: [braincrew]
tags:
  - backend
  - optimizer
  - reference
source_url: "https://openai.com/index/scaling-postgresql/"
---


# Scaling PostgreSQL to power 800 million ChatGPT users

## TL;DR
> OpenAI는 ChatGPT와 API를 지원하기 위해 단일 Primary PostgreSQL 인스턴스와 50개의 Read Replica를 활용해 80만 사용자를 지원하며, 연간 10배 이상의 트래픽 증가를 처리하고 있습니다. MVCC(Multi-Version Concurrency Control)의 write amplification 문제를 완화하기 위해 write-heavy 워크로드를 샤딩된 시스템(Azure Cosmos DB)으로 마이그레이션하고, 쿼리 최적화, 워크로드 격리, 연결 풀링, 캐싱 등의 최적화를 통해 PostgreSQL을 초당 수백만 쿼리를 처리하는 규모로 확장했습니다. 이는 적절한 엔지니어링과 최적화를 통해 단일 Primary 아키텍처로도 대규모 read-heavy 워크로드를 충분히 지원할 수 있음을 증명합니다.

## Key Takeaways
- **단일 Primary 아키텍처의 가능성**: Read-heavy 워크로드에 대해서는 샤딩 없이도 Primary 하나와 다수의 Read Replica로 대규모 트래픽을 처리할 수 있으며, 이는 샤딩에 수반되는 복잡한 애플리케이션 변경을 피할 수 있게 함
- **MVCC의 근본적 한계 이해**: PostgreSQL의 MVCC 구현은 update 시 전체 row를 복사하여 write/read amplification을 유발하고, dead tuple, table bloat, autovacuum 튜닝 등 운영 복잡도를 증가시키므로 write-heavy 워크로드는 다른 시스템으로 분리해야 함
- **계층화된 트래픽 관리**: 우선순위 기반 워크로드 격리, PgBouncer를 통한 연결 풀링, 캐시 락/리스 메커니즘을 통해 트래픽 급증 시 cascading failure를 방지하고 시스템 안정성을 확보할 수 있음
- **쿼리 최적화의 중요성**: ORM이 생성한 다중 테이블 조인(12개 테이블 조인 사례)과 같은 expensive query 하나가 전체 서비스 장애를 유발할 수 있으므로, 복잡한 join은 애플리케이션 레이어로 이동하고 SQL 동작을 엄격히 검토해야 함
- **단일 장애 지점(SPOF) 완화 전략**: 대부분의 critical read를 replica로 오프로드하고, HA 모드로 hot standby를 운영하며, 각 region에 충분한 headroom을 가진 다수의 replica를 배치하여 Primary 장애 시에도 read 서비스는 유지할 수 있도록 설계

## 상세 내용

### OpenAI의 PostgreSQL 스케일링 여정

OpenAI는 수년간 PostgreSQL을 ChatGPT와 API의 핵심 데이터 시스템으로 운영해왔습니다. 사용자 기반이 급격히 증가하면서, 지난 1년간 PostgreSQL 부하는 10배 이상 증가했고 계속해서 빠르게 상승하고 있습니다.

이러한 성장을 지탱하기 위한 프로덕션 인프라 개선 작업을 통해 새로운 인사이트를 얻었습니다: PostgreSQL은 많은 사람들이 생각했던 것보다 훨씬 더 큰 read-heavy 워크로드를 안정적으로 지원할 수 있도록 확장 가능합니다. 

현재 OpenAI는 단일 Primary Azure PostgreSQL Flexible Server 인스턴스와 전 세계 여러 region에 분산된 약 50개의 read replica를 통해 8억 명의 사용자를 위한 대규모 글로벌 트래픽을 지원하고 있습니다. Azure Database for PostgreSQL은 완전 관리형 서비스로서 compute와 storage를 분리한 아키텍처를 제공하며, zone redundant 고가용성을 지원하여 동일 Azure region 내 availability zone 간 동기식 복제를 통해 무손실 failover를 가능하게 합니다.

### 초기 설계의 한계

ChatGPT 출시 후 트래픽이 전례 없는 속도로 증가했습니다. 이를 지원하기 위해 애플리케이션과 PostgreSQL 데이터베이스 레이어 모두에서 광범위한 최적화를 신속히 구현했고, 인스턴스 크기를 늘리는 scale-up과 read replica를 추가하는 scale-out을 수행했습니다.

단일 Primary 아키텍처가 OpenAI 규모의 요구사항을 충족시킬 수 있다는 것은 놀랍게 들릴 수 있지만, 실제로 이를 작동시키는 것은 단순하지 않습니다. PostgreSQL 과부하로 인한 여러 심각한 장애(SEV)를 경험했으며, 이들은 종종 동일한 패턴을 따릅니다:

- 캐싱 레이어 장애로 인한 광범위한 캐시 미스
- CPU를 포화시키는 expensive 다중 조인(multi-way join) 급증
- 새 기능 출시로 인한 write storm

리소스 사용률이 증가하면 쿼리 지연시간이 늘어나고 요청이 타임아웃되기 시작합니다. 재시도는 부하를 더욱 증폭시키고, 전체 ChatGPT 및 API 서비스를 저하시킬 수 있는 악순환을 촉발합니다.

![부하 상태에서의 악순환](https://images.ctfassets.net/kftzwdyauwt9/5dECJjynPkxFF2XABuh3bt/3b5562e1f879fd0afd2deffe9cf1e142/OAI_The_Vicious_Cycle_Under_Load__Light_Desktop_.svg?w=3840&q=90)

### PostgreSQL MVCC의 문제점

PostgreSQL은 read-heavy 워크로드에 대해 잘 확장되지만, write 트래픽이 많은 기간에는 여전히 어려움을 겪습니다. 이는 주로 PostgreSQL의 MVCC(Multi-Version Concurrency Control) 구현 때문입니다.

MVCC의 기본 개념은 DBMS가 여러 쿼리가 가능한 한 서로 간섭 없이 동시에 데이터베이스에 읽고 쓸 수 있도록 하는 것입니다. 쿼리가 실행될 때 DBMS는 트랜잭션이 시작된 시점의 데이터베이스 스냅샷을 관찰합니다(snapshot isolation). 이 접근 방식은 reader가 데이터에 접근하는 것을 차단하는 명시적인 레코드 락의 필요성을 제거합니다.

그러나 PostgreSQL의 MVCC 구현에는 심각한 문제가 있습니다:

**Write Amplification**: 쿼리가 tuple을 업데이트하거나 단일 필드만 수정할 때도 전체 row를 복사하여 새 버전을 생성합니다. Write가 많은 워크로드에서는 상당한 write amplification이 발생합니다.

**Read Amplification**: 쿼리가 최신 버전을 검색하기 위해 여러 tuple 버전(dead tuple)을 스캔해야 하므로 read amplification도 증가합니다.

**운영 복잡도**: Table과 index bloat, index 유지관리 오버헤드 증가, 복잡한 autovacuum 튜닝 등 추가적인 문제를 야기합니다.

Carnegie Mellon University의 Andy Pavlo 교수와 함께 작성한 블로그 "[The Part of PostgreSQL We Hate the Most](https://www.cs.cmu.edu/~pavlo/blog/2023/04/the-part-of-postgresql-we-hate-the-most.html)"에서 이러한 이슈에 대한 심층 분석을 제공하고 있으며, 이는 PostgreSQL Wikipedia 페이지에서도 인용되고 있습니다. 이 글에서는 PostgreSQL의 MVCC 구현이 MySQL, Oracle, Microsoft SQL Server를 포함한 다른 주요 관계형 DBMS 중 최악이라고 지적합니다.

### 초당 수백만 쿼리로 PostgreSQL 확장하기

이러한 한계를 완화하고 write 압력을 줄이기 위해 다음과 같은 전략을 채택했습니다:

#### Write 워크로드 마이그레이션

샤딩 가능한(수평 파티셔닝 가능한) write-heavy 워크로드를 Azure Cosmos DB와 같은 샤딩된 시스템으로 마이그레이션하고, 불필요한 write를 최소화하도록 애플리케이션 로직을 최적화했습니다. 또한 현재 PostgreSQL 배포에 새로운 테이블 추가를 더 이상 허용하지 않으며, 새 워크로드는 기본적으로 샤딩된 시스템을 사용합니다.

현재 인프라가 발전했음에도 PostgreSQL은 샤딩되지 않은 상태로, 단일 Primary 인스턴스가 모든 write를 처리합니다. 주된 이유는 기존 애플리케이션 워크로드를 샤딩하는 것이 매우 복잡하고 시간이 많이 걸리며, 수백 개의 애플리케이션 엔드포인트를 변경해야 하고 몇 달 또는 몇 년이 걸릴 수 있기 때문입니다. 워크로드가 주로 read-heavy이고 광범위한 최적화를 구현했기 때문에, 현재 아키텍처는 여전히 트래픽 증가를 지원할 충분한 여유를 제공합니다.

#### Primary 부하 감소

**과제**: 단일 writer만 있는 경우 write를 확장할 수 없습니다. write 급증은 Primary를 빠르게 과부하시켜 ChatGPT 및 API와 같은 서비스에 영향을 줄 수 있습니다.

**솔루션**: Primary에서 read와 write 모두 가능한 한 부하를 최소화하여 write 급증을 처리할 충분한 용량을 확보합니다. Read 트래픽은 가능한 한 replica로 오프로드됩니다. 그러나 write 트랜잭션의 일부인 일부 read 쿼리는 Primary에 남아야 합니다. 이러한 경우 쿼리가 효율적이고 느린 쿼리를 피하도록 보장하는 데 집중합니다.

#### 쿼리 최적화

**과제**: PostgreSQL에서 여러 expensive 쿼리를 식별했습니다. 과거에는 이러한 쿼리의 볼륨 급증이 대량의 CPU를 소비하여 ChatGPT와 API 요청을 모두 느리게 만들었습니다.

**솔루션**: 12개 테이블을 조인하는 매우 비용이 많이 드는 쿼리를 발견했으며, 이 쿼리의 급증이 과거 고심각도 SEV의 원인이었습니다. 복잡한 다중 테이블 조인은 가능한 한 피해야 합니다. 조인이 필요한 경우 쿼리를 분해하고 복잡한 조인 로직을 애플리케이션 레이어로 이동하는 것을 고려해야 합니다.

이러한 문제 쿼리 중 다수는 ORM(Object-Relational Mapping) 프레임워크에 의해 생성되므로, 생성된 SQL을 주의 깊게 검토하고 예상대로 동작하는지 확인하는 것이 중요합니다. 또한 `idle_in_transaction_session_timeout`과 같은 timeout을 구성하여 장기 실행 idle 쿼리가 autovacuum을 차단하는 것을 방지해야 합니다.

#### 단일 장애 지점(SPOF) 완화

**과제**: Read replica가 다운되면 트래픽을 다른 replica로 라우팅할 수 있습니다. 그러나 단일 writer에 의존한다는 것은 단일 장애 지점이 있다는 의미이며, 다운되면 전체 서비스가 영향을 받습니다.

**솔루션**: 가장 중요한 요청은 read 쿼리만 포함합니다. Primary의 단일 장애 지점을 완화하기 위해 writer에서 replica로 이러한 read를 오프로드하여 Primary가 다운되어도 해당 요청이 계속 서비스될 수 있도록 합니다.

Primary 장애를 완화하기 위해 Hot Standby와 함께 고가용성(HA) 모드로 Primary를 실행합니다. Hot Standby는 지속적으로 동기화되는 replica로 항상 트래픽을 인계받을 준비가 되어 있습니다. PostgreSQL에서는 Primary 서버가 continuous archiving 모드로 작동하고 각 standby 서버는 continuous recovery 모드로 작동하며 Primary에서 WAL 파일을 읽습니다. Azure PostgreSQL 팀은 매우 높은 부하에서도 이러한 failover가 안전하고 안정적으로 유지되도록 상당한 작업을 수행했습니다.

#### 워크로드 격리

**과제**: 특정 요청이 PostgreSQL 인스턴스에서 불균형적으로 많은 리소스를 소비하는 상황이 자주 발생합니다. 이는 동일한 인스턴스에서 실행되는 다른 워크로드의 성능 저하로 이어질 수 있습니다.

**솔루션**: "noisy neighbor" 문제를 완화하기 위해 워크로드를 전용 인스턴스로 격리하여 리소스 집약적 요청의 급증이 다른 트래픽에 영향을 주지 않도록 합니다. 구체적으로 요청을 low-priority와 high-priority tier로 분할하고 별도의 인스턴스로 라우팅합니다. 이렇게 하면 low-priority 워크로드가 리소스 집약적이 되어도 high-priority 요청의 성능이 저하되지 않습니다.

#### 연결 풀링(Connection Pooling)

**과제**: 각 인스턴스에는 최대 연결 제한이 있습니다(Azure PostgreSQL에서 5,000개). 연결이 부족하거나 idle 연결이 너무 많이 누적되기 쉽습니다. 이전에 모든 사용 가능한 연결을 소진시킨 connection storm으로 인한 장애가 있었습니다.

**솔루션**: PgBouncer를 프록시 레이어로 배포하여 데이터베이스 연결을 풀링합니다. Statement 또는 transaction 풀링 모드로 실행하면 연결을 효율적으로 재사용하여 활성 클라이언트 연결 수를 크게 줄일 수 있습니다. 또한 연결 설정 지연시간을 줄입니다: 벤치마크에서 평균 연결 시간이 50밀리초에서 5밀리초로 감소했습니다.

Region 간 연결과 요청은 비용이 많이 들 수 있으므로 프록시, 클라이언트, replica를 동일한 region에 배치하여 네트워크 오버헤드와 연결 사용 시간을 최소화합니다.

각 read replica에는 여러 PgBouncer 파드를 실행하는 자체 Kubernetes 배포가 있습니다. 동일한 Kubernetes Service 뒤에서 여러 Kubernetes 배포를 실행하여 파드 간 트래픽을 로드 밸런싱합니다.

![PostgreSQL 프록시로서의 PgBouncer](https://images.ctfassets.net/kftzwdyauwt9/kttDE3EiZ6roTjpbUpqxX/dd9ceee15663caa6e37a83bedc8626f5/OAI_PgBouncer_as_PostgreSQL_Proxy__Light_Desktop_.svg?w=3840&q=90)

#### 캐싱 전략

**과제**: 캐시 미스의 급증은 PostgreSQL 데이터베이스에 read 급증을 유발하여 CPU를 포화시키고 사용자 요청을 느리게 만들 수 있습니다.

**솔루션**: PostgreSQL의 read 압력을 줄이기 위해 캐싱 레이어를 사용하여 대부분의 read 트래픽을 제공합니다. 그러나 캐시 hit rate가 예기치 않게 떨어지면 캐시 미스의 burst가 대량의 요청을 직접 PostgreSQL로 푸시할 수 있습니다.

캐시 미스 storm 동안 과부하를 방지하기 위해 캐시 락킹(및 리싱) 메커니즘을 구현하여 특정 키에 대해 미스가 발생한 단일 reader만 PostgreSQL에서 데이터를 가져오도록 합니다. 여러 요청이 동일한 캐시 키에 대해 미스가 발생하면 한 요청만 락을 획득하고 다른 요청은 해당 요청이 데이터를 가져올 때까지 대기합니다.

### 결론

OpenAI의 경험은 적절한 최적화와 엔지니어링을 통해 PostgreSQL을 초당 수백만 쿼리를 처리하고 수억 명의 사용자를 지원하는 규모로 확장할 수 있음을 보여줍니다. MVCC의 근본적인 한계를 이해하고 이를 완화하기 위한 전략적 접근(write 워크로드 분리, 쿼리 최적화, 워크로드 격리, 연결 풀링, 캐싱)을 통해 단일 Primary 아키텍처의 한계를 극복하고 안정적인 서비스를 제공할 수 있었습니다.

## References
- [Scaling PostgreSQL to power 800 million ChatGPT users - OpenAI](https://openai.com/index/scaling-postgresql/)
- [What is Azure Database for PostgreSQL? - Microsoft Learn](https://learn.microsoft.com/en-us/azure/postgresql/overview)
- [The Part of PostgreSQL We Hate the Most - Andy Pavlo, Carnegie Mellon University](https://www.cs.cmu.edu/~pavlo/blog/2023/04/the-part-of-postgresql-we-hate-the-most.html)
- [PostgreSQL - Wikipedia](https://en.wikipedia.org/wiki/PostgreSQL#cite_note-37)
- [PostgreSQL Documentation: Log-Shipping Standby Servers](https://www.postgresql.org/docs/current/warm-standby.html#CASCADING-REPLICATION)
