export async function updateLead(account_config, element_id, field_id, value) {
  try {
    const res = await fetch(`https://${account_config.kommo_account_subdomain}.kommo.com/api/v4/leads/${element_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${account_config.kommo_long_duration_token}`
      },
      body: JSON.stringify({
        custom_fields_values: [
          { field_id, values: [{ value }] }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Error en respuesta updateLead (kommo.service.js):", errText);
      return null;
    }

    const data = await res.json();
    return data;

  } catch (error) {
    console.error("❌ Error en updateLead (kommo.service.js):", error);
    return null;
  }
}

export async function launchSalesBot(account_config, salesbot_id, element_id) {
  try {
    const res = await fetch(`https://${account_config.kommo_account_subdomain}.kommo.com/api/v2/salesbot/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${account_config.kommo_long_duration_token}`
      },
      body: JSON.stringify([{
        bot_id: salesbot_id,
        entity_id: element_id,
        entity_type: 2
      }])
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Error en launchSalesBot (kommo.service.js):", errText);
      return null;
    }

    const data = await res.json();
    return data;

  } catch (error) {
    console.error("❌ Error launchSalesBot (kommo.service.js):", error);
    return null;
  }
}