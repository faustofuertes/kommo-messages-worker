import { WorkflowEntrypoint } from "cloudflare:workers";
import { mapLeadToConversation } from "../database/lead_conversation_map";
import { sendMessageToLaburenAgent } from "./services/laburen.service";
import { launchSalesBot, updateLead } from "./services/kommo.service";

export default {};

export class MyWorkflow extends WorkflowEntrypoint {
  async run(event, step) {

    const env = this.env;

    const account_config = event.payload.account_config;
    const normalized = event.payload.normalized;
    var conversationId = event.payload.conversationId;

    let data;

    await step.do("laburen-step", async () => {

      if (conversationId != null) {
        console.log(`⏯️ [${account_config.kommo_account_subdomain}] Reanudando conversación [${conversationId}] para lead [${normalized.element_id}].`);

        data = await sendMessageToLaburenAgent(account_config, normalized, conversationId);
      } else {

        data = await sendMessageToLaburenAgent(account_config, normalized, conversationId);

        conversationId = data?.conversationId;
        await mapLeadToConversation(env, account_config.kommo_account_id, normalized.element_id, conversationId);

        console.log(`🆕 [${account_config.kommo_account_subdomain}] Nueva conversación [${conversationId}] asignada para lead [${normalized.element_id}].`);
      }

      // Validar que tenemos la respuesta con answer antes de finalizar el step
      if (!data) {
        throw new Error(`No se recibió respuesta de Laburen.com [${normalized.element_id}].`);
      }

      return {
        conversationId: conversationId,
        query: normalized.text,
        attachment: normalized.attachment,
        response: data
      }

    });

    await step.do("updateLead-step", async () => {
      const result = await updateLead(account_config, normalized.element_id, Number(account_config.kommo_response_field_id), data.answer);

      return {
        success: result,
        lead_id: normalized.element_id,
        new_response_field_value: data.answer
      };
    });

    await step.do("launchSalesBot-step", async () => {
      const result = await launchSalesBot(account_config, account_config.kommo_salesbot_id, normalized.element_id);

      return {
        success: result,
        lead_id: normalized.element_id,
        salesbot_id: account_config.kommo_salesbot_id
      };
    });

    return { ok: true };
  }
}
