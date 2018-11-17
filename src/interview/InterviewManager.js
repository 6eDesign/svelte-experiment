import config from './interview.config.js';

window.config = config;

const combineData = components => values => {
  components.forEach((c,i) => {
    c.steps = values[i];
  });
  return components;
};

const getDefaultApplier = defaults => obj => {
  Object.keys(defaults)
    .forEach(k => 
      obj[k] = obj.hasOwnProperty(k) ? obj[k] : defaults[k]
    ); 
  return obj;
}
    
const defaultSectionConfig = getDefaultApplier({ 
  steps: []
});

const defaultStepConfig = getDefaultApplier({ 
  isLoading: false, 
  isValid: true, 
  isVisible: false
});

const formatConfiguration = config => {
  config.sections.forEach(section => 
    defaultSectionConfig(section).steps.forEach(defaultStepConfig)  
  )
}

const setStepVisible = step => step.isVisible = true;

const getFirstStep = () => config.sections[0].steps[0];

const getStepIndexInSection = ({step,section}) => section.steps.findIndex(s => 
  s.id == step.id
);

const getSectionIndex = (section) => config.sections.findIndex(s => s.id === section.id); 

const loadSection = section => 
  section.get(config)
    .then(data => data.json())
    .then(steps => { 
      steps.forEach(defaultStepConfig);
      section.steps = steps;
      return section;
    });

const getNextSection = (currSection) => new Promise((resolve,reject) => {
  const currentIndex = getSectionIndex(currSection); 
  if(currentIndex == -1) return reject('Section not found'); 
  const nextSection = config.sections[currentIndex + 1];
  if(typeof nextSection.get == 'function' && nextSection.steps.length == 0) { 
    loadSection(nextSection).then(resolve).catch(reject);
  } else { 
    resolve(config.sections[currentIndex + 1]);
  }
}); 

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
      formatConfiguration(config);
      setStepVisible(getFirstStep());
      return config
    });
}

export function validateStep({step,section}) { 
  if(typeof section.validate == 'function') {
    return section.validate({step,section}); 
  }
  return true;
}

export function getNextStep({step,section}) { 
  return new Promise((resolve,reject) => {
    const stepIndex = getStepIndexInSection({step,section});
    if(stepIndex == -1) return reject('Step not found');
    if(stepIndex + 1 >= section.steps.length) { 
      console.log('fetching next section');
      getNextSection(section).then(nextSection => { 
        resolve(nextSection.steps[0]);
      }).catch(reject);
    } else { 
      resolve(section.steps[stepIndex + 1]);
    }
  });
} 