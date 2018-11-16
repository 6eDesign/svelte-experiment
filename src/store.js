import { Store } from 'svelte/store.js';
import { getInterview, validateStep, getNextStep } from './interview/InterviewManager';

let isAPromise = obj => typeof obj.then == 'function';

class InterviewStore extends Store {
  stepSubmitted(step,section) { 
    let state = this.get();
    let isValid = validateStep(step,section);
    let isAsync = isAPromise(isValid); 
    if(isAsync) { 
      // handle async flow: 
    } else { 
      if(isValid) return this.validStepSubmitted(step,section);
      return this.invalidStepSubmitted(step,section);
    }
  }
  validStepSubmitted(step,section) { 
    let nextStep = getNextStep(step,section);
  }
  invalidStepSubmitted(step,section) { 

  }
}

export default new InterviewStore({
  interview: getInterview()
});