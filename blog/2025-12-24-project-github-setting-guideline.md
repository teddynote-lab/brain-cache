---
title: "Project Github Setting Guideline"
description: "AI/ML 프로젝트에서 긴급 이슈 발생 시 VM에 직접 접속해 코드를 수정하거나, 작업 이력 추적이 미흡한 문제를 해결하기 위한 GitHub 프로젝트 설정 가이드입니다. main/dev 브랜치 이원화, branch protection rule, squash merge,"
slug: project-github-setting-guideline
date: 2025-12-24
authors: [braincrew]
tags:
  - project
  - guideline
source_url: ""
---


# Project Github Setting Guideline

## TL;DR
> AI/ML 프로젝트에서 긴급 이슈 발생 시 VM에 직접 접속해 코드를 수정하거나, 작업 이력 추적이 미흡한 문제를 해결하기 위한 GitHub 프로젝트 설정 가이드입니다. main/dev 브랜치 이원화, branch protection rule, squash merge, PR template 설정을 통해 코드 변경 이력을 체계적으로 관리하고, 팀 협업 시 코드 품질을 시스템적으로 보장할 수 있는 워크플로우를 구축합니다.

## Key Takeaways
- **Branch 이원화 전략**: main(프로덕션), dev(개발), feat(기능) 브랜치 구조로 안정성과 개발 속도를 동시에 확보
- **Protection Rule 필수 설정**: main/dev 브랜치에 직접 push를 막고 PR을 강제함으로써 코드 리뷰와 이력 추적 보장
- **Squash Merge 활용**: 여러 개의 작은 커밋을 하나로 합쳐 깔끔한 커밋 히스토리 유지, 롤백과 디버깅 용이
- **PR Template 표준화**: 작업 내용, 변경 사항, 테스트 결과를 일관된 형식으로 문서화하여 팀 간 커뮤니케이션 효율 향상
- **VM 직접 작업 금지 원칙**: 긴급 상황에서도 Git 워크플로우를 따라 변경 이력을 남기는 것이 장기적으로 유지보수성 향상

## 상세 내용

### 배경: 기존 프로젝트 작업 방식의 문제점

AI/ML 프로젝트 환경에서는 모델 학습과 서빙을 위해 VM(Virtual Machine)을 자주 사용합니다. 그러나 다음과 같은 문제가 반복적으로 발생합니다:

- **긴급 이슈 대응 시 직접 수정**: 서비스 장애나 모델 성능 문제 발생 시, VM에 SSH로 접속해 코드를 직접 수정하는 경우가 빈번합니다. 이는 Git 이력에 남지 않아 "누가, 언제, 왜" 수정했는지 추적이 불가능합니다.
- **작업 내역 추적 미흡**: 개인별 작업이 commit history로 제대로 관리되지 않고, unit test 없이 코드가 배포되어 회귀 버그(regression bug) 발생 위험이 높습니다.

이러한 문제는 특히 여러 Research Engineer가 협업하는 환경에서 코드 충돌, 재현 불가능한 실험, 롤백 어려움 등으로 이어집니다. 이 가이드는 시스템적으로 이런 문제를 방지하기 위한 GitHub 설정 방법을 제시합니다.

### VM 및 SSH 설정 (준비 중)

Azure 또는 AWS, GCP 등 클라우드 환경에서 VM을 생성하고, 로컬 개발 환경에서 SSH를 통해 안전하게 접속하는 방법은 향후 업데이트 예정입니다. 핵심은 개발자가 VM에 직접 코드를 수정하지 않고, 로컬에서 작업 후 Git을 통해 배포하는 흐름을 구축하는 것입니다.

### Branch 이원화 전략

