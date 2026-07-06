// A cached authorizer result is replayed for every route the same identity
// source (bearer token) hits during the TTL, so a policy scoped to the
// triggering route would deny all other routes. Scope policies to the whole
// stage instead:
//   arn:aws:execute-api:region:account:api-id/stage/METHOD/path
// becomes
//   arn:aws:execute-api:region:account:api-id/stage/*
export default function wildcardResource(resource: string): string {
  const [arnBase, stage] = resource.split("/");
  if (!arnBase || !stage) {
    return resource;
  }
  return `${arnBase}/${stage}/*`;
}
