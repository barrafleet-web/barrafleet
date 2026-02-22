exports.handler = async (event) => {
  const code = event.queryStringParameters && event.queryStringParameters.code;
  if (!code) return { statusCode: 400, body: "Missing ?code=" };

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  const data = await res.json();
  if (!data.access_token) return { statusCode: 401, body: "No access token from GitHub" };

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: `
      <script>
        (function () {
          var msg = "authorization:github:success:${data.access_token}";
          if (window.opener) window.opener.postMessage(msg, window.location.origin);
          window.close();
        })();
      </script>
    `
  };
};
