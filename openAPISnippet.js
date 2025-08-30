import OpenAPISnippet from "openapi-snippet";

const generateSnippet = (req, res) => {
  try {
    const { spec, path, method } = req.body;

    const targets = ["shell_curl", "node_fetch", "python_requests"];

    const snippetObj= {};
    const result = OpenAPISnippet.getEndpointSnippets(spec, path, method, targets);

    result.snippets.forEach((s ) => {
      snippetObj[s.title] = s.content;
    });

    res.json({ success: true, snippets: snippetObj });
  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
}
export default generateSnippet