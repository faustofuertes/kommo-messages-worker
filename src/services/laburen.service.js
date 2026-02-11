export async function sendMessageToLaburenAgent(account_config, normalized, conversationId) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 80000);

  try {

    const res = await fetch(`https://dashboard.laburen.com/api/agents/${account_config.laburen_agent_id}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${account_config.laburen_authorization}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        conversationId,
        query: normalized.text || "",
        context: `lead_name: ${normalized.author_name || ""}
        \nlead_id: ${normalized.element_id || ""}
        \nlead_origin: ${normalized.origin || ""}
        \nswitch_field_id: ${account_config.kommo_switch_field_id || ""}
        \nlead_number: ${normalized.phone_number || ""}`,
        attachments: normalized.attachment
          ? [{ url: normalized.attachment }]
          : []
      })
    });

    if (!res.ok) {
      console.error("HTTP Error:", res.status, await res.text());
      return null;
    }

    return res.json();

  } catch (error) {
    console.error("❌ Error en sendMessageToLaburenAgent:", error);
    return null;
  } finally {
    clearTimeout(t);
  }
}