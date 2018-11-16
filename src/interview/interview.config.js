import { locationSection } from './config/location.js';
import { taskPageOne, taskPageTwo } from './config/taskInterview';
import { contactSubmit } from './config/contactSubmit';

export default { 
  info: { 
    get: (ctx) => fetch('/data/taskInfo.json')
  },
  sections: [ 
    locationSection, 
    taskPageOne, 
    taskPageTwo,
    contactSubmit
  ]
};