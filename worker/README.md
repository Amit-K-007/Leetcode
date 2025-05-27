# Running the lc_worker Container

To run the `lc_worker` container with systemd and required privileges, execute the following command:

```bash
docker build -t lc_engine_img -f scripts/Dockerfile .

docker run --network=lc_internal_network -d --name lc_engine --privileged --tmpfs /tmp --tmpfs /run --tmpfs /run/lock -v /sys/fs/cgroup:/sys/fs/cgroup:rw --cgroupns=host lc_engine_img

docker exec -it lc_engine /bin/bash /usr/local/bin/startup-isolate-service.sh

docker exec -it lc_engine /bin/bash
```

# Running Redis containers
```bash
docker run --network=lc_internal_network --name central_redis -d -p 6380:6379 redis

docker run --network=lc_internal_network --name local_redis -d -p 6381:6379 redis
```

# Running DB
```bash
 docker run --name lc_database -e POSTGRES_PASSWORD=mysecretpassword -d -p 5435:5432 postgres
```

# For code testing with redis-cli
## CPP Submission
RPUSH SUBMISSION_QUEUE "{\n  \"questionId\": \"1\",\n  \"language\": \"CPP\",\n  \"functionName\": \"twoSum\",\n  \"dataInput\": \"[2,7,11,15]\\n9\\n[3,2,4]\\n6\\n[3,3]\\n6\",\n  \"userCode\": \"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        return {0, 1};\\n    }\\n};\",\n  \"systemCode\": \"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        unordered_map<int, int> m;\\n        for (int i = 0; i < nums.size(); i++) {\\n            int complement = target - nums[i];\\n            if (m.count(complement)) return {m[complement], i};\\n            m[nums[i]] = i;\\n        }\\n cout<<'hi';       return {};\\n    }\\n};\",\n  \"userId\": \"39fab0ed-613a-4f4d-b8d9-0b41955a7230\",\n  \"paramType\": [\"integer[]\", \"integer\"],\n  \"returnType\": \"integer[]\",\n  \"isAnswer\": false\n}"

## CPP Answer
RPUSH SUBMISSION_QUEUE "{\n  \"questionId\": \"1\",\n  \"language\": \"CPP\",\n  \"functionName\": \"twoSum\",\n  \"dataInput\": \"[2,7,11,15]\\n9\\n[3,2,4]\\n6\\n[3,3]\\n6\",\n  \"userCode\": \"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        return {0, 1};\\n    }\\n};\",\n  \"systemCode\": \"[0,1]\\n[1,2]\\n[0,1]\",\n  \"userId\": \"39fab0ed-613a-4f4d-b8d9-0b41955a7230\",\n  \"paramType\": [\"integer[]\", \"integer\"],\n  \"returnType\": \"integer[]\",\n  \"isAnswer\": true\n}"

## CPP Time
RPUSH SUBMISSION_QUEUE "{\"questionId\":\"1\",\"language\":\"CPP\",\"functionName\":\"twoSum\",\"dataInput\":\"[2,7,11,15]\\n9\\n[3,2,4]\\n6\\n[3,3]\\n6\",\"userCode\":\"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        while (true) {}\\n        return {0, 1};\\n    }\\n};\",\"systemCode\":\"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        unordered_map<int, int> m;\\n        for (int i = 0; i < nums.size(); i++) {\\n            int complement = target - nums[i];\\n            if (m.count(complement)) return {m[complement], i};\\n            m[nums[i]] = i;\\n        }\\n cout<<'hi';       return {};\\n    }\\n};\",\"userId\":\"39fab0ed-613a-4f4d-b8d9-0b41955a7230\",\"paramType\":[\"integer[]\",\"integer\"],\"returnType\":\"integer[]\",\"isAnswer\":false}"

## CPP Memory
RPUSH SUBMISSION_QUEUE "{\"questionId\":\"1\",\"language\":\"CPP\",\"functionName\":\"twoSum\",\"dataInput\":\"[2,7,11,15]\\n9\\n[3,2,4]\\n6\\n[3,3]\\n6\",\"userCode\":\"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        // Allocate ~256MB of memory\\n        vector<int> dummy(67108864, 0);\\n        return {0, 1};\\n    }\\n};\",\"systemCode\":\"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        unordered_map<int, int> m;\\n        for (int i = 0; i < nums.size(); i++) {\\n            int complement = target - nums[i];\\n            if (m.count(complement)) return {m[complement], i};\\n            m[nums[i]] = i;\\n        }\\n cout<<'hi';       return {};\\n    }\\n};\",\"userId\":\"39fab0ed-613a-4f4d-b8d9-0b41955a7230\",\"paramType\":[\"integer[]\",\"integer\"],\"returnType\":\"integer[]\",\"isAnswer\":false}"

## Java Submission
RPUSH SUBMISSION_QUEUE "{\"questionId\":\"1\",\"language\":\"JAVA\",\"functionName\":\"twoSum\",\"dataInput\":\"[2,7,11,15]\\n9\\n[3,2,4]\\n6\\n[3,3]\\n6\",\"userCode\":\"class Solution {\\n    public int[] twoSum(int[] nums, int target) {\\n        return new int[]{0, 1};\\n    }\\n}\",\"systemCode\":\"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        unordered_map<int, int> m;\\n        for (int i = 0; i < nums.size(); i++) {\\n            int complement = target - nums[i];\\n            if (m.count(complement)) return {m[complement], i};\\n            m[nums[i]] = i;\\n        }\\n        cout<<\\\"hi\\\";\\n        return {};\\n    }\\n};\",\"userId\":\"39fab0ed-613a-4f4d-b8d9-0b41955a7230\",\"paramType\":[\"integer[]\",\"integer\"],\"returnType\":\"integer[]\",\"isAnswer\":false}"

