// const newrelic = require("newrelic");
const express = require("express");
const path = require("path");
const axios = require("axios");
const compression = require("compression");
const app = express();
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("./s3-connect.js");

const port = 3000;
const localPriceServer = `http://localhost:3001`;
// const priceServer =
//   "http://ec2-34-221-235-141.us-west-2.compute.amazonaws.com:3000";
// const titleServer = "http://13.57.14.144:2002";
// const reviewsServer = "http://54.183.2.218:4001/books/";
// const summaryServer =
//   "http://ec2-18-188-135-5.us-east-2.compute.amazonaws.com:1220";
// const aggServer =
//   "http://ec2-18-220-21-137.us-east-2.compute.amazonaws.com:2880";
// const alsoEnjoyedServer =
//   "http://ec2-35-162-103-218.us-west-2.compute.amazonaws.com:4000";

app.use(compression());
const oneDay = 60 * 60 * 24;
app.use(
  express.static(path.join(__dirname, "..", "/public"), {
    maxage: oneDay,
  })
);

const setCache = (req, res, next) => {
  if (req.method === "GET") {
    res.set("Cache-control", `public, max-age=${oneDay}`);
  } else {
    res.set("Cache-control", "no-store");
  }
  next();
};

app.use(setCache);

app.get("/files/:fileName", async (req, res) => {
  const fileName = req.params.fileName;
  let key;
  if (!fileName) {
    res.end();
  }
  if (fileName.split(".")[1] === "js") {
    key = "scripts/" + fileName;
  } else if (fileName === "style.css") {
    key = "styles/summary-styles/style.css";
  } else if (fileName === "styles.css") {
    key = "styles/price-styles/styles.css";
  } else {
    res.end();
  }

  const readFile = async (key) => {
    const convertToStr = (stream) => {
      return new Promise((resolve, reject) => {
        let data = [];
        stream.on("data", (chunk) => data.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(data).toString("utf8")));
      });
    };

    try {
      // data returned as readable string
      const data = await s3.send(
        new GetObjectCommand({ Bucket: "rpt27-fec-audible", Key: key })
      );

      const readData = await convertToStr(data.Body);
      return readData;
    } catch (err) {
      console.log("Error! with getting file ", key, err);
    }
  };

  const file = await readFile(key);
  res.send(file);
});

/// price service ///
app.all("/api/price/*", (req, res) => {
  const url = (localPriceServer + req.path).trim();
  console.log(
    "proxying request to price server with method",
    req.method,
    "directed to",
    url
  );

  axios({
    method: req.method,
    url: url,
  }).then((response) => {
    console.log("response", response);
    res.send(JSON.stringify(response.data));
  });
});

/// title service ///
app.all("/api/book/*", (req, res) => {
  const url = (titleServer + req.path).trim();
  console.log(
    "proxying request to title server with method",
    req.method,
    "directed to",
    url
  );
  axios({
    method: req.method,
    url: url,
  }).then((response) => {
    res.send(JSON.stringify(response.data));
  });
});

/// title service ///
app.all("/api/books", (req, res) => {
  const url = (titleServer + req.path).trim();
  console.log(
    "proxying request to title server with method",
    req.method,
    "directed to",
    url
  );
  axios({
    method: req.method,
    url: url,
  }).then((response) => {
    res.send(JSON.stringify(response.data));
  });
});

/// reviews service ///
app.all("/reviews/*", (req, res) => {
  const bookId = req.path.split("/")[2];
  const url = (reviewsServer + bookId + "/reviews/").trim();
  console.log(
    "proxying request to reviews server with method",
    req.method,
    "directed to",
    url
  );
  axios({
    method: req.method,
    url: url,
  })
    .then((response) => {
      res.send(JSON.stringify(response.data));
    })
    .catch((err) => {
      console.error("fetch for reviews failed!", err.statusCode);
    });
});

/// summary service ///
app.all("/api/summary/*", (req, res) => {
  const url = (summaryServer + req.path).trim();
  console.log(
    "proxying request to summary server with method",
    req.method,
    "directed to",
    url
  );
  axios({
    method: req.method,
    url: url,
  }).then((response) => {
    res.send(JSON.stringify(response.data));
  });
});

/// reviews service ///
app.all("/api/aggReview/*", (req, res) => {
  const url = (aggServer + req.path).trim();
  console.log(
    "proxying request to aggregate review server with method",
    req.method,
    "directed to",
    url
  );
  axios({
    method: req.method,
    url: url,
  }).then((response) => {
    res.send(JSON.stringify(response.data));
  });
});

/// also enjoyed service ///
app.all("/api/relatedIds/*", (req, res) => {
  const url = (alsoEnjoyedServer + req.path).trim();
  console.log(
    "proxying request to also enjoyed server with method",
    req.method,
    "directed to",
    url
  );
  axios({
    method: req.method,
    url: url,
  }).then((response) => {
    res.send(JSON.stringify(response.data));
  });
});

app.listen(port, () => {
  console.log(`Proxy listening on http://localhost:${port}`);
});
