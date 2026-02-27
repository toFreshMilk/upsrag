# UPSTAGE API ALL-IN-ONE REFERENCE

이 문서는 Agents, Chat, Parsing, Extraction, Classification, Embedding의 모든 예제 코드를 포함합니다.

---

### 1. Agents (Bash Script)
FILE_ID=$(curl --location 'https://api.upstage.ai/v2/files' \
--header 'Authorization: Bearer up_5bY7BGkgs1mD4ubJq7PLujDYm03ZP' \
--form 'file=@document.pdf' | jq -r '.id')

JOB_ID=$(curl --location 'https://api.upstage.ai/v2/responses' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer up_5bY7BGkgs1mD4ubJq7PLujDYm03ZP' \
--data '{
"model": "agt_BxcRatEWzVYH2yRNtyWynn",
"include": ["last"],
"input": [
{
"role": "user",
"content": [
{
"type": "input_file",
"file_id": "'"$FILE_ID"'"
}
]
}
]
}' | jq -r '.id')

STATUS="queued"
while [[ "$STATUS" == "queued" || "$STATUS" == "in_progress" ]]; do
sleep 2
RESP=$(curl --location "https://api.upstage.ai/v2/responses/$JOB_ID?include[]=last" \
--header 'Authorization: Bearer up_5bY7BGkgs1mD4ubJq7PLujDYm03ZP')
STATUS=$(echo "$RESP" | jq -r '.status')
done

echo "$RESP" | jq -r '.output_text'

---

### 2. Chat with Reasoning (Node.js)
import OpenAI from "openai";

const apiKey = "up_5bY7BGkgs1mD4ubJq7PLujDYm03ZP";
const openai = new OpenAI({
apiKey,
baseURL: "https://api.upstage.ai/v1"
});

const chatCompletion = await openai.chat.completions.create({
model: "solar-pro3",
messages: [{ "role": "user", "content": "Hi, how are you?" }],
reasoning_effort: "high",
stream: true
});

for await (const chunk of chatCompletion) {
process.stdout.write(chunk.choices[0]?.delta?.content || "");
}

---

### 3. Document Parsing (Node.js)
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";

const API_KEY = "up_5bY7BGkgs1mD4ubJq7PLujDYm03ZP";
const FILE_NAME = "YOUR_FILE_NAME";

async function performDocumentParse() {
const formData = new FormData();
formData.append("document", fs.createReadStream(FILE_NAME));
formData.append("output_formats", JSON.stringify(["html", "text"]));
formData.append("base64_encoding", JSON.stringify(["table"]));
formData.append("ocr", "auto");
formData.append("coordinates", "true");
formData.append("model", "document-parse");

const response = await fetch("https://api.upstage.ai/v1/document-digitization", {
method: "POST",
headers: { Authorization: `Bearer ${API_KEY}` },
body: formData,
});
console.log(await response.json());
}
performDocumentParse();

---

### 4. Universal Extraction (Node.js)
import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({
apiKey: "up_5bY7BGkgs1mD4ubJq7PLujDYm03ZP",
baseURL: "https://api.upstage.ai/v1/information-extraction"
});

const base64Image = fs.readFileSync("./bank_statement.png", "base64");

const extraction_response = await openai.chat.completions.create({
model: "information-extract",
messages: [{
role: "user",
content: [{ type: "image_url", image_url: { url: `data:application/octet-stream;base64,${base64Image}` } }],
}],
response_format: {
"type": "json_schema",
"json_schema": {
"name": "document_schema",
"schema": {
"type": "object",
"properties": { "bank_name": { "type": "string" } }
}
}
}
});
console.log(extraction_response);

---

### 5. Document Classification (Python)
import base64
from openai import OpenAI

client = OpenAI(api_key="up_5bY7BGkgs1mD4ubJq7PLujDYm03ZP", base_url="https://api.upstage.ai/v1/document-classification")

def encode_img_to_base64(img_path):
with open(img_path, 'rb') as f:
return base64.b64encode(f.read()).decode('utf-8')

base64_data = encode_img_to_base64("./your_document.png")

response = client.chat.completions.create(
model="document-classify",
messages=[{"role": "user", "content": [{"type": "image_url", "image_url": {"url": f"data:application/octet-stream;base64,{base64_data}"}}]}],
response_format={
"type": "json_schema",
"json_schema": {
"name": "document-classify",
"schema": {
"type": "string",
"oneOf": [
{"const": "invoice"}, {"const": "receipt"}, {"const": "contract"}, {"const": "cv"}, {"const": "others"}
]
}
}
}
)
print(response)

---

### 6. Embeddings (Node.js)
import OpenAI from "openai";

const openai = new OpenAI({
apiKey: "up_5bY7BGkgs1mD4ubJq7PLujDYm03ZP",
baseURL: "https://api.upstage.ai/v1"
});

const embeddings = await openai.embeddings.create({
model: "embedding-query",
input: "Solar embeddings are awesome",
});
console.log(embeddings);