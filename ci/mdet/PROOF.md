# unit mdet · PROOF — the coverage detector stops reading comments

Forks row 1151 (3) F3 B. Branch `claude/mdet-build`, cut 20 Nov 2026 from main `cebe3ebe4024c2144b934b3032b3fb837285d926`
(`git fetch origin main` · `git rev-parse FETCH_HEAD`; units mlaw and mcov are on it). `ci/mdet/BASE` names that sha.

## 1 · What is measured at the cut (20 Nov 2026)

The detector at base: `scripts/organism_test.mjs:306` (`hasSelftest`, `git show cebe3eb:scripts/organism_test.mjs | grep -n "hasSelftest = "`):
`` /['"`]selftest['"`]/.test(src) || /function selftest\(/.test(src) `` over the RAW bytes — a comment, a usage string or a word in any
string literal counts. Its two consumers: `coverage()` (the law: every script that has a selftest sits in exactly one suite) and
`hermetic()`'s selftest loop (the trip metric's targets).

**The new detector** (`selftestForm`, built in step 2) lexes the source — comments blanked, every string / template / regex body
blanked — and accepts exactly two forms:
- **dispatch** · a whole literal `selftest` that is an operand of `===` `==` `!==` `!=` or a `case` label (the mode the script branches on);
- **self-run** · a CALL of its own `selftest()` in code — not its declaration, not `x.selftest()`, not a method definition. A script run
  bare IS its selftest (claudegen: `package.json:_selftest_coverage_law` names that class). Without this form claudegen would MOVE
  has → none and leave the coverage law: the gate would loosen. See FORK F1.

## 2 · THE CENSUS (20 Nov 2026, before any edit of the detector)

