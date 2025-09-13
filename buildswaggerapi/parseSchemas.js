
import $RefParser from "@apidevtools/json-schema-ref-parser";
import fs from "fs";
import path from "path";

const parseSchemas = async (req, res) => {
  try {
    const { version } = req.params;

    // map version → ไฟล์ schema
    const fileMap = {
      "v2": "openapi-2.0.json",
      "v3.0": "openapi-3.0.json",
      "v3.1": "openapi-3.1.json",
    };

    const fileName = fileMap[version];
    if (!fileName) {
      return res.status(404).json({ error: "Schema version not found" });
    }

    const filePath = path.join(__dirname, "schemas", fileName);
    const rawSchema = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // dereference schema
    const derefSchema = await $RefParser.dereference(rawSchema);

    res.json(derefSchema);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load schema" });
  }
});

export default parseSchemas

