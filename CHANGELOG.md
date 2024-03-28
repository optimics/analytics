# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.7.4](https://github.com/optimics/analytics/compare/v0.7.3...v0.7.4) (2024-03-28)


### Bug Fixes

* formattedDate ([8280bab](https://github.com/optimics/analytics/commit/8280babbcb3f886d9ba83107ec18f6dd43eb6e76))





## [0.7.3](https://github.com/optimics/analytics/compare/v0.7.2...v0.7.3) (2023-10-16)


### Bug Fixes

* avoid dying on unknown custom type ([a473f34](https://github.com/optimics/analytics/commit/a473f34e0144303b794d6759daf21060a7f0355c))
* avoid parsing "undefined" as JSON ([03fa90d](https://github.com/optimics/analytics/commit/03fa90d9452ca5952a79081c0e20431130beeb80))
* pass extra props to data layer ([ff06e0f](https://github.com/optimics/analytics/commit/ff06e0f56ac634c0fb1be174e348de9b4f4f7fd5))
* verify type metrics ([a5a0087](https://github.com/optimics/analytics/commit/a5a00871830f394f8a30cecc7854ffd3ffd84f08))





## [0.7.2](https://github.com/optimics/analytics/compare/v0.7.1...v0.7.2) (2023-10-10)


### Bug Fixes

* allow extending article image ([4a538d4](https://github.com/optimics/analytics/commit/4a538d42aadd1e164694f1a05e59b7f5a7197a96))
* avoid validating disabled fields ([2adc3c5](https://github.com/optimics/analytics/commit/2adc3c578b15a792aeedae0acaecb07c46233c43))
* do not use intraday tables ([b546763](https://github.com/optimics/analytics/commit/b5467631e2087b205d6ccd3692deb730ed7255d7))
* do not validate unrequired property ([d494807](https://github.com/optimics/analytics/commit/d4948076ec97718e255ce3b03a8c173b7a3922e9))
* filter exact content types ([55ea5a2](https://github.com/optimics/analytics/commit/55ea5a2818ff5a4b19ecee5acc2a3399e9edd689))
* start article tracking on tag load ([b14354c](https://github.com/optimics/analytics/commit/b14354ca712919cf35a8f516ed194e72a0be581c))
* use yesteday, not tomorrow ([e3d597b](https://github.com/optimics/analytics/commit/e3d597b0a04291794b1bf2d9325820bd9e9876b1))
* validate achievement is at least something ([47c324a](https://github.com/optimics/analytics/commit/47c324ad81a869e4ad70a672221923e16a6534a7))





## [0.7.1](https://github.com/optimics/analytics/compare/v0.7.0...v0.7.1) (2023-10-09)


### Bug Fixes

* avoid overwriting user name ([9315501](https://github.com/optimics/analytics/commit/9315501eb8e4efec66df5c7de238d273cae8a319))
* bind total usage metrics filters ([56512f6](https://github.com/optimics/analytics/commit/56512f6f5fc7e65ba62d0a7adce91437a9c2b0ce))
* configure intersection threshold ([abaa2cb](https://github.com/optimics/analytics/commit/abaa2cb4a6cdc42a19fdb65f17657ee036734e69))
* convert std output to string ([0814020](https://github.com/optimics/analytics/commit/0814020b2e6250bb16be12f3b4d5557386ce8139))
* define element archetype ([46ced26](https://github.com/optimics/analytics/commit/46ced2638287318c58fddad3d95e060f3ea07d71))
* deoverflow ci builds ([b8c5299](https://github.com/optimics/analytics/commit/b8c5299cc5ee81bdba4dcd146adea00b1fae7058))
* fire only after conditional check ([85ce0a5](https://github.com/optimics/analytics/commit/85ce0a59580338f7a428d986863b195c47ead813))
* fire subscription only once ([7ba00cd](https://github.com/optimics/analytics/commit/7ba00cdfc1e8dd306bc38a5f5f71ff36aa4e333d))
* provide event UI options ([f04785b](https://github.com/optimics/analytics/commit/f04785b900e4d5051580552e65385fdfe50f3bda))
* track content types individually ([cc93986](https://github.com/optimics/analytics/commit/cc9398644ffc23f2054db3623474ae59678b1afd))





# [0.7.0](https://github.com/optimics/analytics/compare/v0.6.0...v0.7.0) (2023-10-03)


### Bug Fixes

* bind article tracker with GTM ([9e1bd33](https://github.com/optimics/analytics/commit/9e1bd33d83c2884fd6528620b4d418ef21e1f1c7))
* link packages together ([6608545](https://github.com/optimics/analytics/commit/6608545dc4f7493aa1424e77fbc85373049e297f))
* track article headings ([8533c6f](https://github.com/optimics/analytics/commit/8533c6fdfd33b2079a256ac47e2fc2303739165c))


### Features

* replace entities when needed ([8fb7629](https://github.com/optimics/analytics/commit/8fb76290cba2e27afee7c38abdf22e009fa652a5))
* validate custom dimension properties ([97b9bfc](https://github.com/optimics/analytics/commit/97b9bfcff4a4de987720e2c482805b34351332f9))
* validate custom metric measurement unit ([5237915](https://github.com/optimics/analytics/commit/5237915138c8462bd8aaf050b983bcd41b7ba3c4))
* validate custom metric scope ([310b44b](https://github.com/optimics/analytics/commit/310b44b5193bc38895a7fcd78bf9436a7ae3bdb5))





# [0.6.0](https://github.com/optimics/analytics/compare/v0.5.0...v0.6.0) (2023-08-21)


### Bug Fixes

* create ecommerce reporting package ([80c6a7e](https://github.com/optimics/analytics/commit/80c6a7e708e9da943e13743da953da0dd2abc1b7))
* pass totalTime as seconds ([c7a8f67](https://github.com/optimics/analytics/commit/c7a8f67c11ac51ca4c74b72988e6e5cba722d9db))
* rename helper to eventParams ([62120cd](https://github.com/optimics/analytics/commit/62120cdacd9226a20112fb19833725bb9fc0627d))
* track word count ([517c781](https://github.com/optimics/analytics/commit/517c781a69b6ac045a0b9a7916f81a6ff3dce473))
* use destructuring ([8961a8e](https://github.com/optimics/analytics/commit/8961a8ea45a175407505399f452a52f5042002d2))


### Features

* configure entity properties ([9390a5c](https://github.com/optimics/analytics/commit/9390a5c0e945d34f5833463eb2e631e6fd666d46))





# [0.5.0](https://github.com/optimics/analytics/compare/v0.4.1...v0.5.0) (2023-08-17)


### Features

* avoid firing meaningless event updates ([1f5ac49](https://github.com/optimics/analytics/commit/1f5ac4945deae491758790761bd8a4f5fb23a413))
* trigger consumptionStarted ([ea5d745](https://github.com/optimics/analytics/commit/ea5d74592970fbebf6a05d68ecf72058baa2efc5))
* trigger consumptionStartedFirst ([ed92cfb](https://github.com/optimics/analytics/commit/ed92cfb21c4234309fa1466cd4b1c88efb657c87))
* trigger consumptionStateChanged ([dc4c2cd](https://github.com/optimics/analytics/commit/dc4c2cd69f2fe90e6acabf152f58dbe153171cd1))
* trigger consumptionStopped ([6fffc69](https://github.com/optimics/analytics/commit/6fffc69166b94c446cb3d18295af512d31a10431))





## [0.4.1](https://github.com/optimics/analytics/compare/v0.4.0...v0.4.1) (2023-08-17)


### Bug Fixes

* integrate ga4 property manager ([a1b6136](https://github.com/optimics/analytics/commit/a1b61364b114d9af48aa77032fb9af067d7839c8))


### Features

* deploy ga4 manager to live env ([f724d01](https://github.com/optimics/analytics/commit/f724d01f2718dc315949ff1856d6c2dbc6373592))





# [0.4.0](https://github.com/optimics/analytics/compare/v0.3.1...v0.4.0) (2023-08-09)


### Features

* track article content mutations ([8055147](https://github.com/optimics/analytics/commit/8055147c08e8e9f1fb293c06ca818dc4f600f116))





## [0.3.1](https://github.com/optimics/analytics/compare/v0.3.0...v0.3.1) (2023-08-01)


### Bug Fixes

* publish package contents ([235884d](https://github.com/optimics/analytics/commit/235884d156d189de39b14eabade3cebb45e19eff))





# [0.3.0](https://github.com/optimics/analytics/compare/v0.2.4...v0.3.0) (2023-08-01)


### Bug Fixes

* silence the webpack dev server ([37bc3ef](https://github.com/optimics/analytics/commit/37bc3efb306f4fd8e0e80602e41f3403027afa64))


### Features

* create article tracker ([bcff7ff](https://github.com/optimics/analytics/commit/bcff7ffb0e9cf335cb9a20224ac972b9958b2f87))
* ignore paragraphs containing only whitespace ([58734cd](https://github.com/optimics/analytics/commit/58734cd1c1a7c8c80af1a96c8e00ff3c0d58eee4))
* include content type estimates ([07deac3](https://github.com/optimics/analytics/commit/07deac3d921980e134fe3ecf772a3896da8e60ee))
* measure consumption percents ([6165e4d](https://github.com/optimics/analytics/commit/6165e4d4f57957932276e870d8de20395a0bd4ee))
* report consumables and achievements ([009abf8](https://github.com/optimics/analytics/commit/009abf8b5ee148f7f936d2105daadeac13975f60))
* track article overtime ([ad16e85](https://github.com/optimics/analytics/commit/ad16e850cb6c033e2085a326f6e451bb4c9f7328))
* track overtime only on article ([781e9d5](https://github.com/optimics/analytics/commit/781e9d56c7da3a806f831040fea7bd5a6553f2f9))
* trigger overtime event ([4adc12b](https://github.com/optimics/analytics/commit/4adc12b2e8a7b0f221b572476b741c0d3138d652))





## [0.2.4](https://github.com/optimics/analytics/compare/v0.2.3...v0.2.4) (2023-07-07)


### Bug Fixes

* cache experiment state ([f125d45](https://github.com/optimics/analytics/commit/f125d45e5518a851db10f96ac33c24c0e398042c))
* do not start if active ([0c1cc53](https://github.com/optimics/analytics/commit/0c1cc5332ae1faf2d629885a985eb4fbcc005fbe))





## [0.2.3](https://github.com/optimics/analytics/compare/v0.2.2...v0.2.3) (2023-07-04)


### Bug Fixes

* browser experiment runner - isterminated ([5b5e4ce](https://github.com/optimics/analytics/commit/5b5e4ce38cbf46c772f2168b6ce0f72ae2a9f3a0))
* resolve constants issues ([1c2ca69](https://github.com/optimics/analytics/commit/1c2ca69b89de8b950800b80e772bd761781ef6c1))





## [0.2.2](https://github.com/optimics/analytics/compare/v0.2.1...v0.2.2) (2023-07-03)


### Bug Fixes

* bundle in declaration files ([57b774c](https://github.com/optimics/analytics/commit/57b774ca9b7c0f330ea53ffe22bfa44c85eed9f8))





## 0.2.1 (2023-07-03)


### Bug Fixes

* resolve linting issues ([6d2c7d4](https://github.com/optimics/analytics/commit/6d2c7d48c383f4ed2f0bebb0281b9e824b0c61b2))


### Features

* **browser:** create experiment runner abstraction ([aa6f954](https://github.com/optimics/analytics/commit/aa6f9547b12a8851f3deb67ea240566470dcfeda))
