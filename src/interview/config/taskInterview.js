const validateQuestion = ({step,section}) => {
  switch(step.type) {
    default: 
      return !step.required || step.value != '';
      // can also return a promise - loading states 
      // will be handled automatically, ex: 
      // return new Promise((resolve,reject) => {
      //   setTimeout(resolve,1500,true);
      // });
  }
};

export const taskPageOne = { 
  name: 'taskInterviewPageOne',
  component: 'Question',
  componentOptions: { 
    page: 1
  }, 
  preload: true,
  get: (ctx) => fetch('/data/interview-page-one.json'),
  validate: validateQuestion
}; 

export const taskPageTwo = { 
  name: 'taskInterviewPageTwo',
  component: 'Question', 
  componentOptions: { 
    page: 2
  }, 
  get: (ctx) => fetch('/data/interview-page-two.json'),
  validate: validateQuestion
};