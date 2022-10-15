import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter } from 'k6/metrics';

// A simple counter for http requests

export const requests = new Counter('http_reqs');

// you can specify stages of your test (ramp up/down patterns) through the options object
// target is the number of VUs you are aiming for

export const options = {
  stages: [
    { target: 10, duration: '30s' },
    { target: 5, duration: '30s' },
    { target: 0, duration: '30s' },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  // our HTTP request, note that we are saving the response to res, which can be accessed later

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': 'ebf44bdfa1664576ad812270743a7f3c',
    },
  };

  const res = http.get('https://poc-apim-ananda.azure-api.net/api/mock/', params);

  sleep(1);

  const checkRes = check(res, {
    'status is 200': (r) => r.status === 200,
  });
}