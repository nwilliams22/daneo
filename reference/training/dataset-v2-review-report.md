# Dataset v2 candidate row review

- Candidate file SHA-256: `85b923d289b170a1f1ed5445adf816b88a62986502f2f5a1142bfd1c386a2ec6`
- Candidate source commit: `261b6e6647ced4c081c4ceea47d1238d1d40225a`
- Scope: candidate rows and their embedded `sourceNote`; no reserved fixtures opened; no inference or training run.
- Verdict meanings: pass = no correction identified; correction required = retain only after the specified edit; reject = exclude the target.

## Verdict counts

| Split | Provisional class | Pass | Correction required | Reject | Acceptable as-is |
|---|---:|---:|---:|---:|---:|
| training | register | 53 | 7 | 0 | 53 |
| development | register | 10 | 0 | 0 | 10 |
| training | gloss | 40 | 5 | 0 | 40 |
| development | gloss | 10 | 0 | 0 | 10 |
| training | semantic-fidelity | 40 | 5 | 0 | 40 |
| development | semantic-fidelity | 10 | 0 | 0 | 10 |
| training | literal-gap | 87 | 13 | 0 | 87 |
| development | literal-gap | 9 | 1 | 0 | 9 |

Acceptable as-is means pass only; corrections do not count until applied and reviewed again. These are review counts, not approval of the final dataset.

## Row-by-row verdicts

