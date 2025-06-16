import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { debounce } from '@/lib/debounce';

interface CodeSnippet {
  language: string;
  code: string;
}

type Language = 'CPP' | 'PYTHON' | 'JAVA';

interface CodeEditorProps {
  codeSnippets: CodeSnippet[];
  setCodeSnippets: (snippets: CodeSnippet[]) => void;
  selectedLanguage: Language;
  loading?: boolean;
  error?: string | null;
  initialCodeSnippets?: CodeSnippet[];
}

export const CodeEditor = React.memo(
  ({
    codeSnippets,
    setCodeSnippets,
    selectedLanguage,
    loading,
    error,
    initialCodeSnippets,
  }: Readonly<CodeEditorProps>) => {
    // Local state for code to reduce parent updates
    const [localCode, setLocalCode] = useState<string>(
      codeSnippets.find((snippet) => snippet.language === selectedLanguage)?.code ?? ''
    );

    // Sync localCode when selectedLanguage or codeSnippets change
    useEffect(() => {
      const snippet = codeSnippets.find((snippet) => snippet.language === selectedLanguage);
      setLocalCode(snippet?.code ?? '');
    }, [selectedLanguage, codeSnippets]);

    // Debounced update to parent
    const debouncedUpdateCodeSnippets = useMemo(
      () =>
        debounce((newSnippets: CodeSnippet[]) => {
          setCodeSnippets(newSnippets);
        }, 300),
      [setCodeSnippets]
    );

    // Update code snippets
    const updateCodeSnippets = useCallback(
      (newCode: string) => {
        const newSnippets = codeSnippets.map((snippet) =>
          snippet.language === selectedLanguage ? { ...snippet, code: newCode } : snippet
        );
        debouncedUpdateCodeSnippets(newSnippets);
      },
      [selectedLanguage, codeSnippets, debouncedUpdateCodeSnippets]
    );

    // Handle code change
    const handleCodeChange = useCallback(
      (value: string | undefined) => {
        if (value === undefined) return;
        setLocalCode(value);
        updateCodeSnippets(value);
      },
      [updateCodeSnippets]
    );

    // Reset code to initial state
    const handleReset = useCallback(() => {
      if (!initialCodeSnippets) return;
      const initialCode = initialCodeSnippets.find((snippet) => snippet.language === selectedLanguage)?.code ?? '';
      setLocalCode(initialCode);
      updateCodeSnippets(initialCode);
    }, [initialCodeSnippets, selectedLanguage, updateCodeSnippets]);

    // Memoize editor language to avoid unnecessary recomputation
    const editorLanguage = useMemo(() => selectedLanguage.toLowerCase(), [selectedLanguage]);

    return (
      <div className="relative h-full">
        {/* Display error or loading state */}
        {error && (
          <p className="absolute top-2 left-2 text-red-500 text-sm z-10">{error}</p>
        )}
        {loading && (
          <p className="absolute top-2 left-2 text-gray-500 text-sm z-10">Submitting...</p>
        )}
        <Editor
          height="100%"
          language={editorLanguage}
          value={localCode}
          theme="vs-light"
          onChange={handleCodeChange}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            readOnly: loading, // Disable editing during submission
          }}
        />
      </div>
    );
  }
);