# Chip Studio

반도체 재료를 선택하고, 제조 장비의 동작과 완성된 칩을 탐색하는 교육용 웹사이트입니다.

## 실행

Node.js 22 이상에서 추가 패키지 설치 없이 실행합니다.

```sh
npm start
```

브라우저에서 http://127.0.0.1:8765 를 엽니다. 포트폴리오는 `/portfolio.html`에서 확인할 수 있습니다.

## 기능

- 칩 템플릿, 재료, 층 두께와 배선 밀도 조절
- Canvas로 구현한 3D 회전, 확대·축소, 분해·단면 보기
- 로봇 이송, 증착, 식각, 검사, 절단, 조립을 포함한 9단계 공정
- 제조 속도 0.25~4배 조절과 일시정지
- PCB, 작은 표면실장 부품, USB, 핀 헤더와 LED 전원 조작
- 공식 자료를 기반으로 한 실제 칩 라이브러리 18종
- 한글 회사명·제품명과 대소문자 구분 없는 검색
- 설계 자동 저장, JSON 및 PNG 다운로드
- OpenAI API를 연결하는 칩 질문 창

## AI 연결

사이트의 ‘칩 AI에게 질문’ → ‘AI 연결 설정’에서 본인의 API 키와 접근 가능한 모델을 입력합니다. 키는 로컬 서버 메모리에만 보관하며 서버가 종료되면 사라집니다. AI 질문과 선택한 설계 정보는 OpenAI로 전송됩니다. API 사용 비용은 해당 API 계정에 적용됩니다.

또는 서버 실행 환경에 `OPENAI_API_KEY`와 선택적으로 `OPENAI_MODEL`을 설정할 수 있습니다. 기본 모델은 `gpt-4.1-mini`입니다. 키를 HTML, JavaScript, GitHub 저장소에 기록하지 마세요.

키가 없으면 연결 상태와 안내만 표시됩니다. 실제 AI 응답은 유효한 키, 모델 접근 권한과 네트워크 연결이 필요하며, 현재 작업에서는 실 API 응답을 검증하지 않았습니다.

API 구현 참고: https://developers.openai.com/api/docs/quickstart

## 파일

| 파일 | 역할 |
|---|---|
| index.html / style.css / app.js | 설계·제조·PCB 인터랙션 |
| library.js / library-data.js | 칩 모음과 검색 |
| assistant.js | AI 질문 UI |
| server.cjs | 로컬 정적 서버와 AI API 중계 |
| portfolio.html / portfolio.css / portfolio.js | 프로젝트 포트폴리오 |

`npm run check`로 JavaScript 문법을 확인합니다.

## 표현 범위

칩 구조, PCB와 제조 장면은 교육용 모델입니다. 실제 회로·다이 배치나 제조 공정의 정확한 복제는 아닙니다. 특성 점수는 가상 상대 지표이며 실제 성능 예측이 아닙니다. 라이브러리에는 각 제품의 공식 출처 링크를 표시합니다.

브라우저에 저장되는 설계는 localStorage를 사용합니다. 공유 링크는 설계 설정을 URL에 담으며, 공개 웹 호스팅은 별도 설정이 필요합니다. 정적 GitHub Pages만으로는 AI 서버가 실행되지 않습니다.
