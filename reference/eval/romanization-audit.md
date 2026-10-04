# Romanization corpus audit — 2026-10-04

Source of truth: all 1,439 rows in `src/content/sentences.json`. Join nonempty `ko[].t` with one space, as the app does. Reproduce with `node --import tsx scripts/romanization-audit.ts`. The corpus was not edited.

**Raw exact: 1,350/1,439 (93.82%). After removing only terminal `.`, `!`, or `?` from both sides: 1,431/1,439 (99.44%).** The 81 punctuation-only rows remain a separate content hygiene concern. Eight residual rows are below. Do not call this 1,439/1,439: pronunciation and styling conventions disagree within the corpus, and some rows need adjudication.

| Sentence ID | Korean | Corpus `rom` | Code output | Finding |
| --- | --- | --- | --- | --- |
| s13_station_five | 지하철역까지 오 분 걸려요 | jihacheollyeokkaji o bun geollyeoyo | jihacheollyeokkkaji o bun geollyeoyo | Review ㄱ + ㄲ spelling at 역까지; code may overcount k. |
| s17_photo_hobby | 제 취미는 사진을 찍는 것이에요 | je chwimineun sajineul jjikneun geosieyo | je chwimineun sajineul jjingneun geosieyo | Corpus writes 찍는 as jjikneun; code applies stop nasalization (jjingneun). |
| s18_solo_okay | 혼자 먹는 것도 괜찮아요 | honja meokneun geotdo gwaenchanayo | honja meongneun geotdo gwaenchanayo | Corpus writes 먹는 as meokneun; code applies stop nasalization (meongneun). |
| s_s1_iced_americano | 아아 한 잔 주세요 | a-a han jan juseyo | aa han jan juseyo | Corpus hyphenates the 아아 abbreviation; transliteration has no abbreviation styling. |
| s_m57_morning_roads | 일반적으로 아침에는 길이 많이 막혀요 | ilbanjeogeuro achimeneun giri mani makhyeoyo | ilbanjeogeuro achimeneun giri mani makyeoyo | Corpus has makhyeoyo here, but s12_traffic_bad has makyeoyo for the same 막혀요. |
| s_s4_busan_lunch | 부산 친구가 전화로 물어봤어요: 밥 뭇나? | busan chinguga jeonhwaro mureobwasseoyo: bap mutna? | busan chinguga jeonhwaro mureobwasseoyo: bap munna? | Dialect 뭇나 is rendered mutna in corpus; regular ㄷ + ㄴ assimilation gives munna. |
| s_s4_chungcheong_slow | 충청도 할아버지는 "괜찮아유"라고 천천히 대답하셨어요 | chungcheongdo harabeojineun "gwaenchanayu"rago cheoncheonhi daedapasyeosseoyo | chungcheongdo harabeojineun "gwaenchanayu"rago cheoncheonhi daedaphasyeosseoyo | Corpus omits h in 대답하셨어요; code preserves it. |
| s_m106_supplies_again | 아이가 학용품을 다 잃어버렸길래 연필, 공책 등등을 새로 사 줬어요 | aiga hagyongpumeul da ireobeoryeotgillae yeonpil gongchaek deungdeungeul saero sa jwosseoyo | aiga hagyongpumeul da ireobeoryeotgillae yeonpil, gongchaek deungdeungeul saero sa jwosseoyo | Corpus drops the written comma between 연필 and 공책. |

The same `막혀요` is written both `makyeoyo` and `makhyeoyo` in the corpus. A Korean-line-only function cannot match both by a stable phonological rule. Preserve the reviewed content and resolve the convention explicitly before claiming exactness.

The existing content linter records accepted house spellings in
`reference/authoring/rom-exceptions.json`. It explicitly lists the corpus forms
for `지하철역까지`, `찍는`, `먹는`, `뭇나`, and `대답하셨어요`, and lists
`makyeoyo` for `막혀요`. That supports treating those five rows as reviewed
exceptions rather than changing their content here. It does not resolve the
other `막혀요` row, whose `makhyeoyo` conflicts with the linter exception and
the earlier sentence. The `아아` hyphen and the omitted comma in the
`연필, 공책` row are formatting differences, not phonological rules. Matching
all eight by changing a Korean-line-only transliterator would require
context-specific styling or contradictory output for the same Korean token.
