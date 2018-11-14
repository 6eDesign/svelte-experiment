let locationSection = { 
  name: 'basicLocation', 
  component: 'Location',
  steps: [
    {
      fields: { 
        unknown: [
          {
            type: 'postalCode', 
            id: 'locationCardPostalCode', 
            value: '99547'
          }
        ],
        known: {}
      }
    }
  ]
}; 

let taskPageOne = { 
  name: 'taskInterviewPageOne',
  component: 'Question',
  componentOptions: { 
    page: 1
  }, 
  preload: true,
  get: (ctx) => fetch('/data/interview-page-one.json'),
}; 

let taskPageTwo = { 
  name: 'taskInterviewPageTwo',
  component: 'Question', 
  componentOptions: { 
    page: 2
  }, 
  get: (ctx) => fetch('/data/interview-page-two.json')
};

let contactSubmit = { 
  name: 'contactSubmit', 
  component: 'ContactSubmit', 
  steps: [
    {
      heading: 'Give me your name...',
      fields: [
        {
          type: 'text', 
          placeholder: 'First Name',
          label: 'First Name',
          id: 'firstName',
          value: 'Jon'
        }, { 
          type: 'text',
          placeholder: 'Last Name',
          label: 'Last Name',
          id: 'lastName', 
          value: 'Greenemeier'
        }
      ]
    }, { 
      heading: 'Give me your addy...',
      fields: [ 
        { 
          type: 'text', 
          placeholder: 'Street Address',
          label: 'Street Address',
          id: 'addressLine1',
          value: '1882 E 104th Ave'
        }, { 
          type: 'text', 
          placeholder: 'City',
          label: 'City',
          id: 'city', 
          value: 'Denver'
        }, { 
          type: 'postalCode', 
          placeholder: 'Zip Code',
          label: 'Zip Code',
          id: 'csPostalCode',
          value: '80233'
        }
      ]
    }, { 
      heading: 'Give me your deets...',
      fields: [ 
        {
          type: 'phone', 
          placeholder: 'Phone',
          label: 'Phone',
          id: 'phone', 
          value: '7203492738'
        }, { 
          type: 'email', 
          placeholder: 'Email',
          label: 'Email',
          id: 'email', 
          value: 'jgrkj23kj@edify.com'
        }
      ]
    }
  ] 
};

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