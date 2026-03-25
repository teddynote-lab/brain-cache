---
title: "Docker Log Monitor 적용 가이드라인"
description: "EC2 환경에서 Docker 컨테이너 로그를 실시간 모니터링하고 에러 발생 시 Slack으로 알림을 보내는 경량 모니터링 시스템 구축 경험을 공유합니다. Sentry 같은 무거운 솔루션 대신, Python 기반의 간단한 스크립트로 실시간 로그 감지, 중복 알림 방지, "
slug: docker-log-monitor-적용-가이드라인
date: 2026-01-27
authors: [braincrew]
tags:
  - agent
source_url: "https://api.slack.com/apps"
---

# Docker Log Monitor 적용 가이드라인

## TL;DR
> EC2 환경에서 Docker 컨테이너 로그를 실시간 모니터링하고 에러 발생 시 Slack으로 알림을 보내는 경량 모니터링 시스템 구축 경험을 공유합니다. Sentry 같은 무거운 솔루션 대신, Python 기반의 간단한 스크립트로 실시간 로그 감지, 중복 알림 방지, Traceback 수집 등의 핵심 기능을 구현했습니다. systemd 서비스로 등록하여 서버 재시작 시에도 자동 실행되도록 설정하고, 배포 시 불필요한 알림을 방지하는 Grace Period를 적용했습니다.

## Key Takeaways
- **경량화된 모니터링의 필요성**: 모든 프로젝트에 Sentry 같은 무거운 솔루션이 필요한 것은 아니며, 초기 단계나 소규모 프로젝트에서는 간단한 로그 모니터링 시스템이 더 효과적일 수 있습니다.
- **쿨다운 메커니즘의 중요성**: 동일한 에러가 연속 발생 시 알림 피로도를 방지하기 위해 시간 기반 중복 알림 제어가 필수입니다.
- **배포 시나리오 고려**: 컨테이너 재시작이나 배포 시 발생하는 일시적 에러를 필터링하기 위한 Grace Period 설정으로 노이즈를 줄일 수 있습니다.
- **Traceback 전체 수집**: 단일 라인 에러 로그만으로는 디버깅이 어려우므로, Python Traceback 전체를 수집하여 컨텍스트를 제공해야 합니다.
- **systemd 통합의 장점**: 서비스로 등록하면 서버 재시작, 자동 재시작, 로그 관리 등을 운영체제 레벨에서 관리할 수 있어 안정성이 높아집니다.

## 상세 내용

### 배경: 왜 커스텀 모니터링 시스템을 만들었나?

프로젝트 초기 단계에서 에러 모니터링의 필요성은 명확했지만, Sentry 같은 상용 솔루션을 도입하기에는 몇 가지 장벽이 있었습니다:

1. **비용 및 리소스**: Sentry는 강력하지만 설정이 복잡하고 서버 리소스를 많이 소모합니다
2. **과도한 기능**: 초기 단계에서는 단순한 에러 알림만 필요했습니다
3. **Docker 환경 특화**: Docker 컨테이너의 stdout/stderr 로그를 직접 모니터링하면 애플리케이션 코드 수정 없이 모니터링이 가능합니다

이러한 이유로 Python Docker SDK를 활용한 경량 모니터링 시스템을 직접 구축하기로 결정했습니다.

### 문제 상황: Docker 로그 모니터링의 도전 과제

Docker 환경에서 로그 모니터링을 구현하면서 마주친 주요 문제들:

**1. 연속된 동일 에러의 알림 폭탄**
초기 버전에서는 에러가 발생할 때마다 Slack 알림을 보냈는데, 특정 에러가 반복되면 수십 개의 알림이 순식간에 쌓였습니다.

**2. 배포 시 불필요한 알림**
컨테이너를 재시작하거나 배포할 때 일시적으로 연결이 끊기면서 발생하는 에러들이 알림으로 전송되었습니다.

**3. 불완전한 에러 정보**
단일 라인 에러 메시지만 캡처하면 전체 Traceback을 파악할 수 없어 디버깅이 어려웠습니다.

**4. 모니터링 프로세스의 안정성**
모니터링 스크립트 자체가 중단되면 에러를 놓치게 되는 문제가 있었습니다.

### 해결 과정

#### 1. 쿨다운 메커니즘 구현

