export const contactSubmit = { 
  id: 'contactSubmit', 
  component: 'ContactSubmit', 
  steps: [
    {
      id: 'contactSubmitOne',
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
      id: 'contactSubmitTwo',
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
      id: 'contactSubmitThree',
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