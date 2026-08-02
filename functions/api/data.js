const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
    },
  });

export async function onRequestGet(context) {
  try {
    const row = await context.env.DB
      .prepare("SELECT content, updated_at FROM app_data WHERE id = ?")
      .bind(1)
      .first();

    if (!row) {
      return jsonResponse({
        success: true,
        data: null,
        updatedAt: null,
      });
    }

    return jsonResponse({
      success: true,
      data: JSON.parse(row.content),
      updatedAt: row.updated_at,
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: "Impossible de charger les données.",
        details: error.message,
      },
      500
    );
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    if (!body || typeof body !== "object") {
      return jsonResponse(
        {
          success: false,
          error: "Les données envoyées sont invalides.",
        },
        400
      );
    }

    const content = JSON.stringify(body);

    await context.env.DB
      .prepare(`
        INSERT INTO app_data (id, content, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
          content = excluded.content,
          updated_at = datetime('now')
      `)
      .bind(1, content)
      .run();

    return jsonResponse({
      success: true,
      message: "Données enregistrées.",
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: "Impossible d’enregistrer les données.",
        details: error.message,
      },
      500
    );
  }
}
