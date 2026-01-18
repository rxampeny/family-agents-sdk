exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const user = body.user;

    if (!user) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing 'user'" }),
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY in Netlify env" }),
      };
    }

    const WORKFLOW_ID = "wf_69678af259b88190b90406b5dee162630cb508e02a638d96";

    const r = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1",
      },
      body: JSON.stringify({
        user,
        workflow: { id: WORKFLOW_ID },

        // 👇 ACTIVA SUBIDA DE ARCHIVOS EN EL CHAT
     chatkit_configuration: { file_upload: { enabled: true } }

      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return {
        statusCode: r.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: data }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_secret: data.client_secret }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: String(e) }),
    };
  }
};
