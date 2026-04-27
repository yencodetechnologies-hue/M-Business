const axios = require('axios');

const BASE_URL = 'https://mbusiness.octosofttechnologies.in';

async function testBackend() {
  try {
    console.log('Testing backend connection...');
    
    // Test basic server health
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running:', healthResponse.data);
    
    // Test projects endpoint
    const projectsResponse = await axios.get(`${BASE_URL}/api/projects`);
    console.log('✅ Projects endpoint working, found:', projectsResponse.data.length, 'projects');
    
    // Test add project endpoint
    console.log('Testing add project endpoint...');
    const testProject = {
      name: 'Test Project ' + Date.now(),
      client: 'Test Client',
      purpose: 'Testing API',
      description: 'This is a test project'
    };
    
    const addResponse = await axios.post(`${BASE_URL}/api/projects/add`, testProject);
    console.log('✅ Project added successfully:', addResponse.data);
    
  } catch (error) {
    console.error('❌ Error testing backend:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testBackend();
