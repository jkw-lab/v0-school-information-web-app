# v0-school-information-web-app

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_WFGwNtbu72sKDVGg3zv2p0mMTJdV)

## Getting Started

Node.js 22.13 이상을 사용합니다. npm과 pnpm 잠금 파일은 같은 의존성 변경을 반영합니다.

```bash
npm ci
```

`.env.example`을 프로젝트 루트의 `.env.local`로 복사하고, 나이스 교육정보 개방 포털에서 발급받은 키를 설정합니다.

```dotenv
NEIS_API_KEY=발급받은_키
```

`.env.local`은 새 폴더나 ZIP에 자동으로 전달되지 않습니다. 새 작업 폴더에서는 다시 설정해야 합니다.
배포 환경에서도 서버 환경변수 `NEIS_API_KEY`를 별도로 설정하세요. 브라우저에 노출되는 `NEXT_PUBLIC_` 접두사는 사용하지 않습니다.
키가 없으면 API는 503과 서비스 설정 안내를 반환합니다. 인증 실패, 서버 오류, 실제 데이터 없음은 구분하여 처리됩니다.

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다. 기본 학교는 북일고등학교이며 설정에서 학교를 변경할 수 있습니다.
학교를 바꾸면 학년·반을 다시 선택합니다. 과목명 수정은 해당 날짜·교시·원래 과목에 적용되며 다음 주에 자동 복사되지 않습니다.
학교, 학년·반, 과목 수정과 색상은 이 브라우저에 저장됩니다. 다른 기기와 동기화되지 않습니다.

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit
```

회귀 테스트는 외부 NEIS 응답을 모의하여 페이지네이션, 무자료/오류 구분, 키 누락, 날짜 검사,
전체 지역 검색, 강의실 조회 실패 시 기본 시간표 유지, 응답 형식 검사, 브라우저 저장소 예외를 검증합니다.
실제 NEIS 키를 이용한 데이터 검증 및 브라우저 상호작용 테스트를 대체하지 않습니다.
교사명과 강의실은 제공된 데이터가 있을 때만 표시합니다. 강의실 후보가 여러 개면 임의로 선택하지 않습니다.

## 0.2.0 Changes

- Next.js 16.3.4 및 보안 수정 의존성으로 업데이트하고 TypeScript 빌드 검사를 활성화했습니다.
- NEIS의 100건 이후 결과를 페이지 단위로 조회하며, 조회에 시간 제한을 적용했습니다.
- 학교 검색의 전체 지역 필터와 중첩 대화상자, 학교 변경 시 남아 있던 학년·반을 수정했습니다.
- 시간표·급식·학사일정의 이전 요청을 취소해 늦은 응답이 새 화면을 덮어쓰지 않게 했습니다.
- 조회 실패 시 다시 시도할 수 있고 시간표의 주간 이동을 지원합니다.
- 저장된 다크모드를 앱 시작부터 적용하며 화면 확대와 하단 안전 영역을 지원합니다.
- 잘못된 저장 데이터 및 저장소 접근 실패를 처리하고 전체 삭제를 이 앱의 설정에 한정했습니다.
- 과목명 수정 저장이 실패하면 저장 실패를 안내합니다.
- 급식 메뉴의 다양한 줄바꿈·알레르기 번호 구분 형식과 날짜 해석을 처리했습니다.

## Repository visibility

공개 저장소에는 현재 파일뿐 아니라 Git 기록도 노출됩니다. 확인한 기존 7개 커밋의 텍스트 패턴 검사에서는
비밀키, 환경변수 파일, 학생 데이터 파일을 발견하지 못했습니다. 문의 이메일은 설정 화면에 공개되어 있습니다.
이 검사는 완전한 보안 감사가 아닙니다. 비밀키는 커밋하지 말고, 노출된 키는 삭제만 하지 말고 폐기·재발급하세요.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/jkw-lab/v0-school-information-web-app" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
