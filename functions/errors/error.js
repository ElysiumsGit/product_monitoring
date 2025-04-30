const renderErrorPage = (title, message, hint) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    :root {
      --main-color: #dc3545;
      --bg-color: #f8f9fa;
      --text-color: #333;
      --hint-color: #666;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: 'Segoe UI', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }

    .container {
      background-color: #fff;
      border: 1px solid #ddd;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
      max-width: 90%;
      width: 500px;
      text-align: center;
    }

    h1 {
      color: var(--main-color);
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    p {
      font-size: 1.1rem;
      margin: 0.5rem 0;
    }

    small {
      color: var(--hint-color);
      font-size: 0.9rem;
    }

    @media (max-width: 600px) {
      .container {
        padding: 1.5rem 1rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      p {
        font-size: 1rem;
      }

      small {
        font-size: 0.85rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>
    <small>${hint}</small>
  </div>
</body>
</html>
`;

module.exports = { renderErrorPage }