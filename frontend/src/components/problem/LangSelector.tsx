import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Language = "CPP" | "PYTHON" | "JAVA";

interface LangSelectorProps {
  language: string;
  setLanguage: (val: Language) => void;
}


export function LangSelector({ language, setLanguage}: Readonly<LangSelectorProps>) {

  return (
    <Select
      value={language}
      onValueChange={(val) => setLanguage(val as Language)}
    >
      <SelectTrigger className="w-[100px] hover:bg-zinc-100 border-zinc-300 focus-visible:ring-0 focus-visible:border-zinc-300 focus:outline-none">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="CPP">C++</SelectItem>
        <SelectItem value="PYTHON">Python</SelectItem>
        <SelectItem value="JAVA">Java</SelectItem>
      </SelectContent>
    </Select>
  );
}
