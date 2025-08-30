import OpenAPISnippet from "openapi-snippet";

const generateSnippet = (req, res) => {
  try {
    const { spec, path, method } = req.body;
    if (!spec || !path || !method) {
      return res.status(400).json({ success: false, error: "Missing spec/path/method" });
    }

    // กำหนด target client / language ให้หลากหลาย
    const targets = [
      "shell_curl",
      "node_fetch",
      "node_request",
      "python_requests",
      "python_httpx",
      "javascript_xhr",
      "javascript_fetch",
      "ruby_net_http",
      "go_native",
      "java_unirest",
      "php_curl",
      "csharp_restsharp",
      "objc_nsurlsession",
      "swift_urlsession"
    ];

    const result = OpenAPISnippet.getEndpointSnippets(spec, path, method, targets);

    const snippetObj = {};
    result.snippets.forEach((s) => {
      snippetObj[s.title] = s.content;
    });

    // ส่งกลับให้ client
    res.json({ success: true, snippets: snippetObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};

export default generateSnippet;