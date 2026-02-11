export async function mapLeadToConversation(env, account_id, lead_id, conversation_id) {

    const conversation_map = await env.DB
        .prepare("INSERT INTO lead_conversation_map (account_id, lead_id, conversation_id) VALUES (?, ?, ?)")
        .bind(account_id, lead_id, conversation_id)
        .run();

    return conversation_map;
}