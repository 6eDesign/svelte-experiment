import { Store } from 'svelte/store.js';
import { getInterview, validateStep, getNextStep } from './interview/InterviewManager';

let isAPromise = obj => typeof obj.then == 'function';

class InterviewStore extends Store {

  stepSubmitted({step,section}) { 
    let state = this.get();
    let isValid = validateStep({step,section});
    let isAsync = isAPromise(isValid); 
    if(!isAsync) { 
      return this.validityDetermined({
        step,
        section,
        isAsync,
        isValid
      });
    } 
    this.setLoading({step, loading: true})
    isValid.then(validity => {
      // set loading state: 
      this.setLoading({step,loading:false})
      this.validityDetermined({
        step,
        section,
        isAsync,
        isValid: validity
      });
    });
  }

  validityDetermined({step,section,isValid,isAsync}) { 
    if(isValid) return this.validStepSubmitted({step,section});
    this.invalidStepSubmitted({step,section});
  }

  validStepSubmitted({step,section}) { 
    console.log('valid submitted');
    let nextStep = getNextStep({step,section});
  }
  
  invalidStepSubmitted({step,section}) { 

  }

  setLoading({step,loading}) {
    step.isLoading = loading;
    return this.commitInterview();
  }

  commitInterview() { 
    let { interview } = this.get();
    this.set({interview});
    return this;
  }

}

export default new InterviewStore({
  interview: getInterview()
});