import Editor from "@monaco-editor/react";

interface CodeSnippets {
  language: string;
  code: string;
}
interface CodeEditorProps {
  codeSnippets: CodeSnippets[];
  setCodeSnippets: (val: CodeSnippets[]) => void;
  selectedLanguage: string;
}

export function CodeEditor({
  codeSnippets,
  setCodeSnippets,
  selectedLanguage,
}: Readonly<CodeEditorProps>) {
  const currentSnippet = codeSnippets.find(
    (snippet) => snippet.language === selectedLanguage
  );
   const handleCodeChange = (val: string | undefined) => {
    if (val === undefined) return;
    console.log(val);

    setCodeSnippets(
      codeSnippets.map((snippet) =>
        snippet.language === selectedLanguage
          ? { ...snippet, code: val }
          : snippet
      )
    );
  };
  return (
    <Editor
      height="100%"
      language={selectedLanguage.toLowerCase()}
      value={currentSnippet?.code ?? ""}
      theme="vs-light"
      onChange={handleCodeChange}
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
