import config from './interview.config.js';

let combineData = components => values => {
  components.forEach((c,i) => {
    c.steps = values[i];
  });
  return components;
};

export function getInterview(ctx) { 
  var fetchableComponents = config.sections.filter(s => 
    s.hasOwnProperty('get') && s.preload
  ); 
  if(config.info.get) fetchableComponents.push(config.info);
  let promises = fetchableComponents.map(c => c.get()); 
  return Promise.all(promises)
    .then(values => Promise.all(values.map(v => v.json())))
    .then(combineData(fetchableComponents))
    .then(() => {
      config.sections.forEach(s => s.steps = s.steps || []);
      return config
    });
}; 

export function validateStep(step,section) { 
  if(typeof section.validate == 'function') {
    return section.validate(step,section); 
  }
  return true;
};

export function getNextStep(currentStep,currentSection) { 

}; 
