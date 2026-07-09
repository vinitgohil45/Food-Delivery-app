import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1';

async function test() {
  console.log('Logging in as driver...');
  const res = await axios.post(`${API_URL}/auth/login`, {
    email: 'driver@cravego.com',
    password: 'password123'
  });
  const token = res.data.data.accessToken;
  console.log('Token received:', token.slice(0, 20));

  console.log('Fetching available orders...');
  const availableRes = await axios.get(`${API_URL}/delivery/available-orders`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Available orders response:', JSON.stringify(availableRes.data, null, 2));
}

test().catch(console.error);
