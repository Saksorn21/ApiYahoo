import OpenAPISnippet from "openapi-snippet";

const generateSnippet = (req, res) => {
  try {
    const { spec, path, method } = req.body;
    if (!spec || !path || !method) {
      return res.status(400).json({ success: false, error: "Missing spec/path/method" });
    }

    // กำหนด target client / language ให้หลากหลาย
    const targets = [
      "c_libcurl",
      "csharp_restsharp",
      "csharp_httpclient",
      "go_native",
      "java_okhttp",
      "java_unirest",
      "javascript_axios",
      "javascript_fetch",
      "javascript_jquery",
      "javascript_xhr",
      "node_fetch",
      "node_request",
      "node_unirest",
      "objc_nsurlsession",
      "ocaml_cohttp",
      "php_curl",
      "php_http1",
      "php_http2",
      "python_python3",
      "python_requests",
      "ruby_native",
      "shell_curl",
      "shell_httpie",
      "shell_wget",
      "swift_nsurlsession"
    ];
    const result = OpenAPISnippet.getEndpointSnippets(spec, path, method, targets);

    const snippetObj = {};
    result.snippets.forEach((s) => {
      // ใช้ s.id (เช่น javascript_axios) แทน s.title ("Javascript + Axios")
      snippetObj[s.id] = s.content;
    });

    res.json({ success: true, snippets: snippetObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};

export default generateSnippet;