## Java Memory
RPUSH SUBMISSION_QUEUE "{\"questionId\":\"1\",\"language\":\"JAVA\",\"functionName\":\"twoSum\",\"dataInput\":\"[2,7,11,15]\\n9\\n[3,2,4]\\n6\\n[3,3]\\n6\",\"userCode\":\"class Solution {\\n    public int[] twoSum(int[] nums, int target) {\\n        // Allocate ~256MB of memory\\n        int[] dummy = new int[67108864];\\n        return new int[]{0, 1};\\n    }\\n}\",\"systemCode\":\"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        unordered_map<int, int> m;\\n        for (int i = 0; i < nums.size(); i++) {\\n            int complement = target - nums[i];\\n            if (m.count(complement)) return {m[complement], i};\\n            m[nums[i]] = i;\\n        }\\n cout<<'hi';       return {};\\n    }\\n};\",\"userId\":\"39fab0ed-613a-4f4d-b8d9-0b41955a7230\",\"paramType\":[\"integer[]\",\"integer\"],\"returnType\":\"integer[]\",\"isAnswer\":false}"

## Java Time
RPUSH SUBMISSION_QUEUE "{\"questionId\":\"1\",\"language\":\"JAVA\",\"functionName\":\"twoSum\",\"dataInput\":\"[2,7,11,15]\\n9\\n[3,2,4]\\n6\\n[3,3]\\n6\",\"userCode\":\"class Solution {\\n    public int[] twoSum(int[] nums, int target) {\\n        for (long i = 0; i < 100000000000L; i++) {}\\n        return new int[]{0, 1};\\n    }\\n}\",\"systemCode\":\"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        unordered_map<int, int> m;\\n        for (int i = 0; i < nums.size(); i++) {\\n            int complement = target - nums[i];\\n            if (m.count(complement)) return {m[complement], i};\\n            m[nums[i]] = i;\\n        }\\n cout<<'hi';       return {};\\n    }\\n};\",\"userId\":\"39fab0ed-613a-4f4d-b8d9-0b41955a7230\",\"paramType\":[\"integer[]\",\"integer\"],\"returnType\":\"integer[]\",\"isAnswer\":false}"

## Python Run
RPUSH SUBMISSION_QUEUE "{\"questionId\":\"1\",\"language\":\"PYTHON\",\"functionName\":\"twoSum\",\"dataInput\":\"[2,7,11,15]\\n9\\n[3,2,4]\\n6\\n[3,3]\\n6\",\"userCode\":\"class Solution:\\n    def twoSum(self, nums, target):\\n        return [0, 1]\",\"systemCode\":\"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        unordered_map<int, int> m;\\n        for (int i = 0; i < nums.size(); i++) {\\n            int complement = target - nums[i];\\n            if (m.count(complement)) return {m[complement], i};\\n            m[nums[i]] = i;\\n        }\\n        cout<<\\\"hi\\\";\\n        return {};\\n    }\\n};\",\"userId\":\"39fab0ed-613a-4f4d-b8d9-0b41955a7230\",\"paramType\":[\"integer[]\",\"integer\"],\"returnType\":\"integer[]\",\"isAnswer\":false}"

## Python Memory
RPUSH SUBMISSION_QUEUE "{\"questionId\":\"1\",\"language\":\"PYTHON\",\"functionName\":\"twoSum\",\"dataInput\":\"[2,7,11,15]\\n9\\n[3,2,4]\\n6\\n[3,3]\\n6\",\"userCode\":\"class Solution:\\n    def twoSum(self, nums, target):\\n        dummy = [0] * 67108864  # Allocate ~256MB of memory\\n        return [0, 1]\",\"systemCode\":\"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        unordered_map<int, int> m;\\n        for (int i = 0; i < nums.size(); i++) {\\n            int complement = target - nums[i];\\n            if (m.count(complement)) return {m[complement], i};\\n            m[nums[i]] = i;\\n        }\\n cout<<'hi';       return {};\\n    }\\n};\",\"userId\":\"39fab0ed-613a-4f4d-b8d9-0b41955a7230\",\"paramType\":[\"integer[]\",\"integer\"],\"returnType\":\"integer[]\",\"isAnswer\":false}"

## Python time
RPUSH SUBMISSION_QUEUE "{\"questionId\":\"1\",\"language\":\"PYTHON\",\"functionName\":\"twoSum\",\"dataInput\":\"[2,7,11,15]\\n9\\n[3,2,4]\\n6\\n[3,3]\\n6\",\"userCode\":\"class Solution:\\n    def twoSum(self, nums, target):\\n        while True:\\n            pass\\n        return [0, 1]\",\"systemCode\":\"class Solution {\\npublic:\\n    vector<int> twoSum(vector<int>& nums, int target) {\\n        unordered_map<int, int> m;\\n        for (int i = 0; i < nums.size(); i++) {\\n            int complement = target - nums[i];\\n            if (m.count(complement)) return {m[complement], i};\\n            m[nums[i]] = i;\\n        }\\n cout<<'hi';       return {};\\n    }\\n};\",\"userId\":\"39fab0ed-613a-4f4d-b8d9-0b41955a7230\",\"paramType\":[\"integer[]\",\"integer\"],\"returnType\":\"integer[]\",\"isAnswer\":false}"