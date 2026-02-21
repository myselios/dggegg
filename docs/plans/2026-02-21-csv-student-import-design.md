# CSV 학생 일괄 임포트 설계

## 개요
학생관리 페이지에서 CSV 파일을 통해 학생을 일괄 추가하는 기능.

## 요구사항
- CSV 컬럼: 이름, 학교, 거주지, 학년
- 중복 처리: 같은 이름+학교 조합은 건너뛰기
- 미리보기: 임포트 전 데이터 확인 + 중복 표시
- 샘플 CSV 다운로드 제공

## UI 흐름
1. 학생 추가 버튼 오른쪽에 "CSV 가져오기" 버튼
2. 다이얼로그 열림 → 파일 선택/드래그
3. 파싱 후 미리보기 테이블 표시 (중복 행 표시)
4. "N명 추가하기" 버튼으로 일괄 추가
5. 완료 후 SWR 캐시 갱신

## 컬럼 매핑
| CSV 헤더 | DB 필드 |
|----------|---------|
| 이름 / name | name_ko |
| 학교 / school | school |
| 거주지 / residence | residence |
| 학년 / grade | grade |

## 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `components/students/student-csv-import-dialog.tsx` | 신규 - CSV 임포트 다이얼로그 |
| `components/students/student-board.tsx` | 툴바에 CSV 가져오기 버튼 추가 |
| `app/actions/students.ts` | `createStudentsBatch` 서버 액션 추가 |

## 기술 결정
- CSV 파싱: 클라이언트에서 FileReader + 수동 파싱 (외부 라이브러리 없음)
- 중복 체크: SWR 캐시의 기존 학생 목록과 이름+학교 비교
- 일괄 추가: 서버 액션에서 Supabase insert 배열 사용
