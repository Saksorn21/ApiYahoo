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
      "shell_httpie",
      "shell_wget",
      "node_request",
      "node_native",
      "node_unirest",
      "python_requests",
      "python_python3",
      "javascript_xhr",
      "javascript_jquery",
      "java_unirest",
      "java_okhttp",
      "csharp_restsharp",
      "csharp_httpclient",
      "go_native",
      "php_curl",
      "php_http1",
      "php_http2",
      "objc_nsurlsession",
      "swift_nsurlsession",
      "ruby_native",
      "c_libcurl",
      "ocaml_cohttp"
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