#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/compdown-ae.sh create-json <doc.json>
  scripts/compdown-ae.sh create-yaml <doc.yaml>
  scripts/compdown-ae.sh generate-json <out.json> [--selection-only]

Environment overrides:
  COMPDOWN_NS           Preferred ExtendScript namespace (default: com.compdown.cep)
  COMPDOWN_JSX_ENTRY    Path to built Compdown ExtendScript entry
  AE_RUNNER             Path to run-ae-jsx.sh bridge script
  AE_JSX_BASE           Passed through to AE runner
  AE_APP_NAME           Passed through to AE runner
  AE_LOCK_FILE          Passed through to AE runner
  AE_LOG_FILE           Passed through to AE runner
EOF
}

if [[ $# -lt 2 ]]; then
  usage
  exit 2
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node is required" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ACTION="$1"
ARG1="$2"
shift 2

COMPDOWN_NS="${COMPDOWN_NS:-com.compdown.cep}"
COMPDOWN_JSX_ENTRY="${COMPDOWN_JSX_ENTRY:-$ROOT_DIR/dist/cep-dev/jsx/index.js}"
AE_RUNNER="${AE_RUNNER:-/Users/sebastienlavoie/.codex/skills/after-effects/scripts/run-ae-jsx.sh}"

if [[ ! -f "$COMPDOWN_JSX_ENTRY" ]]; then
  echo "Compdown ExtendScript build not found: $COMPDOWN_JSX_ENTRY" >&2
  echo "Build first (example): npm run build or npm run dev" >&2
  exit 1
fi

if [[ ! -x "$AE_RUNNER" ]]; then
  echo "AE runner not found or not executable: $AE_RUNNER" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d /tmp/compdown-ae.XXXXXX)"
RUNNER_BASENAME="compdown_runner"
RUNNER_JSX="$TMP_DIR/${RUNNER_BASENAME}.jsx"
INPUT_JSON="$TMP_DIR/input.json"
OUTPUT_JSON="$TMP_DIR/output.json"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

to_abs() {
  local p="$1"
  if [[ "$p" = /* ]]; then
    printf '%s' "$p"
  else
    printf '%s/%s' "$PWD" "$p"
  fi
}

DOC_PATH="$(to_abs "$ARG1")"

case "$ACTION" in
  create-json)
    if [[ ! -f "$DOC_PATH" ]]; then
      echo "JSON file not found: $DOC_PATH" >&2
      exit 1
    fi
    cp "$DOC_PATH" "$INPUT_JSON"
    ;;
  create-yaml)
    if [[ ! -f "$DOC_PATH" ]]; then
      echo "YAML file not found: $DOC_PATH" >&2
      exit 1
    fi
    node --input-type=module -e '
      import fs from "node:fs";
      import yaml from "js-yaml";
      const [inPath, outPath] = process.argv.slice(1);
      const raw = fs.readFileSync(inPath, "utf8");
      const parsed = yaml.load(raw);
      fs.writeFileSync(outPath, JSON.stringify(parsed), "utf8");
    ' "$DOC_PATH" "$INPUT_JSON"
    ;;
  generate-json)
    # no pre-input file needed
    ;;
  *)
    echo "Unknown action: $ACTION" >&2
    usage
    exit 2
    ;;
esac

SELECTION_ONLY="false"
if [[ "$ACTION" = "generate-json" ]]; then
  if [[ "${1:-}" = "--selection-only" ]]; then
    SELECTION_ONLY="true"
  elif [[ $# -gt 0 ]]; then
    echo "Unknown option for generate-json: $1" >&2
    exit 2
  fi
fi

JSX_ENTRY_ESC="$(json_escape "$COMPDOWN_JSX_ENTRY")"
NS_ESC="$(json_escape "$COMPDOWN_NS")"
INPUT_ESC="$(json_escape "$INPUT_JSON")"
OUTPUT_ESC="$(json_escape "$OUTPUT_JSON")"
ACTION_ESC="$(json_escape "$ACTION")"
SEL_ESC="$(json_escape "$SELECTION_ONLY")"

cat > "$RUNNER_JSX" <<EOF
(function () {
  function writeOutput(payload) {
    var outFile = new File(outputPath);
    if (!outFile.open("w")) {
      throw new Error("Could not write output: " + outputPath);
    }
    outFile.write(JSON.stringify(payload));
    outFile.close();
  }

  var jsxEntry = "$JSX_ENTRY_ESC";
  var ns = "$NS_ESC";
  var inputPath = "$INPUT_ESC";
  var outputPath = "$OUTPUT_ESC";
  var action = "$ACTION_ESC";
  var selectionOnly = "$SEL_ESC" === "true";

  try {
    $.evalFile(jsxEntry);
    var host = (typeof $ !== "undefined") ? $ : window;
    var candidateNs = [ns, "com.compdown.cep", "com.compdown-dev.cep"];
    var resolvedNs = "";
    for (var i = 0; i < candidateNs.length; i++) {
      var maybe = candidateNs[i];
      if (maybe && host[maybe]) {
        resolvedNs = maybe;
        break;
      }
    }
    if (!resolvedNs) {
      throw new Error("Compdown namespace not loaded. Tried: " + candidateNs.join(", "));
    }
    ns = resolvedNs;

    var result;
    if (action === "create-json" || action === "create-yaml") {
      var inFile = new File(inputPath);
      if (!inFile.open("r")) {
        throw new Error("Could not read input JSON: " + inputPath);
      }
      var inputText = inFile.read();
      inFile.close();
      var doc = JSON.parse(inputText);
      if (!host[ns].createFromDocument) {
        throw new Error("createFromDocument is not available on namespace: " + ns);
      }
      result = host[ns].createFromDocument(doc);
    } else if (action === "generate-json") {
      if (!host[ns].generateFromComp) {
        throw new Error("generateFromComp is not available on namespace: " + ns);
      }
      result = host[ns].generateFromComp(selectionOnly);
    } else {
      throw new Error("Unknown action: " + action);
    }

    writeOutput({ ok: true, result: result });
  } catch (e) {
    writeOutput({
      ok: false,
      error: (e && e.toString) ? e.toString() : "Unknown ExtendScript error"
    });
  }
})();
EOF

AE_JSX_BASE="$TMP_DIR" "$AE_RUNNER" "$RUNNER_BASENAME"

if [[ ! -f "$OUTPUT_JSON" ]]; then
  echo "AE run finished but no output JSON was produced." >&2
  exit 1
fi

if ! node --input-type=module -e '
  import fs from "node:fs";
  const outPath = process.argv[1];
  const payload = JSON.parse(fs.readFileSync(outPath, "utf8"));
  if (!payload.ok) {
    console.error(payload.error || "Unknown error");
    process.exit(1);
  }
  console.log(JSON.stringify(payload.result));
' "$OUTPUT_JSON" > "$TMP_DIR/result.json"; then
  exit 1
fi

if [[ "$ACTION" = "generate-json" ]]; then
  OUT_PATH="$(to_abs "$DOC_PATH")"
  cp "$TMP_DIR/result.json" "$OUT_PATH"
  echo "Wrote generated Compdown JSON: $OUT_PATH"
else
  cat "$TMP_DIR/result.json"
  echo
fi