![Branch Structure](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/78c78abd-2c69-456e-9938-c458ae813a34/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466RDIG27QE%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T065013Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDCMtPmGiArJrAqWROxY5AlrymYaVpHBLqqOqkNiO%2FiIgIhAJJ0avnMSZgMc9F1AUVlH8LdRwBlj56e7mxzmomgko%2FtKogECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1Igx6cVeEQMyQcIlUD%2FIq3AOPw2Uq92YMx3q9CRuSgOHXCGV1%2BuIrAUSm5mP20fALIZrknrvevF75AMvhMMc8K6Ih3z%2F%2FcJ5zEy4aPc6dFMg8Tb5DMqioBCa0TL%2BqWizzK065eU8UCsOifDkEXsmiF9NmR5mQH9ZlKIhA98aGHDzCUsjMTUIwlO%2FKWJuo1hmlGtbTyll6WXi9j4w5uLmvBHehfWB68znBZR3UiEAyR8N40Ro3Nh%2FRVEL8nOmL2G%2BYHzpp6GU8D518u3hm4QKYOr7%2BxglBdf4A6qcrCGu3sCjPGM%2FYS854m%2BiXsjSy5dnn03HjRB%2F1IWDBCTcI70QTILNJtYMnwPSpZbi48Q3dJuyhYgOEM%2F7Ed64fscVzcVakfINMb%2FufBxhGov97peyaRGW72N72g3eo5t%2BQxb3tNfROUQX1M2MK9kPjNfh0VCRMxnT%2Fz3IdPwh3ON2vhLVwIGR%2FlKPFTO5Tk%2FYf9F3jdVbf9wFsHYIQkLqXOItbYT8nEEtyaWvfFjLmol0bIxhNP8vzLo2hqR36ZPaxath2I%2FxpOzlGnIz%2Bi4ARREiX%2BJWQQEAk%2FCI%2FxkWQ3WVsGE%2BzeWOurSeBsdfFRKtVijdL95OVQIZvGU27yXWTyKCq9wEk0lvw9YAmOlNBfy7iSjDf%2FY3OBjqkARNEr3pdsBKsGuWmsrIeqcv9SiUQgjrgryGfarJD60NW4nrJQoRTr7x2yPWlAOKZVX9xxGuiNuTDtrVUs4SG7sRaCPEpP30ZWSdVP9CDwznYIvq%2BrpeMtUDG%2BhJnvsiy7V5EovHEDHI%2FsQxP7TtVxyxSAJKLkYIWVlu4gyl95Va%2FUs%2FxMjdrzO35BhZh7MDFiFo4Y%2BDq3k%2B%2Bx86HYNv5cgC8FhCy&X-Amz-Signature=0d278cc6f88ebb6faab268884cc2c0cbe01da6f618dc4efd265fd7d490100024&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

**브랜치 구조:**
- **main**: 프로덕션 배포용 브랜치. 항상 안정적인 상태를 유지해야 합니다.
- **dev**: 개발 통합 브랜치. 모든 feature 브랜치는 여기서 분기하고 병합됩니다.
- **feat/feature-name**: 개별 기능 개발용 브랜치. dev를 base로 생성합니다.

**워크플로우:**
1. dev 브랜치에서 `feat/new-model-architecture` 같은 feature 브랜치 생성
2. 로컬에서 작업 후 commit & push
3. dev로 PR(Pull Request) 생성
4. 코드 리뷰 및 테스트 통과 후 merge
5. dev에서 충분히 테스트된 코드만 main으로 merge

이 구조는 실험적인 모델 개발(feat)과 안정적인 서비스 운영(main)을 분리하여, Research Engineer가 자유롭게 실험하면서도 프로덕션 안정성을 유지할 수 있게 합니다.

### Branch Protection Rule 설정

![Protection Rule Settings 1](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/68b23a63-8727-47d4-8bc3-b7c6e05ddcfd/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466RDIG27QE%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T065013Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDCMtPmGiArJrAqWROxY5AlrymYaVpHBLqqOqkNiO%2FiIgIhAJJ0avnMSZgMc9F1AUVlH8LdRwBlj56e7mxzmomgko%2FtKogECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1Igx6cVeEQMyQcIlUD%2FIq3AOPw2Uq92YMx3q9CRuSgOHXCGV1%2BuIrAUSm5mP20fALIZrknrvevF75AMvhMMc8K6Ih3z%2F%2FcJ5zEy4aPc6dFMg8Tb5DMqioBCa0TL%2BqWizzK065eU8UCsOifDkEXsmiF9NmR5mQH9ZlKIhA98aGHDzCUsjMTUIwlO%2FKWJuo1hmlGtbTyll6WXi9j4w5uLmvBHehfWB68znBZR3UiEAyR8N40Ro3Nh%2FRVEL8nOmL2G%2BYHzpp6GU8D518u3hm4QKYOr7%2BxglBdf4A6qcrCGu3sCjPGM%2FYS854m%2BiXsjSy5dnn03HjRB%2F1IWDBCTcI70QTILNJtYMnwPSpZbi48Q3dJuyhYgOEM%2F7Ed64fscVzcVakfINMb%2FufBxhGov97peyaRGW72N72g3eo5t%2BQxb3tNfROUQX1M2MK9kPjNfh0VCRMxnT%2Fz3IdPwh3ON2vhLVwIGR%2FlKPFTO5Tk%2FYf9F3jdVbf9wFsHYIQkLqXOItbYT8nEEtyaWvfFjLmol0bIxhNP8vzLo2hqR36ZPaxath2I%2FxpOzlGnIz%2Bi4ARREiX%2BJWQQEAk%2FCI%2FxkWQ3WVsGE%2BzeWOurSeBsdfFRKtVijdL95OVQIZvGU27yXWTyKCq9wEk0lvw9YAmOlNBfy7iSjDf%2FY3OBjqkARNEr3pdsBKsGuWmsrIeqcv9SiUQgjrgryGfarJD60NW4nrJQoRTr7x2yPWlAOKZVX9xxGuiNuTDtrVUs4SG7sRaCPEpP30ZWSdVP9CDwznYIvq%2BrpeMtUDG%2BhJnvsiy7V5EovHEDHI%2FsQxP7TtVxyxSAJKLkYIWVlu4gyl95Va%2FUs%2FxMjdrzO35BhZh7MDFiFo4Y%2BDq3k%2B%2Bx86HYNv5cgC8FhCy&X-Amz-Signature=53dff1323d27986dbbfc6db48075cf4a0b79f8c58e0204264787de1ba052c2c3&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

![Protection Rule Settings 2](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/acf69d5c-e797-4d28-b883-47fd0f4e95c2/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466RDIG27QE%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T065013Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDCMtPmGiArJrAqWROxY5AlrymYaVpHBLqqOqkNiO%2FiIgIhAJJ0avnMSZgMc9F1AUVlH8LdRwBlj56e7mxzmomgko%2FtKogECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1Igx6cVeEQMyQcIlUD%2FIq3AOPw2Uq92YMx3q9CRuSgOHXCGV1%2BuIrAUSm5mP20fALIZrknrvevF75AMvhMMc8K6Ih3z%2F%2FcJ5zEy4aPc6dFMg8Tb5DMqioBCa0TL%2BqWizzK065eU8UCsOifDkEXsmiF9NmR5mQH9ZlKIhA98aGHDzCUsjMTUIwlO%2FKWJuo1hmlGtbTyll6WXi9j4w5uLmvBHehfWB68znBZR3UiEAyR8N40Ro3Nh%2FRVEL8nOmL2G%2BYHzpp6GU8D518u3hm4QKYOr7%2BxglBdf4A6qcrCGu3sCjPGM%2FYS854m%2BiXsjSy5dnn03HjRB%2F1IWDBCTcI70QTILNJtYMnwPSpZbi48Q3dJuyhYgOEM%2F7Ed64fscVzcVakfINMb%2FufBxhGov97peyaRGW72N72g3eo5t%2BQxb3tNfROUQX1M2MK9kPjNfh0VCRMxnT%2Fz3IdPwh3ON2vhLVwIGR%2FlKPFTO5Tk%2FYf9F3jdVbf9wFsHYIQkLqXOItbYT8nEEtyaWvfFjLmol0bIxhNP8vzLo2hqR36ZPaxath2I%2FxpOzlGnIz%2Bi4ARREiX%2BJWQQEAk%2FCI%2FxkWQ3WVsGE%2BzeWOurSeBsdfFRKtVijdL95OVQIZvGU27yXWTyKCq9wEk0lvw9YAmOlNBfy7iSjDf%2FY3OBjqkARNEr3pdsBKsGuWmsrIeqcv9SiUQgjrgryGfarJD60NW4nrJQoRTr7x2yPWlAOKZVX9xxGuiNuTDtrVUs4SG7sRaCPEpP30ZWSdVP9CDwznYIvq%2BrpeMtUDG%2BhJnvsiy7V5EovHEDHI%2FsQxP7TtVxyxSAJKLkYIWVlu4gyl95Va%2FUs%2FxMjdrzO35BhZh7MDFiFo4Y%2BDq3k%2B%2Bx86HYNv5cgC8FhCy&X-Amz-Signature=bd9604458287b5f238672200cd4ed114b9023a30e2623db44a86ebc10b4a8f69&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

Branch protection rule은 main, dev 브랜치에 반드시 설정해야 합니다. 이는 VM에 직접 접속해 코드를 수정하는 습관을 시스템적으로 차단합니다.

**권장 설정:**
- **Require a pull request before merging**: 직접 push를 막고 반드시 PR을 통해서만 병합 가능하게 합니다.
- **Require approvals**: 최소 1명 이상의 리뷰어 승인을 필수로 설정합니다. 페어 프로그래밍처럼 코드 품질을 검증할 수 있습니다.
- **Require status checks to pass**: CI/CD 파이프라인(unit test, linting 등)을 통과해야만 merge 가능하게 합니다.
- **Require conversation resolution before merging**: PR 코멘트가 모두 해결되어야 병합됩니다.
- **Include administrators**: 관리자도 이 규칙을 따르도록 강제하여 예외 없는 프로세스를 보장합니다.

이 설정으로 긴급 상황에서도 "일단 VM에 들어가서 고친다"는 접근이 불가능해지고, 반드시 Git 워크플로우를 따르게 됩니다.

### Pull Request 설정

#### Squash Merge 전략

![Squash Merge Setting](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/0c65e936-5d08-4b77-a83a-f928a5e2c115/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466RDIG27QE%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T065013Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDCMtPmGiArJrAqWROxY5AlrymYaVpHBLqqOqkNiO%2FiIgIhAJJ0avnMSZgMc9F1AUVlH8LdRwBlj56e7mxzmomgko%2FtKogECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1Igx6cVeEQMyQcIlUD%2FIq3AOPw2Uq92YMx3q9CRuSgOHXCGV1%2BuIrAUSm5mP20fALIZrknrvevF75AMvhMMc8K6Ih3z%2F%2FcJ5zEy4aPc6dFMg8Tb5DMqioBCa0TL%2BqWizzK065eU8UCsOifDkEXsmiF9NmR5mQH9ZlKIhA98aGHDzCUsjMTUIwlO%2FKWJuo1hmlGtbTyll6WXi9j4w5uLmvBHehfWB68znBZR3UiEAyR8N40Ro3Nh%2FRVEL8nOmL2G%2BYHzpp6GU8D518u3hm4QKYOr7%2BxglBdf4A6qcrCGu3sCjPGM%2FYS854m%2BiXsjSy5dnn03HjRB%2F1IWDBCTcI70QTILNJtYMnwPSpZbi48Q3dJuyhYgOEM%2F7Ed64fscVzcVakfINMb%2FufBxhGov97peyaRGW72N72g3eo5t%2BQxb3tNfROUQX1M2MK9kPjNfh0VCRMxnT%2Fz3IdPwh3ON2vhLVwIGR%2FlKPFTO5Tk%2FYf9F3jdVbf9wFsHYIQkLqXOItbYT8nEEtyaWvfFjLmol0bIxhNP8vzLo2hqR36ZPaxath2I%2FxpOzlGnIz%2Bi4ARREiX%2BJWQQEAk%2FCI%2FxkWQ3WVsGE%2BzeWOurSeBsdfFRKtVijdL95OVQIZvGU27yXWTyKCq9wEk0lvw9YAmOlNBfy7iSjDf%2FY3OBjqkARNEr3pdsBKsGuWmsrIeqcv9SiUQgjrgryGfarJD60NW4nrJQoRTr7x2yPWlAOKZVX9xxGuiNuTDtrVUs4SG7sRaCPEpP30ZWSdVP9CDwznYIvq%2BrpeMtUDG%2BhJnvsiy7V5EovHEDHI%2FsQxP7TtVxyxSAJKLkYIWVlu4gyl95Va%2FUs%2FxMjdrzO35BhZh7MDFiFo4Y%2BDq3k%2B%2Bx86HYNv5cgC8FhCy&X-Amz-Signature=657482a768482197c49b29ad18ce15a4e780364f597d648c7533b3a07ca95b06&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

**Squash Merge의 장점:**
- 개발 중 "WIP", "fix typo", "debugging" 같은 작은 커밋들이 많이 생기는데, 이를 하나의 의미 있는 커밋으로 합쳐 히스토리를 깔끔하게 유지합니다.
- `git log`로 이력을 볼 때 feature 단위로 파악할 수 있어, 특정 기능을 추가한 시점을 쉽게 찾을 수 있습니다.
- 롤백 시 해당 feature 전체를 한 번에 되돌릴 수 있습니다.

**설정 방법:**
Repository Settings → General → Pull Requests 섹션에서 "Allow squash merging"만 체크하고 나머지는 해제합니다.

#### PR Template 설정

![PR Template Setting](https://prod-files-secure.s3.us-west-2.amazonaws.com/bb84b169-cb88-81fc-90c3-00032f05f905/27ed859f-3633-4899-8032-ae177e5a4bff/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466RDIG27QE%2F20260325%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260325T065013Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDCMtPmGiArJrAqWROxY5AlrymYaVpHBLqqOqkNiO%2FiIgIhAJJ0avnMSZgMc9F1AUVlH8LdRwBlj56e7mxzmomgko%2FtKogECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1Igx6cVeEQMyQcIlUD%2FIq3AOPw2Uq92YMx3q9CRuSgOHXCGV1%2BuIrAUSm5mP20fALIZrknrvevF75AMvhMMc8K6Ih3z%2F%2FcJ5zEy4aPc6dFMg8Tb5DMqioBCa0TL%2BqWizzK065eU8UCsOifDkEXsmiF9NmR5mQH9ZlKIhA98aGHDzCUsjMTUIwlO%2FKWJuo1hmlGtbTyll6WXi9j4w5uLmvBHehfWB68znBZR3UiEAyR8N40Ro3Nh%2FRVEL8nOmL2G%2BYHzpp6GU8D518u3hm4QKYOr7%2BxglBdf4A6qcrCGu3sCjPGM%2FYS854m%2BiXsjSy5dnn03HjRB%2F1IWDBCTcI70QTILNJtYMnwPSpZbi48Q3dJuyhYgOEM%2F7Ed64fscVzcV
