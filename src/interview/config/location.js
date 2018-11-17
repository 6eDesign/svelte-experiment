export const locationSection = { 
  id: 'basicLocation', 
  component: 'Location',
  steps: [
    {
      id: 'unknownUserLocationCard',
      fields: [{
        type: 'postalCode', 
        id: 'locationCardPostalCode', 
        placeholder: 'Enter Zip Code',
        value: ''
      }]
    }
  ]
}; 