동일한 에러에 대해 일정 시간 동안 중복 알림을 방지하는 메커니즘을 구현했습니다:

```python
class ErrorTracker:
    def __init__(self, cooldown_seconds=300):  # 5분 쿨다운
        self.error_history = {}
        self.cooldown_seconds = cooldown_seconds
    
    def should_notify(self, error_signature):
        """에러 시그니처 기반으로 알림 전송 여부 결정"""
        current_time = time.time()
        
        if error_signature in self.error_history:
            last_notified = self.error_history[error_signature]
            if current_time - last_notified < self.cooldown_seconds:
                return False  # 쿨다운 기간 내에는 알림 차단
        
        self.error_history[error_signature] = current_time
        return True
    
    def cleanup_old_entries(self):
        """오래된 에러 기록 정리"""
        current_time = time.time()
        self.error_history = {
            k: v for k, v in self.error_history.items()
            if current_time - v < self.cooldown_seconds * 2
        }
```

**의사결정 포인트**: 쿨다운 시간을 5분으로 설정한 이유는, 대부분의 에러가 5분 내에 해결되거나 반복 패턴이 명확해지기 때문입니다. 프로젝트 특성에 따라 조정 가능합니다.

#### 2. Grace Period 구현

배포 시 컨테이너가 시작된 직후 일정 시간 동안은 알림을 보내지 않도록 설정:

```python
class DockerLogMonitor:
    def __init__(self, grace_period_seconds=60):
        self.grace_period = grace_period_seconds
        self.container_start_times = {}
    
    def is_in_grace_period(self, container_id):
        """컨테이너가 Grace Period 내에 있는지 확인"""
        if container_id not in self.container_start_times:
            # 컨테이너 시작 시간 기록
            container = self.docker_client.containers.get(container_id)
            start_time = container.attrs['State']['StartedAt']
            self.container_start_times[container_id] = parse_datetime(start_time)
        
        start_time = self.container_start_times[container_id]
        elapsed = (datetime.now() - start_time).total_seconds()
        return elapsed < self.grace_period
    
    def process_log_line(self, container_id, log_line):
        if self.is_in_grace_period(container_id):
            logger.debug(f"Grace period active for {container_id}, skipping alert")
            return
        
        # 에러 패턴 감지 및 처리
        self.detect_and_notify(log_line)
```

#### 3. Traceback 전체 수집

Python 에러의 경우 여러 줄에 걸쳐 있는 Traceback을 모두 수집:

```python
class TracebackCollector:
    def __init__(self):
        self.traceback_buffer = []
        self.in_traceback = False
    
    def process_line(self, line):
        """로그 라인을 처리하고 Traceback 수집"""
        # Traceback 시작 감지
        if "Traceback (most recent call last):" in line:
            self.in_traceback = True
            self.traceback_buffer = [line]
            return None
        
        # Traceback 진행 중
        if self.in_traceback:
            self.traceback_buffer.append(line)
            
            # Traceback 종료 조건: 실제 에러 메시지 라인
            if self.is_error_line(line) and len(self.traceback_buffer) > 1:
                full_traceback = "\n".join(self.traceback_buffer)
                self.in_traceback = False
                self.traceback_buffer = []
                return full_traceback
        
        return None
    
    def is_error_line(self, line):
        """에러 메시지 라인 판별"""
        error_patterns = [
            r'^[A-Z][a-zA-Z]+Error:',
            r'^[A-Z][a-zA-Z]+Exception:',
            r'^AssertionError:',
        ]
        return any(re.match(pattern, line.strip()) for pattern in error_patterns)
```

#### 4. Docker API를 통한 실시간 스트리밍

Docker SDK를 사용하여 컨테이너 로그를 실시간으로 스트리밍:

```python
import docker

class DockerLogMonitor:
    def __init__(self, container_name, slack_webhook_url):
        self.docker_client = docker.from_env()
        self.container_name = container_name
        self.slack_webhook = slack_webhook_url
        self.error_tracker = ErrorTracker(cooldown_seconds=300)
        self.traceback_collector = TracebackCollector()
    
    def start_monitoring(self):
        """컨테이너 로그 모니터링 시작"""
        try:
            container = self.docker_client.containers.get(self.container_name)
            logger.info(f"Monitoring started for container: {self.container_name}")
            
            # 실시간 로그 스트리밍 (follow=True, tail='all')
            for log_line in container.logs(stream=True, follow=True):
                line = log_line.decode('utf-8').strip()
                self.process_log_line(container.id, line)
                
        except docker.errors.NotFound:
            logger.error(f"Container {self.container_name} not found")
        except Exception as e:
            logger.error(f"Monitoring error: {e}")
            # 자동 재연결 로직
            time.sleep(10)
            self.start_monitoring()
```

