const renderErrorPage = () => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Site Can’t Be Reached</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #1e1e1e;
      color: #ccc;
      font-family: 'Segoe UI', sans-serif;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .outerContainer {
      width: 600px;
      height: 400px;
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
    }

    .bodyContent {
      text-align: left;
    }

    .icon {
      font-size: 48px;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 1.5rem;
      color: #e0e0e0;
      margin-bottom: 0.5rem;
    }

    p {
      margin: 0.3rem 0;
      font-size: 1rem;
    }

    a {
      color: #4da3ff;
      text-decoration: none;
    }

    .code {
      font-size: 0.85rem;
      color: #777;
      margin-top: 1rem;
    }

    button {
      margin-top: 1.5rem;
      padding: 0.5rem 1.5rem;
      background-color: #4da3ff;
      border: none;
      color: white;
      font-size: 1rem;
      border-radius: 4px;
      cursor: pointer;
    }

    button:hover {
      background-color: #357ee5;
    }
  </style>
</head>
<body>
  <div class="outerContainer">
    <div class="bodyContent">
      <div class="icon">📄</div>
      <h1>This site can’t be reached</h1>
      <p>Check if there is a typo in <strong>https://app-m4gsgw27rq-uc.a.run.app</strong>.</p>
      <p>If spelling is correct, <a href="#">try running Windows Network Diagnostics</a>.</p>
      <div class="code">DNS_PROBE_FINISHED_NXDOMAIN</div>
      <button onclick="location.reload()">Reload</button>
    </div>
  </div>
</body>
</html>
`;

module.exports = { renderErrorPage };
