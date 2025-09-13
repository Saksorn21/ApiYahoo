import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import $RefParser from "@apidevtools/json-schema-ref-parser";
import { stringify } from "flatted";
              
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseSchemas = async (req, res) => {
  try {
    const { version } = req.params;

    const fileMap = {
      "v2": "openapi-2.0.json",
      "v3": "openapi-3.0.json",
      "v3.1": "openapi-3.1.json",
    };

    const fileName = fileMap[version];
    if (!fileName) {
      return res.status(404).json({ error: "Schema version not found" });
    }

    const filePath = path.join(__dirname, "schemas", fileName);
    const rawSchema = JSON.parse(await fs.readFile(filePath, "utf-8"));

      let derefSchema;
      try {
        derefSchema = await $RefParser.dereference(rawSchema);
        
      } catch (err) {
        console.error("Dereference error:", err);
        return res.status(400).json({ error: "Invalid schema refs" });
      };
    res.setHeader("Content-Type", "application/json");
    
    res.json(stringify(derefSchema));
  } catch (err) {
    console.error("parseSchemas error:", err);
    res.status(500).json({ error: "Failed to load schema" });
  }
};

export default parseSchemas;

