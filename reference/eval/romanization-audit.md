# Romanization corpus audit — 2026-10-04

Source of truth: all 1439 rows in `src/content/sentences.json`. For each row, join nonempty `ko[].t` with one space, exactly as the app does; compare `romanize(joined)` byte for byte with `rom`. No corpus value was changed.

**Exact matches: 1297/1439 (90.13%). Mismatches: 142.** 80 mismatches are only final punctuation. The rest include pronunciation, spacing and corpus style differences; treat the corpus as authoritative pending individual review.

| Sentence ID | Korean | Corpus `rom` | Code output |
| --- | --- | --- | --- |
| s5_ten_past | 지금 세 시 십 분 이에요 | jigeum se si sip bunieyo | jigeum se si sip bun ieyo |
| s5_half_past | 오후 두 시 반 이에요 | ohu du si banieyo | ohu du si ban ieyo |
| s5_how_old | 몇 살 이에요? | myeot sarieyo? | myeot sal ieyo? |
| s9_how_much | 얼마 예요? | eolmayeyo? | eolma yeyo? |
| s9_five_thousand | 오천 원 이에요 | ocheon wonieyo | ocheon won ieyo |
| s12_traffic_bad | 길이 너무 막혀요 | giri neomu makyeoyo | giri neomu makhyeoyo |
| s13_station_five | 지하철역까지 오 분 걸려요 | jihacheollyeokkaji o bun geollyeoyo | jihacheollyeokkkaji o bun geollyeoyo |
| s15_what_grade | 몇 학년 이에요? | myeot hangnyeonieyo? | myeot hangnyeon ieyo? |
| s17_photo_hobby | 제 취미는 사진을 찍는 것이에요 | je chwimineun sajineul jjikneun geosieyo | je chwimineun sajineul jjingneun geosieyo |
| s18_solo_okay | 혼자 먹는 것도 괜찮아요 | honja meokneun geotdo gwaenchanayo | honja meongneun geotdo gwaenchanayo |
| s19_happy_birthday | 생일 축하해! | saengil chukahae! | saengil chukhahae! |
| s24_good_idea | 좋은 생각이에요! | joeun saenggagieyo | joeun saenggagieyo! |
| s24_what_music | 어떤 음악을 들어요? | eotteon eumageul deureoyo | eotteon eumageul deureoyo? |
| s24_movie_how | 어제 본 영화 어땠어요? | eoje bon yeonghwa eottaesseoyo | eoje bon yeonghwa eottaesseoyo? |
| s25_happy_birthday | 생일 축하해요! | saengil chukahaeyo! | saengil chukhahaeyo! |
| s29_hard_but_fun | 한국어는 어려워요. 그렇지만 재미있어요. | hangugeoneun eoryeowoyo. geureochiman jaemiisseoyo | hangugeoneun eoryeowoyo. geureochiman jaemiisseoyo. |
| s29_winter_but | 겨울이 왔어요. 그러나 춥지 않았어요. | gyeouri wasseoyo. geureona chupji anasseoyo | gyeouri wasseoyo. geureona chupji anasseoyo. |
| s30_toothbrush_paste | 칫솔하고 치약을 꼭 사야 돼요 | chissolhago chiyageul kkok saya dwaeyo | chitsolhago chiyageul kkok saya dwaeyo |
| s_s1_funny_kk | 그 얘기 진짜 웃겨 ㅋㅋㅋ | geu yaegi jinjja utgyeo kkk | geu yaegi jinjja utgyeo ㅋㅋㅋ |
| s_s1_iced_americano | 아아 한 잔 주세요 | a-a han jan juseyo | aa han jan juseyo |
| s_s2_construction | 공사 중입니다. 죄송합니다. | gongsa jungimnida. joesonghamnida | gongsa jungimnida. joesonghamnida. |
| s_m34_guests_shoes | 문 앞에 신발이 많아요. 손님이 왔나 봐요 | mun ape sinbari manayo. sonnimi wanna bwayo | mun ape sinbari manayo. sonnimi watna bwayo |
| s_m40_too_salty | 조금 짠 것 같아요. 소금을 너무 많이 뿌렸어요. | jogeum jjan geot gatayo. sogeumeul neomu mani ppuryeosseoyo | jogeum jjan geot gatayo. sogeumeul neomu mani ppuryeosseoyo. |
| s_m48_hundred_channels | 채널이 백 개나 있어요. 그런데 재미있는 프로그램이 없어요 | chaeneori baek gaena isseoyo. geureonde jaemiinneun peurogeuraemi eopseoyo | chaeneori baek gaena isseoyo. geureonde jaemiitneun peurogeuraemi eopseoyo |
| s_m51_talent_show | 그 탤런트는 요즘 무슨 프로에 출연해요? | geu taelleonteuneun yojeum museun peuroe churyeonhaeyo | geu taelleonteuneun yojeum museun peuroe churyeonhaeyo? |
| s_m49_autumn_turns | 가을이 오면 나뭇잎이 노래지고 낙엽이 떨어져요 | gaeuri omyeon namunnipi noraejigo nagyeobi tteoreojyeoyo | gaeuri omyeon namusipi noraejigo nagyeobi tteoreojyeoyo |
| s_m53_medicine_but | 약을 먹었는데 아직 안 나았어요 | yageul meogeonneunde ajik an naasseoyo | yageul meogeotneunde ajik an naasseoyo |
| s_m53_grandma_arc | 할머니께서 지난주에 수술을 받으셨는데 내일 퇴원하세요 | halmeonikkeseo jinanjue susureul badeusyeonneunde naeil toewonhaseyo | halmeonikkeseo jinanjue susureul badeusyeotneunde naeil toewonhaseyo |
| s_m56_gov_results | 정부가 어제 조사 결과를 밝혔습니다. 또한 새로운 계획도 발표했습니다 | jeongbuga eoje josa gyeolgwareul balkyeotseumnida. ttohan saeroun gyehoekdo balpyohaetseumnida | jeongbuga eoje josa gyeolgwareul bakhyeotseumnida. ttohan saeroun gyehoekdo balpyohaetseumnida |
| s_m55_rain_mistake | 비가 올 줄 알았는데 눈이 왔어요 | biga ol jul aranneunde nuni wasseoyo | biga ol jul aratneunde nuni wasseoyo |
| s_s4_busan_lunch | 부산 친구가 전화로 물어봤어요: 밥 뭇나? | busan chinguga jeonhwaro mureobwasseoyo: bap mutna? | busan chinguga jeonhwaro mureobwasseoyo: bap munna? |
| s_s4_chungcheong_slow | 충청도 할아버지는 "괜찮아유"라고 천천히 대답하셨어요 | chungcheongdo harabeojineun "gwaenchanayu"rago cheoncheonhi daedapasyeosseoyo | chungcheongdo harabeojineun "gwaenchanayu"rago cheoncheonhi daedaphasyeosseoyo |
| s_m59_market_fresh | 시장에서 오이하고 상추를 샀는데 아주 신선했어요 | sijangeseo oihago sangchureul sanneunde aju sinseonhaesseoyo | sijangeseo oihago sangchureul satneunde aju sinseonhaesseoyo |
| s_m58_freshman_grad | 신입생 때는 모든 게 새로웠는데 벌써 졸업생이 됐어요 | sinipsaeng ttaeneun modeun ge saerowonneunde beolsseo joreopsaengi dwaesseoyo | sinipsaeng ttaeneun modeun ge saerowotneunde beolsseo joreopsaengi dwaesseoyo |
| s_m62_umbrella_gone | 분명히 우산을 가방에 넣어 뒀는데 지금 없어요 | bunmyeonghi usaneul gabange neoeo dwonneunde jigeum eopseoyo | bunmyeonghi usaneul gabange neoeo dwotneunde jigeum eopseoyo |
| s_m67_passport_trouble | 여권을 잃어버렸어요. 큰일 났어요! | yeogwoneul ireobeoryeosseoyo. keunnil nasseoyo! | yeogwoneul ireobeoryeosseoyo. keunil nasseoyo! |
| s_m67_wennil_visit | 이 시간에 여기 웬일이에요? | i sigane yeogi wennirieyo? | i sigane yeogi wenirieyo? |
| s_m68_turn_gone | 제가 이름을 불렀는데 친구는 그냥 돌아서서 가 버렸어요 | jega ireumeul bulleonneunde chinguneun geunyang doraseoseo ga beoryeosseoyo | jega ireumeul bulleotneunde chinguneun geunyang doraseoseo ga beoryeosseoyo |
| s_m69_speech_nerves | 축하 인사말을 준비해 두었는데, 결혼식에서 너무 긴장해서 다 잊어버렸어요 | chuka insamareul junbihae dueonneunde, gyeolhonsigeseo neomu ginjanghaeseo da ijeobeoryeosseoyo | chukha insamareul junbihae dueotneunde, gyeolhonsigeseo neomu ginjanghaeseo da ijeobeoryeosseoyo |
| s_m70_grown_close | 예전에는 사이가 멀었는데 요즘은 많이 가까워졌어요 | yejeoneneun saiga meoreonneunde yojeumeun mani gakkawojyeosseoyo | yejeoneneun saiga meoreotneunde yojeumeun mani gakkawojyeosseoyo |
| s_m70_easy_read | 잘 읽히는 소설을 한 권 소개해 주세요 | jal ilkineun soseoreul han gwon sogaehae juseyo | jal ikhineun soseoreul han gwon sogaehae juseyo |
| s_m74_lullaby_first | 아기를 재우려고 노래를 불렀는데 제가 먼저 잠들어 버렸어요 | agireul jaeuryeogo noraereul bulleonneunde jega meonjeo jamdeureo beoryeosseoyo | agireul jaeuryeogo noraereul bulleotneunde jega meonjeo jamdeureo beoryeosseoyo |
| s_m75_cancel_text | 취소 문자가 왔는데 이유를 모르겠어요 | chwiso munjaga wanneunde iyureul moreugesseoyo | chwiso munjaga watneunde iyureul moreugesseoyo |
| s_m76_which_line | 서울역에서 몇 호선으로 갈아타야 돼요? | seoullyeogeseo myeot hoseoneuro garataya dwaeyo | seoullyeogeseo myeot hoseoneuro garataya dwaeyo? |
| s_m76_summit_not_yet | 정상이 가까운 줄 알았는데 아직 한 시간이나 남았어요 | jeongsangi gakkaun jul aranneunde ajik han siganina namasseoyo | jeongsangi gakkaun jul aratneunde ajik han siganina namasseoyo |
| s_m78_diplomat_decade | 외교관이 된 지 십 년이 됐는데 아직도 외국 생활이 힘들어요 | oegyogwani doen ji sip nyeoni dwaenneunde ajikdo oeguk saenghwari himdeureoyo | oegyogwani doen ji sip nyeoni dwaetneunde ajikdo oeguk saenghwari himdeureoyo |
| s_m81_three_kinds | 사과는 세 종밖에 없는데 질이 다 좋네요 | sagwaneun se jongbakke eomneunde jiri da jonneyo | sagwaneun se jongbakke eopneunde jiri da jonneyo |
| s_m81_cohort_ten_years | 국립 대학교를 졸업한 지 십 년이 됐는데 동기들을 아직 자주 만나요 | gungnip daehakgyoreul joreophan ji sip nyeoni dwaenneunde donggideureul ajik jaju mannayo | gungnip daehakgyoreul joreophan ji sip nyeoni dwaetneunde donggideureul ajik jaju mannayo |
| s_m79_quiz_trend | 요즘 에스엔에스에서 심리 테스트가 유행이에요 | yojeum eseueneseueseo simni teseuteuga yuhaengieyo | yojeum eseueneseueseo simri teseuteuga yuhaengieyo |
| s_m88_since_graduation | 졸업한 이래 처음 학교에 가 봤는데 자주 갔던 식당이 없어졌더라고요 | joreophan irae cheoeum hakgyoe ga bwanneunde jaju gatdeon sikdangi eopseojyeotdeoragoyo | joreophan irae cheoeum hakgyoe ga bwatneunde jaju gatdeon sikdangi eopseojyeotdeoragoyo |
| s_m92_wiped_surface | 표면을 닦기는 닦았는데 물기가 아직 남았어요 | pyomyeoneul dakgineun dakkanneunde mulgiga ajik namasseoyo | pyomyeoneul dakgineun dakkatneunde mulgiga ajik namasseoyo |
| s_m93_result_soon | 결과가 곧 밝혀질 텐데 조금만 더 기다려 보세요 | gyeolgwaga got balkyeojil tende jogeumman deo gidaryeo boseyo | gyeolgwaga got bakhyeojil tende jogeumman deo gidaryeo boseyo |
| s_m95_no_contact_no_conflict | 서로 접촉이 없는 한 갈등도 없어요 | seoro jeopchogi eomneun han galdeungdo eopseoyo | seoro jeopchogi eopneun han galdeungdo eopseoyo |
| s_m98_no_evidence_no_detention | 증거가 없는 한 경찰은 그 사람을 구속할 수 없어요 | jeunggeoga eomneun han gyeongchareun geu sarameul gusokhal su eopseoyo | jeunggeoga eopneun han gyeongchareun geu sarameul gusokhal su eopseoyo |
| s_m100_election_support_capital | 선거 결과를 봤는데 수도권에서는 지지가 크게 늘었더라고요 | seongeo gyeolgwareul bwanneunde sudogwoneseoneun jijiga keuge neureotdeoragoyo | seongeo gyeolgwareul bwatneunde sudogwoneseoneun jijiga keuge neureotdeoragoyo |
| s_m101_nature_whereas | 성격은 바뀔 수 있는 반면에 본성은 잘 안 바뀌어요 | seonggyeogeun bakkwil su inneun banmyeone bonseongeun jal an bakkwieoyo | seonggyeogeun bakkwil su itneun banmyeone bonseongeun jal an bakkwieoyo |
| s_m102_govt_disclose_correct | 정부는 조사 결과를 공개하며 잘못을 바로잡겠다고 밝혔어요 | jeongbuneun josa gyeolgwareul gonggaehamyeo jalmoseul barojapgetdago balkyeosseoyo | jeongbuneun josa gyeolgwareul gonggaehamyeo jalmoseul barojapgetdago bakhyeosseoyo |
| s_m103_midthirties_spending | 삼십 대 중반이 되니까 지출이 수입보다 많더라고요 | samsip dae jungbani doenikka jichuri suipboda manteoragoyo | samsip dae jungbani doenikka jichuri suipboda mandeoragoyo |
| s_m104_old_stories_buried | 오래된 이야기는 결국 역사에 묻히기 마련이에요 | oraedoen iyagineun gyeolguk yeoksae muchigi maryeonieyo | oraedoen iyagineun gyeolguk yeoksae muthigi maryeonieyo |
| s_m105_manuscript_three_sentences | 원고를 쓰기는 썼는데 고작 세 문장이에요 | wongoreul sseugineun sseonneunde gojak se munjangieyo | wongoreul sseugineun sseotneunde gojak se munjangieyo |
| s_m106_supplies_again | 아이가 학용품을 다 잃어버렸길래 연필, 공책 등등을 새로 사 줬어요 | aiga hagyongpumeul da ireobeoryeotgillae yeonpil gongchaek deungdeungeul saero sa jwosseoyo | aiga hagyongpumeul da ireobeoryeotgillae yeonpil, gongchaek deungdeungeul saero sa jwosseoyo |
| s_m109_friend_trapped | 친구가 엘리베이터에 갇혔더라고요 | chinguga ellibeiteoe gachyeotdeoragoyo | chinguga ellibeiteoe gathyeotdeoragoyo |
| s_m119_interrupt_story | 친구가 끼어드는 바람에 이야기가 끊겼어요 | chinguga kkieodeuneun barame iyagiga kkeunkyeosseoyo | chinguga kkieodeuneun barame iyagiga kkeungyeosseoyo |
| s_m121_02 | 전시회에 사람이 많더라고요 | jeonsihoee sarami manteoragoyo | jeonsihoee sarami mandeoragoyo |
| s_m121_06 | 방해가 많길래 집에 갔어요 | banghaega mankillae jibe gasseoyo | banghaega mangillae jibe gasseoyo |
| s_m132_preliminary | 예선에서 지더라도 자부심을 잃지 말아요 | yeseoneseo jideorado jabusimeul ilchi marayo | yeseoneseo jideorado jabusimeul ilji marayo |
| s_m135_future | 각오를 굳힌 만큼 앞날을 믿어요. | gagoreul guthin mankeum amnareul mideoyo. | gagoreul guthin mankeum apnareul mideoyo. |
| s_m137_recovery | 그전에는 회복될 수 없었는데 이제 가능해졌어요. | geujeoneneun hoebokdoel su eopseonneunde ije ganeunghaejyeosseoyo. | geujeoneneun hoebokdoel su eopseotneunde ije ganeunghaejyeosseoyo. |
| s_m138_help | 도움말을 읽는 김에 소지품도 확인했어요. | doummareul ingneun gime sojipumdo hwaginhaesseoyo. | doummareul ikneun gime sojipumdo hwaginhaesseoyo. |
| s_m142_form | 원서가 불완전하면 필수 정보를 보충해야 해요. | wonseoga burwanjeonhamyeon pilsu jeongboreul bochunghaeya haeyo | wonseoga burwanjeonhamyeon pilsu jeongboreul bochunghaeya haeyo. |
| s_m142_counter | 창구 뒤편이 아주 어두워서 긴장감이 느껴졌어요. | changgu dwipyeoni aju eoduwoseo ginjanggami neukkyeojyeosseoyo | changgu dwipyeoni aju eoduwoseo ginjanggami neukkyeojyeosseoyo. |
| s_m142_signature | 참석자가 요 종이에 서명했어요. | chamseokjaga yo jongie seomyeonghaesseoyo | chamseokjaga yo jongie seomyeonghaesseoyo. |
| s_m142_rent | 전세가 최저 금액으로도 가능할까요? | jeonsega choejeo geumaegeurodo ganeunghalkkayo | jeonsega choejeo geumaegeurodo ganeunghalkkayo? |
| s_m142_night | 직원이 밤을 새웠어요. | jigwoni bameul saewosseoyo | jigwoni bameul saewosseoyo. |
| s_m142_jog | 저는 잔디 옆에서 조깅 횟수를 세어 봤어요. | jeoneun jandi yeopeseo joging hoetsureul seeo bwasseoyo | jeoneun jandi yeopeseo joging hoetsureul seeo bwasseoyo. |
| s_m142_road | 아스팔트가 비 때문에 젖었어요. | aseupalteuga bi ttaemune jeojeosseoyo | aseupalteuga bi ttaemune jeojeosseoyo. |
| s_m142_payment | 퇴직금이 예상보다 적었어요. | toejikgeumi yesangboda jeogeosseoyo | toejikgeumi yesangboda jeogeosseoyo. |
| s_m143_submission | 제출은 오늘까지 필수예요. | jechureun oneulkkaji pilsuyeyo | jechureun oneulkkaji pilsuyeyo. |
| s_m143_return | 아버지는 한밤중에 귀가하셨어요. | abeojineun hanbamjunge gwigahasyeosseoyo | abeojineun hanbamjunge gwigahasyeosseoyo. |
| s_m143_rear | 뒷문 뒤편에 습기가 많아요. | dwinmun dwipyeone seupgiga manayo | dwinmun dwipyeone seupgiga manayo. |
| s_m143_grading | 선생님은 채점을 끝냈어요. | seonsaengnimeun chaejeomeul kkeunnaesseoyo | seonsaengnimeun chaejeomeul kkeunnaesseoyo. |
| s_m143_sparkle | 잔디밭이 비가 그친 뒤에 반짝였어요. | jandibachi biga geuchin dwie banjjagyeosseoyo | jandibachi biga geuchin dwie banjjagyeosseoyo. |
| s_m143_visitor | 관람객이 전시를 소중히 여겼어요. | gwallamgaegi jeonsireul sojunghi yeogyeosseoyo | gwallamgaegi jeonsireul sojunghi yeogyeosseoyo. |
| s_m143_family | 딸아이는 할머니를 그리워해요. | ttaraineun halmeonireul geuriwohaeyo | ttaraineun halmeonireul geuriwohaeyo. |
| s_m143_hospital | 병실은 한밤중에도 분주했어요. | byeongsireun hanbamjungedo bunjuhaesseoyo | byeongsireun hanbamjungedo bunjuhaesseoyo. |
| s_m144_form | 신청서는 제출 전에 확인하세요. | sincheongseoneun jechul jeone hwaginhaseyo | sincheongseoneun jechul jeone hwaginhaseyo. |
| s_m144_board | 채점 결과가 게시판에 나왔어요. | chaejeom gyeolgwaga gesipane nawasseoyo | chaejeom gyeolgwaga gesipane nawasseoyo. |
| s_m144_service | 직장인이 교내에서 봉사했어요. | jikjangini gyonaeeseo bongsahaesseoyo | jikjangini gyonaeeseo bongsahaesseoyo. |
| s_m144_forecast | 예보가 위험성을 강조했어요. | yeboga wiheomseongeul gangjohaesseoyo | yeboga wiheomseongeul gangjohaesseoyo. |
| s_m144_school | 재학 중인 학생은 학과를 선택해요. | jaehak jungin haksaengeun hakgwareul seontaekhaeyo | jaehak jungin haksaengeun hakgwareul seontaekhaeyo. |
| s_m144_display | 학교는 앨범을 전시했어요. | hakgyoneun aelbeomeul jeonsihaesseoyo | hakgyoneun aelbeomeul jeonsihaesseoyo. |
| s_m144_job | 사업가는 새 일자리를 만들었어요. | saeopganeun sae iljarireul mandeureosseoyo | saeopganeun sae iljarireul mandeureosseoyo. |
| s_m144_tutor | 자매는 과외를 받았어요. | jamaeneun gwaoereul badasseoyo | jamaeneun gwaoereul badasseoyo. |
| s_m145_display | 앨범을 전시하러 가는 김에 전시장도 둘러봤어요. | aelbeomeul jeonsihareo ganeun gime jeonsijangdo dulleobwasseoyo | aelbeomeul jeonsihareo ganeun gime jeonsijangdo dulleobwasseoyo. |
| s_m145_post | 신청서를 우편으로 보냈더니 답장이 왔어요. | sincheongseoreul upyeoneuro bonaetdeoni dapjangi wasseoyo | sincheongseoreul upyeoneuro bonaetdeoni dapjangi wasseoyo. |
| s_m145_recruit | 배우자가 일자리를 알아보던 전시장에서 직원을 모집해요. | baeujaga iljarireul arabodeon jeonsijangeseo jigwoneul mojiphaeyo | baeujaga iljarireul arabodeon jeonsijangeseo jigwoneul mojiphaeyo. |
| s_m145_noon | 정오가 지났는데도 전시장은 조용할 따름이에요. | jeongoga jinanneundedo jeonsijangeun joyonghal ttareumieyo | jeongoga jinatneundedo jeonsijangeun joyonghal ttareumieyo. |
| s_m145_advice | 충고를 듣고도 속상할 따름이었어요. | chunggoreul deutgodo soksanghal ttareumieosseoyo | chunggoreul deutgodo soksanghal ttareumieosseoyo. |
| s_m145_dishes | 수입품이라고 하더라도 이 식기는 비싸지 않아요. | suippumirago hadeorado i sikgineun bissaji anayo | suippumirago hadeorado i sikgineun bissaji anayo. |
| s_m145_medal | 금메달을 따고서 눈감았어요. | geummedareul ttagoseo nungamasseoyo | geummedareul ttagoseo nungamasseoyo. |
| s_m145_care | 간호를 하느라고 동화책을 읽지 못했어요. | ganhoreul haneurago donghwachaegeul ikji mothaesseoyo | ganhoreul haneurago donghwachaegeul ikji mothaesseoyo. |
| s_m146_hall | 전시장을 둘러보는 김에 무용가도 만났어요. | jeonsijangeul dulleoboneun gime muyonggado mannasseoyo | jeonsijangeul dulleoboneun gime muyonggado mannasseoyo. |
| s_m146_prize | 금메달을 땄을 뿐만 아니라 상금도 받았어요. | geummedareul ttasseul ppunman anira sanggeumdo badasseoyo | geummedareul ttasseul ppunman anira sanggeumdo badasseoyo. |
| s_m146_tableware | 식기가 고급스러울 뿐만 아니라 깨끗해요. | sikgiga gogeupseureoul ppunman anira kkaekkeuthaeyo | sikgiga gogeupseureoul ppunman anira kkaekkeuthaeyo. |
| s_m146_weather | 날이 개더니 앞바다가 보였어요. | nari gaedeoni apbadaga boyeosseoyo | nari gaedeoni apbadaga boyeosseoyo. |
| s_m146_ham | 햄은 고소하기는 하지만 식욕이 없어요. | haemeun gosohagineun hajiman sigyogi eopseoyo | haemeun gosohagineun hajiman sigyogi eopseoyo. |
| s_m146_delay | 출국을 연기하는 바람에 입사도 늦어졌어요. | chulgugeul yeongihaneun barame ipsado neujeojyeosseoyo | chulgugeul yeongihaneun barame ipsado neujeojyeosseoyo. |
| s_m146_welcome | 외갓집에 갔더니 모두 반겨 주셨어요. | oegatjibe gatdeoni modu bangyeo jusyeosseoyo | oegatjibe gatdeoni modu bangyeo jusyeosseoyo. |
| s_m146_recycle | 재활용에 찬성하더라도 방법은 다시 생각해야 해요. | jaehwaryonge chanseonghadeorado bangbeobeun dasi saenggakhaeya haeyo | jaehwaryonge chanseonghadeorado bangbeobeun dasi saenggakhaeya haeyo. |
| s_m147_attend | 참석 대상자를 학생으로 한정하더라도 준비해야 해요. | chamseok daesangjareul haksaengeuro hanjeonghadeorado junbihaeya haeyo | chamseok daesangjareul haksaengeuro hanjeonghadeorado junbihaeya haeyo. |
| s_m147_reuse | 재활용에 관한 자료를 참고한 결과 태도가 바뀌었어요. | jaehwaryonge gwanhan jaryoreul chamgohan gyeolgwa taedoga bakkwieosseoyo | jaehwaryonge gwanhan jaryoreul chamgohan gyeolgwa taedoga bakkwieosseoyo. |
| s_m147_skills | 입사하고서 실력이 향상되었어요. | ipsahagoseo sillyeogi hyangsangdoeeosseoyo | ipsahagoseo sillyeogi hyangsangdoeeosseoyo. |
| s_m147_walk | 근교에서 걷다 보니 빗방울이 떨어졌어요. | geungyoeseo geotda boni bitbanguri tteoreojyeosseoyo | geungyoeseo geotda boni bitbanguri tteoreojyeosseoyo. |
| s_m147_host | 사회자는 손수 준비하고도 걱정했어요. | sahoejaneun sonsu junbihagodo geokjeonghaesseoyo | sahoejaneun sonsu junbihagodo geokjeonghaesseoyo. |
| s_m147_warm | 날씨가 포근하기는 하지만 꽃은 시들었어요. | nalssiga pogeunhagineun hajiman kkocheun sideureosseoyo | nalssiga pogeunhagineun hajiman kkocheun sideureosseoyo. |
| s_m147_disc | 시디가 판매될 듯해요. | sidiga panmaedoel deuthaeyo | sidiga panmaedoel deuthaeyo. |
| s_m147_doubt | 결과가 불확실하더라도 쓸데없이 걱정하지 마세요. | gyeolgwaga bulhwaksilhadeorado sseuldeeopsi geokjeonghaji maseyo | gyeolgwaga bulhwaksilhadeorado sseuldeeopsi geokjeonghaji maseyo. |
| s_m148_path | 근교 산길을 걷다 보니 빗방울이 떨어졌어요. | geungyo sangireul geotda boni bitbanguri tteoreojyeosseoyo | geungyo sangireul geotda boni bitbanguri tteoreojyeosseoyo. |
| s_m148_scale | 장모님께서 저울로 짐을 재고서 운반을 부탁하셨어요. | jangmonimkkeseo jeoullo jimeul jaegoseo unbaneul butakhasyeosseoyo | jangmonimkkeseo jeoullo jimeul jaegoseo unbaneul butakhasyeosseoyo. |
| s_m148_commute | 출퇴근하다가 반대편 로터리에서 길을 잃었어요. | chultoegeunhadaga bandaepyeon roteorieseo gireul ireosseoyo | chultoegeunhadaga bandaepyeon roteorieseo gireul ireosseoyo. |
| s_m148_host | 사회자가 긴장되었지만 통역을 손수 준비했어요. | sahoejaga ginjangdoeeotjiman tongyeogeul sonsu junbihaesseoyo | sahoejaga ginjangdoeeotjiman tongyeogeul sonsu junbihaesseoyo. |
| s_m148_regular | 단골이 가게에 들어오자마자 촛불을 켰어요. | dangori gagee deureoojamaja chotbureul kyeosseoyo | dangori gagee deureoojamaja chotbureul kyeosseoyo. |
| s_m148_rod | 낚싯대가 냇물에 빠지자 나는 힘없이 집으로 돌아왔어요. | naksitdaega naenmure ppajija naneun himeopsi jibeuro dorawasseoyo | naksitdaega naenmure ppajija naneun himeopsi jibeuro dorawasseoyo. |
| s_m148_room | 포근한 방이 더러워져서 장모님이 깨끗하게 청소하셨어요. | pogeunhan bangi deoreowojyeoseo jangmonimi kkaekkeuthage cheongsohasyeosseoyo | pogeunhan bangi deoreowojyeoseo jangmonimi kkaekkeuthage cheongsohasyeosseoyo. |
| s_m148_humid | 날이 무덥더라도 산길을 계속 걸었어요. | nari mudeopdeorado sangireul gyesok georeosseoyo | nari mudeopdeorado sangireul gyesok georeosseoyo. |
| s_m149_spring | 장모님께 약수를 드렸더니 표정이 밝아졌어요. | jangmonimkke yaksureul deuryeotdeoni pyojeongi balgajyeosseoyo | jangmonimkke yaksureul deuryeotdeoni pyojeongi balgajyeosseoyo. |
| s_m149_children | 촛불을 끄고서 아이들이 마당의 양옆에서 뛰놀았어요. | chotbureul kkeugoseo aideuri madangui yangyeopeseo ttwinorasseoyo | chotbureul kkeugoseo aideuri madangui yangyeopeseo ttwinorasseoyo. |
| s_m149_angler | 산길을 내려와서 강변에서 낚시꾼을 만났어요. | sangireul naeryeowaseo gangbyeoneseo naksikkuneul mannasseoyo | sangireul naeryeowaseo gangbyeoneseo naksikkuneul mannasseoyo. |
| s_m149_postpone | 공연이 연기되자 배우가 괴로워했어요. | gongyeoni yeongidoeja baeuga goerowohaesseoyo | gongyeoni yeongidoeja baeuga goerowohaesseoyo. |
| s_m149_rainwash | 초여름 비에 차가 깨끗이 씻겼어요. | choyeoreum bie chaga kkaekkeusi ssitgyeosseoyo | choyeoreum bie chaga kkaekkeusi ssitgyeosseoyo. |
| s_m149_fees | 학비가 감소되면 학생들이 안심할 거예요. | hakbiga gamsodoemyeon haksaengdeuri ansimhal geoyeyo | hakbiga gamsodoemyeon haksaengdeuri ansimhal geoyeyo. |
| s_m149_period | 교시가 끝나자마자 학생들이 학교에서 뛰놀았어요. | gyosiga kkeunnajamaja haksaengdeuri hakgyoeseo ttwinorasseoyo | gyosiga kkeunnajamaja haksaengdeuri hakgyoeseo ttwinorasseoyo. |
| s_m149_focus | 초저녁부터 집중하다 보니 피곤을 느꼈어요. | chojeonyeokbuteo jipjunghada boni pigoneul neukkyeosseoyo | chojeonyeokbuteo jipjunghada boni pigoneul neukkyeosseoyo. |
| s_m150_school | 사립 학교에 등록하려고 학비를 냈어요. | sarip hakgyoe deungnokharyeogo hakbireul naesseoyo | sarip hakgyoe deungnokharyeogo hakbireul naesseoyo. |
| s_m150_record | 공연된 음악을 음반으로 들었어요. | gongyeondoen eumageul eumbaneuro deureosseoyo | gongyeondoen eumageul eumbaneuro deureosseoyo. |
| s_m150_water | 약수를 마시고서 몸속이 시원해졌어요. | yaksureul masigoseo momsogi siwonhaejyeosseoyo | yaksureul masigoseo momsogi siwonhaejyeosseoyo. |
| s_m150_funeral | 장례식에서 가족들이 손잡았어요. | jangnyesigeseo gajokdeuri sonjabasseoyo | jangnyesigeseo gajokdeuri sonjabasseoyo. |
| s_m150_preface | 밤새우며 석사 논문의 머리말을 썼어요. | bamsaeumyeo seoksa nonmunui meorimareul sseosseoyo | bamsaeumyeo seoksa nonmunui meorimareul sseosseoyo. |
| s_m150_summer | 올여름에는 라켓을 들고 강변으로 갈 거예요. | oryeoreumeneun rakeseul deulgo gangbyeoneuro gal geoyeyo | oryeoreumeneun rakeseul deulgo gangbyeoneuro gal geoyeyo. |
| s_m150_cartoonist | 만화가가 사생활을 지키려고 얼굴을 공개하지 않았어요. | manhwagaga sasaenghwareul jikiryeogo eolgureul gonggaehaji anasseoyo | manhwagaga sasaenghwareul jikiryeogo eolgureul gonggaehaji anasseoyo. |
| s_m150_cat | 고양이가 야옹 울더니 아이의 눈이 반짝거렸어요. | goyangiga yaong uldeoni aiui nuni banjjakgeoryeosseoyo | goyangiga yaong uldeoni aiui nuni banjjakgeoryeosseoyo. |
| s_m155_attendance | 예습을 했는데도 학생이 결석해서 수업을 놓쳤어요. | yeseubeul haenneundedo haksaengi gyeolseokhaeseo sueobeul nochyeosseoyo. | yeseubeul haetneundedo haksaengi gyeolseokhaeseo sueobeul nochyeosseoyo. |