**의사결정 포인트**: `stream=True`와 `follow=True` 옵션으로 실시간 스트리밍을 구현했습니다. `tail='all'`을 사용하면 컨테이너 시작 후 모든 로그를 캡처할 수 있지만, 필요에 따라 `tail=100`처럼 최근 로그만 가져올 수도 있습니다.

#### 5. systemd 서비스 등록

안정적인 운영을 위해 systemd 서비스로 등록:

```bash
# /etc/systemd/system/docker-monitor.service
[Unit]
Description=Docker Log Monitor Service
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/docker-monitor
Environment="PYTHONUNBUFFERED=1"
ExecStart=/usr/bin/python3 /home/ubuntu/docker-monitor/monitor.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

서비스 등록 및 실행 명령어:

```bash
# 서비스 파일 복사 및 권한 설정
sudo cp docker-monitor.service /etc/systemd/system/
sudo chmod 644 /etc/systemd/system/docker-monitor.service

# systemd 리로드 및 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable docker-monitor.service
sudo systemctl start docker-monitor.service

# 서비스 상태 확인
sudo systemctl status docker-monitor.service

# 로그 확인
sudo journalctl -u docker-monitor.service -f
```

**의사결정 포인트**: 
- `Restart=always`로 설정하여 프로세스 종료 시 자동 재시작
- `After=docker.service`로 Docker 서비스가 시작된 후에 실행되도록 의존성 설정
- `StandardOutput=journal`로 systemd 저널에 로그 저장하여 중앙화된 로그 관리

#### 6. Slack 알림 포맷 개선

가독성 높은 알림 메시지 구성:

```python
def send_slack_notification(self, error_info):
    """Slack으로 에러 알림 전송"""
    message = {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🚨 Docker Container Error Detected"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Container:*\n{error_info['container_name']}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Time:*\n{error_info['timestamp']}"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Error Message:*\n```{error_info['error_message']}```"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Full Traceback:*\n```{error_info['traceback'][:2000]}```"
                }
            }
        ]
    }
    
    response = requests.post(
        self.slack_webhook,
        json=message,
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code != 200:
        logger.error(f"Slack notification failed: {response.text}")
```

### 결과

이 시스템을 도입한 후 다음과 같은 개선 효과를 얻었습니다:

1. **즉각적인 에러 인지**: 프로덕션 환경에서 발생하는 에러를 실시간으로 파악할 수 있게 되었습니다
2. **알림 피로도 감소**: 쿨다운 메커니즘으로 중복 알림이 90% 이상 감소했습니다
3. **디버깅 시간 단축**: Traceback 전체를 수집하여 에러 원인 파악 시간이 크게 줄었습니다
4. **운영 안정성 향상**: systemd 통합으로 서버 재시작 후에도 자동으로 모니터링이 재개됩니다
5. **비용 효율성**: Sentry 대비 서버 리소스 사용량이 매우 적고 추가 비용이 발생하지 않습니다

### 개선 예정 사항

현재 버전은 기본적인 모니터링 기능을 제공하지만, 다음과 같은 개선을 계획하고 있습니다:

- **다중 컨테이너 지원**: 현재는 단일 컨테이너만 모니터링하지만, 여러 컨테이너를 동시에 모니터링
- **필터링 룰 커스터마이징**: YAML 설정 파일로 에러 패턴과 필터링 룰을 외부화
- **메트릭 수집**: 에러 발생 빈도, 패턴 분석 등의 통계 데이터 수집
- **다양한 알림 채널**: Slack 외에 Email, Discord, PagerDuty 등 추가 지원

## References
- [Docker SDK for Python Documentation](https://docker-py.readthedocs.io/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [systemd Service Unit Configuration](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [Docker Logging Best Practices](https://docs.docker.com/config/containers/logging/)
