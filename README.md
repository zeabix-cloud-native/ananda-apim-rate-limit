# Azure API Management - Rate Limit

## Base line
Before we configure the Rate Limit for API, let's test without it to see the behaviour

**Prerequisites**
- K6: [K6 installation](https://k6.io/docs/getting-started/installation/)

1. Login to Azure Portal and navigate to Azure API Management, then select your instance
2. Create new API with `Subscription Required` (Or reuse the existing API)
3. After the API is created, please prepare these following information
- Subscription Key
- Header name (for provide subscription key)
- API Url

4. In this repository, directory `k6`, we have prepare the k6 load test script to call your API with some reasonable rps (request per seconds). However it needs to be updated with your subscription key and URL
 - Replace your subscription key and header name
 ```js
    headers: {
      'Content-Type': 'application/json',
      '<Header name>': '<Subscription key>', 
      // Example: 'Ocp-Apim-Subscription-Key': 'ebf44bdfa1664576ad812270743a7f3c',
    },
 ```

 - Replace your API URL
 ```js
const res = http.get('<Your API URL>', params);
// Example: const res = http.get('https://poc-apim-ananda.azure-api.net/api/mock/', params);
```

5. Run the test script
```sh
$ k6 run simple-test.js
```

6. The script will run approximately 1:30 minutes, and should show result like the following example once it's done
```sh

          /\      |‾‾| /‾‾/   /‾‾/   
     /\  /  \     |  |/  /   /  /    
    /  \/    \    |     (   /   ‾‾\  
   /          \   |  |\  \ |  (‾)  | 
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: simple-test.js
     output: -

  scenarios: (100.00%) 1 scenario, 10 max VUs, 2m0s max duration (incl. graceful stop):
           * default: Up to 10 looping VUs for 1m30s over 3 stages (gracefulRampDown: 30s, gracefulStop: 30s)


running (1m30.6s), 00/10 VUs, 351 complete and 0 interrupted iterations
default ✓ [======================================] 00/10 VUs  1m30s

     ✓ status is 200

     checks.........................: 100.00% ✓ 351      ✗ 0   
     data_received..................: 120 kB  1.3 kB/s
     data_sent......................: 84 kB   926 B/s
     http_req_blocked...............: avg=33.81ms  min=2µs      med=11µs     max=1.3s     p(90)=16µs     p(95)=18.49µs 
     http_req_connecting............: avg=1.22ms   min=0s       med=0s       max=112.84ms p(90)=0s       p(95)=0s      
   ✓ http_req_duration..............: avg=347.67ms min=277.57ms med=308.01ms max=843.26ms p(90)=490.54ms p(95)=529.96ms
       { expected_response:true }...: avg=347.67ms min=277.57ms med=308.01ms max=843.26ms p(90)=490.54ms p(95)=529.96ms
     http_req_failed................: 0.00%   ✓ 0        ✗ 351 
     http_req_receiving.............: avg=125µs    min=15µs     med=127µs    max=385µs    p(90)=181µs    p(95)=193µs   
     http_req_sending...............: avg=55.28µs  min=8µs      med=53µs     max=549µs    p(90)=73µs     p(95)=77µs    
     http_req_tls_handshaking.......: avg=32.08ms  min=0s       med=0s       max=1.21s    p(90)=0s       p(95)=0s      
     http_req_waiting...............: avg=347.49ms min=277.36ms med=307.91ms max=843.1ms  p(90)=490.28ms p(95)=529.82ms
     http_reqs......................: 351     3.875746/s
     iteration_duration.............: avg=1.38s    min=1.27s    med=1.31s    max=2.61s    p(90)=1.51s    p(95)=1.77s   
     iterations.....................: 351     3.875746/s
     vus............................: 1       min=1      max=10
     vus_max........................: 10      min=10     max=10

```

## Configure Rate Limit for APIM

1. Login to Azure Portal and navigate to Azure API Management, then select your instance
2. Create new API with `Subscription Required` (Or reuse the existing API)

*NOTE: In cause of using an existing API, for the simplicity please ensure that it's not protected using OAuth* 

3. On `Design` tab, click `Policy  </>` (either in `Inbound`, `Outbound` or `Backend`)
4. Replace the existing policy with this snippet

```xml
<policies>
    <inbound>
        <base />
        <rate-limit-by-key calls="100" renewal-period="180" counter-key="@(context.Subscription?.Key ?? "anonymous")" />
    </inbound>
    <backend>
        <base />
    </backend>
    <outbound>
        <base />
    </outbound>
    <on-error>
        <base />
    </on-error>
</policies>
```

**Explanation**
The snippet above means that for this API, we will limit 100 calls per 180 seconds. It will count based on the subscription keys, which mean each subscription will be able to call this API not exceed 100 calls withint 3 minutes

5. Click `Save` to apply the policy

<br/>


## Run Test with Rate Limit
After we have completed configure the APIM to have limit rate, let's run the `k6` again, the steps should be the same as when we run for base line 

The result should be difference than the previous test

```sh

          /\      |‾‾| /‾‾/   /‾‾/   
     /\  /  \     |  |/  /   /  /    
    /  \/    \    |     (   /   ‾‾\  
   /          \   |  |\  \ |  (‾)  | 
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: simple-test.js
     output: -

  scenarios: (100.00%) 1 scenario, 10 max VUs, 2m0s max duration (incl. graceful stop):
           * default: Up to 10 looping VUs for 1m30s over 3 stages (gracefulRampDown: 30s, gracefulStop: 30s)


running (1m30.3s), 00/10 VUs, 345 complete and 0 interrupted iterations
default ✓ [======================================] 00/10 VUs  1m30s

     ✗ status is 200
      ↳  28% — ✓ 100 / ✗ 245

     checks.........................: 28.98% ✓ 100      ✗ 245 
     data_received..................: 141 kB 1.6 kB/s
     data_sent......................: 83 kB  914 B/s
     http_req_blocked...............: avg=39.26ms  min=1µs      med=11µs     max=2.38s  p(90)=17µs     p(95)=20µs    
     http_req_connecting............: avg=4.17ms   min=0s       med=0s       max=1.06s  p(90)=0s       p(95)=0s      
   ✓ http_req_duration..............: avg=367.56ms min=279.54ms med=312.25ms max=3.37s  p(90)=513.95ms p(95)=547.76ms
       { expected_response:true }...: avg=404.6ms  min=282.48ms med=319.94ms max=3.37s  p(90)=535.46ms p(95)=679.18ms
     http_req_failed................: 71.01% ✓ 245      ✗ 100 
     http_req_receiving.............: avg=132µs    min=21µs     med=119µs    max=1.56ms p(90)=180µs    p(95)=194.8µs 
     http_req_sending...............: avg=55.18µs  min=8µs      med=49µs     max=1.39ms p(90)=72µs     p(95)=76µs    
     http_req_tls_handshaking.......: avg=34.81ms  min=0s       med=0s       max=1.44s  p(90)=0s       p(95)=0s      
     http_req_waiting...............: avg=367.38ms min=279.39ms med=312.18ms max=3.37s  p(90)=513.71ms p(95)=547.63ms
     http_reqs......................: 345    3.821587/s
     iteration_duration.............: avg=1.4s     min=1.28s    med=1.31s    max=5.62s  p(90)=1.53s    p(95)=1.63s   
     iterations.....................: 345    3.821587/s
     vus............................: 1      min=1      max=10
     vus_max........................: 10     min=10     max=10
```

As we can see the number of success (200) is just 100/245

```sh
     ✗ status is 200
      ↳  28% — ✓ 100 / ✗ 245
```

You can run `curl` to see the exact response (ensure that you run this within 3 minutes after the k6 script is complete, otherwise the counter will be reset)

*Example (please replace URL and subscription key)*

```sh
$ curl https://poc-apim-ananda.azure-api.net/api/mock -H 'Ocp-Apim-Subscription-Key: ebf44bdfa1664576ad812270743a7f3c'
```

You should see result similar to this

```json
{ "statusCode": 429, "message": "Rate limit is exceeded. Try again in 59 seconds." }
```