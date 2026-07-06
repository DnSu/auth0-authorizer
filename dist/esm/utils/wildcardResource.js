// A cached authorizer result is replayed for every route the same identity
// source (bearer token) hits during the TTL, so a policy scoped to the
// triggering route would deny all other routes. Scope policies to the whole
// stage instead:
//   arn:aws:execute-api:region:account:api-id/stage/METHOD/path
// becomes
//   arn:aws:execute-api:region:account:api-id/stage/*
export default function wildcardResource(resource) {
    var _a = resource.split("/"), arnBase = _a[0], stage = _a[1];
    if (!arnBase || !stage) {
        return resource;
    }
    return "".concat(arnBase, "/").concat(stage, "/*");
}
