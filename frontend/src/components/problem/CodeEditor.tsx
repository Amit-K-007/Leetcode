import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  setCode: (val: string) => void;
  language?: string;
}

export function CodeEditor({
  code,
  setCode,
  language = "cpp",
}: Readonly<CodeEditorProps>) {
  return (
    <Editor
      height="100%"
      language={language}
      value={code}
      theme="vs-light"
      onChange={(val) => setCode(val ?? "")}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        automaticLayout: true,
      }}
    />
  );
}
