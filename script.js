import http from "k6/http";
import { sleep } from "k6";

export let options = {
  scenarios: {
    constant_request_rate: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 100,
      maxVUs: 500,
    },
  },
};
export default function () {
  let id = Math.floor(Math.random() * (10000000 - 9900000 + 1) + 9900000);
  //let id = 9000001;
  console.log("k6 id:", id);
  http.get(http.url`http://localhost:3000/api/price/${id}`);
}
