exports.onExecutePostLogin = async (event, api) => {
  const audience = event.resource_server?.identifier;
  console.log("audience:", audience);
  console.log("authorization:", JSON.stringify(event.authorization));
  const roles = event.authorization?.roles;
  if (!audience || !Array.isArray(roles)) {
    return;
  }
  const namespace = audience;
  api.idToken.setCustomClaim(`${namespace}/roles`, roles);
  api.accessToken.setCustomClaim(`${namespace}/roles`, roles);
};
