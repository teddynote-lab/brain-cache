---
title: "LangGraph Multi-Tenant PostgreSQL 설계 가이드"
description: "LangGraph 기반 Multi-Tenant 시스템을 PostgreSQL로 구축할 때 사용할 수 있는 5가지 격리 전략을 비교 분석합니다. Thread ID + Namespace 방식은 낮은 복잡도로 빠르게 시작 가능하며, Row Level Security(RLS)는"
slug: langgraph-multi-tenant-postgresql-설계-가이드
date: 2026-02-01
authors: [sungyeon]
tags:
  - architecture
  - guideline
source_url: "https://haru0229.tistory.com/196#8.-%EB%B3%B4%EC%95%88-%EC%B2%B4%ED%81%AC%EB%A6%AC%EC%8A%A4%ED%8A%B8"
---


# LangGraph Multi-Tenant PostgreSQL 설계 가이드

## TL;DR
> LangGraph 기반 Multi-Tenant 시스템을 PostgreSQL로 구축할 때 사용할 수 있는 5가지 격리 전략을 비교 분석합니다. Thread ID + Namespace 방식은 낮은 복잡도로 빠르게 시작 가능하며, Row Level Security(RLS)는 데이터베이스 레벨에서 강력한 격리를 제공합니다. Schema 분리와 Database 분리는 더 높은 격리 수준이 필요한 금융/의료 등의 규제 환경에 적합합니다. 실무에서는 요구사항에 따라 전략을 선택하되, JWT 기반 인증과 테넌트 컨텍스트 관리를 통해 안전한 격리를 구현해야 합니다.

## Key Takeaways
- **Thread ID Prefix 전략**: `tenant-{tenant_id}:user-{user_id}:session-{session_id}` 형식으로 애플리케이션 레벨에서 간단하게 Multi-Tenant를 구현 가능. MVP나 일반 SaaS에 권장.
- **PostgreSQL RLS 활용**: `SET LOCAL app.tenant_id` + Policy 기반으로 데이터베이스 레벨의 강력한 격리 제공. 애플리케이션 버그에도 데이터 누출 방지 가능.
- **Namespace 계층 구조**: Checkpoint는 `tenant-{tenant_id}`, Store는 `(tenant_id, user_id, "memories")` 튜플로 구성해 cross-thread 상태 관리와 Long-term Memory 격리 구현.
- **Connection Pooling 고려**: Schema/Database 분리 시 테넌트별 커넥션 풀 관리가 필수. 동적 스키마 라우팅과 캐싱 전략 필요.
- **보안 체크리스트**: JWT 검증, SQL Injection 방지, 감사 로깅, 정기적인 테넌트 격리 테스트를 통해 Multi-Tenant 환경의 보안 강화 필요.

## 상세 내용

### Multi-Tenant 격리 전략 선택 가이드

LangGraph 기반의 Agent 시스템을 Multi-Tenant 환경에 배포할 때, 테넌트 간 데이터 격리는 핵심적인 아키텍처 결정입니다. 각 전략은 격리 수준, 구현 복잡도, 확장성, 그리고 사용 케이스에 따라 뚜렷한 트레이드오프를 가집니다.

| 전략 | 격리 수준 | 복잡도 | 확장성 | 사용 케이스 |
|------|----------|--------|--------|-------------|
| Application-level | 낮음 | 낮음 | 높음 | 빠른 MVP |
| Thread ID Prefix | 중간 | 낮음 | 높음 | 일반적인 SaaS |
| Schema 분리 | 높음 | 중간 | 중간 | 규제 요구사항 |
| Row Level Security | 높음 | 높음 | 높음 | 엔터프라이즈 |
| Database 분리 | 최고 | 최고 | 낮음 | 금융/의료 |

전략 선택의 핵심은 **요구되는 격리 수준**과 **운영 복잡도** 간의 균형입니다. 대부분의 경우 Thread ID + Namespace 방식으로 시작하여, 보안 요구사항이 증가하면 RLS나 Schema 분리로 마이그레이션하는 것을 권장합니다.

### 전략 1: Thread ID + Namespace 기반 격리

