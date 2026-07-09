# MathWings Web — Handoff Doc

작성일: 2026-07-09 · 기준 커밋: `main @ bc770de` (PR [#2](https://github.com/yoonkii/mathwings-web/pull/2) squash 머지)

## 1. 프로젝트 개요

- **서비스**: MathWings — 수학 문제를 풀면 캐릭터가 날아오르는 Flappy Bird류 웹 게임 (프로덕션 운영 중)
- **스택**: Next.js 16 (App Router, Turbopack) · React 19 (+ React Compiler) · TypeScript · Tailwind 4 · Canvas 2D · Supabase (리더보드 + 자체 analytics)
- **구조**:
  - `src/domain/` — 게임 엔진 (React 무관 순수 로직: 물리/충돌/파이프 스폰/문제 생성). Android 앱에서 포팅됨
  - `src/hooks/` — 엔진 ↔ React 연결 (`useGameState`가 허브, rAF 루프는 `useGameLoop`)
  - `src/rendering/gameCanvas.ts` — 스냅샷을 받아 캔버스에 그리는 순수 렌더 함수
  - `src/components/` — 화면 (Title / GameView / GameOver / Keypad / Settings)
  - `src/data/` — 클라이언트 저장 (localStorage) + API 클라이언트 + **서버 전용 `supabaseServer.ts`**
  - `src/app/api/` — `/api/scores`, `/api/events` (Supabase 접근은 전부 서버 경유)

## 2. 이번 세션에서 한 일 (PR #2, 34 files, +1148/−446)

리뷰 방식: 수동 전수 리뷰 + Playwright 스크린샷 검증 → 멀티에이전트 workflow(5개 렌즈 병렬 리뷰, 발견 32건 전부 적대적 검증 → 23건 확정/9건 기각) → 클러스터별 병렬 수정 → 빌드/스크린샷 재검증.

### 레이아웃/데스크톱
- 키패드 행 고정높이(`h-14`) → flex로 변경: **낮은 창(예: 1280×620)에서 ⌫/0/✓ 행 잘림 해결**
- **가로모드(높이<500px) 지원**: 게임(좌 60%)+입력(우 40%) 분할 — `globals.css`의 `.game-screen*` 클래스 + 미디어쿼리
- **리사이즈/회전 대응**: 게임 영역 div를 ResizeObserver로 감시, READY면 재초기화·플레이 중이면 `GameEngine.resize()`로 비례 스케일
- ScoreDisplay에 `safe-area-inset-top` 반영

### 게임플레이 (⚠️ 의도된 규칙 변경 포함)
- **READY 상태에서 문제 미리 표시** — 기존엔 시작 후 ~1.4초 내 첫 정답 못 넣으면 사망
- **천장 충돌: 즉사 → 클램프** (`gameEngine.ts` update 내 클램프, `collisionDetector.ts`의 ceiling 분기 제거). *난이도가 약간 쉬워짐 — 프로덕션에서 체감 확인 권장*
- Space 연타 시 BGM 재시작 + `game_start` 중복 집계 버그 수정 (startGame에 READY 가드)
- 동점은 NEW HIGH SCORE로 표시하지 않음
- 입력 자릿수: `GameConfig.MAX_INPUT_LENGTH = 4` (최대 정답 1998)

### 입력/터치
- `overscroll-behavior: none` — Android pull-to-refresh로 판 날아가는 문제 차단
- 키패드 `touch-action: none` + pointerup 시 "이 버튼에서 시작된 프레스"만 발동 (pointercancel로 숫자 씹힘 해결)
- 키보드 1급 지원: 타이틀 Enter/Space 시작, 게임오버 Enter 재시작, fine-pointer 기기에서 HOW TO PLAY에 키보드 안내 표시

### 오디오 (10.4MB → 4.1MB)
- BGM 3곡: 128kbps/44.1kHz 재인코딩 + **90초 심리스 루프** (ffmpeg acrossfade — 마지막 3초가 처음 3초로 블렌드. 원본은 git 히스토리 `54cb885^`에 있음)
- `game_over.mp3` 6초로 트림 (재생 3초 후 페이드아웃되므로)
- iOS 인터럽션 후 AudioContext resume (visibilitychange + SFX 재생 직전 state 체크) — 백그라운드 복귀 후 SFX 무음 해결
- BGM `HTMLAudioElement` src별 캐시 (매판 재fetch 제거), ended 오디오 재생 방지
- 타이틀 BGM: 타이틀에 머무는 제스처(기어 클릭, 비시작 키)에서 시작. **페이지 로드만으로는 autoplay 정책상 불가** (코드에 주석 있음)

### 보안/데이터 (핵심 구조 변경)
- **브라우저 → Supabase 직접 접근 전면 제거.** 흐름: 클라이언트 → `/api/scores`·`/api/events` → `supabaseServer.ts` → Supabase
- 서버 검증: 점수(정수 1..10000), 이름(trim 1..20자), 이벤트 타입 화이트리스트, 페이로드 2KB 제한
- `/analytics`: 서버 컴포넌트에서 `ANALYTICS_PASSWORD` 검사 (비밀번호가 JS 번들에서 제거됨), 데이터도 서버에서 조회 후 props로 전달
- Supabase 1000행 캡 페이지네이션 (`.range()` 루프, 상한 20,000행), 이벤트 값 sanitize
- **방문자 집계: 탭(sessionStorage) → 사용자(localStorage `visitor_id`)**, 과거 행은 session_id 폴백이라 데이터 연속성 유지

### 접근성/PWA/메타
- 게임오버·설정 다이얼로그 시맨틱+포커스 관리, Escape 닫기, aria-label 일괄, 이름 입력 form화(+모바일 속성), input `user-select: text` 복원
- `prefers-reduced-motion`, 저대비 텍스트 보정, 게임오버 카드 상단 잘림 해결 (`m-auto` + `85dvh`)
- manifest 아이콘 192/512 (신규 생성), apple-touch-icon, OG/Twitter 메타, DSEG 폰트 preload, 핀치줌 허용 (⚠️ 의도된 변경)
- 성능: 리프 컴포넌트 `React.memo`, 타이틀 캔버스 버퍼 매 프레임 재할당 제거

## 3. 배포 체크리스트

1. **`ANALYTICS_PASSWORD`** (서버 전용) 설정 — 기존 `NEXT_PUBLIC_ANALYTICS_PASSWORD`도 폴백으로 동작하지만 번들 노출되므로 교체 권장
2. (권장) **`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`** 설정 → 배포 → **그 다음에** `supabase/harden_policies.sql` 실행 (anon RLS 정책 드롭 + score CHECK 제약). **순서 주의**: SQL을 먼저 실행하면 구버전 클라이언트가 깨짐. 실행 전까지는 기존 env로 그대로 동작
3. README "Environment variables" 섹션에 전체 목록 있음

## 4. 남은 작업 / 알려진 한계 (우선순위순)

| # | 항목 | 메모 |
|---|------|------|
| 1 | **60fps React 리렌더 리팩터** | `useGameState`가 매 프레임 `setSnapshot` → 트리 전체 reconcile. memo로 완화했지만 근본 해법은 캔버스 렌더를 rAF 루프에서 직접 호출하고 React state는 score/problem/gameState 변화 시에만 갱신. 저사양 기기에서 프레임 드랍 제보가 오면 착수 |
| 2 | **BGM 루프 청음 확인** | 90초 크로스페이드 컷은 파형 레벨로만 검증(무음/클리핑 없음). 음악적으로 어색하면 컷 포인트(현재 90s/블렌드 3s)를 조정해 재생성 — 방법은 이 문서 §6 |
| 3 | **서버 타임존 집계** | analytics 일별 그룹핑이 서버 로컬 타임존 기준 (Vercel=UTC). KST 기준을 원하면 `supabaseServer.ts`의 `localDay()`/`periodStart()`에 TZ 오프셋 적용 |
| 4 | analytics 이벤트 증가 시 | 20,000행 상한 도달하면 Postgres 뷰/RPC로 서버측 집계 전환 (`harden_policies.sql`에 방향 주석 있음) |
| 5 | maskable PWA 아이콘 | 현재 `purpose: any`만. 캐릭터에 safe-zone 패딩 준 maskable 별도 제작 여지 |
| 6 | leaderboard 테이블 DDL이 repo에 없음 | `harden_policies.sql`에 정책 조회 쿼리로 안내만 해둠. DDL을 repo로 가져오면 좋음 |
| 7 | rate limiting | API 라우트에 값 검증은 있으나 요청 빈도 제한 없음. 어뷰징 생기면 Vercel WAF 또는 upstash ratelimit |

리뷰에서 **기각**된 항목(재조사 불필요): iOS 무음 스위치와 oscillator, 색상만의 정답 피드백, GameView 스프라이트 재로드, 볼륨값 클램프 등 9건 — 코드가 이미 처리 중이거나 실효 영향 없음.

## 5. 검증 방법

```bash
npm run dev            # 개발
npx tsc --noEmit && npm run lint && npm run build   # 전부 통과 상태 (경고 2건은 기존 것)
```

- Playwright 스크린샷 스위트(제작해 둔 것): 세션 스크래치패드 `shots.js`(수정 전 기준선)·`shots2.js`(검증용) — 뷰포트: 390×844, 1280×620, 844×390(가로), 1440×900 키보드 플로우, 리사이즈 시나리오. 컨테이너 소멸 시 유실되므로 필요하면 repo에 `e2e/`로 옮길 것
- API 스모크: `GET /api/scores` → `{configured:false,scores:[]}`(env 없을 때), `POST /api/events` 정상 204/이상 400

## 6. 오디오 재생성 레시피 (컷 포인트 조정 시)

```bash
# 90초 루프, 마지막 3초 → 처음 3초 크로스페이드 (L=90, F=3 조정 가능)
ffmpeg -i src.mp3 -filter_complex \
  "[0:a]atrim=90:93,asetpts=PTS-STARTPTS[c];[0:a]atrim=0:3,asetpts=PTS-STARTPTS[a];\
   [0:a]atrim=3:90,asetpts=PTS-STARTPTS[b];[c][a]acrossfade=d=3:c1=tri:c2=tri[x];\
   [x][b]concat=n=2:v=0:a=1[out]" -map "[out]" -ar 44100 -b:a 128k out.mp3
# 참고: 결과물은 원곡 90초 지점부터 시작(루프 이음새가 파일 경계에 오도록). 원본 음원은 git 히스토리에 있음
```

## 7. 주의할 코드 포인트 (다음 작업자용)

- `src/data/supabaseServer.ts`는 **서버 전용** — `'use client'` 파일에서 import 금지 (SERVICE_ROLE_KEY 노출됨). 파일 상단 주석이 유일한 가드
- `GameEngine.resize()`는 폭/높이 비율로 개체를 스케일 — 물리 상수(GRAVITY 등)는 여전히 절대 px라 화면 높이에 따라 체감 난이도 차이는 남아 있음 (지금까지는 허용 수준으로 판단)
- `NumericKeypad`는 pointer 이벤트로 동작 + `onClick`은 `e.detail === 0`(키보드/AT)일 때만 — onClick을 일반 경로로 바꾸면 이중 발동함
- 게임오버 Enter=RETRY 리스너는 INPUT/BUTTON 타깃을 무시 — 이름 입력 Enter(제출)와 충돌 방지용
- `page.tsx`의 레이아웃은 `globals.css`의 `.game-screen*` 클래스가 좌우함 — 인라인 height로 되돌리면 가로모드가 다시 깨짐
