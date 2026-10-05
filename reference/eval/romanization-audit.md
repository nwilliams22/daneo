# Romanization corpus audit — 2026-10-04

Source of truth: all 1,439 rows in `src/content/sentences.json`. Join nonempty `ko[].t` with one space, as the app does. Reproduce with `node --import tsx scripts/romanization-audit.ts`. Following the independent eight-row review in [BAD-218](/BAD/issues/BAD-218), three `rom` values were corrected. No Korean text changed.

**Raw exact: 1,353/1,439 (94.02%). After removing only terminal `.`, `!`, or `?` from both sides: 1,434/1,439 (99.65%).** The 81 punctuation-only rows remain a separate content hygiene concern. Five residual rows are below; all five are listed in `reference/authoring/rom-exceptions.json`. Do not call this 1,439/1,439: accepted house spellings differ from the transliterator's phonological output.

| Sentence ID | Korean | Corpus `rom` | Code output | Finding |
| --- | --- | --- | --- | --- |
| s13_station_five | 지하철역까지 오 분 걸려요 | jihacheollyeokkaji o bun geollyeoyo | jihacheollyeokkkaji o bun geollyeoyo | Accepted house spelling for `지하철역까지`. |
| s17_photo_hobby | 제 취미는 사진을 찍는 것이에요 | je chwimineun sajineul jjikneun geosieyo | je chwimineun sajineul jjingneun geosieyo | Accepted house spelling for `찍는`; code applies stop nasalization. |
| s18_solo_okay | 혼자 먹는 것도 괜찮아요 | honja meokneun geotdo gwaenchanayo | honja meongneun geotdo gwaenchanayo | Accepted house spelling for `먹는`; code applies stop nasalization. |
| s_s4_busan_lunch | 부산 친구가 전화로 물어봤어요: 밥 뭇나? | busan chinguga jeonhwaro mureobwasseoyo: bap mutna? | busan chinguga jeonhwaro mureobwasseoyo: bap munna? | Accepted dialect spelling for `뭇나`. |
| s_s4_chungcheong_slow | 충청도 할아버지는 "괜찮아유"라고 천천히 대답하셨어요 | chungcheongdo harabeojineun "gwaenchanayu"rago cheoncheonhi daedapasyeosseoyo | chungcheongdo harabeojineun "gwaenchanayu"rago cheoncheonhi daedaphasyeosseoyo | Accepted house spelling for `대답하셨어요`. |

The independent review selected `makyeoyo` as the corpus convention for `막혀요`, correcting `s_m57_morning_roads` to agree with `s12_traffic_bad`. It also removed the styling hyphen from `s_s1_iced_americano` and restored the Korean comma in the romanization of `s_m106_supplies_again`.

The existing content linter records accepted house spellings in
`reference/authoring/rom-exceptions.json`. It explicitly lists the corpus forms
for `지하철역까지`, `찍는`, `먹는`, `뭇나`, and `대답하셨어요`, and lists
`makyeoyo` for `막혀요`. The independent review accepted the five listed
spellings as house exceptions. Matching them by changing a Korean-line-only
transliterator would alter general phonological output to reproduce row-specific
conventions. The 81 terminal-punctuation differences are tracked separately in
[BAD-214](/BAD/issues/BAD-214).