가장 실용적인 시작점으로, LangGraph의 Thread와 Namespace 개념을 활용한 애플리케이션 레벨 격리 방식입니다.

**핵심 설계 원칙**:
- **Thread ID**: `tenant-{tenant_id}:user-{user_id}:session-{session_id}` 형식으로 각 실행을 고유하게 식별
- **Checkpoint Namespace**: `tenant-{tenant_id}`로 테넌트 레벨에서 그룹핑
- **Store Namespace**: `(tenant_id, user_id, "memories")` 튜플로 Long-term Memory 계층 구조 구성

#### 구현 예시

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.store.postgres.aio import AsyncPostgresStore
from pydantic import BaseModel
import jwt

# JWT 기반 테넌트 인증
security = HTTPBearer()

class TenantContext(BaseModel):
    tenant_id: str
    user_id: str
    org_id: Optional[str] = None

def get_tenant_context(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TenantContext:
    """JWT에서 테넌트 정보 추출"""
    try:
        payload = jwt.decode(
            credentials.credentials, 
            JWT_SECRET, 
            algorithms=["HS256"]
        )
        return TenantContext(
            tenant_id=payload["tenant_id"],
            user_id=payload["user_id"],
            org_id=payload.get("org_id")
        )
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Thread ID 생성 전략
def generate_thread_id(
    tenant_id: str, user_id: str, session_id: str
) -> str:
    return f"tenant-{tenant_id}:user-{user_id}:session-{session_id}"

def generate_checkpoint_ns(tenant_id: str) -> str:
    return f"tenant-{tenant_id}"

def generate_store_namespace(tenant_id: str, user_id: str) -> tuple:
    return (tenant_id, user_id, "memories")
```

**장점**:
- 구현 복잡도가 낮고 빠르게 프로토타입 가능
- PostgreSQL 특별 설정 불필요
- 수평 확장성 우수 (단일 데이터베이스에서 수천 개 테넌트 지원)

**제약사항**:
- 애플리케이션 코드 버그 시 데이터 누출 위험
- 데이터베이스 레벨의 강제 격리 없음

### 전략 2: PostgreSQL Row Level Security (RLS)

데이터베이스 레벨에서 행 단위 접근 제어를 구현하여, 애플리케이션 로직과 무관하게 테넌트 격리를 보장합니다.

#### RLS 설정 예시

```sql
-- 1. tenant_id 컬럼 추가 (기존 테이블 수정)
ALTER TABLE checkpoints ADD COLUMN tenant_id TEXT;
ALTER TABLE checkpoint_writes ADD COLUMN tenant_id TEXT;

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_checkpoints_tenant 
ON checkpoints(tenant_id, thread_id);

CREATE INDEX idx_checkpoint_writes_tenant 
ON checkpoint_writes(tenant_id, thread_id);

-- 3. RLS 정책 활성화
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_writes ENABLE ROW LEVEL SECURITY;

-- 4. 테넌트별 격리 정책
CREATE POLICY tenant_isolation ON checkpoints
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', TRUE))
WITH CHECK (tenant_id = current_setting('app.tenant_id', TRUE));

CREATE POLICY tenant_isolation ON checkpoint_writes
FOR ALL
USING (tenant_id = current_setting('app.tenant_id', TRUE))
WITH CHECK (tenant_id = current_setting('app.tenant_id', TRUE));
```

#### LangGraph와 RLS 통합

```python
class TenantAwarePostgresSaver(AsyncPostgresSaver):
    """RLS 지원 커스텀 Checkpointer"""
    
    def __init__(self, conn: Connection, tenant_id: str):
        super().__init__(conn)
        self.tenant_id = tenant_id
    
    async def _set_tenant_context(self):
        """세션 시작 시 tenant_id 설정"""
        await self.conn.execute(
            f"SET LOCAL app.tenant_id = '{self.tenant_id}'"
        )

@app.post("/chat")
async def chat_endpoint(
    request: ChatRequest,
    tenant: TenantContext = Depends(get_tenant_context)
):
    async with pool.connection() as conn:
        # RLS 컨텍스트 설정
        await conn.execute(
            f"SET LOCAL app.tenant_id = '{tenant.tenant_id}'"
        )
        
        checkpointer = AsyncPostgresSaver(conn)
        graph = create_graph().compile(checkpointer=checkpointer)
        
        config = {
            "configurable": {
                "thread_id": generate_thread_id(
                    tenant.tenant_id, 
                    tenant.user_id, 
                    request.session_id
                )
            }
        }
        
        response = await graph.ainvoke(
            {"messages": request.messages}, 
            config
        )
        return response
```

**RLS의 핵심 이점**:
- 데이터베이스가 격리를 강제하므로 애플리케이션 버그에도 안전
- 기존 LangGraph 코드 수정 최소화
- 감사 로깅과 결합 가능

**성능 고려사항**:
- `current_setting()` 함수 호출 오버헤드 (일반적으로 무시 가능)
- tenant_id 인덱스 필수 (쿼리 성능 유지)

### 전략 3: Schema 기반 격리

각 테넌트를 별도 PostgreSQL Schema로 격리하는 방식으로, 물리적 분리에 가까운 격리를 제공합니다.

```python
class SchemaBasedCheckpointer:
    """테넌트별 Schema 라우팅"""
    
    def __init__(self, pool: AsyncConnectionPool):
        self.pool = pool
        self.schema_cache = {}
    
    async def get_checkpointer(
        self, tenant_id: str
    ) -> AsyncPostgresSaver:
        schema_name = f"tenant_{tenant_id}"
        
        # Schema 자동 생성
        if schema_name not in self.schema_cache:
            async with self.pool.connection() as conn:
                await conn.execute(
                    f"CREATE SCHEMA IF NOT EXISTS {schema_name}"
                )
                await conn.execute(
                    f"SET search_path TO {schema_name}"
                )
                # LangGraph 테이블 초기화
                checkpointer = AsyncPostgresSaver(conn)
                await checkpointer.setup()
                
                self.schema_cache[schema_name] = True
        
        # Schema 전환 후 Checkpointer 반환
        async with self.pool.connection() as conn:
            await conn.execute(
                f"SET search_path TO {schema_name}"
            )
            return AsyncPostgresSaver(conn)
```

**적용 시나리오**:
- 규제 요구사항 (GDPR, HIPAA 등)
- 테넌트별 백업/복구 필요
- 데이터 마이그레이션 용이성

**운영 복잡도**:
- Schema 생성/삭제 자동화 필요
- Connection Pool 관리 복잡성 증가
- 테넌트 수가 수백 개 이상일 때 스키마 관리 부담

### Long-Term Memory (Store) Multi-Tenant 격리

LangGraph Store는 Checkpoint와 별도로 Long-term Memory를 관리합니다. Namespace 튜플 구조를 활용한 계층적 격리가 핵심입니다.

```python
# Store Namespace 전략
def generate_store_namespace(
    tenant_id: str, 
    user_id: str
) -> tuple:
    """
    계층 구조: (tenant_id, user_id, "memories")
    - 레벨 1: 테넌트 격리
    - 레벨 2: 사용자별 분리
    - 레벨 3: 메모리 타입
    """
    return (tenant_id, user_id, "memories")

# 사용 예시
async def save_user_preference(
    tenant_id: str,
    user_id: str,
    preference: dict
):
    namespace = generate_store_namespace(tenant_id, user_id)
    
    await store.aput(
        namespace=namespace,
        key="preferences",
        value=preference
    )

# 검색 시 테넌트 자동 필터링
async def search_memories(
    tenant_id: str,
    user_id: str,
    query: str
):
    namespace = generate_store_namespace(tenant_id, user_id)
    
    # Store는 namespace prefix로 자동 격리
    results = await store.asearch(
        namespace_prefix=(tenant_id,),  # 테넌트 레벨 필터
        query=query
    )
    return results
```

**Store RLS 적용** (추가 격리층):

```sql
-- Store 테이블에도 RLS 적용
ALTER TABLE store ADD COLUMN tenant_id TEXT;

CREATE POLICY store_tenant_isolation ON store
FOR ALL
USING (
    namespace[1] = current_setting('app.tenant_id', TRUE)
)
WITH CHECK (
    namespace[1] = current_setting('app.tenant_id', TRUE)
);
```

### 보안 체크리스트

Multi-Tenant 시스템 배포 전 반드시 확인해야 할 보안 항목:

**1. 인증/인가**
- [ ] JWT 토큰 서명 검증 구현
- [ ] 토큰 만료 시간 적절히 설정 (권장: 1시간)
- [ ] Refresh Token 순환 메커니즘

**2. 격리 검증**
- [ ] Cross-tenant 쿼리 시도 시 접근 거부 확인
- [ ] Thread ID에 테넌트 정보 포함 여부 검증
- [ ] RLS 정책 우회 시도 테스트

**3. SQL Injection 방지**
```python
# ❌ 위험: 문자열 포맷팅
await conn.execute(
    f"SET LOCAL app.tenant_id = '{tenant_id}'"
)

# ✅ 안전: 파라미터화된 쿼리
await conn.execute(
    "SELECT set_config('app.tenant_id', $1, true)",
    [tenant_id]
)
```

**4. 감사 로깅**
```python
async def audit_log(
    tenant_id: str,
    user_id: str,
    action: str,
    resource: str
):
    await conn.execute("""
        INSERT INTO audit_logs 
        (tenant_id, user_id, action, resource, timestamp)
        VALUES ($1, $2, $3, $4, NOW())
    """, [tenant_id, user_id, action, resource])
```

**5. 정기 검증**
- [ ] 월간 테넌트 격리 침투 테스트
- [ ] 분기별 권한 감사
- [ ] 데이터 접근 로그 분석 자동화

### 성능 최적화 전략

**Connection Pool 설정**:
```python
# Schema 분리 시 동적 풀 관리
class TenantAwarePool:
    def __init__(self, base_uri: str, max_pools: int = 50):
        self.pools: Dict[str, AsyncConnectionPool] = {}
        self.base_uri = base_uri
        self.max_pools = max_pools
    
    async def get_pool(
        self, tenant_id: str
    ) -> AsyncConnectionPool:
        if tenant_id not in self.pools:
            if len(self.pools) >= self.max_pools:
                # LRU 제거
                oldest = min(
                    self.pools.items(), 
                    key=lambda x: x[1].last_used
                )
                await oldest[1].close()
                del self.pools[oldest[0]]
            
            self.pools[tenant_id] = AsyncConnectionPool(
                f"{self.base_uri}?options=-c search_path=tenant_{tenant_id}",
                min_size=2,
                max_size=10
            )
        
        return self.pools[tenant_id]
```

**인덱싱 전략**:
```sql
-- Composite 인덱스로 테넌트 쿼리 최적화
CREATE INDEX idx_checkpoints_tenant_thread_ts 
ON checkpoints(tenant_id, thread_id, checkpoint_id DESC);

-- Partial 인덱스로 활성 테넌트만 최적화
CREATE INDEX idx_active_tenants 
ON checkpoints(tenant_id, thread_id) 
WHERE created_at > NOW() - INTERVAL '30 days';
```

## References
- [LangGraph Multi-Tenant PostgreSQL 설계 가이드](https://haru0229.tistory.com/196)
- [LangGraph Multi-Tenant 격리 전략 개요](https://haru0229.tistory.com/196#1.-multi-tenant-%EA%B2%A9%EB%A6%AC-%EC%A0%84%EB%9E%B5-%EA%B0%9C%EC%9A%94)
- [Thread ID + Namespace 기반 격리](https://haru0229.tistory.com/196#2.-%EC%A0%84%EB%9E%B5-1-thread-id-+-namespace-%EA%B8%B0%EB%B0%98-%EA%B2%A9%EB%A6%AC-%EA%B6%8C%EC%9E%A5-%EC%8B%9C%EC%9E%91%EC%A0%90)
- [PostgreSQL Row Level Security](https://haru0229.tistory.com/196#3.-%EC%A0%84%EB%9E%B5-2-postgresql-row-level-security-rls)
- [보안 체크리스트](https://haru0229.tistory.com/196#8.-%EB%B3%B4%EC%95%88-%EC%B2%B4%ED%81%AC%EB%A6%AC%EC%8A%A4%ED%8A%B8)