Command: `node scripts/organism_test.mjs census` on the build tree (a READ mode outside `all`). Columns: the legacy reading and the
line of the word that made it say has; the new reading, its form and the line of its dispatch / self-run call; MOVES.
Every scripts/*.mjs except organism_test.mjs itself (the detector's own `scripts()` excludes it, at base as on the build).

**What moves: nothing at this cut.** No script moves has → none, none moves none → has. The one script the legacy reading fooled
(study_scope, mcov F3) gained a real verb in unit mcov, so it now reads has by a dispatch. The one script the dispatch-only rule
WOULD have moved is claudegen (the legacy reading says has from its declaration `scripts/claudegen.mjs:579`; the new one from its bare
self-run call `:1006`) — held by the self-run form. The witness plants each class both ways (§3).

Re-keyed 21 Nov 2026 by forks row 1224 (2) on the merge of main e436c17: the last cell is each organ's blob
(`git hash-object scripts/<organ>`), so witness C4 judges a row only while that organ's bytes are the bytes it was written on.

<!-- census:begin -->
| script | legacy | legacy at | detector | form | at | moves | blob |
|---|---|---|---|---|---|---|---|
| acts.mjs | has | 67 | has | dispatch | 67 | — | 97ece85972306b887af39aeb0a85101bc1915efc |
| archive_audit.mjs | has | 819 | has | dispatch | 819 | — | e15f520b641ac52356ece867cbcd7fec26de5c93 |
| archivist.mjs | has | 2689 | has | dispatch | 3485 | — | 4de46965110a767cca41d3fe4386148fd56a5aa7 |
| audit.mjs | has | 971 | has | dispatch | 1265 | — | 707eeab031efb27fe4ef5febfd390f1f5d7bf501 |
| audit_preload.mjs | none | — | none | — | — | — | f752e595e25ecd0fb7916c49f784bb80b475e9fe |
| awayday.mjs | has | 1231 | has | dispatch | 1231 | — | 2ca702090a3ae13cc2ee6874094476c79c4b4f06 |
| benchmark.mjs | has | 1257 | has | dispatch | 1257 | — | 67822db37ff797cb1101a6e8a6d8022ceb841ceb |
| blackbox.mjs | has | 103 | has | dispatch | 300 | — | 5f5e32a0d0b257ca9aa414686fadcc0d93c67473 |
| bootroom.mjs | has | 792 | has | dispatch | 792 | — | 64c8d4f2997c0a9b9cff77e7f6236fd298a47cf4 |
| brain.mjs | has | 5431 | has | dispatch | 7104 | — | 4d625b154c66166f505a3709071ab146e74c818b |
| calibration.mjs | has | 1123 | has | dispatch | 1123 | — | cfeb5b0ee2af69b037207bca41195afa47a149b4 |
| capsule_bridge.mjs | has | 860 | has | dispatch | 860 | — | f1fdbf93174e8f1aae736617b4dead530176d8f6 |
| captain.mjs | has | 97 | has | dispatch | 97 | — | bd26e3c97d6888e88b5dc25c1aef4abf9b35c975 |
| captains_call.mjs | has | 1784 | has | dispatch | 1784 | — | f0b397ab4a3d24a502000b402f077d4727cb2fd7 |
| capture.mjs | has | 2658 | has | dispatch | 2658 | — | a9e1c37b684bd33ed02a34fac30b5b4b2103ffa6 |
| ci_verdict.mjs | has | 355 | has | dispatch | 355 | — | 448d3e12db4adc67d05c1282359a539295754048 |
| claims.mjs | has | 274 | has | dispatch | 274 | — | fa374e3e6ec8b1aa7ee63a1ffdc7df050edb7ee1 |
| claudegen.mjs | has | 579 | has | self-run | 1006 | — | ae42614e748e6faebff8f9d846123031d904546b |
| conductor.mjs | has | 1748 | has | dispatch | 1748 | — | 185a03672207cf38bd3ff16cdfe05fd6309e393f |
| context.mjs | has | 1000 | has | dispatch | 1270 | — | 29f61d187df1395047e3d89cfecce0be12428f56 |
| context_manifest.mjs | has | 1484 | has | dispatch | 1484 | — | 28dbc5f81f39be46ba79b4e3e0498016c1ebcc76 |
| cortex.mjs | has | 2173 | has | dispatch | 2173 | — | 0934825c7b508a86c698fdc65735a6dcefc9f882 |
| council.mjs | has | 484 | has | dispatch | 484 | — | 981cda8fd231f95937ff90667a8566d512dd40f8 |
| course.mjs | has | 904 | has | dispatch | 904 | — | de06cbef4e721906c9eab795b72901d19711f147 |
| daemon_watchdog.mjs | has | 1060 | has | dispatch | 1060 | — | 2ecd5bb3dbe8a78fa77c0ee5b5847bed5cc058c3 |
| daily_green.mjs | has | 802 | has | dispatch | 802 | — | 6e190e769860b7c3a1006c6a968c6e9950d95aa2 |
| day.mjs | none | — | none | — | — | — | df4c2e5abbf7650c2d9fc34f9605511b460d09d8 |
| daykey.mjs | has | 353 | has | dispatch | 353 | — | 8e5f6d7afa65de5b9a4a379eb702057545f4f919 |
| deck_lint.mjs | has | 153 | has | dispatch | 153 | — | d299705a38e61bb6a57491c1fabcbda8264a85e0 |
| deep.mjs | has | 796 | has | dispatch | 796 | — | aead9d300a1e01be6edcbcbc129c7eb64de82424 |
| distiller.mjs | has | 1183 | has | dispatch | 1183 | — | 77a7c9874a515a4d9d85622e99aea06387c76b1d |
| dmn.mjs | has | 1042 | has | dispatch | 1611 | — | 29b2e52f88b9a6f6ba3eb31de55eb50827f6d9ba |
| done.mjs | has | 289 | has | dispatch | 289 | — | 5d875d7f011de67866b83bf45306bb6925e38f9d |
| doubtminer.mjs | has | 917 | has | dispatch | 1346 | — | 2a76ca691b9aac58cf544d0c9b85e1eaf3beb9a4 |
| dugout.mjs | has | 6496 | has | dispatch | 6496 | — | e89561477ea8805ccfdcd58693597edfd7b04e1e |
| examiner.mjs | has | 508 | has | dispatch | 785 | — | 9f468114b4e64a8d44af35c4fc17e4c3b5faecde |
| exchanges.mjs | has | 302 | has | dispatch | 302 | — | 0c60fe25b2a3474b78f9120bd2916eea4efe08b5 |
| flow_atlas.mjs | has | 418 | has | dispatch | 418 | — | 6bbcb539da27bae26fe1e5c52d89a1db8ccd8ede |
| forge_session.mjs | has | 3306 | has | dispatch | 3306 | — | f13bed151b8e86daaed236807804f90d4e5ef321 |
| freeze.mjs | has | 212 | has | dispatch | 212 | — | 27c334ca0de3c03869d5766180b71dc482d8ac41 |
| fsrs.mjs | has | 1113 | has | dispatch | 1113 | — | 33200eef3a198dc09e2e41641f0e65f15c7c2cef |
| fuelboard.mjs | has | 623 | has | dispatch | 651 | — | e529c403cfe98df72cf389b31eb58f348fb2c0b7 |
| gaffer_brain.mjs | has | 2787 | has | dispatch | 2787 | — | c5079d84b35c3977ccb98f73d300b0643a59370e |
| gaffer_state.mjs | has | 632 | has | dispatch | 632 | — | 261f18b94e1346a736070ff43254bbb93512d452 |
| gate.mjs | has | 977 | has | dispatch | 978 | — | 36c706019e792398a20a5b6bf60c6a7607b02cf7 |
| gate_tune.mjs | has | 202 | has | dispatch | 202 | — | f998c7ef7b02f84d39e1dbe40a496321f0567885 |
| gates.mjs | has | 483 | has | dispatch | 483 | — | 1799f103836188b67b5a57fe497e3c7e31090b7b |
| groundsman.mjs | has | 676 | has | dispatch | 676 | — | ffbc63de8675b487237e567b328129b819bc68d6 |
| harness_text.mjs | has | 60 | has | dispatch | 60 | — | f815b068103ed3c28cab707aa0ef342d2e1377a0 |
| harvest.mjs | has | 351 | has | dispatch | 351 | — | 333572baa5a2953a2e1491c32b1661398448df03 |
| heartbeat.mjs | has | 457 | has | dispatch | 457 | — | 8ddfb3e4bf060081c568723fcabe8da55145a8e9 |
| herd.mjs | has | 392 | has | dispatch | 393 | — | bcd875fdddc8f4584308f467d04986539b7d012d |
| hippocampus.mjs | has | 564 | has | dispatch | 1758 | — | 56a8d99dc68fab0c1f89624ded7be1679ba3ec78 |
| home_pin.mjs | has | 97 | has | dispatch | 166 | — | 143bdb855b66f8e5039181a0c79a8ffe20ce6676 |
| intent.mjs | has | 360 | has | dispatch | 360 | — | 9fbb54f709128d58da44d79f99497316d7734459 |
| keeper.mjs | has | 326 | has | dispatch | 326 | — | eb0ff8db1dd33e622bc4a9566ee14e85360fb34b |
| land.mjs | none | — | none | — | — | — | 0e7e2404dcf9fdaced62310daf758b17f75bd84e |
| lawpack.mjs | has | 937 | has | dispatch | 937 | — | 682d7e9dc47cf68824f57d4d378743c062ec64d1 |
| learn_digest.mjs | has | 220 | has | dispatch | 220 | — | 5a42caa7df155cbe5d4f6116a9bd7179c3f22592 |
| learning_state.mjs | has | 1011 | has | dispatch | 1011 | — | f2e6821ac9fce84bc93361466e852db90d9abebe |
| learnstate.mjs | has | 2178 | has | dispatch | 2178 | — | d2fbb305d4cdd31ec94bf53baa45566198ded9c1 |
| learnstate_hook.mjs | none | — | none | — | — | — | fbb8bd0ceb947e1c4caf2e3e984f0d59db021035 |
| limits.mjs | has | 1214 | has | dispatch | 1214 | — | c1fd7e0b762e7783d70e72d4ca739386b39fb536 |
| manager.mjs | has | 1724 | has | dispatch | 1724 | — | 0a0377395b5935f12998e61e75537d27f1159d64 |
| mcp-memory.mjs | has | 621 | has | dispatch | 621 | — | 8266993b59e1e36759cf662faec60616cdc29954 |
| mirror.mjs | has | 332 | has | dispatch | 332 | — | 68310c55f964284980bc45b0aca6bcacf7727ad8 |
| models.mjs | has | 435 | has | dispatch | 435 | — | e553bee35768233a6a80cfc3491f3231d83921a8 |
| mutagen.mjs | has | 156 | has | dispatch | 997 | — | 65154186a783e9772c7e5e3203459210df797f9d |
| nemesis.mjs | has | 643 | has | dispatch | 643 | — | 0907d0a3f13524bc5d01ddcd764aeea67e9cca10 |
| night.mjs | has | 266 | has | dispatch | 266 | — | 27f581a3b414e32860afabf09ba9a49ca38afe07 |
| nightshift.mjs | has | 1994 | has | dispatch | 1994 | — | d23d58787b47407b95c2cd4c40409fa80564cffb |
| nikhil_model.mjs | has | 519 | has | dispatch | 519 | — | 585cd8201445e24265e9143de82811bbdbc4e73b |
| notes_compiler.mjs | has | 1068 | has | dispatch | 1068 | — | 99ba07a608457a3269a629bfbf603c087b40c58e |
| notes_corrections.mjs | has | 202 | has | dispatch | 202 | — | 57030fe499eace272c25df687d9a929781335aed |
| oura_auth.mjs | has | 248 | has | dispatch | 248 | — | 52720183d78206a6b1917b464bbe321b46c22542 |
| oura_coach.mjs | has | 1090 | has | dispatch | 1090 | — | 6ec523ed88cd425305627bc2c7532d89412b38a4 |
| outbox.mjs | has | 599 | has | dispatch | 599 | — | f0605014fa27c200afcce456afd9f5a8c72c1f88 |
| outwork_audit.mjs | has | 438 | has | dispatch | 438 | — | 8d4b7011275e971df980d9b86607d367c68d4b84 |
| parked.mjs | has | 202 | has | dispatch | 202 | — | 722f3bafd40d6bcf83a12042d2d5072dfc5847bb |
| physio.mjs | has | 1719 | has | dispatch | 1719 | — | 09e41a596a55d1c4b620afea0873e91773ebb83c |
| postmatch.mjs | has | 1370 | has | dispatch | 1370 | — | 4f1e5c07e0b3509772d90dd9a808ae505250530e |
| presence.mjs | has | 1193 | has | dispatch | 1193 | — | 1dacb5b22a8e830af54d16f84003c6e1af7e5d50 |
| probe.mjs | has | 2284 | has | dispatch | 2284 | — | 4bfc6280e2168fe1fc019b26a7aae366e3345e5a |
| pulse.mjs | has | 376 | has | dispatch | 376 | — | de133ce76777285edbe48a46097118c1eb9f909a |
| python_state.mjs | has | 479 | has | dispatch | 479 | — | c3c0d00ce63f12a6fd6376b4bd7b4d44317f05c9 |
| rails.mjs | has | 645 | has | dispatch | 973 | — | 2616cf9f3382f9060f52e375984314d5f0ffeace |
| reconcile.mjs | has | 823 | has | dispatch | 823 | — | 53144775f6179572975b812a07d98c9e1b2ded22 |
| register.mjs | has | 160 | has | dispatch | 161 | — | e3937b474494c6b25480c0ef1e8e19001a8c5197 |
| registry.mjs | has | 67 | has | dispatch | 67 | — | 7eba4d924291c3b8c3e2d4b398097d7c8074d29f |
| rejirah.mjs | has | 1242 | has | dispatch | 1242 | — | 3b046e0db6c059d46ac3f44e70f434a267f9d5ee |
| repo_bundle.mjs | none | — | none | — | — | — | 916f5b457b139da594c424ba85f6d150a70d4a3a |
| resume_pointer.mjs | has | 287 | has | dispatch | 322 | — | bacd5f2492128baa9f37880f8d7588adcf77b8e0 |
| rung_receipt.mjs | has | 273 | has | dispatch | 273 | — | 7b4811a2d5c82e33aa8e9e923522ea48a2ca2c80 |
| samjhao.mjs | has | 99 | has | dispatch | 99 | — | 40e031e65bc60681994afab5ea7b95d9c945f742 |
| sandbox.mjs | has | 339 | has | dispatch | 386 | — | 789f360d4e591031478197d1860fd6af947ed50c |
| scoreboard.mjs | has | 626 | has | dispatch | 626 | — | ee3149f622888b0c90abd4906ea678223c2cd619 |
| scorer.mjs | has | 598 | has | dispatch | 602 | — | e19b7f22a903f52a7b2a39abfb792caa32edb300 |
| scout.mjs | has | 1256 | has | dispatch | 1256 | — | f0aae277977aec088e4e94188fd63022711d4424 |
| selfknowledge.mjs | has | 521 | has | dispatch | 521 | — | ba078cb92a840ea7e56668d814c6b3319e5e85ce |
| senses.mjs | has | 75 | has | dispatch | 75 | — | 9619583dc05224553707deb2ae0db569710d156f |
| services.mjs | has | 29 | has | dispatch | 1163 | — | bf33b50c0c54da34bc9ef3ca07571b4346599f01 |
| session_meter.mjs | has | 814 | has | dispatch | 814 | — | d37b40c22b1c77906e3bfaa890e8da67ace0f436 |
| setpiece.mjs | has | 1527 | has | dispatch | 1527 | — | 6e1107e1b464195fd13a7a73320378da066dcf7b |
| shadow.mjs | has | 509 | has | dispatch | 509 | — | 86647e52274608a595616be41bfa98b1fa027fab |
| shipped.mjs | has | 356 | has | dispatch | 356 | — | f010f84d1660c8f5511e72770f9d390e28c9cc4a |
| sitting.mjs | has | 1525 | has | dispatch | 1525 | — | 7f88e35e7aa086834622becb30ff23c5d689766c |
| speak.mjs | has | 145 | has | dispatch | 145 | — | 6ad4d6867229544ec4edbe87f02ef1daa5efced1 |
| spool.mjs | has | 267 | has | dispatch | 267 | — | e2567cde64e65ca325ce7e07c8a740b0e2edd0e3 |
| sprintsync.mjs | has | 338 | has | dispatch | 338 | — | 54a3fa2fb725473e3a344a64b7dd5e66c1591dbc |
| state.mjs | has | 488 | has | dispatch | 488 | — | e51433e4f219c04c011922f78451e4abe0130be5 |
| study_rail_replay.mjs | has | 411 | has | dispatch | 411 | — | 2adae70390ba73ca0166e45accc020d80742986d |
| study_scope.mjs | has | 42 | has | dispatch | 748 | — | abdd08289b805935347fe803715e7a17ca1b223c |
| swallow.mjs | has | 68 | has | dispatch | 91 | — | 6dce7177e927b7ca41368b94966255846d681339 |
| talk.mjs | has | 239 | has | dispatch | 239 | — | 87264164922cb593b9da2fbb73dc194c61100173 |
| tasks.mjs | has | 428 | has | dispatch | 428 | — | fae381f751b0771db163b2e81befd5d572d6e913 |
| teaching_audit.mjs | has | 2529 | has | dispatch | 2861 | — | 885eb9e5204ed2bca1e73d07dd00fc1978d20159 |
| teaching_bar.mjs | none | — | none | — | — | — | 33b9f2eebb5a9f8d941f00af62213d13a06ae198 |
| teaching_contract.mjs | has | 1474 | has | dispatch | 1971 | — | 4a051b0d9ef58d9bb8fc59f34a63dcd92b17412e |
| teaching_gate.mjs | has | 1344 | has | dispatch | 1344 | — | 80cb302e6c9487f192aa81c72f237407787864c5 |
| teaching_terms.mjs | none | — | none | — | — | — | dde823a099a0cd1a197125685bbe8707b621e6d2 |
| test_coach_v2.mjs | none | — | none | — | — | — | 9b6acac78b694da350298da4456409d346d6a525 |
| thalamus.mjs | has | 1238 | has | dispatch | 1238 | — | f529fcf022da1f0d1dabcbbf8dc90b66971ea9df |
| throwin.mjs | has | 594 | has | dispatch | 594 | — | a3022ccc42913b2dce1ddf590a1b228fb2c9e257 |
| timeaudit.mjs | has | 37 | has | dispatch | 353 | — | e2a183596d1a5288ecec4b62baa57adbce1dfbf1 |
| tokenizer_play.mjs | has | 143 | has | dispatch | 143 | — | 12f183f49c6e7a6903244f6054bc54b82b244569 |
| tone.mjs | has | 193 | has | dispatch | 193 | — | 02e386c41a60d6edcfeb242f8cde46060556a49d |
| touchline.mjs | has | 564 | has | dispatch | 564 | — | 271a2bc6b403406432f5f1ff151f913f3c93cf0d |
| treasury.mjs | has | 294 | has | dispatch | 296 | — | 84cc0d2f68072e037d32a349662b67b48d8e310b |
| turn_hook.mjs | has | 676 | has | dispatch | 766 | — | 76128a86a16ac385d07ac90fe0136833225c5d5b |
| turnstile.mjs | has | 247 | has | dispatch | 247 | — | 555e3d47c87145482fd9163efe4509bf81b24b0e |
| twin.mjs | has | 607 | has | dispatch | 607 | — | b34952f7736f9ef704cc0990c19f1d972587b4a2 |
| unleash_verdict.mjs | has | 150 | has | dispatch | 150 | — | cbeaea5c2bdd5ffec55ccf2bbfd6a662a829bb7d |
| usage_tap.mjs | has | 311 | has | dispatch | 311 | — | a520f033ab2cdda1385a179a4ab10c7d014a90df |
| validators.mjs | has | 218 | has | dispatch | 218 | — | b6e073613ba487ef1a03f4c9fe51e08491af60aa |
| viz.mjs | has | 1554 | has | dispatch | 1554 | — | a3feff6689d2e2531f0e58354bf8716b3d638646 |
| watchman.mjs | has | 3287 | has | dispatch | 3287 | — | ee431760290145550b8393d4863f0876b3553782 |
| watchman_brief.mjs | none | — | none | — | — | — | 9bf7b82745bd7c1f66d4fe1ac9ca12d33f8d5ee6 |
| widget.mjs | has | 277 | has | dispatch | 277 | — | ba4c2090ad226c4fdb99791f47b0ae15c6e430c6 |
| witness_cause.mjs | has | 5 | has | dispatch | 166 | — | a4cfb414b6b940cc88668ff2f701bde24fff0176 |
| xray.mjs | has | 213 | has | dispatch | 1407 | — | 47b9de0723bf69f7244c5815c378f3c077e9ba38 |
<!-- census:end -->

## 3 · The witness, both ways (20 Nov 2026)

`ci/mdet/witness_mdet.mjs --org <dir> --base-org <dir>` plants six scripts into a clone (or a copy of a plain tree) of each org
under os.tmpdir(): mdet_comment (the word only in comments), mdet_string (only in string literals), mdet_dispatch (`=== "selftest"`),
mdet_case (`case "selftest":`), mdet_selfrun (its own `selftest()` called), mdet_decl (a declaration nobody calls, and
`other.selftest()`). None is in a suite, so the coverage law must call exactly the has-plants orphans. Clauses C1 COMMENT,
C2 STRING, C3 DISPATCH, C4 CENSUS (the census minus the plants equals the table above), C5 SELF-RUN — header = contract.

| run | command | last line |
|---|---|---|
| build vs base | `node ci/mdet/witness_mdet.mjs --org . --base-org <clone of cebe3eb>` | `GREEN MDET the coverage detector reads a dispatch or a self-run, never a comment or a string · 5 clause(s)` (exit 0) |
| base as org | `node ci/mdet/witness_mdet.mjs --org <clone of cebe3eb> --base-org <clone of cebe3eb>` | `RED MDET · C1 COMMENT, C2 STRING, C3 DISPATCH, C4 CENSUS, C5 SELF-RUN` (exit 1) |
| plain LF trees | the same, `--org` / `--base-org` = `git archive` of HEAD / cebe3eb (the WITNESSES member's shape) | GREEN MDET, BOUND = the ci/mdet files and scripts/organism_test.mjs |

Every clause reads RED on base for two reasons: the legacy detector calls mdet_comment and mdet_string orphans, and base has no
census mode (it prints its mode list and exits 1) and no ci/mdet/PROOF.md. A witness run takes seconds: it runs only the
`coverage` and `census` modes, which read files and spawn nothing; each is bounded by the planted file's HEAVY_BOUND_MS, read.

## 4 · Mutants (20 Nov 2026)

`node ci/mdet/run_mutants_mdet.mjs --org .` — one exact edit of scripts/organism_test.mjs per clause, each in a fresh plant:
C1 line comments no longer blanked · C2 any whole literal counts (the legacy reading) · C3 a dispatch no longer accepted ·
C4 the census drops its last row · C5 a bare self-run no longer read.

`run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN`

## 5 · Measurements (20 Nov 2026)

- **Touched selftests:** none. scripts/organism_test.mjs is the suite runner, not a member; its `selftest` verb is unchanged.
- **Touched members:** none. package.json is untouched: the census moves no script, so no member line moves (row 1187 (2) not exercised).
- **The coverage law, its suites and its floor:** unchanged in code; `hermetic()`'s targets are the same set (the census has-column
  equals the legacy has-column on every script). The law is STRICTER in kind: a comment or a string can no longer satisfy it,
  and a comment or a string can no longer make an innocent script an orphan.
- (20 Nov 2026) `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs coverage`, build: `organism_test: 10 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 0 (hermetic: named, not run)`
- (20 Nov 2026) `ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs all`, build (the seat checkout): `organism_test: 156 passed, 0 failed · ruled 0 · UNRULED 0 · LIVE 124 (hermetic: named, not run)` (exit 0)
- (20 Nov 2026) the same, base (a fresh clone of cebe3eb): `organism_test: 154 passed, 2 failed · ruled 0 · UNRULED 2 · LIVE 124 (hermetic: named, not run)` (exit 2) — both reds are `sandbox selftest` (its tripwire recorded 2 of 4
  attempts), the fresh-clone red unit mcov named as its F5 and the architect routed to unit mherm. Not this unit's: the sandbox
  organ is untouched and its run is the same spawn on both trees.
- `node scripts/models.mjs check`: exit 0.
- **The law pack gate's count line** (`ORGANISM_TEST_PROFILE=hermetic node scripts/organism_test.mjs lawpack`, LF trees, after `npm ci`):
  - base: `ORGANISM_TEST_LAWPACK {"owners-only-state-write":0,"law-m-literal-model":0,"jugad-literal-subject-list":90,"trailing-n-slice":0,"bare-catch":37,"receipt-testimony-read":5,"tum-not-tu-prose":0,"import-time-registry-read":2,"unguarded-dispatch":0,"raw-nul-in-source":0,"depcruise_errors":7}`
  - build: `ORGANISM_TEST_LAWPACK {"owners-only-state-write":0,"law-m-literal-model":0,"jugad-literal-subject-list":90,"trailing-n-slice":0,"bare-catch":37,"receipt-testimony-read":5,"tum-not-tu-prose":0,"import-time-registry-read":2,"unguarded-dispatch":0,"raw-nul-in-source":0,"depcruise_errors":7}`
  - identical: no count rose; the gate's own assert is ok on both.
- **Canon-count replay** (LOAD ZERO BLOCK 7) over the COMMIT blobs of every tracked .md, before every push that touched one:
  undeclared 0.

## 6 · FORKS

- **F1 · the self-run form is a second accepted form beside the dispatch.** The brief says "requires a DISPATCH on the word". Read
  literally, claudegen (`scripts/claudegen.mjs:1006`, run bare, no word to dispatch on) MOVES has → none and leaves the coverage law:
  the gate loosens. (A) dispatch only, and claudegen's membership stays by package.json alone, unenforced · (B) dispatch OR a call of
  the script's own `selftest()` in code (built). **Built B**: it keeps every current has, and witness C5 plants it both ways.
- **F2 · an uncalled `function selftest(` now reads none.** The legacy reading counted the declaration. No script at this cut is in
  that shape (the census moves nothing); C5's mdet_decl plants it. (A) keep (built) · (B) count a declaration too. Recommend A: a
  declaration nobody calls cannot run.
- **F3 · test_coach_v2 is a suite member the detector cannot see.** It is invoked bare and carries no `selftest` word or function
  (census: none on both readings), so the coverage law does not require it. Named, not chased: no change of reading moves it; a unit
  could ask every bare-invoked member to answer the word.
- **F4 · the base `all` red** is mcov F5 / unit mherm (above), measured here only because the base was a fresh clone.
- **F5 · the census table is a snapshot of this cut.** Witness C4 compares it row for row, so any later edit of a scripts/*.mjs that
  moves a dispatch line reds C4 on a re-run of this witness against a newer tree. When main moves, the table is regenerated by
  `node scripts/organism_test.mjs census` in the merge step (the brief's main-moves rule), never hand-edited.
- **F6 · the effort receipt tool** (campaign-2026-09/tools/effort_receipt.mjs) is not in this repository: its error is named in the
  final message; nothing is written under campaign-2026-09/.

## 7 · MAIN MOVED — merge of main 6a6bdff (unit mmeter), 20 Nov 2026

- `git fetch origin main && git merge --no-edit FETCH_HEAD` (FETCH_HEAD = `6a6bdfff4349b849398b69d0748b27d37c874b85`): merge commit
  `febf3e20a603181b22ae0b6122dfb018e8f4d6a3`, a merge, never a rebase or a force push. **No conflicting hunk**: scripts/organism_test.mjs auto-merged — main's intent
  (a `clauses` mode that walks ci/witness/) and this unit's (the detector, its census read mode) sit in different hunks and both
  hold (`clauses` on the merged tree, 20 Nov 2026: 6 passed, 0 failed; `coverage`: 10 passed, 0 failed). package.json is
  untouched by this unit, so no union was needed.
- `ci/mdet/BASE` is unchanged (cebe3eb). The clauses are judged against it; the BOUND against the parent 6a6bdff (row 1200 (2)) —
  the witness gained `--bound-org <dir>` for that (absent, the bound reads --base-org; then the merged tree's ci/mmeter paths
  read `RED MDET · BOUND`, which the WITNESSES member drops by its own `judgeLast`, scripts/organism_test.mjs).
- The census table (§2) was regenerated by `node scripts/organism_test.mjs census` (F5): two rows shift their dispatch line —
  daily_green and done, both changed by mmeter — and **nothing moves**.
- Witness (bound against 6a6bdff): `GREEN MDET the coverage detector reads a dispatch or a self-run, never a comment or a string · 5 clause(s)` (exit 0). Base as org: `RED MDET · C1 COMMENT, C2 STRING, C3 DISPATCH, C4 CENSUS, C5 SELF-RUN` (exit 1).
- Mutants: `run_mutants: 5 of 5 mutant(s) RED by the clause that names them · control GREEN`
- Law pack count line, merged tree and main 6a6bdff alike: `ORGANISM_TEST_LAWPACK {"owners-only-state-write":0,"law-m-literal-model":0,"jugad-literal-subject-list":90,"trailing-n-slice":0,"bare-catch":37,"receipt-testimony-read":5,"tum-not-tu-prose":0,"import-time-registry-read":2,"unguarded-dispatch":0,"raw-nul-in-source":0,"depcruise_errors":7}` — no count rose. `node scripts/models.mjs check`: exit 0.

CHECKPOINT · merged main 6a6bdff at 14:21Z 20 Nov 2026 · witness and mutants GREEN on the merged tree · resume from: the neutral verdict of this push
