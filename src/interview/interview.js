
let formatQuestion = q => { 
  switch(q.presentationType) { 
    case 'CHECK_BOX': 
      q.answerElements.forEach(a => a.checked = false);
      break; 
    case 'RADIO_ONEPER_LINE':
    case 'RADIO_SINGLE_LINE':
    case 'RADIO_BUTTON':
    case 'RADIO_SINGLE_LINE_LEFT':
      // q.answerElements.forEach(a => a.checked = false);
      q.value = q.answerElements[0].answerID;
      break; 
  }
  return q;
}; 

let transformData = (values) => {
  let [interview,info] = values;
  let data = { 
    info, 
    interviewSteps: interview.questionElements.map((q,i) => {
      q.stepID = q.questionID; 
      q.presentationType = q.answerElements[0].presentationType;
      q.value = '';
      q.valid = false;
      q.stepType = 'interviewQuestion';
      q.questionID = `ques_${q.questionID}`;
      q.answerElements.forEach(a => a.answerID = `ans_${a.answerID}`);
      return formatQuestion(q);
    }) 
  }
  return data;
}

export function getInterview() { 
  let interview = fetch(`/data/interview.json`);
  let info = fetch(`/data/taskInfo.json`);
  return Promise.all([interview, info])
    .then(values => Promise.all(values.map(v => v.json())))
    .then(data => transformData(data))
}; 