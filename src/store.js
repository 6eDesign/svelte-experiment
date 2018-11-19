import { Store } from 'svelte/store.js';
import { getInterview, validateStep, getNextStep } from './interview/InterviewManager';

let isAPromise = obj => typeof obj.then == 'function';

class InterviewStore extends Store {

  stepSubmitted({step,section}) { 
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
    getNextStep({step,section}).then(nextStep => {
      this.setVisible({step: nextStep, visibility: true})
        .presentStep({step: nextStep});
    }).catch(this.catastrophicError);
  }
  
  invalidStepSubmitted({step,section}) { 
    
  }

  presentStep({step}) { 
    this.set({ currentStep: step.id });
    window.scroll({
      top: document.querySelector(`.scroll-section[data-id="${step.id}"]`).offsetTop, 
      left: 0, 
      behavior: 'smooth'
    });
    return this;
  }

  setVisible({step,visibility}) { 
    step.isVisible = visibility;
    return this.commitInterview();
  }

  setLoading({step,loading}) {
    let { interview } = this.get();
    interview.isLoading = loading;
    step.isLoading = loading;
    return this.commitInterview();
  }

  commitInterview() { 
    let { interview } = this.get();
    this.set({interview});
    return this;
  }

  catastrophicError(err) { 
    console.log('oh nose', err);
  }

}

const interviewStore = new InterviewStore({
  currentStep: null,
  interview: null,
  interviewPromise: getInterview().then(interview => {
    interviewStore.set({interview})
  })
});

// interviewStore.compute(
//   'translateX',
//   ['currentStep', ]
// )

export default interviewStore;