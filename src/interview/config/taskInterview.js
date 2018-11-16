const validateQuestion = (question,section) => {
  switch(question.type) {
    default: 
      return !question.required || question.value != '';
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