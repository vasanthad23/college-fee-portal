const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login to http://localhost:5000/api/auth/login');
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@college.com',
            password: 'adminpassword'
        });
        console.log('Login Success:', res.data.status);
    } catch (err) {
        console.error('Login Failed:');
        if (err.response) {
            console.error('  Status:', err.response.status);
            console.error('  Message:', err.response.data.message);
        } else {
            console.error('  Error:', err.message);
        }
    }
}

testLogin();
