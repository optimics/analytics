# Experiment runner

> Register your UX experiment in the LocalStorage and keep track of it

## Usage

```
import { Experiment } from '@optimics/browser-experiment-runner'

class MyExperiment extends Experiment {
  key = 'my-experiment'
  duration = 30 * 86400000
}

const myExp = new MyExperiment()
myExp.startIfNeeded()
```