| Candidate ID | Split / provisional class | Verdict | Field(s) and exact action |
|---|---|---|---|
| `DAN-V2-CANDIDATE-001` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-002` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-003` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-004` | training / register | **correction required** | target.korean: 지금 세 시 십 분이에요 (join the copula to the numeral phrase; preserve 동일 in input/target). |
| `DAN-V2-CANDIDATE-005` | training / register | **correction required** | target.korean: 몇 살이에요? (join 이에요 to 살). |
| `DAN-V2-CANDIDATE-006` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-007` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-008` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-009` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-010` | training / register | **correction required** | target.literal_gap: “Literally, ‘plans/promise exist’; in use, ‘I have plans/an appointment.’” Qualify the existential phrasing; no experiencer is overt. |
| `DAN-V2-CANDIDATE-011` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-012` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-013` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-014` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-015` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-016` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-017` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-018` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-019` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-020` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-021` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-022` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-023` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-024` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-025` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-026` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-027` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-028` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-029` | training / register | **correction required** | target.literal_gap: “Literally, ‘will be busy’; depending on subject/context, -(으)ㄹ 거예요 can also express a probability (‘probably busy’).” Preserve the future reading as default. |
| `DAN-V2-CANDIDATE-030` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-031` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-032` | training / register | **correction required** | target.korean: 얼마예요? (spacing). |
| `DAN-V2-CANDIDATE-033` | training / register | **correction required** | target.korean: 오천 원이에요 (spacing). |
| `DAN-V2-CANDIDATE-034` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-035` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-036` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-037` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-038` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-039` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-040` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-041` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-042` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-043` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-044` | training / register | **correction required** | target.literal_gap: “Literally, ‘rain comes’; in use, ‘it is raining.’” |
| `DAN-V2-CANDIDATE-045` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-046` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-047` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-048` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-049` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-050` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-051` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-052` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-053` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-054` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-055` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-056` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-057` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-058` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-059` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-060` | training / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-061` | development / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-062` | development / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-063` | development / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-064` | development / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-065` | development / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-066` | development / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-067` | development / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-068` | development / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-069` | development / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-070` | development / register | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-071` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-072` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-073` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-074` | training / gloss | **pass** | —: 늦어서 / 죄송합니다 are separately and adequately glossed as late-because / sorry-[formal]. |
| `DAN-V2-CANDIDATE-075` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-076` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-077` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-078` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-079` | training / gloss | **correction required** | target.literal_gap: “Literally, ‘the floor is warm’; the cultural note may explain ondol heating, but do not imply the sentence itself means a special idiom.” |
| `DAN-V2-CANDIDATE-080` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-081` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-082` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-083` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-084` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-085` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-086` | training / gloss | **correction required** | target.natural_english: “I’m stressed, so I have no energy.” Current “I’ve been getting stress” is unidiomatic and falsely progressive. |
| `DAN-V2-CANDIDATE-087` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-088` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-089` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-090` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-091` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-092` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-093` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-094` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-095` | training / gloss | **correction required** | target.korean: 몇 학년이에요? (join 이에요 to 학년). |
| `DAN-V2-CANDIDATE-096` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-097` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-098` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-099` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-100` | training / gloss | **correction required** | target.literal_gap: “Literally, ‘see an exam well’; in use, ‘do well on an exam.’” |
| `DAN-V2-CANDIDATE-101` | training / gloss | **correction required** | target.natural_english: “I’ll start exercising tomorrow.” Current “Starting tomorrow, I’ll start exercising” duplicates the start event. |
| `DAN-V2-CANDIDATE-102` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-103` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-104` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-105` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-106` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-107` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-108` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-109` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-110` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-111` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-112` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-113` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-114` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-115` | training / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-116` | development / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-117` | development / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-118` | development / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-119` | development / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-120` | development / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-121` | development / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-122` | development / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-123` | development / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-124` | development / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-125` | development / gloss | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-126` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-127` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-128` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-129` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-130` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-131` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-132` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-133` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-134` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-135` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-136` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-137` | training / semantic-fidelity | **correction required** | target.natural_english: “This is a good/popular restaurant.” 맛집 does not assert that it is “the famous one.” |
| `DAN-V2-CANDIDATE-138` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-139` | training / semantic-fidelity | **correction required** | target.literal_gap: “Literally, ‘eating alone is okay too’; the source note’s 혼밥 context is explanatory, not a different sentence meaning.” |
| `DAN-V2-CANDIDATE-140` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-141` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-142` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-143` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-144` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-145` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-146` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-147` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-148` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-149` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-150` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-151` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-152` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-153` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-154` | training / semantic-fidelity | **correction required** | target.literal_gap: “Literally, ‘Did you see the text? Reply!’; casual 반말 and omitted subject/particles are context/register facts, not a distinct idiomatic translation.” |
| `DAN-V2-CANDIDATE-155` | training / semantic-fidelity | **correction required** | target.literal_gap: “Literally, ‘take a selfie and raise/post it to social media’; in use, ‘post/upload it.’” |
| `DAN-V2-CANDIDATE-156` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-157` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-158` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-159` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-160` | training / semantic-fidelity | **correction required** | target.natural_english: “You shouldn’t press this” / “It’s not okay to press this.” 안 돼요 is prohibition/impermissibility; “must not” is too categorical without context. |
| `DAN-V2-CANDIDATE-161` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-162` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-163` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-164` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-165` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-166` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-167` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-168` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-169` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-170` | training / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-171` | development / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-172` | development / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-173` | development / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-174` | development / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-175` | development / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-176` | development / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-177` | development / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-178` | development / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-179` | development / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-180` | development / semantic-fidelity | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-181` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-182` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-183` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-184` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-185` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-186` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-187` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-188` | training / literal-gap | **correction required** | target.literal_gap: Replace “Literally (no literal parts)” with a meaningful compositional reading and delimit this as a culturally contextual concept, or reject this as a literal-gap item. 정 is not semantically empty; gloss should describe accumulated attachment/affection. |
| `DAN-V2-CANDIDATE-189` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-190` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-191` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-192` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-193` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-194` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-195` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-196` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-197` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-198` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-199` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-200` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-201` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-202` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-203` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-204` | training / literal-gap | **correction required** | target.literal_gap, target.sourceNote: Add explicit contrasting contexts for 가세요: “선생님이 가세요” = “the teacher is going” (honorific declarative), “가세요” addressed to a listener = “please go” (polite request). The uncontextualized target currently invites the model to infer addressee/subject from morphology alone. |
| `DAN-V2-CANDIDATE-205` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-206` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-207` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-208` | training / literal-gap | **correction required** | target.natural_english: Narrow to “not okay / not allowed” with a context-qualified exclamation “no way!”; it does not universally mean all three. |
| `DAN-V2-CANDIDATE-209` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-210` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-211` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-212` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-213` | training / literal-gap | **correction required** | target.natural_english: “driver” / vocative “driver” (or “sir/ma’am, driver”). 기사님 is a respectful address, not literally “engineer-sir”; “any driver” needs the addressee context. |
| `DAN-V2-CANDIDATE-214` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-215` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-216` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-217` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-218` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-219` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-220` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-221` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-222` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-223` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-224` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-225` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-226` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-227` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-228` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-229` | training / literal-gap | **correction required** | target.literal_gap: Replace “to ride a something” with “to be in a 썸 (a not-yet-defined romantic/flirting stage)”; 타다 here means being in/experiencing the state, not riding an object. |
| `DAN-V2-CANDIDATE-230` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-231` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-232` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-233` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-234` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-235` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-236` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-237` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-238` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-239` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-240` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-241` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-242` | training / literal-gap | **correction required** | target.natural_english, sourceNote: Limit to “wrong” as the standard meaning, and mark “different” as a frequently confused/misused form only when supported by a cited source and context. The categorical “Koreans habitually…” claim is unsupported and risks teaching 틀리다=다르다. |
| `DAN-V2-CANDIDATE-243` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-244` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-245` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-246` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-247` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-248` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-249` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-250` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-251` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-252` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-253` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-254` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-255` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-256` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-257` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-258` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-259` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-260` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-261` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-262` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-263` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-264` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-265` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-266` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-267` | training / literal-gap | **correction required** | target.natural_english: “Horses to Jeju; people to Seoul” or “send horses to Jeju and people to Seoul.” Current metaphorical paraphrase omits the proverb’s paired destinations and weakens its literal/figurative contrast. |
| `DAN-V2-CANDIDATE-268` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-269` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-270` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-271` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-272` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-273` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-274` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-275` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-276` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-277` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-278` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-279` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-280` | training / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-281` | development / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-282` | development / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-283` | development / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-284` | development / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-285` | development / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-286` | development / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-287` | development / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-288` | development / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-289` | development / literal-gap | **pass** | —: No correction identified in the target fields on review. |
| `DAN-V2-CANDIDATE-290` | development / literal-gap | **correction required** | target.natural_english, sourceNote: Qualify 코리안 타임 as dated/occasionally joking usage, not a current “old custom” asserted as established fact; provide a dated source for the mid-century/30-minute claim or remove that claim. Do not use as a timeless translation. |

## Cross-row review findings

- All 100 gap targets have a non-empty `literal_gap`; the sentence targets have empty `literal_gap` by design. The empty sentence field is not itself an error. The report flags the sentence rows above where a specific semantic or context problem is visible.
- The literal-gap candidates are mostly single lexical items or phrases. Their one-chunk aligned glosses preserve the intended literal/ordinary contrast at the phrase level, but they do not establish word-by-word compositional independence. Do not count lexical idioms as evidence of unseen paraphrase generalization.
- No exact normalized English/Korean duplicates were apparent in the inspected sequence. The set is strongly source-correlated: rows are adjacent sentence/commentary sequences from the shipped curriculum, and many literal-gap notes explicitly refer to neighboring lessons. Mechanical v1/reservation disjointness does not prove paraphrase independence. Treat class/split independence as unverified until cross-item source families and derived variants are audited.
- Register labels are provisional: polite 요 forms are prevalent in the first register block, but these targets are translations and general sentences rather than controlled register contrasts. The class name does not by itself demonstrate register sensitivity.
- Corrections to candidate rows must be reviewed and rebound to a new candidate SHA before they count as approved training/development examples.
