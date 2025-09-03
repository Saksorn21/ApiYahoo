import OpenAPISnippet from "openapi-snippet";

const generateSnippet = (req, res) => {
  try {
    const { spec, path, method, resolved } = req.body;
    if (!spec || !path || !method) {
      return res.status(400).json({ success: false, error: "Missing spec/path/method" });
    }

    // --- แทนค่า pathParams ---
    let finalPath = path;
    if (resolved?.pathParams) {
      Object.keys(resolved.pathParams).forEach((key) => {
        finalPath = finalPath.replace(`{${key}}`, encodeURIComponent(resolved.pathParams[key]));
      });
    }

    // --- สร้าง query string ---
    let queryString = "";
    if (resolved?.query && Object.keys(resolved.query).length > 0) {
      const qs = Object.entries(resolved.query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      queryString = `?${qs}`;
    }

    // --- เตรียม headers ---
    let headersString = "";
    if (resolved?.headers && Object.keys(resolved.headers).length > 0) {
      headersString = JSON.stringify(resolved.headers, null, 2);
    }

    // --- เตรียม body ---
    let bodyString = "";
    if (resolved?.body) {
      bodyString = JSON.stringify(resolved.body, null, 2);
    }

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

    // generate snippet
    const result = OpenAPISnippet.getEndpointSnippets(spec, path, method, targets);

    const snippetObj = {};
    result.snippets.forEach((s) => {
      let content = s.content;

      // แทรก preview ของ dynamic values
      if (queryString) content += `\n// Query: ${queryString}`;
      if (headersString) content += `\n// Headers: ${headersString}`;
      if (bodyString) content += `\n// Body: ${bodyString}`;

      snippetObj[s.id] = content;
    });

    res.json({
      success: true,
      snippets: snippetObj,
      finalPath: finalPath + queryString, // path + query แทนค่าเรียบร้อย
      headers: resolved?.headers || {},
      body: resolved?.body || {}
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};

export default generateSnippet;