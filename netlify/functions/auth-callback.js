const https = require("https");

exports.handler = async function (event) {
  const code = event.queryStringParameters && event.queryStringParameters.code;

  if (!code) {
    return {
      statusCode: 400,
      body: "Missing ?code="
    };
  }

  const postData = JSON.stringify({
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    code: code
  });

  const options = {
    hostname: "github.com",
    path: "/login/oauth/access_token",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
      "Accept": "application/json"
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        const data = JSON.parse(body);

        if (!data.access_token) {
          resolve({
            statusCode: 401,
            body: "No access token received"
          });
          return;
        }

        resolve({
          statusCode: 200,
          headers: { "Content-Type": "text/html" },
          body: `
            <script>
              (function() {
                var msg = "authorization:github:success:${data.access_token}";
                if (window.opener) {
                  window.opener.postMessage(msg, window.location.origin);
                }
                window.close();
              })();
            </script>
          `
        });
      });
    });

    req.on("error", () => {
      resolve({
        statusCode: 500,
        body: "GitHub request failed"
      });
    });

    req.write(postData);
    req.end();
  });
};
