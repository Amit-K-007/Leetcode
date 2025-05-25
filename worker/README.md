# Running the lc-worker Container

To run the `lc-worker` container with systemd and required privileges, execute the following command:

```bash
docker build -t lc_engine -f scripts/Dockerfile .

docker run --network=lc- network -d --name lc-engine --privileged --tmpfs /tmp --tmpfs /run --tmpfs /run/lock -v /sys/fs/cgroup:/sys/fs/cgroup:rw --cgroupns=host lc-engine

docker exec -it lc-engine /bin/bash /usr/local/bin/startup-isolate-service.sh

docker exec -it lc-engine /bin/bash
```

# Running Redis containers
```
docker run --network=lc_network --name central_redis -d -p 6379:6379 redis

docker run --network=lc_network --name local_redis -d -p 6380:6379 redis
```


# For code testing with redis-cli
## Wrong user code
RPUSH SUBMISSION_QUEUE "{\n  \"questionId\": \"1\",\n  \"lang\": \"CPP\",\n  \"dataInput\": \"[2,7,11,15]\\n9\\n[3,2,4]\\n6\\n[3,3]\\n6\",\n  \"userCode\": \"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        return {10, 20};\\n    }\\n};\",\n  \"systemCode\": \"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        unordered_map<int, int> m;\\n        for (int i = 0; i < nums.size(); i++) {\\n            int complement = target - nums[i];\\n            if (m.count(complement)) return {m[complement], i};\\n            m[nums[i]] = i;\\n        }\\n cout<<'hi';       return {};\\n    }\\n};\",\n  \"userId\": \"39fab0ed-613a-4f4d-b8d9-0b41955a7230\",\n  \"paramType\": [\"integer[]\", \"integer\"],\n  \"returnType\": \"integer[]\"\n}"


## Correct user code
RPUSH SUBMISSION_QUEUE "{\n  \"questionId\": \"1\",\n  \"lang\": \"CPP\",\n  \"dataInput\": \"[2,7,11,15]\\n9\\n[3,2,4]\\n6\\n[3,3]\\n6\",\n  \"userCode\": \"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        unordered_map<int, int> m;\\n        for (int i = 0; i < nums.size(); i++) {\\n            int complement = target - nums[i];\\n            if (m.count(complement)) return {m[complement], i};\\n            m[nums[i]] = i;\\n        }\\n cout<<'hi';       return {};\\n    }\\n};\",\n  \"systemCode\": \"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        unordered_map<int, int> m;\\n        for (int i = 0; i < nums.size(); i++) {\\n            int complement = target - nums[i];\\n            if (m.count(complement)) return {m[complement], i};\\n            m[nums[i]] = i;\\n        }\\n cout<<'hi';       return {};\\n    }\\n};\",\n  \"userId\": \"39fab0ed-613a-4f4d-b8d9-0b41955a7230\",\n  \"paramType\": [\"integer[]\", \"integer\"],\n  \"returnType\": \"integer[]\"\n}"

