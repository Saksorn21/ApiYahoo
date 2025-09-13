import OpenAPISnippet from "openapi-snippet";

      const generateSnippet = (req, res) => {
        try {
          const { spec, path, method, resolved } = req.body;
          if (!spec || !path || !method) {
            return res.status(400).json({ success: false, error: "Missing spec/path/method" });
          }

          // --- Base URL ---
          let baseUrl = "";
          if (spec.swagger === "2.0") {
            // v2
            const scheme = spec.schemes?.[0] || "https";
            baseUrl = `${scheme}://${spec.host || ""}${spec.basePath || ""}`;
          } else if (spec.openapi?.startsWith("3.")) {
            // v3
            baseUrl = spec.servers?.[0]?.url || "";
          }

          // --- Path replace ---
          let finalPath = path;
          if (resolved?.pathParams) {
            Object.keys(resolved.pathParams).forEach((key) => {
              const val = encodeURIComponent(resolved.pathParams[key]);
              finalPath = finalPath.replace(`{${key}}`, val);
              finalPath = finalPath.replace(`%7B${key}%7D`, val);
            });
          }

          // --- Query ---
          let queryString = "";
          if (resolved?.query && Object.keys(resolved.query).length > 0) {
            const qs = Object.entries(resolved.query)
              .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
              .join("&");
            queryString = `?${qs}`;
          }

          // --- Headers ---
          let headersString = "";
          if (resolved?.headers && Object.keys(resolved.headers).length > 0) {
            headersString = JSON.stringify(resolved.headers, null, 2);
          }

          // --- Body ---
          let bodyString = "";
          if (resolved?.body && Object.keys(resolved.body).length > 0) {
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

// ❗ ใช้ path raw ของ spec ให้ generator
    const result = OpenAPISnippet.getEndpointSnippets(spec, path, method, targets);

    const snippetObj = {};
    result.snippets.forEach((s) => {
      let content = s.content;

      // replace pathParams ใน snippet
      if (resolved?.pathParams) {
        Object.keys(resolved.pathParams).forEach((key) => {
          const value = encodeURIComponent(resolved.pathParams[key]);
          content = content.replace(`{${key}}`, value);
          content = content.replace(`%7B${key}%7D`, value);
        });
      }

      if (queryString) content += `\n// Query: ${queryString}`;
      if (headersString) content += `\n// Headers: ${headersString}`;
      if (bodyString) content += `\n// Body: ${bodyString}`;

      snippetObj[s.id] = content;
    });

    res.json({
      success: true,
      snippets: snippetObj,
      url: baseUrl + finalPath + queryString,
      headers: resolved?.headers || {},
      body: resolved?.body || {}
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
};
export default generateSnippet;